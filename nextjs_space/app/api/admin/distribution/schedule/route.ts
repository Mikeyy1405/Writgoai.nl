import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';
import { schedulePost } from '@/lib/services/getlatedev';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

// POST - Schedule content for distribution
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
    const { data: task, error: createError } = await supabaseAdmin
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

    if (createError) {
      throw createError;
    }

    // Schedule with GetLateDev
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

      return NextResponse.json(updatedTask, { status: 201 });
    } catch (scheduleError) {
      console.error('[Schedule API] GetLateDev scheduling failed:', scheduleError);
      
      // Update task status to failed
      await supabaseAdmin
        .from('distribution_tasks')
        .update({
          status: 'failed',
          error_message: 'Fout bij het plannen met GetLateDev',
        })
        .eq('id', task.id);

      return NextResponse.json(
        { error: 'Fout bij het plannen met GetLateDev', task },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Schedule API] Failed to schedule:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het plannen van de distributie' },
      { status: 500 }
    );
  }
}

// PUT - Update scheduled item
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
        ...(data.metadata && { metadata: data.metadata }),
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // TODO: Update with GetLateDev if needed

    return NextResponse.json(task);
  } catch (error) {
    console.error('[Schedule API] Failed to update:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de planning' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel scheduled item
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

    // Get task to cancel GetLateDev job
    const { data: task } = await supabaseAdmin
      .from('distribution_tasks')
      .select('*')
      .eq('id', id)
      .single();

    // TODO: Cancel with GetLateDev if job_id exists

    // Update status to cancelled
    const { error } = await supabaseAdmin
      .from('distribution_tasks')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Schedule API] Failed to cancel:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het annuleren van de planning' },
      { status: 500 }
    );
  }
}
