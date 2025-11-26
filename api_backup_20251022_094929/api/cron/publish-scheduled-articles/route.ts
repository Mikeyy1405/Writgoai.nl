
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateArticleWithLinks } from '@/lib/article-generator-v2';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { trackLinkReference } from '@/lib/link-builder';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verificatie van cron secret (voor beveiliging)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'change-me-in-production';
    
    if (authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Vind alle artikelen die vandaag gepubliceerd moeten worden
    const articlesToPublish = await prisma.plannedArticle.findMany({
      where: {
        status: 'PLANNED',
        scheduledDate: {
          lte: now,
        },
      },
      include: {
        ContentPlan: {
          include: {
            Client: {
              include: {
                AIProfile: true,
                WordPressConfig: true,
              },
            },
          },
        },
      },
      take: 10, // Limiteer tot 10 per run
    });

    const results = [];

    for (const plannedArticle of articlesToPublish) {
      const client = plannedArticle.ContentPlan.Client;
      const profile = client.AIProfile;
      const wpConfig = client.WordPressConfig;

      if (!profile) {
        console.log(`Skipping article ${plannedArticle.id}: No AI profile`);
        continue;
      }

      if (!wpConfig || !wpConfig.verified) {
        console.log(`Skipping article ${plannedArticle.id}: WordPress not configured`);
        await prisma.plannedArticle.update({
          where: { id: plannedArticle.id },
          data: { status: 'FAILED' },
        });
        continue;
      }

      try {
        // Update status naar GENERATING
        await prisma.plannedArticle.update({
          where: { id: plannedArticle.id },
          data: { status: 'GENERATING' },
        });

        // Genereer artikel met links
        const article = await generateArticleWithLinks({
          topic: plannedArticle.suggestedTopic,
          keywords: plannedArticle.keywords,
          client,
          profile,
          includeLinks: true,
        });

        // Update status naar PUBLISHING
        await prisma.plannedArticle.update({
          where: { id: plannedArticle.id },
          data: { status: 'PUBLISHING' },
        });

        // Publiceer naar WordPress
        const wpPost = await publishToWordPress(
          {
            siteUrl: wpConfig.siteUrl,
            username: wpConfig.username,
            applicationPassword: wpConfig.applicationPassword,
          },
          {
            title: article.title,
            content: article.content,
            excerpt: article.excerpt,
            status: profile.publishMode === 'IMMEDIATE' ? 'publish' : 'draft',
            tags: article.keywords,
          }
        );

        // Sla gepubliceerd artikel op
        const publishedArticle = await prisma.publishedArticle.create({
          data: {
            plannedArticleId: plannedArticle.id,
            clientId: client.id,
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            seoTitle: article.seoTitle,
            metaDescription: article.metaDescription,
            keywords: article.keywords,
            wordpressPostId: wpPost.id,
            wordpressUrl: wpPost.link,
            internalLinks: article.internalLinks,
            externalLinks: article.externalLinks,
          },
        });

        // Track link references
        for (const targetId of article.internalLinks) {
          await trackLinkReference(
            publishedArticle.id,
            targetId,
            'internal link',
            'INTERNAL'
          );
        }

        for (const targetId of article.externalLinks) {
          await trackLinkReference(
            publishedArticle.id,
            targetId,
            'external link',
            'EXTERNAL'
          );
        }

        // Update status naar PUBLISHED
        await prisma.plannedArticle.update({
          where: { id: plannedArticle.id },
          data: { 
            status: 'PUBLISHED',
            publishedAt: new Date(),
            generatedAt: new Date(),
          },
        });

        // Update subscription usage
        const subscription = await prisma.clientSubscription.findFirst({
          where: { 
            clientId: client.id,
            status: 'ACTIVE',
          },
        });

        if (subscription) {
          await prisma.clientSubscription.update({
            where: { id: subscription.id },
            data: { articlesUsed: { increment: 1 } },
          });
        }

        results.push({
          success: true,
          articleId: publishedArticle.id,
          title: article.title,
          url: wpPost.link,
        });

        console.log(`✅ Published: ${article.title} to ${wpPost.link}`);
      } catch (error) {
        console.error(`Error publishing article ${plannedArticle.id}:`, error);
        
        await prisma.plannedArticle.update({
          where: { id: plannedArticle.id },
          data: { status: 'FAILED' },
        });

        results.push({
          success: false,
          articleId: plannedArticle.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in scheduled publish job:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled articles' },
      { status: 500 }
    );
  }
}
