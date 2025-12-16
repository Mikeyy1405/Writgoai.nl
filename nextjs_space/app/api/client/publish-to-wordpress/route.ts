import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishToWordPress } from '@/lib/wordpress-publisher';

/**
 * POST /api/client/publish-to-wordpress
 * Publish content to WordPress
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { contentId, projectId, postType = 'post', status = 'draft' } = await req.json();

    if (!contentId || !projectId) {
      return NextResponse.json(
        { error: 'Content ID en Project ID zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Check WordPress configuration
    if (!project.wordpress_url || !project.wordpress_username || !project.wordpress_password) {
      return NextResponse.json(
        { error: 'WordPress configuratie ontbreekt voor dit project' },
        { status: 400 }
      );
    }

    // Get content to publish
    const content = await prisma.blogPost.findFirst({
      where: {
        id: contentId,
        client_id: session.user.id,
        project_id: projectId,
      },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'Content niet gevonden' },
        { status: 404 }
      );
    }

    // Publish to WordPress
    try {
      const result = await publishToWordPress({
        wordpressUrl: project.wordpress_url,
        username: project.wordpress_username,
        password: project.wordpress_password,
        title: content.title,
        content: content.content,
        excerpt: content.excerpt || '',
        status,
        postType,
        categories: content.category ? [content.category] : [],
        tags: content.seo_keywords || [],
        featuredImage: content.featured_image || undefined,
      });

      // Update content status
      await prisma.blogPost.update({
        where: { id: contentId },
        data: {
          status: 'published',
          published_at: new Date(),
          wordpress_post_id: result.id?.toString(),
          metadata: {
            ...content.metadata,
            wordpressUrl: result.link,
            publishedAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        wordpressId: result.id,
        wordpressUrl: result.link,
        message: 'Content succesvol gepubliceerd naar WordPress',
      });
    } catch (wpError: any) {
      console.error('WordPress publish error:', wpError);
      return NextResponse.json(
        { 
          error: 'Fout bij publiceren naar WordPress',
          details: wpError.message || 'Onbekende fout',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het publiceren' },
      { status: 500 }
    );
  }
}
