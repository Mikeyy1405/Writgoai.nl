import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get('project_id');

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

    // Get config
    const { data: config } = await supabase
      .from('autopilot_config')
      .select('*')
      .eq('project_id', project_id)
      .single();

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, enabled, frequency, target_keywords, content_strategy } = body;

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

    // Calculate next run based on frequency
    const now = new Date();
    const nextRun = new Date(now);
    
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'biweekly':
        nextRun.setDate(nextRun.getDate() + 14);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    // Upsert config
    const { data: config, error: dbError } = await supabase
      .from('autopilot_config')
      .upsert({
        project_id,
        enabled,
        frequency,
        target_keywords: target_keywords || [],
        content_strategy,
        next_run: enabled ? nextRun.toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      project_id,
      action: 'config',
      message: `AutoPilot ${enabled ? 'enabled' : 'disabled'} with ${frequency} frequency`,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
