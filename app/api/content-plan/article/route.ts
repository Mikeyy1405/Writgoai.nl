import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get a specific article from the content plan by index
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const articleIndex = searchParams.get('index');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (articleIndex === null) {
      return NextResponse.json({ error: 'Article index is required' }, { status: 400 });
    }

    const index = parseInt(articleIndex, 10);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: 'Invalid article index' }, { status: 400 });
    }

    // First try content_plans table
    let { data: plan, error } = await supabaseAdmin
      .from('content_plans')
      .select('plan, language, niche')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // If not found, try content_plan_jobs table
    if (error || !plan || !plan.plan) {
      const { data: job, error: jobError } = await supabaseAdmin
        .from('content_plan_jobs')
        .select('plan, language, niche')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (jobError || !job) {
        return NextResponse.json({ error: 'No content plan found for this project' }, { status: 404 });
      }

      plan = job;
    }

    const articles = plan.plan as any[];
    
    if (!articles || !Array.isArray(articles)) {
      return NextResponse.json({ error: 'Content plan has no articles' }, { status: 404 });
    }

    if (index >= articles.length) {
      return NextResponse.json({ error: 'Article index out of range' }, { status: 404 });
    }

    const article = articles[index];

    return NextResponse.json({ 
      article: {
        ...article,
        index,
        language: plan.language,
        niche: plan.niche,
      },
      totalArticles: articles.length,
    });
  } catch (error: any) {
    console.error('Get article error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
