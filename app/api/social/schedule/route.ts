import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

interface ScheduleConfig {
  project_id: string;
  enabled: boolean;
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekdays' | 'weekly' | 'custom';
  custom_days?: number[];
  post_times: string[];
  auto_generate_content: boolean;
  use_content_ideas: boolean;
  post_types: string[];
  target_platforms: string[];
  auto_publish: boolean;
  schedule_posts: boolean;
  // Auto-populate calendar settings
  auto_populate_calendar?: boolean;
  include_holidays?: boolean;
  days_ahead?: number;
}

// Get schedule for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data: schedule, error } = await getSupabase()
      .from('social_schedules')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ schedule: schedule || null });
  } catch (error: any) {
    console.error('Get schedule error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create or update schedule
export async function POST(request: Request) {
  try {
    const body: Partial<ScheduleConfig> = await request.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Validate frequency
    const validFrequencies = ['daily', 'twice_daily', 'three_times_daily', 'weekdays', 'weekly', 'custom'];
    if (body.frequency && !validFrequencies.includes(body.frequency)) {
      return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    // Default values for new schedule
    const scheduleData = {
      project_id,
      enabled: body.enabled ?? true,
      frequency: body.frequency || 'daily',
      custom_days: body.custom_days || null,
      post_times: body.post_times || ['09:00'],
      auto_generate_content: body.auto_generate_content ?? true,
      use_content_ideas: body.use_content_ideas ?? true,
      post_types: body.post_types || ['educational', 'storytelling', 'engagement'],
      target_platforms: body.target_platforms || ['instagram'],
      auto_publish: body.auto_publish ?? false,
      schedule_posts: body.schedule_posts ?? true,
      // Auto-populate calendar settings
      auto_populate_calendar: body.auto_populate_calendar ?? true,
      include_holidays: body.include_holidays ?? true,
      days_ahead: body.days_ahead ?? 14,
    };

    // Check if schedule exists for this project
    const { data: existingSchedule } = await getSupabase()
      .from('social_schedules')
      .select('id')
      .eq('project_id', project_id)
      .limit(1)
      .single();

    let result;
    if (existingSchedule) {
      const { data, error } = await getSupabase()
        .from('social_schedules')
        .update(scheduleData)
        .eq('id', existingSchedule.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await getSupabase()
        .from('social_schedules')
        .insert(scheduleData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // If auto_populate_calendar is enabled, trigger auto-population
    if (result.auto_populate_calendar && result.enabled) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        await fetch(`${appUrl}/api/social/auto-populate-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id,
            days_ahead: result.days_ahead || 14,
            include_holidays: result.include_holidays ?? true,
            platforms: result.target_platforms || ['instagram'],
          }),
        });
      } catch (autoPopulateError) {
        console.error('Auto-populate calendar error:', autoPopulateError);
        // Don't fail the schedule save if auto-populate fails
      }
    }

    return NextResponse.json({
      success: true,
      schedule: result,
      message: existingSchedule ? 'Schedule updated' : 'Schedule created',
    });
  } catch (error: any) {
    console.error('Create/update schedule error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete schedule
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('schedule_id');

    if (!scheduleId) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const { error } = await getSupabase()
      .from('social_schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Toggle schedule enabled/disabled
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { schedule_id, enabled } = body;

    if (!schedule_id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from('social_schedules')
      .update({ enabled: enabled ?? true })
      .eq('id', schedule_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      schedule: data,
      message: enabled ? 'Schedule enabled' : 'Schedule paused',
    });
  } catch (error: any) {
    console.error('Toggle schedule error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
