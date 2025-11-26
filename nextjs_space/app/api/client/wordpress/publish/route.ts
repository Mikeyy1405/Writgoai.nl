

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { convertShortcodesToHTML } from '@/lib/shortcode-to-html';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const {
      contentId,
      projectId, // Optioneel: gebruik project-specifieke WordPress config
      title,
      content,
      excerpt,
      status = 'publish',
      categories = [],
      tags = [],
      featuredImageUrl,
      seoTitle,
      seoDescription,
      focusKeyword,
      useGutenberg = true, // Default to Gutenberg blocks
    } = body;

    // Get client data
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Check if project-specific WordPress config exists
    let config = {
      siteUrl: client.wordpressUrl || '',
      username: client.wordpressUsername || '',
      applicationPassword: client.wordpressPassword || '',
    };

    // Als er een projectId is, probeer project-specifieke config te gebruiken
    if (projectId && projectId !== 'client-legacy') {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          clientId: client.id,
        },
        select: {
          wordpressUrl: true,
          wordpressUsername: true,
          wordpressPassword: true,
        },
      });

      if (project) {
        // Gebruik project config als die bestaat, anders fall back naar client config
        config = {
          siteUrl: project.wordpressUrl || client.wordpressUrl || '',
          username: project.wordpressUsername || client.wordpressUsername || '',
          applicationPassword: project.wordpressPassword || client.wordpressPassword || '',
        };
      }
    }
    // Als projectId === 'client-legacy', gebruik gewoon de client config (default)

    // Check if we have valid WordPress config
    if (!config.siteUrl || !config.username || !config.applicationPassword) {
      return NextResponse.json(
        { error: 'WordPress instellingen niet geconfigureerd. Configureer WordPress in je project instellingen of account instellingen.' },
        { status: 400 }
      );
    }

    // Convert shortcodes to HTML before publishing
    const processedContent = convertShortcodesToHTML(content);

    // Publish to WordPress
    const result = await publishToWordPress(config, {
      title,
      content: processedContent,
      excerpt,
      status,
      categories,
      tags,
      featuredImageUrl,
      seoTitle,
      seoDescription,
      focusKeyword,
      useGutenberg, // Pass through Gutenberg blocks preference
    });

    // Update content if contentId is provided
    if (contentId) {
      // Try to update SavedContent first
      try {
        await prisma.savedContent.update({
          where: { id: contentId },
          data: {
            publishedUrl: result.link,
            publishedAt: new Date(),
          },
        });
      } catch (e) {
        // If SavedContent not found, try ContentPiece
        try {
          await prisma.contentPiece.update({
            where: { id: contentId },
            data: {
              blogUrl: result.link,
              blogPublishedAt: new Date(),
              blogPublished: true,
            },
          });
        } catch (err) {
          console.error('Failed to update content with published info:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      postUrl: result.link,
      status: result.status,
    });
  } catch (error) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fout bij publiceren naar WordPress' },
      { status: 500 }
    );
  }
}
