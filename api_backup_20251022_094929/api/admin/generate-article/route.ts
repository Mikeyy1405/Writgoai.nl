
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateArticle, generateArticleHTML } from '@/lib/article-generator';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, topic, keywords = [], useCredits = true } = body;

    if (!clientId || !topic) {
      return NextResponse.json(
        { error: 'Client ID and topic are required' },
        { status: 400 }
      );
    }

    // Haal klant en profiel op
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { 
        AIProfile: true,
        ClientSubscription: {
          include: {
            Package: true
          }
        }
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.AIProfile) {
      return NextResponse.json(
        { error: 'Client has no AI profile configured' },
        { status: 400 }
      );
    }

    // Check credits
    if (useCredits) {
      const hasCredits = await checkAndDeductArticleCredit(client);
      if (!hasCredits) {
        return NextResponse.json(
          { error: 'Client has no available article credits' },
          { status: 400 }
        );
      }
    }

    // Genereer artikel met AI
    const article = await generateArticle({
      topic,
      keywords,
      client,
      profile: client.AIProfile,
    });

    // Genereer HTML versie
    const htmlContent = generateArticleHTML(article);

    // Sla op als Task met Deliverable
    const task = await prisma.task.create({
      data: {
        title: `Artikel: ${article.title}`,
        description: article.excerpt,
        category: 'CONTENT_AUTOMATION',
        status: 'COMPLETED',
        clientId: client.id,
        createdById: session.user.id,
        completedAt: new Date(),
        notes: `Keywords: ${article.keywords.join(', ')}`,
      },
    });

    // Maak deliverable (we slaan de HTML op als string - in productie zou je dit naar S3 uploaden)
    const deliverable = await prisma.deliverable.create({
      data: {
        taskId: task.id,
        fileName: `${article.seoTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`,
        fileUrl: `/api/deliverables/${task.id}/article`, // We maken deze endpoint nog
        fileSize: Buffer.byteLength(htmlContent, 'utf8'),
        notes: JSON.stringify({
          seoTitle: article.seoTitle,
          metaDescription: article.metaDescription,
          keywords: article.keywords,
          htmlContent: htmlContent,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      task,
      deliverable,
      article: {
        title: article.title,
        excerpt: article.excerpt,
        keywords: article.keywords,
      },
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function checkAndDeductArticleCredit(client: any): Promise<boolean> {
  // Check gratis credits eerst
  if (client.freeArticleCredits > 0) {
    await prisma.client.update({
      where: { id: client.id },
      data: { freeArticleCredits: { decrement: 1 } },
    });
    return true;
  }

  // Check abonnement credits
  if (client.ClientSubscription.length > 0) {
    const subscription = client.ClientSubscription[0];
    if (subscription.status === 'ACTIVE' && subscription.Package.articlesPerMonth) {
      const articlesLimit = subscription.Package.articlesPerMonth;
      if (subscription.articlesUsed < articlesLimit) {
        await prisma.clientSubscription.update({
          where: { id: subscription.id },
          data: { articlesUsed: { increment: 1 } },
        });
        return true;
      }
    }
  }

  return false;
}
