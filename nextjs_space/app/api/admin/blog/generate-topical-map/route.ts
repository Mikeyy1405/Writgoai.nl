import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateTopicalMap } from '@/lib/topical-map-generator';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

/**
 * POST /api/admin/blog/generate-topical-map
 * Generates a topical map based on website analysis
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { 
      websiteUrl, 
      websiteAnalysis, 
      numberOfTopics, 
      language, 
      tone,
      period 
    } = await request.json();

    if (!websiteAnalysis || !websiteAnalysis.niche) {
      return NextResponse.json(
        { error: 'Website analyse data is verplicht' },
        { status: 400 }
      );
    }

    console.log('[Topical Map] Generating map for:', {
      website: websiteUrl,
      niche: websiteAnalysis.niche,
      topics: numberOfTopics,
    });

    // Configure topical map generation
    const config = {
      mainTopic: websiteAnalysis.niche,
      language: mapLanguageCode(language || 'nl'),
      depth: 3, // 3 levels: pillar → cluster → supporting
      targetArticles: numberOfTopics || 20,
      includeCommercial: true,
      commercialRatio: 0.3, // 30% commercial, 70% informational
      websiteUrl: websiteUrl,
      projectContext: {
        name: websiteAnalysis.title || websiteAnalysis.niche,
        description: websiteAnalysis.description,
        targetAudience: websiteAnalysis.targetAudience || 'Algemeen publiek',
        existingContent: websiteAnalysis.existingTopics || [],
      },
    };

    // Generate topical map using existing generator
    const topicalMap = await generateTopicalMap(config);

    // Transform topical map to topic ideas with scheduling
    const topics = transformTopicalMapToTopics(
      topicalMap,
      period || '2 maanden',
      tone || 'professioneel'
    );

    console.log('[Topical Map] Generated:', {
      totalTopics: topics.length,
      pillar: topics.filter(t => t.type === 'pillar').length,
      cluster: topics.filter(t => t.type === 'cluster').length,
      supporting: topics.filter(t => t.type === 'supporting').length,
    });

    return NextResponse.json({
      success: true,
      topics,
      totalTopics: topics.length,
      seoOpportunityScore: topicalMap.seoOpportunityScore,
      estimatedMonths: topicalMap.estimatedMonths,
    });
  } catch (error: any) {
    console.error('[Topical Map] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Topical map generatie mislukt' },
      { status: 500 }
    );
  }
}

/**
 * Map language codes
 */
function mapLanguageCode(lang: string): string {
  const mapping: Record<string, string> = {
    'nl': 'NL',
    'en': 'EN',
    'de': 'DE',
    'fr': 'FR',
  };
  return mapping[lang] || 'NL';
}

/**
 * Transform topical map structure to flat topic list with scheduling
 */
function transformTopicalMapToTopics(
  topicalMap: any,
  period: string,
  tone: string
): Array<{
  title: string;
  description: string;
  type: 'pillar' | 'cluster' | 'supporting';
  keywords: string[];
  estimatedWords: number;
  priority: number;
  scheduledDate: string;
}> {
  const topics: any[] = [];
  const today = new Date();
  
  // Calculate total days for scheduling
  const periodDays = parsePeriodToDays(period);
  let topicIndex = 0;
  let totalTopics = 0;
  
  // Count total topics first
  for (const category of topicalMap.categories) {
    for (const subcategory of category.subcategories) {
      totalTopics += subcategory.topics?.length || 0;
    }
  }

  // Process categories and subcategories
  for (const category of topicalMap.categories) {
    for (const subcategory of category.subcategories) {
      const subcategoryTopics = subcategory.topics || [];
      
      for (const topic of subcategoryTopics) {
        // Determine type based on priority and category structure
        let type: 'pillar' | 'cluster' | 'supporting' = 'supporting';
        if (category.priority === 'high' && topic.priority >= 8) {
          type = 'pillar';
        } else if (topic.priority >= 6) {
          type = 'cluster';
        }
        
        // Calculate scheduled date
        const dayOffset = Math.floor((topicIndex / totalTopics) * periodDays);
        const scheduledDate = new Date(today);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        
        topics.push({
          title: topic.title,
          description: `${subcategory.name} - ${category.name}`,
          type,
          keywords: topic.keywords || [],
          estimatedWords: type === 'pillar' ? 2500 : type === 'cluster' ? 1500 : 1000,
          priority: topic.priority || 5,
          scheduledDate: scheduledDate.toISOString(),
        });
        
        topicIndex++;
      }
    }
  }

  // Sort by priority (high to low) and then by type (pillar → cluster → supporting)
  topics.sort((a, b) => {
    const typeOrder = { pillar: 0, cluster: 1, supporting: 2 };
    if (typeOrder[a.type] !== typeOrder[b.type]) {
      return typeOrder[a.type] - typeOrder[b.type];
    }
    return b.priority - a.priority;
  });

  return topics;
}

/**
 * Parse period string to days
 */
function parsePeriodToDays(period: string): number {
  const periodMap: Record<string, number> = {
    '1 week': 7,
    '2 weken': 14,
    '1 maand': 30,
    '2 maanden': 60,
    '3 maanden': 90,
    '6 maanden': 180,
  };
  return periodMap[period] || 60; // Default to 2 months
}
