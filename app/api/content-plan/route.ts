import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

// Get content plan for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // First, try to get from content_plans table
    const { data: plan, error } = await getSupabaseAdmin()
      .from('content_plans')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    // If we found a plan, return it
    if (plan) {
      return NextResponse.json({ plan });
    }

    // If no plan in content_plans, check for completed jobs
    const { data: completedJob, error: jobError } = await getSupabaseAdmin()
      .from('content_plan_jobs')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobError && jobError.code !== 'PGRST116') {
      console.error('Job lookup error:', jobError);
    }

    // If we found a completed job, save it to content_plans and return it
    if (completedJob && completedJob.plan) {
      // Save to content_plans for future use
      const { data: savedPlan, error: saveError } = await getSupabaseAdmin()
        .from('content_plans')
        .insert({
          project_id: projectId,
          niche: completedJob.niche,
          language: completedJob.language,
          target_count: completedJob.target_count,
          competition_level: completedJob.competition_level,
          reasoning: completedJob.reasoning,
          plan: completedJob.plan,
          clusters: completedJob.clusters,
          stats: completedJob.stats,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save completed job to content_plans:', saveError);
        // Still return the job data even if save failed
        return NextResponse.json({ 
          plan: {
            project_id: projectId,
            niche: completedJob.niche,
            language: completedJob.language,
            target_count: completedJob.target_count,
            competition_level: completedJob.competition_level,
            reasoning: completedJob.reasoning,
            plan: completedJob.plan,
            clusters: completedJob.clusters,
            stats: completedJob.stats,
          }
        });
      }

      return NextResponse.json({ plan: savedPlan });
    }

    return NextResponse.json({ plan: null });
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
    const { data: existingPlan } = await getSupabaseAdmin()
      .from('content_plans')
      .select('id')
      .eq('project_id', project_id)
      .limit(1)
      .single();

    let result;
    if (existingPlan) {
      // Update existing plan
      const { data, error } = await getSupabaseAdmin()
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
      const { data, error } = await getSupabaseAdmin()
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

    const { error } = await getSupabaseAdmin()
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
