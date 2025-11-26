import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { sendEmail } from '@/lib/email';
import { getContentPublishedEmailTemplate } from '@/lib/email-templates';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      projectId,
      title,
      content,
      excerpt,
      categories = [],
      status = 'publish',
      featuredImageUrl,
      // SEO metadata
      seoTitle,
      seoDescription,
      focusKeyword,
    } = body;

    if (!projectId || !title || !content) {
      return NextResponse.json({ 
        error: 'Project ID, titel en content zijn verplicht' 
      }, { status: 400 });
    }

    // Find client with WordPress config
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        name: true,
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get project with WordPress config
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

    if (!project) {
      return NextResponse.json({ 
        error: 'Project niet gevonden',
      }, { status: 404 });
    }

    // Gebruik project-specifieke WordPress config, of fall back naar client-level config
    const wordpressConfig = {
      siteUrl: project.wordpressUrl || client.wordpressUrl,
      username: project.wordpressUsername || client.wordpressUsername,
      applicationPassword: project.wordpressPassword || client.wordpressPassword,
    };

    // Check if we have WordPress config
    if (!wordpressConfig.siteUrl || !wordpressConfig.username || !wordpressConfig.applicationPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie niet gevonden. Configureer WordPress in je project instellingen.',
      }, { status: 400 });
    }

    // Publish to WordPress with SEO metadata
    const result = await publishToWordPress(
      wordpressConfig,
      {
        title,
        content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        categories,
        status,
        featuredImageUrl,
        // SEO metadata voor Yoast/RankMath
        seoTitle,
        seoDescription,
        focusKeyword,
      }
    );

    // 📧 Stuur email notificatie naar client
    if (status === 'publish' && result.link) {
      try {
        const emailTemplate = getContentPublishedEmailTemplate(
          client.name || 'daar',
          title,
          result.link,
          {
            excerpt: excerpt || content.substring(0, 150) + '...',
            categories,
            wordCount: content.length,
            autoPublished: false,
          }
        );

        await sendEmail(
          session.user.email,
          emailTemplate.subject,
          emailTemplate.html,
          emailTemplate.text
        );

        console.log(`✅ Email notification sent to ${session.user.email} for published article: ${title}`);
      } catch (emailError) {
        console.error('Error sending publish notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      postId: result.id,
      link: result.link,
      status: result.status,
    });
  } catch (error: any) {
    console.error('Error publishing to WordPress:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Fout bij publiceren naar WordPress',
    }, { status: 500 });
  }
}
