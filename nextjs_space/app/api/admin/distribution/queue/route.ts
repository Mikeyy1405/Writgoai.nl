import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { QueueResponse } from '@/lib/types/distribution';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

// GET - Fetch queue items with filtering/pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '30');
    const platform = searchParams.get('platform');
    const clientId = searchParams.get('client_id');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const sortBy = searchParams.get('sort_by') || 'scheduled_at';
    const sortDirection = searchParams.get('sort_direction') || 'asc';

    // Build query
    let query = supabaseAdmin
      .from('distribution_tasks')
      .select(`
        *,
        Client!inner(id, name, company_name)
      `, { count: 'exact' });

    // Apply filters
    if (platform) {
      query = query.contains('platforms', [platform]);
    }
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (dateFrom) {
      query = query.gte('scheduled_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('scheduled_at', dateTo);
    }

    // Apply sorting
    const ascending = sortDirection === 'asc';
    if (sortBy === 'scheduled_at') {
      query = query.order('scheduled_at', { ascending });
    } else if (sortBy === 'status') {
      query = query.order('status', { ascending });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    query = query.range(from, to);

    const { data: tasks, error, count } = await query;

    if (error) {
      throw error;
    }

    // Map to QueueItem format
    const items = (tasks || []).map(task => ({
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

    const response: QueueResponse = {
      items,
      total: count || 0,
      page,
      per_page: perPage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Queue API] Failed to fetch queue:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de wachtrij' },
      { status: 500 }
    );
  }
}

// PUT - Update queue item (reschedule, edit)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Taak ID is verplicht' }, { status: 400 });
    }

    // Update task
    const { data: task, error } = await supabaseAdmin
      .from('distribution_tasks')
      .update({
        ...(data.scheduled_at && { scheduled_at: data.scheduled_at }),
        ...(data.platforms && { platforms: data.platforms }),
        ...(data.status && { status: data.status }),
        ...(data.metadata && { metadata: data.metadata }),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('[Queue API] Failed to update task:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de taak' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from queue
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Taak ID is verplicht' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('distribution_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Queue API] Failed to delete task:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen van de taak' },
      { status: 500 }
    );
  }
}
