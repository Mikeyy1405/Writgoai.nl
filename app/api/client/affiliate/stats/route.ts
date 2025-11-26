
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Affiliate Statistics
 * GET /api/client/affiliate/stats
 * 
 * Haalt affiliate statistieken op voor de client
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        affiliateCode: true,
        affiliateEnabled: true,
        affiliateCommissionRate: true,
        affiliateTotalEarnings: true,
        affiliateWithdrawn: true,
        affiliateReferrals: {
          select: {
            id: true,
            referredClientId: true,
            referralCode: true,
            status: true,
            isVerified: true,
            firstPurchaseAt: true,
            firstPurchaseAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        affiliateEarnings: {
          select: {
            id: true,
            month: true,
            year: true,
            referredRevenue: true,
            commissionAmount: true,
            status: true,
            isPaid: true,
          },
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12, // Last 12 months
        },
        affiliatePayouts: {
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            requestedAt: true,
            paidAt: true,
          },
          orderBy: { requestedAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Bereken statistieken
    const totalReferrals = client.affiliateReferrals.length;
    const activeReferrals = client.affiliateReferrals.filter(r => r.status === 'active').length;
    const verifiedReferrals = client.affiliateReferrals.filter(r => r.isVerified).length;
    const convertedReferrals = client.affiliateReferrals.filter(r => r.firstPurchaseAt).length;

    const totalCommissionEarned = client.affiliateEarnings.reduce(
      (sum, earning) => sum + earning.commissionAmount, 
      0
    );
    const pendingCommission = client.affiliateEarnings
      .filter(e => e.status === 'pending')
      .reduce((sum, earning) => sum + earning.commissionAmount, 0);
    const approvedCommission = client.affiliateEarnings
      .filter(e => e.status === 'approved' && !e.isPaid)
      .reduce((sum, earning) => sum + earning.commissionAmount, 0);

    const availableForWithdrawal = client.affiliateTotalEarnings - client.affiliateWithdrawn;

    const stats = {
      affiliateCode: client.affiliateCode,
      affiliateEnabled: client.affiliateEnabled,
      commissionRate: client.affiliateCommissionRate * 100, // Convert to percentage
      
      referrals: {
        total: totalReferrals,
        active: activeReferrals,
        verified: verifiedReferrals,
        converted: convertedReferrals,
        conversionRate: totalReferrals > 0 ? Math.round((convertedReferrals / totalReferrals) * 100) : 0,
      },
      
      earnings: {
        total: client.affiliateTotalEarnings,
        pending: pendingCommission,
        approved: approvedCommission,
        withdrawn: client.affiliateWithdrawn,
        available: availableForWithdrawal,
      },
      
      referralsList: client.affiliateReferrals,
      earningsHistory: client.affiliateEarnings,
      payoutHistory: client.affiliatePayouts,
    };

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error: any) {
    console.error('Get affiliate stats error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden',
      details: error.message,
    }, { status: 500 });
  }
}
