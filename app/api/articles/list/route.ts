import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's projects with their articles
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, website_url')
      .eq('user_id', user.id);

    if (projectsError) {
      console.error('Projects error:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    const userProjectIds = projects.map(p => p.id);

    // Get articles for user's projects
    const { data: articles, error: dbError } = await supabase
      .from('articles')
      .select('*')
      .in('project_id', userProjectIds)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Add project info to articles
    const articlesWithProject = (articles || []).map(article => {
      const project = projects.find(p => p.id === article.project_id);
      return {
        ...article,
        project: project ? {
          id: project.id,
          name: project.name,
          website_url: project.website_url
        } : null
      };
    });

    return NextResponse.json({ articles: articlesWithProject });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
