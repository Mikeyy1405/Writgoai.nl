import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Fetch all stats in parallel
    const [
      // Revenue stats
      currentMonthRevenue,
      lastMonthRevenue,
      
      // Client stats
      totalClients,
      newClientsThisMonth,
      newClientsLastMonth,
      
      // Conversion stats
      totalTrials,
      convertedTrials,
      
      // Content stats
      contentThisWeek,
      contentLastWeek,
      
      // Recent activity
      recentClients,
      recentContent,
    ] = await Promise.all([
      // Current month revenue
      supabaseAdmin
        .from('Payment')
        .select('amount')
        .gte('created_at', startOfMonth.toISOString())
        .eq('status', 'succeeded')
        .then(({ data }) => data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0),
      
      // Last month revenue
      supabaseAdmin
        .from('Payment')
        .select('amount')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())
        .eq('status', 'succeeded')
        .then(({ data }) => data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0),
      
      // Get total clients from database
      (async () => {
        try {
          const { count } = await supabaseAdmin
            .from('Client')
            .select('*', { count: 'exact', head: true });
          return count || 0;
        } catch {
          return 0;
        }
      })(),
      
      // New clients this month
      supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .then(({ count }) => count || 0),
      
      // New clients last month
      supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString())
        .then(({ count }) => count || 0),
      
      // Total trials
      supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .not('trial_started_at', 'is', null)
        .then(({ count }) => count || 0),
      
      // Converted trials
      supabaseAdmin
        .from('Client')
        .select('*', { count: 'exact', head: true })
        .not('trial_started_at', 'is', null)
        .eq('subscription_status', 'active')
        .then(({ count }) => count || 0),
      
      // Content this week
      supabaseAdmin
        .from('GeneratedContent')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
        .then(({ count }) => count || 0),
      
      // Content last week
      supabaseAdmin
        .from('GeneratedContent')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', startOfWeek.toISOString())
        .then(({ count }) => count || 0),
      
      // Recent clients
      supabaseAdmin
        .from('Client')
        .select('id, email, company_name, created_at, subscription_status')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => data || []),
      
      // Recent content
      supabaseAdmin
        .from('GeneratedContent')
        .select('id, title, content_type, created_at, client_id')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => data || []),
    ]);

    // Calculate growth percentages
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;
    
    const clientGrowth = newClientsLastMonth > 0 
      ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100 
      : 0;
    
    const conversionRate = totalTrials > 0 
      ? (convertedTrials / totalTrials) * 100 
      : 0;
    
    const contentGrowth = contentLastWeek > 0 
      ? ((contentThisWeek - contentLastWeek) / contentLastWeek) * 100 
      : 0;

    return NextResponse.json({
      stats: {
        revenue: {
          current: currentMonthRevenue / 100, // Convert cents to euros
          growth: revenueGrowth,
        },
        clients: {
          total: totalClients,
          growth: clientGrowth,
        },
        conversion: {
          rate: conversionRate,
          total: totalTrials,
          converted: convertedTrials,
        },
        content: {
          thisWeek: contentThisWeek,
          growth: contentGrowth,
        },
      },
      recentActivity: {
        clients: recentClients,
        content: recentContent,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
