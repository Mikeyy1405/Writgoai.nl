import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { checkDailyLimits } from '@/lib/content-planner';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/writgo/plan/daily-limits?date=2024-01-01
 * Check daily limits for content generation
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
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const date = new Date(dateStr);

    // Get topics
    const { data: topics, error: topicsError } = await supabase
      .from('writgo_topics')
      .select('*')
      .order('priority', { ascending: true });

    if (topicsError || !topics) {
      return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
    }

    // Count articles generated today per topic
    const { data: todayArticles, error: articlesError } = await supabase
      .from('writgo_content_queue')
      .select('topic_id')
      .gte('scheduled_for', `${dateStr}T00:00:00`)
      .lte('scheduled_for', `${dateStr}T23:59:59`);

    if (articlesError) {
      console.error('Error fetching today articles:', articlesError);
    }

    // Count by topic
    const generatedToday: Record<string, number> = {};
    todayArticles?.forEach(article => {
      if (article.topic_id) {
        generatedToday[article.topic_id] = (generatedToday[article.topic_id] || 0) + 1;
      }
    });

    // Check limits
    const limits = checkDailyLimits(topics, date, generatedToday);

    // Calculate totals
    const totalMax = limits.reduce((sum, l) => sum + l.maxPerDay, 0);
    const totalGenerated = limits.reduce((sum, l) => sum + l.generatedToday, 0);
    const totalRemaining = limits.reduce((sum, l) => sum + l.remaining, 0);

    return NextResponse.json({
      success: true,
      date: dateStr,
      limits,
      totals: {
        maxPerDay: Math.min(3, totalMax), // Hard limit of 3 per day
        generatedToday: totalGenerated,
        remaining: Math.max(0, Math.min(3, totalMax) - totalGenerated)
      }
    });

  } catch (error: any) {
    console.error('Error checking daily limits:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
