

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Admin Affiliate Payouts API
 * GET: Haal alle affiliates met hun stats en payout requests op
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Check if user is admin (you can add role check here)
    const user = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Haal alle affiliate programs op met statistieken
    const affiliatePrograms = await prisma.affiliateReferral.findMany({
      include: {
        referrer: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Haal alle referred clients op
    const referredClientIds = affiliatePrograms.map(ap => ap.referredClientId);
    const referredClients = await prisma.client.findMany({
      where: {
        id: { in: referredClientIds }
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        createdAt: true
      }
    });

    const referredClientsMap = new Map(referredClients.map(c => [c.id, c]));

    // Haal alle earnings op gegroepeerd per affiliate
    const earnings = await prisma.affiliateEarning.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Bereken totalen per affiliate
    const affiliateStats = new Map();
    
    affiliatePrograms.forEach(referral => {
      const affiliateId = referral.referrerClientId;
      const referredClient = referredClientsMap.get(referral.referredClientId);
      
      if (!affiliateStats.has(affiliateId)) {
        affiliateStats.set(affiliateId, {
          clientInfo: referral.referrer,
          totalEarned: 0,
          activeReferrals: 0,
          totalReferrals: 0,
          referrals: []
        });
      }
      
      const stats = affiliateStats.get(affiliateId);
      stats.totalReferrals++;
      
      if (referredClient && (referredClient as any).subscriptionStatus === 'active') {
        stats.activeReferrals++;
      }
      
      if (referredClient) {
        stats.referrals.push({
          id: referral.id,
          referredClient: referredClient,
          signupDate: referral.createdAt,
          status: referral.status
        });
      }
    });

    // Voeg earnings toe
    earnings.forEach(earning => {
      if (affiliateStats.has(earning.affiliateClientId)) {
        const stats = affiliateStats.get(earning.affiliateClientId);
        stats.totalEarned += earning.commissionAmount;
      }
    });

    // Haal alle payout requests op
    const payouts = await prisma.affiliatePayout.findMany({
      include: {
        affiliateClient: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: {
        requestedAt: 'desc'
      }
    });

    // Bereken totalen
    const activeReferralsCount = affiliatePrograms.filter(r => {
      const client = referredClientsMap.get(r.referredClientId);
      return client && (client as any).subscriptionStatus === 'active';
    }).length;

    const totalStats = {
      totalAffiliates: affiliateStats.size,
      totalReferrals: affiliatePrograms.length,
      activeReferrals: activeReferralsCount,
      totalEarnedAllTime: earnings.reduce((sum, e) => sum + e.commissionAmount, 0),
      pendingPayouts: payouts.filter(p => p.status === 'requested').length,
      pendingPayoutAmount: payouts.filter(p => p.status === 'requested').reduce((sum, p) => sum + p.amount, 0)
    };

    return NextResponse.json({
      success: true,
      stats: totalStats,
      affiliates: Array.from(affiliateStats.values()),
      payouts: payouts.map(p => ({
        id: p.id,
        affiliateClientId: p.affiliateClientId,
        client: p.affiliateClient,
        amount: p.amount,
        status: p.status,
        paymentMethod: p.paymentMethod,
        paymentDetails: p.paymentDetails,
        requestedAt: p.requestedAt,
        processedAt: p.processedAt,
        paidAt: p.paidAt,
        notes: p.notes
      }))
    });
  } catch (error) {
    console.error('Error fetching affiliate payouts:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}
