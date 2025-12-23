import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin client for fetching articles (bypasses RLS)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get user's projects (using Project table with clientId)
    // The clientId in Project table links to Client.id, and Client.email matches user.email
    const { data: client } = await supabaseAdmin
      .from('Client')
      .select('id')
      .eq('email', user.email)
      .single();

    if (!client) {
      // No client found, return empty
      return NextResponse.json({ articles: [] });
    }

    // Get projects for this client
    const { data: userProjects } = await supabaseAdmin
      .from('Project')
      .select('id, name, websiteUrl')
      .eq('clientId', client.id);

    const userProjectIds = userProjects?.map(p => p.id) || [];

    if (userProjectIds.length === 0) {
      return NextResponse.json({ articles: [] });
    }

    // Get articles for user's projects (only articles WITH project_id)
    const { data: articles, error: dbError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .in('project_id', userProjectIds)
      .not('project_id', 'is', null)
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
      const project = userProjects?.find(p => p.id === article.project_id);
      return {
        ...article,
        project: project ? {
          id: project.id,
          name: project.name,
          website_url: project.websiteUrl
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
