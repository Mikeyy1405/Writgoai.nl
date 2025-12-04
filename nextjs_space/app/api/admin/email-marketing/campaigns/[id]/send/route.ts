/**
 * Send Marketing Campaign API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendMarketingCampaign } from '@/lib/email-marketing';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get campaign
    const campaign = await prisma.marketingCampaign.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'sent') {
      return NextResponse.json(
        { error: 'Campaign already sent' },
        { status: 400 }
      );
    }

    if (!campaign.listId) {
      return NextResponse.json(
        { error: 'Campaign must have a list selected' },
        { status: 400 }
      );
    }

    // Send campaign
    const result = await sendMarketingCampaign({
      campaignId: campaign.id,
      listId: campaign.listId,
      subject: campaign.subject,
      htmlContent: campaign.templateHtml,
      clientId: client.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      creditsUsed: result.creditsUsed,
    });
  } catch (error: any) {
    console.error('[Campaign Send] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send campaign' },
      { status: 500 }
    );
  }
}
