import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/tasks/[id]
 * Get task details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const taskId = params.id;

    // Get task with session data
    const { data: task, error } = await supabase
      .from('agent_tasks')
      .select(`
        *,
        agent_templates(name, icon, description),
        agent_sessions(
          id,
          activity_log,
          screenshots,
          current_url,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error in GET /api/agent/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/agent/tasks/[id]
 * Update task (e.g., cancel, retry)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const taskId = params.id;
    const body = await request.json();
    const { status, action } = body;

    // Verify task belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Handle actions
    if (action === 'cancel') {
      // Cancel task
      const { data: updatedTask, error: updateError } = await supabase
        .from('agent_tasks')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // TODO: Send cancel request to VPS
      // await cancelTaskOnVPS(taskId);

      return NextResponse.json({ task: updatedTask });
    } else if (action === 'retry') {
      // Retry failed task
      const { data: updatedTask, error: updateError } = await supabase
        .from('agent_tasks')
        .update({
          status: 'queued',
          error_message: null,
          started_at: null,
          completed_at: null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // TODO: Send task to VPS again
      // await sendTaskToVPS(updatedTask);

      return NextResponse.json({ task: updatedTask });
    } else if (status) {
      // Update status manually (used by VPS webhook)
      const updates: any = { status };

      if (status === 'running' && !existingTask.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (['completed', 'failed', 'cancelled'].includes(status)) {
        updates.completed_at = new Date().toISOString();

        if (existingTask.started_at) {
          const duration = Math.floor(
            (new Date().getTime() - new Date(existingTask.started_at).getTime()) / 1000
          );
          updates.duration_seconds = duration;
        }
      }

      const { data: updatedTask, error: updateError } = await supabase
        .from('agent_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ task: updatedTask });
    }

    return NextResponse.json({ error: 'Invalid action or status' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in PATCH /api/agent/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/tasks/[id]
 * Delete task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const taskId = params.id;

    // Delete task (cascade will delete sessions and chat messages)
    const { error } = await supabase
      .from('agent_tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/agent/tasks/[id]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
