
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  parseTradeTrackerFeed, 
  fetchTradeTrackerFeed,
  TradeTrackerProduct 
} from '@/lib/tradetracker-api';
import { chatCompletion } from '@/lib/aiml-api';

/**
 * POST /api/client/projects/[id]/tradetracker-feed
 * Import TradeTracker productfeed en converteer naar affiliate links
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Valideer project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: true,
      },
    });

    if (!project || project.client.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Valideer TradeTracker credentials
    if (!project.tradeTrackerSiteId) {
      return NextResponse.json(
        { error: 'TradeTracker Site ID is niet geconfigureerd. Ga naar project instellingen om je credentials toe te voegen.' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { feedUrl, feedContent, defaultCategory } = body;

    if (!feedUrl && !feedContent) {
      return NextResponse.json(
        { error: 'Feed URL of feed content is verplicht' },
        { status: 400 }
      );
    }

    console.log('[TradeTracker Feed Import] Starting import for project:', projectId);

    // Parse feed
    let products: TradeTrackerProduct[];
    
    if (feedUrl) {
      products = await fetchTradeTrackerFeed(
        feedUrl,
        project.tradeTrackerSiteId,
        project.tradeTrackerCampaignId || undefined
      );
    } else {
      products = await parseTradeTrackerFeed(
        feedContent,
        project.tradeTrackerSiteId,
        project.tradeTrackerCampaignId || undefined
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Geen producten gevonden in feed' },
        { status: 400 }
      );
    }

    console.log(`[TradeTracker Feed Import] Found ${products.length} products, generating affiliate links...`);

    // Converteer producten naar affiliate links met AI-gegenereerde keywords
    const affiliateLinksToCreate: Array<{
      url: string;
      anchorText: string;
      category: string;
      keywords: string[];
    }> = [];

    // Batch process products (5 at a time voor keywords generatie)
    const batchSize = 5;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (product) => {
          try {
            // Genereer keywords met AI
            const keywords = await generateKeywordsForProduct(product);
            
            // Check voor duplicaten
            const existing = await prisma.affiliateLink.findFirst({
              where: {
                projectId,
                url: product.affiliateUrl,
              },
            });

            if (existing) {
              console.log(`[TradeTracker Feed Import] Skipping duplicate: ${product.name}`);
              return;
            }

            affiliateLinksToCreate.push({
              url: product.affiliateUrl,
              anchorText: product.name,
              category: product.category || defaultCategory || 'TradeTracker Producten',
              keywords,
            });
          } catch (error) {
            console.error(`[TradeTracker Feed Import] Error processing product ${product.name}:`, error);
          }
        })
      );
    }

    // Batch create affiliate links
    const created = await prisma.$transaction(
      affiliateLinksToCreate.map((link) =>
        prisma.affiliateLink.create({
          data: {
            projectId,
            ...link,
          },
        })
      )
    );

    console.log(`[TradeTracker Feed Import] Successfully imported ${created.length} products as affiliate links`);

    return NextResponse.json({
      success: true,
      imported: created.length,
      total: products.length,
      skipped: products.length - created.length,
      message: `${created.length} TradeTracker producten geïmporteerd! 🎉`,
    });
  } catch (error: any) {
    console.error('[TradeTracker Feed Import] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij importeren van TradeTracker feed' },
      { status: 500 }
    );
  }
}

/**
 * Generate keywords for product using AI
 */
async function generateKeywordsForProduct(product: TradeTrackerProduct): Promise<string[]> {
  try {
    const prompt = `Genereer 3-5 relevante Nederlandse zoekwoorden voor dit product.

Productnaam: ${product.name}
${product.category ? `Categorie: ${product.category}` : ''}
${product.description ? `Beschrijving: ${product.description.substring(0, 200)}` : ''}

Return ALLEEN een komma-gescheiden lijst van keywords, niets anders.
Voorbeeld: yoga mat, sportmat, fitness, workout`;

    const response = await chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een keyword extractie expert. Genereer relevante Nederlandse keywords voor producten.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 2)
      .slice(0, 5);

    return keywords.length > 0 ? keywords : [product.name.toLowerCase()];
  } catch (error) {
    console.error('[TradeTracker Feed Import] Error generating keywords:', error);
    // Fallback keywords from product name
    return product.name.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 5);
  }
}
