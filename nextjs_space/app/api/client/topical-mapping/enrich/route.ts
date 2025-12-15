
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { enrichKeywordsBatch, prioritizeKeywords } from '@/lib/dataforseo-api';

export const dynamic = 'force-dynamic';

/**
 * 📊 POST /api/client/topical-mapping/enrich
 * 
 * Enriches topical map topics with real SEO data from DataForSEO
 * - Search volume & trends
 * - Keyword difficulty
 * - CPC & competition
 * - Related keywords & questions
 * 
 * Cost: ~€0.006 per keyword
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { topicalMapId, priorityStrategy = 'balanced' } = body;

    if (!topicalMapId) {
      return NextResponse.json(
        { error: 'Topical map ID is required' },
        { status: 400 }
      );
    }

    // Fetch topical map with all topics
    const topicalMap = await prisma.topicalMap.findFirst({
      where: {
        id: topicalMapId,
        project: {
          clientId: client.id
        }
      },
      include: {
        categories: {
          include: {
            topics: true
          }
        }
      }
    });

    if (!topicalMap) {
      return NextResponse.json({ error: 'Topical map not found' }, { status: 404 });
    }

    console.log('[Topical Map Enrichment] Starting for:', {
      mapId: topicalMapId,
      mainTopic: topicalMap.mainTopic,
      totalTopics: topicalMap.categories.reduce((sum, cat) => sum + cat.topics.length, 0)
    });

    // Collect all keywords from topics
    const allKeywords: string[] = [];
    const topicKeywordMap: Map<string, string[]> = new Map();

    for (const category of topicalMap.categories) {
      for (const topic of category.topics) {
        // Use primary keyword (title) for enrichment
        const primaryKeyword = topic.keywords[0] || topic.title;
        allKeywords.push(primaryKeyword);
        topicKeywordMap.set(topic.id, [primaryKeyword, ...topic.keywords.slice(1, 3)]); // Top 3 keywords
      }
    }

    // Remove duplicates
    const uniqueKeywords = [...new Set(allKeywords)];
    
    console.log('[Topical Map Enrichment] Enriching', uniqueKeywords.length, 'unique keywords');

    // Determine location and language
    const location = topicalMap.language === 'nl' || topicalMap.language === 'NL' ? 'Netherlands' : 'United States';
    const language = topicalMap.language === 'nl' || topicalMap.language === 'NL' ? 'nl' : 'en';

    // Enrich keywords with DataForSEO
    const enrichmentResult = await enrichKeywordsBatch(uniqueKeywords, location, language);

    if (!enrichmentResult.success) {
      return NextResponse.json(
        {
          error: 'Failed to enrich keywords',
          details: enrichmentResult.errors
        },
        { status: 500 }
      );
    }

    // Create a lookup map for enriched data
    const enrichedDataMap = new Map(
      enrichmentResult.data.map(kw => [kw.keyword.toLowerCase(), kw])
    );

    // Update topics with enriched data
    let updatedCount = 0;
    for (const category of topicalMap.categories) {
      for (const topic of category.topics) {
        const primaryKeyword = (topic.keywords[0] || topic.title).toLowerCase();
        const enrichedData = enrichedDataMap.get(primaryKeyword);

        if (enrichedData) {
          await prisma.topicalTopic.update({
            where: { id: topic.id },
            data: {
              searchVolume: enrichedData.searchVolume,
              difficulty: enrichedData.difficulty,
              cpc: enrichedData.cpc,
              competition: enrichedData.competition,
              trend: enrichedData.trend,
              relatedKeywords: enrichedData.relatedKeywords,
              questions: enrichedData.questions,
              seasonalityScore: enrichedData.seasonalityScore,
              opportunityScore: enrichedData.opportunityScore,
              priority: Math.max(topic.priority, Math.round(enrichedData.opportunityScore / 10)) // Auto-adjust priority
            }
          });
          updatedCount++;
        }
      }
    }

    // Apply prioritization strategy if requested
    if (priorityStrategy && priorityStrategy !== 'balanced') {
      const prioritized = prioritizeKeywords(enrichmentResult.data, priorityStrategy as any);
      
      // Update priorities based on new ranking
      for (let i = 0; i < prioritized.length; i++) {
        const keyword = prioritized[i].keyword.toLowerCase();
        const topic = topicalMap.categories
          .flatMap(c => c.topics)
          .find(t => (t.keywords[0] || t.title).toLowerCase() === keyword);
        
        if (topic) {
          await prisma.topicalTopic.update({
            where: { id: topic.id },
            data: { priority: 10 - Math.floor(i / (prioritized.length / 10)) } // Distribute 1-10
          });
        }
      }
    }

    console.log('[Topical Map Enrichment] Completed:', {
      enrichedTopics: updatedCount,
      totalCost: enrichmentResult.totalCost,
      strategy: priorityStrategy
    });

    return NextResponse.json({
      success: true,
      enriched: updatedCount,
      totalKeywords: uniqueKeywords.length,
      cost: enrichmentResult.totalCost,
      costPerKeyword: (enrichmentResult.totalCost / uniqueKeywords.length).toFixed(4),
      message: `✅ ${updatedCount} topics verrijkt met real keyword data! Kosten: €${enrichmentResult.totalCost.toFixed(2)}`
    });

  } catch (error) {
    console.error('[Topical Map Enrichment] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to enrich topical map',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
