import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { schedulePost, getJobStatus, handleWebhook } from '@/lib/services/getlatedev';

export const maxDuration = 60;

// POST - Send to GetLateDev API
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    // Check if this is a webhook (no auth required for webhooks)
    if (data.webhook) {
      await handleWebhook(data);
      return NextResponse.json({ success: true });
    }

    // Validate task ID
    if (!data.task_id) {
      return NextResponse.json({ error: 'Taak ID is verplicht' }, { status: 400 });
    }

    // Get task from database
    const { data: task, error: fetchError } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*')
      .eq('id', data.task_id)
      .single();

    if (fetchError || !task) {
      return NextResponse.json({ error: 'Taak niet gevonden' }, { status: 404 });
    }

    // Send to GetLateDev
    try {
      const jobId = await schedulePost(task);
      
      // Update task with job ID
      const { data: updatedTask, error: updateError } = await supabaseAdmin
        .from('distribution_tasks')
        .update({
          getlatedev_job_id: jobId,
          status: 'scheduled',
        })
        .eq('id', task.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ 
        success: true,
        job_id: jobId,
        task: updatedTask,
      });
    } catch (scheduleError) {
      console.error('[GetLateDev API] Scheduling failed:', scheduleError);
      
      // Update task status to failed
      await supabaseAdmin
        .from('distribution_tasks')
        .update({
          status: 'failed',
          error_message: 'Fout bij het plannen met GetLateDev',
        })
        .eq('id', task.id);

      return NextResponse.json(
        { error: 'Fout bij het plannen met GetLateDev' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[GetLateDev API] Request failed:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij de GetLateDev aanvraag' },
      { status: 500 }
    );
  }
}

// GET - Fetch GetLateDev status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is verplicht' }, { status: 400 });
    }

    // Get status from GetLateDev
    const status = await getJobStatus(jobId);

    return NextResponse.json(status);
  } catch (error) {
    console.error('[GetLateDev API] Failed to fetch status:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de status' },
      { status: 500 }
    );
  }
}
