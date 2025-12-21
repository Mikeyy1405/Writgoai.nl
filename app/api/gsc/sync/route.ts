import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Note: This is a placeholder for GSC integration
// In production, you would use Google Search Console API with OAuth
// For now, this allows manual data import or webhook integration

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, queries } = body;

    if (!project_id || !queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'Project ID and queries array required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Insert GSC data
    const gscRecords = queries.map((q: any) => ({
      project_id,
      query: q.query,
      clicks: q.clicks || 0,
      impressions: q.impressions || 0,
      ctr: q.ctr || 0,
      position: q.position || 0,
      date: q.date || new Date().toISOString().split('T')[0],
    }));

    const { error: insertError } = await supabase
      .from('gsc_data')
      .upsert(gscRecords, {
        onConflict: 'project_id,query,date',
      });

    if (insertError) {
      console.error('Database error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save GSC data' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'scan',
      message: `Synced ${queries.length} queries from Google Search Console`,
    });

    return NextResponse.json({
      success: true,
      synced: queries.length,
    });
  } catch (error: any) {
    console.error('Error syncing GSC data:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get GSC data for a project
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');
    const days = parseInt(searchParams.get('days') || '30');

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get GSC data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: gscData, error: dbError } = await supabase
      .from('gsc_data')
      .select('*')
      .eq('project_id', project_id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('impressions', { ascending: false })
      .limit(100);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch GSC data' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: gscData });
  } catch (error) {
    console.error('Error fetching GSC data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
