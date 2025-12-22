import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get content plan for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get the latest content plan for this project
    const { data: plan, error } = await supabaseAdmin
      .from('content_plans')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    return NextResponse.json({ plan: plan || null });
  } catch (error: any) {
    console.error('Get content plan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Save content plan for a project
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      project_id, 
      user_id,
      niche, 
      language, 
      target_count, 
      competition_level, 
      reasoning, 
      plan, 
      clusters, 
      stats 
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Check if a plan already exists for this project
    const { data: existingPlan } = await supabaseAdmin
      .from('content_plans')
      .select('id')
      .eq('project_id', project_id)
      .limit(1)
      .single();

    let result;
    if (existingPlan) {
      // Update existing plan
      const { data, error } = await supabaseAdmin
        .from('content_plans')
        .update({
          niche,
          language,
          target_count,
          competition_level,
          reasoning,
          plan,
          clusters,
          stats,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPlan.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new plan
      const { data, error } = await supabaseAdmin
        .from('content_plans')
        .insert({
          project_id,
          user_id,
          niche,
          language,
          target_count,
          competition_level,
          reasoning,
          plan,
          clusters,
          stats,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, plan: result });
  } catch (error: any) {
    console.error('Save content plan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete content plan
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('content_plans')
      .delete()
      .eq('project_id', projectId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete content plan error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
