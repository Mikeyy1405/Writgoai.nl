import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { DistributionStats, DistributionOverview, PlatformConfig, PLATFORM_CONFIGS } from '@/lib/types/distribution';
import { startOfToday, startOfWeek } from 'date-fns';

export const maxDuration = 60;

// GET - Fetch distribution overview stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get stats
    const today = startOfToday();
    const weekStart = startOfWeek(today);

    // Count posts today
    const { count: todayCount } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_at', today.toISOString());

    // Count posts this week
    const { count: weekCount } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*', { count: 'exact', head: true })
      .gte('scheduled_at', weekStart.toISOString());

    // Count pending posts
    const { count: pendingCount } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'scheduled']);

    // Count failed posts
    const { count: failedCount } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Count published posts
    const { count: publishedCount } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    // Calculate success rate
    const totalAttempts = (publishedCount || 0) + (failedCount || 0);
    const successRate = totalAttempts > 0 
      ? Math.round(((publishedCount || 0) / totalAttempts) * 100) 
      : 100;

    const stats: DistributionStats = {
      today: todayCount || 0,
      this_week: weekCount || 0,
      pending: pendingCount || 0,
      success_rate: successRate,
      failed: failedCount || 0,
    };

    // Get recent activity (last 10 tasks)
    const { data: recentTasks } = await supabaseAdmin
      .from('distribution_tasks')
      .select(`
        *,
        Client!inner(id, name, company_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const recentActivity = (recentTasks || []).map(task => ({
      id: task.id,
      task: {
        id: task.id,
        content_id: task.content_id,
        client_id: task.client_id,
        platforms: task.platforms,
        scheduled_at: new Date(task.scheduled_at),
        status: task.status,
        getlatedev_job_id: task.getlatedev_job_id,
        created_at: new Date(task.created_at),
        updated_at: new Date(task.updated_at),
        published_at: task.published_at ? new Date(task.published_at) : undefined,
        error_message: task.error_message,
        metadata: task.metadata,
      },
      content: {
        title: task.metadata?.title || 'Geen titel',
        preview: task.metadata?.preview || '',
        type: task.metadata?.type || 'social_post',
      },
      client: {
        id: task.Client.id,
        name: task.Client.name,
        company: task.Client.company_name || task.Client.name,
      },
    }));

    // Get platform status (mock for now)
    const platformStatus: PlatformConfig[] = Object.values(PLATFORM_CONFIGS).map(config => ({
      ...config,
      enabled: true,
      connected: false, // TODO: Check actual connection status
      last_sync: undefined,
    }));

    const overview: DistributionOverview = {
      stats,
      recent_activity: recentActivity,
      platform_status: platformStatus,
    };

    return NextResponse.json(overview);
  } catch (error) {
    console.error('[Distribution API] Failed to fetch overview:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de distributie gegevens' },
      { status: 500 }
    );
  }
}

// POST - Create new distribution task
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.content_id || !data.client_id || !data.platforms || !data.scheduled_at) {
      return NextResponse.json({ 
        error: 'Verplichte velden ontbreken: content_id, client_id, platforms, scheduled_at' 
      }, { status: 400 });
    }

    // Create distribution task
    const { data: task, error } = await supabaseAdmin
      .from('distribution_tasks')
      .insert({
        content_id: data.content_id,
        client_id: data.client_id,
        platforms: data.platforms,
        scheduled_at: data.scheduled_at,
        status: 'pending',
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('[Distribution API] Failed to create task:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de distributie taak' },
      { status: 500 }
    );
  }
}
