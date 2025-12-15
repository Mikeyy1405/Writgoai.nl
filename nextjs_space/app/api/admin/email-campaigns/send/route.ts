
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {

  sendOnboardingEmail,
  sendPromotionalEmail,
  isEmailConfigured,
} from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Send email campaign to all clients or specific segments
 * POST /api/admin/email-campaigns/send
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email systeem niet geconfigureerd. Controleer SMTP instellingen.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      campaignType, // 'onboarding' | 'promotional'
      emailNumber, // For onboarding: 1-5
      promoType, // For promotional: 'black-friday' | 'christmas' | 'new-year'
      discountCode,
      discountPercentage,
      expiryDate,
      targetAudience, // 'all' | 'new' | 'active' | 'inactive'
    } = body;

    const dashboardUrl = 'https://WritgoAI.nl/client-portal';

    // Get target clients based on audience
    let clients;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (targetAudience) {
      case 'new':
        // Clients created in last 30 days
        clients = await prisma.client.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { id: true, email: true, name: true },
        });
        break;
      case 'active':
        // Clients with active subscriptions
        clients = await prisma.client.findMany({
          where: {
            subscriptionStatus: 'active',
          },
          select: { id: true, email: true, name: true },
        });
        break;
      case 'inactive':
        // Clients without active subscriptions
        clients = await prisma.client.findMany({
          where: {
            OR: [
              { subscriptionStatus: null },
              { subscriptionStatus: { not: 'active' } },
            ],
          },
          select: { id: true, email: true, name: true },
        });
        break;
      default:
        // All clients
        clients = await prisma.client.findMany({
          select: { id: true, email: true, name: true },
        });
    }

    console.log(`Sending ${campaignType} email to ${clients.length} clients...`);

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send emails in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (client) => {
          try {
            let result;

            if (campaignType === 'onboarding') {
              result = await sendOnboardingEmail(
                client.email,
                client.name,
                emailNumber,
                dashboardUrl
              );
            } else if (campaignType === 'promotional') {
              result = await sendPromotionalEmail(
                client.email,
                client.name,
                promoType,
                discountCode,
                discountPercentage,
                expiryDate,
                dashboardUrl
              );
            }

            if (result?.success) {
              results.sent++;

              // Log email in database
              await prisma.emailLog.create({
                data: {
                  clientId: client.id,
                  templateCode: `${campaignType}-${emailNumber || promoType}`,
                  subject: `Email sent to ${client.name}`,
                  recipientEmail: client.email,
                  status: 'sent',
                },
              });
            } else {
              results.failed++;
              results.errors.push(`Failed to send to ${client.email}: ${result?.reason || 'Unknown error'}`);
            }
          } catch (error: any) {
            results.failed++;
            results.errors.push(`Error sending to ${client.email}: ${error.message}`);
          }
        })
      );

      // Small delay between batches
      if (i + batchSize < clients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Email campaign complete. Sent: ${results.sent}, Failed: ${results.failed}`);

    return NextResponse.json({
      success: true,
      sent: results.sent,
      failed: results.failed,
      total: clients.length,
      errors: results.errors.slice(0, 10), // Return first 10 errors
    });
  } catch (error: any) {
    console.error('Error sending email campaign:', error);
    return NextResponse.json(
      { error: 'Fout bij verzenden email campagne', details: error.message },
      { status: 500 }
    );
  }
}
