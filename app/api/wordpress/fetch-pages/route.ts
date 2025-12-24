import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createWordPressClient } from '@/lib/wordpress-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authenticatie
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is verplicht' }, { status: 400 });
    }

    // Haal project op
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('wp_url, wp_username, wp_password, wp_app_password')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check WordPress configuratie
    if (!project.wp_url || !project.wp_username) {
      return NextResponse.json(
        { error: 'WordPress is niet geconfigureerd voor dit project' },
        { status: 400 }
      );
    }

    const password = project.wp_app_password || project.wp_password;
    if (!password) {
      return NextResponse.json({ error: 'WordPress password ontbreekt' }, { status: 400 });
    }

    // Maak WordPress client
    const wpClient = createWordPressClient({
      url: project.wp_url,
      username: project.wp_username,
      password: password,
    });

    console.log(`Fetching WordPress pages (page ${page}, per_page ${perPage})`);

    // Haal pages op
    const pages = await wpClient.getPages({
      page,
      per_page: perPage,
    });

    // Transform pages
    const transformedPages = pages.map((page: any) => ({
      wordpress_id: page.id,
      title: page.title.rendered,
      content: page.content.rendered,
      slug: page.slug,
      status: page.status,
      wordpress_url: page.link,
      published_at: page.date,
      modified_at: page.modified,
    }));

    console.log(`✓ Fetched ${transformedPages.length} pages`);

    return NextResponse.json({
      success: true,
      pages: transformedPages,
      pagination: {
        current_page: page,
        per_page: perPage,
      },
    });

  } catch (error: any) {
    console.error('WordPress pages fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen van WordPress pages' },
      { status: 500 }
    );
  }
}
