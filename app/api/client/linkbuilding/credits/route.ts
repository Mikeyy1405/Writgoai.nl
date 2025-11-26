
/**
 * Linkbuilding Credits API
 * 
 * Manages credit earning and spending for linkbuilding activities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const maxDuration = 300;

// Credit rates
const CREDIT_PER_LINK_GIVEN = 5; // Earn 5 credits for each link you give
const CREDIT_PER_LINK_RECEIVED = -2; // Spend 2 credits for each link you receive

/**
 * POST: Record a link exchange and update credits
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { partnershipId, type, articleUrl, anchorText, notes } = body;

    if (!partnershipId || !type) {
      return NextResponse.json(
        { error: 'Partnership ID and type are required' },
        { status: 400 }
      );
    }

    if (!['given', 'received'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "given" or "received"' },
        { status: 400 }
      );
    }

    // Find the partnership
    const partnership = await prisma.linkbuildingPartnership.findFirst({
      where: {
        id: partnershipId,
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
        status: 'active',
      },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: 'Active partnership not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if max links per month is reached
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const linksThisMonth = type === 'given' 
      ? partnership.linksGiven // You would need to track monthly in a better implementation
      : partnership.linksReceived;

    if (linksThisMonth >= partnership.maxLinksPerMonth) {
      return NextResponse.json(
        { error: 'Maximaal aantal links voor deze maand bereikt' },
        { status: 400 }
      );
    }

    // Calculate credits
    const isRequester = partnership.requestingClientId === client.id;
    let creditsChange = 0;
    let partnerCreditsChange = 0;

    if (type === 'given') {
      // I'm giving a link to my partner
      creditsChange = CREDIT_PER_LINK_GIVEN;
      partnerCreditsChange = CREDIT_PER_LINK_RECEIVED;
    } else {
      // I'm receiving a link from my partner
      creditsChange = CREDIT_PER_LINK_RECEIVED;
      partnerCreditsChange = CREDIT_PER_LINK_GIVEN;
    }

    // Update partnership statistics
    const updateData: any = {
      lastLinkDate: new Date(),
    };

    if (type === 'given') {
      updateData.linksGiven = { increment: 1 };
      updateData.creditsEarned = { increment: Math.abs(creditsChange) };
    } else {
      updateData.linksReceived = { increment: 1 };
      updateData.creditsSpent = { increment: Math.abs(creditsChange) };
    }

    await prisma.linkbuildingPartnership.update({
      where: { id: partnershipId },
      data: updateData,
    });

    // Add credits to client account
    if (creditsChange > 0) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          topUpCredits: { increment: creditsChange },
        },
      });

      // Record credit transaction
      const currentBalance =
        (client.subscriptionCredits || 0) + (client.topUpCredits || 0);

      await prisma.creditTransaction.create({
        data: {
          clientId: client.id,
          amount: creditsChange,
          type: 'earned_linkbuilding',
          description: `Linkbuilding: ${type === 'given' ? 'Link gegeven' : 'Link ontvangen'}`,
          balanceAfter: currentBalance + creditsChange,
        },
      });
    } else if (creditsChange < 0) {
      // Deduct credits
      const currentBalance =
        (client.subscriptionCredits || 0) + (client.topUpCredits || 0);

      if (currentBalance + creditsChange < 0) {
        return NextResponse.json(
          { error: 'Onvoldoende credits voor deze link exchange' },
          { status: 400 }
        );
      }

      await prisma.client.update({
        where: { id: client.id },
        data: {
          topUpCredits: { increment: creditsChange }, // Negative increment
        },
      });

      await prisma.creditTransaction.create({
        data: {
          clientId: client.id,
          amount: creditsChange,
          type: 'spent_linkbuilding',
          description: `Linkbuilding: ${type === 'given' ? 'Link gegeven' : 'Link ontvangen'}`,
          balanceAfter: currentBalance + creditsChange,
        },
      });
    }

    return NextResponse.json({
      success: true,
      creditsEarned: Math.max(0, creditsChange),
      creditsSpent: Math.abs(Math.min(0, creditsChange)),
      message: 'Link exchange recorded successfully',
    });
  } catch (error: any) {
    console.error('Error recording link exchange:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record link exchange' },
      { status: 500 }
    );
  }
}

/**
 * GET: Get linkbuilding credits summary
 */
export async function GET(request: NextRequest) {
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

    // Get all partnerships
    const partnerships = await prisma.linkbuildingPartnership.findMany({
      where: {
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
      },
    });

    // Calculate totals
    const totalEarned = partnerships.reduce((sum, p) => sum + p.creditsEarned, 0);
    const totalSpent = partnerships.reduce((sum, p) => sum + p.creditsSpent, 0);

    // Get recent transactions
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: {
        clientId: client.id,
        type: { in: ['earned_linkbuilding', 'spent_linkbuilding'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalEarned,
        totalSpent,
        netCredits: totalEarned - totalSpent,
        activePartnerships: partnerships.filter((p) => p.status === 'active').length,
        totalPartnerships: partnerships.length,
      },
      recentTransactions,
    });
  } catch (error: any) {
    console.error('Error fetching credits summary:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credits summary' },
      { status: 500 }
    );
  }
}
