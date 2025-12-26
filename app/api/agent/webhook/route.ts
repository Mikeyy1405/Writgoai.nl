import { createClient } from '@/lib/supabase/service-role';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/agent/webhook
 * Receive updates from VPS (task status, results, screenshots, etc.)
 *
 * This endpoint is called by the VPS to update task status
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.AGENT_WEBHOOK_SECRET || 'your-secret-key';

    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      task_id,
      status,
      result_data,
      result_files,
      error_message,
      session_data,
      screenshots,
      activity_log,
    } = body;

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Get task
    const { data: task, error: fetchError } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Update task
    const updates: any = {};

    if (status) {
      updates.status = status;

      if (status === 'running' && !task.started_at) {
        updates.started_at = new Date().toISOString();
      }

      if (['completed', 'failed', 'cancelled'].includes(status)) {
        updates.completed_at = new Date().toISOString();

        if (task.started_at) {
          const duration = Math.floor(
            (new Date().getTime() - new Date(task.started_at).getTime()) / 1000
          );
          updates.duration_seconds = duration;
        }
      }
    }

    if (result_data) {
      updates.result_data = result_data;
    }

    if (result_files) {
      updates.result_files = result_files;
    }

    if (error_message) {
      updates.error_message = error_message;
    }

    // Update task
    const { error: updateError } = await supabase
      .from('agent_tasks')
      .update(updates)
      .eq('id', task_id);

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update or create session
    if (session_data || screenshots || activity_log) {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('task_id', task_id)
        .single();

      const sessionUpdates: any = {
        task_id,
        user_id: task.user_id,
      };

      if (session_data) {
        if (session_data.container_id) sessionUpdates.container_id = session_data.container_id;
        if (session_data.vnc_url) sessionUpdates.vnc_url = session_data.vnc_url;
        if (session_data.current_url) sessionUpdates.current_url = session_data.current_url;
      }

      if (screenshots) {
        sessionUpdates.screenshots = screenshots;
      }

      if (activity_log) {
        // Append to existing activity log
        if (existingSession?.activity_log) {
          sessionUpdates.activity_log = [
            ...existingSession.activity_log,
            ...activity_log,
          ];
        } else {
          sessionUpdates.activity_log = activity_log;
        }
      }

      if (['completed', 'failed', 'cancelled'].includes(status)) {
        sessionUpdates.is_active = false;
        sessionUpdates.ended_at = new Date().toISOString();
      }

      if (existingSession) {
        // Update existing session
        await supabase
          .from('agent_sessions')
          .update(sessionUpdates)
          .eq('id', existingSession.id);
      } else {
        // Create new session
        await supabase.from('agent_sessions').insert(sessionUpdates);
      }
    }

    // TODO: Send notification to user if task completed/failed
    // You can integrate with your notification system here

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in POST /api/agent/webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
