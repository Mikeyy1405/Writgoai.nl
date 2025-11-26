

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

/**
 * Automatic Linkbuilding Cron Job
 * GET /api/cron/linkbuilding-auto
 * 
 * Runs periodically to find and place links between users' content
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Linkbuilding Cron] Starting automatic linkbuilding...');

    // Find clients with linkbuilding enabled
    const clients = await prisma.client.findMany({
      where: {
        linkbuildingEnabled: true,
        subscriptionStatus: 'active', // Only active subscribers
      },
      select: {
        id: true,
        name: true,
        subscriptionCredits: true,
        topUpCredits: true,
        savedContent: {
          where: {
            publishedUrl: { not: null },
            isArchived: false,
          },
          select: {
            id: true,
            title: true,
            content: true,
            publishedUrl: true,
            keywords: true,
            category: true,
          },
          take: 50,
        },
      },
      take: 50, // Process max 50 clients per run
    });

    if (clients.length < 2) {
      console.log('[Linkbuilding Cron] Not enough clients to create links');
      return NextResponse.json({
        success: true,
        message: 'Not enough clients for linkbuilding',
        processed: 0,
      });
    }

    let linksCreated = 0;
    let linksAttempted = 0;
    const MAX_LINKS_PER_RUN = 20; // Max links to create per cron run

    // For each client, try to find 1-2 good linkbuilding opportunities
    for (const client of clients) {
      if (linksCreated >= MAX_LINKS_PER_RUN) break;

      // Check if client has enough credits (15 per link)
      const availableCredits = client.subscriptionCredits + client.topUpCredits;
      if (availableCredits < 15) continue;

      // Get articles that don't have many outbound links yet
      const articlesNeedingLinks = client.savedContent.filter(
        article => article.content && article.content.length > 500
      ).slice(0, 5); // Process max 5 articles per client

      if (articlesNeedingLinks.length === 0) continue;

      // Find potential target clients
      const otherClients = clients.filter(c => c.id !== client.id);
      if (otherClients.length === 0) continue;

      // For each article, try to find 1 good link
      for (const sourceArticle of articlesNeedingLinks) {
        if (linksCreated >= MAX_LINKS_PER_RUN) break;
        
        linksAttempted++;

        try {
          // Collect potential target articles
          const potentialTargets = otherClients.flatMap(targetClient =>
            targetClient.savedContent.map(article => ({
              ...article,
              clientId: targetClient.id,
              clientName: targetClient.name,
            }))
          ).slice(0, 30); // Limit to 30 for AI analysis

          if (potentialTargets.length === 0) continue;

          // Use AI to find best match
          const prompt = `Je bent een SEO linkbuilding expert. Analyseer het volgende bron artikel en selecteer HET BESTE target artikel voor een natuurlijke, relevante link.

Bron artikel:
Titel: ${sourceArticle.title}
Keywords: ${sourceArticle.keywords?.join(', ') || 'Geen'}
Content preview: ${sourceArticle.content?.substring(0, 1000) || ''}

Target artikelen:
${potentialTargets.slice(0, 15).map((article, idx) => `
${idx + 1}. ${article.title}
   Keywords: ${article.keywords?.join(', ') || 'Geen'}
   URL: ${article.publishedUrl}
`).join('\n')}

Selecteer ALLEEN HET BESTE artikel (hoogste relevantie score > 70) of return null als geen goed past.

Return JSON:
{
  "articleIndex": <index 1-based, or null>,
  "relevanceScore": <0-100>,
  "anchorText": "<natuurlijke anchor text>",
  "reason": "<waarom dit een goede match is>"
}`;

          const completion = await chatCompletion({
            messages: [
              { role: 'user', content: prompt }
            ],
            model: 'gpt-4o-mini',
            temperature: 0.3,
          });

          const aiResponse = completion.choices[0]?.message?.content || '{}';
          let cleaned = aiResponse.trim();
          cleaned = cleaned.replace(/^```json\s*/i, '');
          cleaned = cleaned.replace(/^```\s*/, '');
          cleaned = cleaned.replace(/\s*```$/, '');
          
          const recommendation = JSON.parse(cleaned);

          if (!recommendation.articleIndex || recommendation.relevanceScore < 70) {
            console.log(`[Linkbuilding] No good match found for article ${sourceArticle.id}`);
            continue;
          }

          const targetArticle = potentialTargets[recommendation.articleIndex - 1];
          if (!targetArticle) continue;

          // Check if link already exists
          const existingLink = await prisma.linkbuildingLink.findFirst({
            where: {
              sourceClientId: client.id,
              sourceArticleId: sourceArticle.id,
              targetArticleId: targetArticle.id,
              status: { not: 'removed' },
            },
          });

          if (existingLink) {
            console.log(`[Linkbuilding] Link already exists between these articles`);
            continue;
          }

          // Create the link
          await prisma.linkbuildingLink.create({
            data: {
              sourceClientId: client.id,
              sourceArticleId: sourceArticle.id,
              sourceArticleTitle: sourceArticle.title,
              sourceArticleUrl: sourceArticle.publishedUrl!,
              
              targetClientId: targetArticle.clientId,
              targetArticleId: targetArticle.id,
              targetArticleTitle: targetArticle.title,
              targetArticleUrl: targetArticle.publishedUrl!,
              
              anchorText: recommendation.anchorText,
              placement: 'body',
              
              creditsCharged: 15,
              status: 'active',
              isAutomatic: true,
              relevanceScore: recommendation.relevanceScore,
            },
          });

          // Deduct credits
          let remainingCredits = 15;
          let subscriptionCreditsUsed = 0;
          let topUpCreditsUsed = 0;

          if (client.subscriptionCredits >= remainingCredits) {
            subscriptionCreditsUsed = remainingCredits;
          } else {
            subscriptionCreditsUsed = client.subscriptionCredits;
            topUpCreditsUsed = remainingCredits - client.subscriptionCredits;
          }

          await prisma.client.update({
            where: { id: client.id },
            data: {
              subscriptionCredits: { decrement: subscriptionCreditsUsed },
              topUpCredits: { decrement: topUpCreditsUsed },
              totalCreditsUsed: { increment: 15 },
            },
          });

          // Log transaction
          await prisma.creditTransaction.create({
            data: {
              clientId: client.id,
              amount: -15,
              type: 'linkbuilding',
              description: `Automatische linkbuilding naar "${targetArticle.title}"`,
              balanceAfter: (client.subscriptionCredits - subscriptionCreditsUsed) + (client.topUpCredits - topUpCreditsUsed),
            },
          });

          linksCreated++;
          console.log(`[Linkbuilding] Created link from ${sourceArticle.title} to ${targetArticle.title}`);

        } catch (error) {
          console.error(`[Linkbuilding] Error processing article ${sourceArticle.id}:`, error);
          // Continue with next article
        }
      }
    }

    console.log(`[Linkbuilding Cron] Completed: ${linksCreated} links created out of ${linksAttempted} attempts`);

    return NextResponse.json({
      success: true,
      message: 'Automatic linkbuilding completed',
      stats: {
        clientsProcessed: clients.length,
        linksAttempted,
        linksCreated,
      },
    });

  } catch (error: any) {
    console.error('[Linkbuilding Cron] Error:', error);
    return NextResponse.json({
      error: 'Linkbuilding cron failed',
      details: error.message,
    }, { status: 500 });
  }
}
