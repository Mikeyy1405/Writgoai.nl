
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total clients
    let totalClients = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      totalClients = count || 0;
    } catch (error) {
      console.error('Error fetching total clients:', error);
    }
    
    // Get active clients (logged in last 30 days)
    let activeClients = 0;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count, error } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .gte('updatedAt', thirtyDaysAgo.toISOString());
      
      if (error) throw error;
      activeClients = count || 0;
    } catch (error) {
      console.error('Error fetching active clients:', error);
    }

    // Get total credits purchased and used (manual aggregation from Client table)
    let totalCreditsPurchased = 0;
    let totalCreditsUsed = 0;
    let currentSubscriptionCredits = 0;
    let currentTopUpCredits = 0;
    
    try {
      const { data: clients, error } = await supabaseAdmin
        .from('Client')
        .select('totalCreditsPurchased, totalCreditsUsed, subscriptionCredits, topUpCredits');
      
      if (error) throw error;
      
      if (clients) {
        totalCreditsPurchased = clients.reduce((sum, c) => sum + (c.totalCreditsPurchased || 0), 0);
        totalCreditsUsed = clients.reduce((sum, c) => sum + (c.totalCreditsUsed || 0), 0);
        currentSubscriptionCredits = clients.reduce((sum, c) => sum + (c.subscriptionCredits || 0), 0);
        currentTopUpCredits = clients.reduce((sum, c) => sum + (c.topUpCredits || 0), 0);
      }
    } catch (error) {
      console.error('Error fetching credit stats:', error);
    }

    // Get subscription counts (manual grouping)
    let subscriptionCounts: any[] = [];
    try {
      const { data: clients, error } = await supabaseAdmin
        .from('Client')
        .select('subscriptionPlan, subscriptionStatus')
        .eq('subscriptionStatus', 'active');
      
      if (error) throw error;
      
      if (clients) {
        // Group by subscription plan
        const grouped = clients.reduce((acc: any, client: any) => {
          const plan = client.subscriptionPlan || 'unknown';
          if (!acc[plan]) {
            acc[plan] = { subscriptionPlan: plan, _count: 0 };
          }
          acc[plan]._count++;
          return acc;
        }, {});
        
        subscriptionCounts = Object.values(grouped);
      }
    } catch (error) {
      console.error('Error fetching subscription counts:', error);
    }

    // Get recent activity
    // Note: ClientActivityLog table doesn't exist in current schema, return empty array
    const recentActivity: any[] = [];

    // Get total revenue
    // Note: CreditPurchase table doesn't exist in current schema, return default values
    const revenueData = {
      total: 0,
      totalCredits: 0
    };

    // Get monthly revenue
    // Note: CreditPurchase table doesn't exist in current schema, return empty array
    const monthlyRevenue: any[] = [];

    return NextResponse.json({
      totalClients,
      activeClients,
      credits: {
        totalPurchased: totalCreditsPurchased,
        totalUsed: totalCreditsUsed,
        currentSubscription: currentSubscriptionCredits,
        currentTopUp: currentTopUpCredits
      },
      subscriptions: subscriptionCounts,
      recentActivity,
      revenue: {
        total: revenueData.total,
        totalCredits: revenueData.totalCredits,
        monthly: monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Error fetching super admin stats:', error);
    
    // Return fallback data structure with defaults
    return NextResponse.json({
      totalClients: 0,
      activeClients: 0,
      credits: {
        totalPurchased: 0,
        totalUsed: 0,
        currentSubscription: 0,
        currentTopUp: 0
      },
      subscriptions: [],
      recentActivity: [],
      revenue: {
        total: 0,
        totalCredits: 0,
        monthly: []
      }
    });
  }
}
