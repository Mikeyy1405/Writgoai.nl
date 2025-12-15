import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/simplified/publish/wordpress
 * Publiceer een artikel naar WordPress
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { articleId, projectId } = await req.json();

    if (!articleId || !projectId) {
      return NextResponse.json(
        { error: 'Article ID and Project ID are required' },
        { status: 400 }
      );
    }

    console.log('[WordPress Publish] Starting...');
    console.log('[WordPress Publish] Article ID:', articleId);
    console.log('[WordPress Publish] Project ID:', projectId);

    // Get client
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[WordPress Publish] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get project with WordPress credentials
    const { data: project, error: projectError } = await supabase
      .from('Project')
      .select('*')
      .eq('id', projectId)
      .eq('clientId', client.id)
      .single();

    if (projectError || !project) {
      console.error('[WordPress Publish] Project not found:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check WordPress credentials
    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      console.error('[WordPress Publish] WordPress credentials not configured');
      return NextResponse.json(
        { error: 'WordPress credentials not configured for this project' },
        { status: 400 }
      );
    }

    // Get article
    const { data: article, error: articleError } = await supabase
      .from('BlogPost')
      .select('*')
      .eq('id', articleId)
      .eq('clientId', client.id)
      .single();

    if (articleError || !article) {
      console.error('[WordPress Publish] Article not found:', articleError);
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    console.log('[WordPress Publish] Publishing to:', project.wordpressUrl);

    // Publish to WordPress
    const wpApiUrl = `${project.wordpressUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
    const auth = Buffer.from(`${project.wordpressUsername}:${project.wordpressPassword}`).toString('base64');

    const wpResponse = await fetch(wpApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        status: 'publish',
        slug: article.slug,
        excerpt: article.excerpt || '',
      })
    });

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error('[WordPress Publish] WordPress API error:', errorText);
      throw new Error(`WordPress API error: ${wpResponse.status} ${errorText}`);
    }

    const wpData = await wpResponse.json();
    console.log('[WordPress Publish] Success! Post ID:', wpData.id);

    // Update article status
    const { error: updateError } = await supabase
      .from('BlogPost')
      .update({
        status: 'published',
        publishedAt: new Date().toISOString(),
        metadata: {
          ...article.metadata,
          wordpressPostId: wpData.id,
          wordpressUrl: wpData.link,
        },
        updatedAt: new Date().toISOString(),
      })
      .eq('id', articleId);

    if (updateError) {
      console.error('[WordPress Publish] Failed to update article:', updateError);
    }

    return NextResponse.json({
      success: true,
      wordpressUrl: wpData.link,
      wordpressPostId: wpData.id,
      message: '✅ Artikel gepubliceerd op WordPress!'
    });

  } catch (error: any) {
    console.error('[WordPress Publish] ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to publish to WordPress' },
      { status: 500 }
    );
  }
}
