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

    // Get user's articles with project info
    const { data: articles, error: dbError } = await supabase
      .from('articles')
      .select(`
        *,
        project:projects(id, name, website_url)
      `)
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Filter articles that belong to user's projects
    const userProjects = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);

    const userProjectIds = userProjects.data?.map(p => p.id) || [];
    const filteredArticles = articles?.filter(a => userProjectIds.includes(a.project_id)) || [];

    return NextResponse.json({ articles: filteredArticles });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
