

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendOnboardingEmail, isEmailConfigured } from '@/lib/email';

/**
 * Cron job to send scheduled onboarding emails
 * GET /api/client/onboarding-emails
 * 
 * Schedule in Vercel Cron:
 * - Run daily at 09:00 UTC (10:00 CET / 11:00 CEST)
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isEmailConfigured()) {
      console.log('Email not configured, skipping onboarding emails');
      return NextResponse.json({ success: false, reason: 'email_not_configured' });
    }

    const now = new Date();
    const dashboardUrl = 'https://WritgoAI.nl/client-portal';

    // Define delay schedules for each email
    const schedules = [
      { emailNumber: 1, hoursAfterSignup: 0 }, // Immediate
      { emailNumber: 2, hoursAfterSignup: 24 }, // Day 1
      { emailNumber: 3, hoursAfterSignup: 72 }, // Day 3
      { emailNumber: 4, hoursAfterSignup: 120 }, // Day 5
      { emailNumber: 5, hoursAfterSignup: 168 }, // Day 7
    ];

    const results: { emailNumber: number; sent: number; failed: number }[] = [];

    for (const schedule of schedules) {
      const targetDate = new Date(now.getTime() - schedule.hoursAfterSignup * 60 * 60 * 1000);
      const windowStart = new Date(targetDate.getTime() - 60 * 60 * 1000); // 1 hour before
      const windowEnd = new Date(targetDate.getTime() + 60 * 60 * 1000); // 1 hour after

      // Find clients who should receive this email
      const clients = await prisma.client.findMany({
        where: {
          createdAt: {
            gte: windowStart,
            lte: windowEnd,
          },
          // Don't send to clients who already received this email
          emailLogs: {
            none: {
              templateCode: `onboarding-${schedule.emailNumber}`,
            },
          },
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      let sent = 0;
      let failed = 0;

      for (const client of clients) {
        try {
          const result = await sendOnboardingEmail(
            client.email,
            client.name,
            schedule.emailNumber as 1 | 2 | 3 | 4 | 5,
            dashboardUrl
          );

          if (result.success) {
            sent++;

            // Log email
            await prisma.emailLog.create({
              data: {
                clientId: client.id,
                templateCode: `onboarding-${schedule.emailNumber}`,
                subject: `Onboarding Email ${schedule.emailNumber}`,
                recipientEmail: client.email,
                status: 'sent',
              },
            });
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Error sending onboarding email to ${client.email}:`, error);
          failed++;
        }
      }

      results.push({
        emailNumber: schedule.emailNumber,
        sent,
        failed,
      });

      console.log(`Onboarding email ${schedule.emailNumber}: ${sent} sent, ${failed} failed`);
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Error in onboarding emails cron:', error);
    return NextResponse.json(
      { error: 'Fout bij verzenden onboarding emails', details: error.message },
      { status: 500 }
    );
  }
}
