import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send task to VPS for execution
 */
async function sendTaskToVPS(task: any) {
  const vpsApiUrl = process.env.VPS_API_URL;
  const vpsApiSecret = process.env.VPS_API_SECRET;

  if (!vpsApiUrl || !vpsApiSecret) {
    throw new Error('VPS configuration missing (VPS_API_URL or VPS_API_SECRET)');
  }

  const response = await fetch(`${vpsApiUrl}/tasks/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vpsApiSecret}`,
    },
    body: JSON.stringify({
      task_id: task.id,
      title: task.title,
      description: task.description,
      prompt: task.prompt,
      priority: task.priority,
      user_id: task.user_id,
      project_id: task.project_id,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`VPS API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * GET /api/agent/tasks
 * List user's agent tasks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const projectId = searchParams.get('project_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('agent_tasks')
      .select('*, agent_templates(name, icon)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by status
    const grouped = {
      running: tasks?.filter((t) => t.status === 'running') || [],
      queued: tasks?.filter((t) => t.status === 'queued') || [],
      completed: tasks?.filter((t) => t.status === 'completed') || [],
      failed: tasks?.filter((t) => t.status === 'failed') || [],
      cancelled: tasks?.filter((t) => t.status === 'cancelled') || [],
    };

    return NextResponse.json({ tasks, grouped });
  } catch (error: any) {
    console.error('Error in GET /api/agent/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agent/tasks
 * Create a new agent task
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      prompt,
      project_id,
      template_id,
      priority = 'normal',
    } = body;

    if (!title || !prompt) {
      return NextResponse.json(
        { error: 'Title and prompt are required' },
        { status: 400 }
      );
    }

    // Check user credits (if you want to charge for agent tasks)
    // For now, we'll skip this, but you can add it later

    // Create task
    const { data: task, error: createError } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: user.id,
        project_id: project_id || null,
        template_id: template_id || null,
        title,
        description,
        prompt,
        priority,
        status: 'queued',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Send task to VPS for execution
    const vpsEnabled = process.env.VPS_ENABLED === 'true';
    if (vpsEnabled) {
      try {
        await sendTaskToVPS(task);
      } catch (vpsError) {
        console.error('VPS execution error:', vpsError);
        // Task is still created in DB, mark as failed
        await supabase
          .from('agent_tasks')
          .update({
            status: 'failed',
            error_message: `VPS error: ${vpsError instanceof Error ? vpsError.message : 'Unknown error'}`
          })
          .eq('id', task.id);
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      project_id: project_id || null,
      action: 'agent_task_created',
      details: `Created agent task: ${title}`,
      metadata: { task_id: task.id },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/agent/tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
