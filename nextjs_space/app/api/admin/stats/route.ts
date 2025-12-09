
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { withTimeout, API_TIMEOUTS } from '@/lib/api-timeout';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats - Get admin dashboard stats
 */
export async function GET() {
  try {
    // Check session with timeout
    const session = await withTimeout(
      getServerSession(authOptions),
      API_TIMEOUTS.SESSION_CHECK,
      'Session check timeout'
    ).catch((error) => {
      console.error('Session check failed:', error);
      return null;
    });

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get total clients
    let totalClients = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true });
      if (!error) totalClients = count || 0;
    } catch (error) {
      console.error('Error fetching total clients:', error);
    }

    // Get active subscriptions
    let activeSubscriptions = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .eq('subscriptionStatus', 'active');
      if (!error) activeSubscriptions = count || 0;
    } catch (error) {
      console.error('Error fetching active subscriptions:', error);
    }

    // Note: These tables don't exist in current schema, return default values
    const pendingFeedback = 0;
    const unreadMessages = 0;
    const unreadSupport = 0;
    const pendingPayouts = 0;
    const pendingPayoutAmount = 0;

    // Get total content generated (using SavedContent table)
    let totalContentGenerated = 0;
    try {
      const { count, error } = await supabaseAdmin
        .from('SavedContent')
        .select('*', { count: 'exact', head: true });
      if (!error) totalContentGenerated = count || 0;
    } catch (error) {
      console.error('Error fetching total content generated:', error);
    }

    // Get credits used this month (from CreditTransaction table)
    let creditsUsedThisMonth = 0;
    try {
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const { data: transactions, error } = await supabaseAdmin
        .from('CreditTransaction')
        .select('amount, type')
        .eq('type', 'usage')
        .gte('createdAt', firstDayOfMonth.toISOString());
      
      if (!error && transactions) {
        creditsUsedThisMonth = Math.abs(
          transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
        );
      }
    } catch (error) {
      console.error('Error fetching credits used this month:', error);
    }

    // Note: CreditPurchase table doesn't exist, return 0 for revenue
    const revenueThisMonth = 0;

    // Get recent clients
    let recentClients: any[] = [];
    try {
      const { data, error } = await supabaseAdmin
        .from('Client')
        .select('id, name, email, createdAt, subscriptionPlan')
        .order('createdAt', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        recentClients = data;
      }
    } catch (error) {
      console.error('Error fetching recent clients:', error);
    }

    // Note: Feedback table doesn't exist, return empty array
    const recentFeedback: any[] = [];

    return NextResponse.json({
      stats: {
        totalClients: totalClients || 0,
        activeSubscriptions: activeSubscriptions || 0,
        pendingFeedback: pendingFeedback || 0,
        unreadMessages: unreadMessages || 0,
        unreadSupport: unreadSupport || 0,
        totalContentGenerated: totalContentGenerated || 0,
        creditsUsedThisMonth: creditsUsedThisMonth || 0,
        revenueThisMonth: revenueThisMonth || 0,
        pendingPayouts: pendingPayouts || 0,
        pendingPayoutAmount: pendingPayoutAmount || 0
      },
      recentActivities: {
        recentClients: recentClients || [],
        recentFeedback: recentFeedback || []
      }
    });
  } catch (error) {
    console.error('[Admin Stats API] Error:', error);
    
    // Return a more descriptive error
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Er is een onbekende fout opgetreden';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
