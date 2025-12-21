import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateContentCalendar, checkDailyLimits } from '@/lib/content-planner';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/writgo/plan/calendar
 * Generate content calendar
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      startDate = new Date().toISOString().split('T')[0],
      days = 30,
      articlesPerDay = 2
    } = body;

    // Get topics
    const { data: topics, error: topicsError } = await supabase
      .from('writgo_topics')
      .select('*')
      .order('priority', { ascending: true });

    if (topicsError || !topics) {
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    // Generate calendar
    const start = new Date(startDate);
    const calendar = generateContentCalendar(topics, start, days, articlesPerDay);

    // Save to database
    const calendarEntries = calendar.map(entry => ({
      topic_id: entry.topicId,
      planned_date: entry.date.toISOString().split('T')[0],
      planned_time: entry.plannedTime,
      content_type: entry.contentType,
      title: entry.title,
      focus_keyword: entry.focusKeyword,
      priority_score: entry.priorityScore,
      status: 'planned'
    }));

    // Delete existing planned entries for this period
    await supabase
      .from('writgo_content_calendar')
      .delete()
      .gte('planned_date', start.toISOString().split('T')[0])
      .eq('status', 'planned');

    // Insert new entries
    const { data: inserted, error: insertError } = await supabase
      .from('writgo_content_calendar')
      .insert(calendarEntries)
      .select();

    if (insertError) {
      console.error('Error inserting calendar entries:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'calendar_generated',
      description: `Content calendar gegenereerd: ${days} dagen, ${calendar.length} artikelen`,
      status: 'success',
      metadata: { days, articlesPerDay, count: calendar.length }
    });

    return NextResponse.json({
      success: true,
      calendar: inserted,
      count: calendar.length,
      summary: {
        days,
        articlesPerDay,
        totalArticles: calendar.length,
        startDate: start.toISOString().split('T')[0],
        endDate: new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    });

  } catch (error: any) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/writgo/plan/calendar?start=2024-01-01&days=30
 * Get existing calendar
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start') || new Date().toISOString().split('T')[0];
    const days = parseInt(searchParams.get('days') || '30');

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Get calendar entries
    const { data: entries, error } = await supabase
      .from('writgo_content_calendar')
      .select(`
        *,
        writgo_topics (
          name,
          slug,
          color,
          icon
        )
      `)
      .gte('planned_date', startDate)
      .lte('planned_date', endDate.toISOString().split('T')[0])
      .order('planned_date', { ascending: true })
      .order('planned_time', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      calendar: entries || [],
      count: entries?.length || 0
    });

  } catch (error: any) {
    console.error('Error fetching calendar:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
