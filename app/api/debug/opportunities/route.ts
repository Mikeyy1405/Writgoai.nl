import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization to prevent build-time errors
let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabase as any;
}

export async function GET() {
  try {
    // Get ALL opportunities (no filters)
    const { data: allOpps, error: allError } = await getSupabase()
      .from('writgo_content_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }
    
    // Group by status
    const byStatus = allOpps?.reduce((acc: any, opp: any) => {
      acc[opp.status] = (acc[opp.status] || 0) + 1;
      return acc;
    }, {});
    
    // Get recent ones (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recent = allOpps?.filter((o: any) => o.created_at > oneDayAgo);
    
    // Get detected ones
    const detected = allOpps?.filter((o: any) => o.status === 'detected');
    
    return NextResponse.json({
      total: allOpps?.length || 0,
      byStatus,
      recentCount: recent?.length || 0,
      detectedCount: detected?.length || 0,
      recentOpportunities: recent?.slice(0, 10).map((o: any) => ({
        id: o.id,
        title: o.title,
        status: o.status,
        priority: o.priority,
        created_at: o.created_at,
        trigger_name: o.metadata?.trigger_name
      })),
      detectedOpportunities: detected?.slice(0, 10).map((o: any) => ({
        id: o.id,
        title: o.title,
        priority: o.priority,
        created_at: o.created_at
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
