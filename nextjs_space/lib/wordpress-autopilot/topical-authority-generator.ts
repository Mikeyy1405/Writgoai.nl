/**
 * Topical Authority Content Generator
 * Analyseert WordPress site en genereert topical authority content strategie
 */

import { chatCompletion } from '@/lib/aiml-api';
import { fetchSitemap } from '@/lib/wordpress-publisher';
import { detectContentIntent } from './content-intent-templates';
import type {
  ContentStrategy,
  KeywordCluster,
  ContentCalendarItem,
} from './types';

interface SiteAnalysis {
  niche: string;
  mainTopics: string[];
  existingContent: {
    title: string;
    url: string;
    topics: string[];
  }[];
  contentGaps: string[];
}

/**
 * Analyze WordPress site to detect niche and topics
 */
export async function analyzeSite(
  siteUrl: string,
  clientId: string
): Promise<SiteAnalysis> {
  console.log('🔍 Analyzing WordPress site:', siteUrl);
  
  try {
    // Fetch sitemap
    const sitemapData = await fetchSitemap(siteUrl);
    
    // Get recent posts (max 20)
    const recentPosts = sitemapData.recentPosts.slice(0, 20);
    
    console.log(`📄 Found ${recentPosts.length} recent posts`);
    
    // Analyze content with AI
    const analysisPrompt = `Je bent een SEO en content strategie expert. Analyseer deze WordPress site en identificeer:

1. De primaire NICHE van de website (1 zin)
2. De 5-10 belangrijkste MAIN TOPICS waarover de site schrijft
3. Bestaande content structuur
4. Content gaps en opportunities

SITE URL: ${siteUrl}

RECENTE CONTENT URLS:
${recentPosts.map((url, i) => `${i + 1}. ${url}`).join('\n')}

CATEGORIEËN: ${sitemapData.categories.join(', ')}
TAGS: ${sitemapData.tags.slice(0, 20).join(', ')}

Return je analyse in JSON format:
{
  "niche": "Korte beschrijving van de niche",
  "mainTopics": ["Topic 1", "Topic 2", ...],
  "existingContent": [
    {
      "title": "Afgeleide titel uit URL",
      "url": "URL",
      "topics": ["Topic", ...]
    }
  ],
  "contentGaps": ["Gap 1", "Gap 2", ...]
}

Focus op:
- Concrete, actionable topics
- SEO-vriendelijke onderwerpen
- Content gaps die de topical authority versterken`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'claude-sonnet-4',
      temperature: 0.3,
      max_tokens: 3000,
      trackUsage: {
        clientId,
        feature: 'autopilot_site_analysis',
      },
    });
    
    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse AI analysis');
    }
    
    const analysis: SiteAnalysis = JSON.parse(jsonMatch[0]);
    
    console.log('✅ Site analysis completed');
    console.log(`   Niche: ${analysis.niche}`);
    console.log(`   Main topics: ${analysis.mainTopics.length}`);
    console.log(`   Content gaps: ${analysis.contentGaps.length}`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Site analysis failed:', error);
    throw error;
  }
}

/**
 * Generate comprehensive keyword clusters for topical authority
 */
export async function generateKeywordClusters(
  niche: string,
  mainTopics: string[],
  clientId: string
): Promise<KeywordCluster[]> {
  console.log('🎯 Generating keyword clusters for topical authority...');
  
  const clustersPrompt = `Je bent een SEO keyword research expert. Genereer een comprehensive keyword strategie voor topical authority.

NICHE: ${niche}

MAIN TOPICS:
${mainTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

Genereer voor ELKE main topic:
- 1 primaire keyword (hoog volume, medium difficulty)
- 5-8 secundaire keywords (mix van long-tail en short-tail)
- Geschatte search volume category (high/medium/low)
- Keyword difficulty (easy/medium/hard)
- Content priority (critical/high/medium/low)

Return JSON array:
[
  {
    "id": "unique-id",
    "topic": "Main Topic",
    "primaryKeyword": "main keyword",
    "secondaryKeywords": ["keyword 1", "keyword 2", ...],
    "searchVolume": 5000,
    "difficulty": "medium",
    "priority": "high",
    "status": "planned"
  }
]

Focus op:
- Realistische, searchable keywords
- Mix van informational, commercial, en transactional intent
- Keywords die topical authority opbouwen
- Natuurlijke keyword variatie`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: clustersPrompt }],
    model: 'gpt-4o',
    temperature: 0.4,
    max_tokens: 4000,
    trackUsage: {
      clientId,
      feature: 'autopilot_keyword_clusters',
    },
  });
  
  const content = response.choices[0]?.message?.content || '[]';
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse keyword clusters');
  }
  
  const clusters: KeywordCluster[] = JSON.parse(jsonMatch[0]);
  
  console.log(`✅ Generated ${clusters.length} keyword clusters`);
  
  return clusters;
}

/**
 * Generate content calendar from keyword clusters
 */
export async function generateContentCalendar(
  siteId: string,
  strategyId: string,
  keywordClusters: KeywordCluster[],
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  clientId: string
): Promise<ContentCalendarItem[]> {
  console.log('📅 Generating content calendar...');
  
  // Calculate number of posts per month based on frequency
  const postsPerMonth = {
    daily: 30,
    weekly: 4,
    biweekly: 2,
    monthly: 1,
  }[postingFrequency];
  
  // Sort clusters by priority
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedClusters = [...keywordClusters].sort(
    (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
  );
  
  // Calculate schedule
  const calendar: ContentCalendarItem[] = [];
  const startDate = new Date();
  startDate.setHours(9, 0, 0, 0); // Default posting time 9:00 AM
  
  const daysInterval = {
    daily: 1,
    weekly: 7,
    biweekly: 14,
    monthly: 30,
  }[postingFrequency];
  
  sortedClusters.forEach((cluster, index) => {
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + (index * daysInterval));
    
    // Generate content title suggestions with AI
    const titles = generateTitleSuggestions(cluster.primaryKeyword, cluster.topic);
    const title = titles[0] || `${cluster.topic}: ${cluster.primaryKeyword}`;
    
    // Detect content intent automatically
    const allKeywords = [cluster.primaryKeyword, ...cluster.secondaryKeywords];
    const contentIntent = detectContentIntent(title, allKeywords);
    
    calendar.push({
      id: `calendar-${Date.now()}-${index}`,
      siteId,
      strategyId,
      title,
      focusKeyword: cluster.primaryKeyword,
      secondaryKeywords: cluster.secondaryKeywords,
      contentType: determineContentType(cluster.primaryKeyword),
      contentIntent: contentIntent as any,
      topic: cluster.topic,
      scheduledDate,
      status: 'scheduled',
      internalLinks: [],
      affiliateLinks: [],
      images: [],
      metadata: {},
    });
  });
  
  console.log(`✅ Generated ${calendar.length} content items`);
  
  return calendar;
}

/**
 * Generate title suggestions from keyword
 */
function generateTitleSuggestions(keyword: string, topic: string): string[] {
  // Simple title generation - in production, use AI
  const templates = [
    `${keyword}: De Complete Gids voor ${new Date().getFullYear()}`,
    `Alles wat Je Moet Weten over ${keyword}`,
    `${keyword} Uitgelegd: Een Praktische Handleiding`,
    `De Beste ${keyword} voor ${topic}`,
    `${keyword}: Tips, Tricks en Best Practices`,
  ];
  
  return templates;
}

/**
 * Determine content type from keyword
 */
function determineContentType(keyword: string): ContentCalendarItem['contentType'] {
  const lower = keyword.toLowerCase();
  
  if (lower.includes('beste') || lower.includes('top')) return 'listicle';
  if (lower.includes('hoe') || lower.includes('how to')) return 'how-to';
  if (lower.includes('review') || lower.includes('test')) return 'review';
  if (lower.includes('gids') || lower.includes('guide')) return 'guide';
  
  return 'article';
}

/**
 * Generate complete topical authority strategy
 */
export async function generateTopicalAuthorityStrategy(
  siteId: string,
  siteUrl: string,
  clientId: string,
  postingFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
): Promise<ContentStrategy> {
  console.log('🚀 Generating topical authority strategy...');
  
  // Step 1: Analyze site
  const analysis = await analyzeSite(siteUrl, clientId);
  
  // Step 2: Generate keyword clusters
  const keywordClusters = await generateKeywordClusters(
    analysis.niche,
    analysis.mainTopics,
    clientId
  );
  
  // Step 3: Calculate topical authority metrics
  const totalTopics = analysis.mainTopics.length;
  const coveredTopics = analysis.existingContent.length;
  const currentCoverage = Math.round((coveredTopics / (totalTopics * 10)) * 100); // Assume 10 posts per topic for full coverage
  
  // Create subtopics structure
  const subtopics: Record<string, string[]> = {};
  analysis.mainTopics.forEach(topic => {
    const related = keywordClusters
      .filter(c => c.topic === topic)
      .flatMap(c => c.secondaryKeywords.slice(0, 3));
    subtopics[topic] = related;
  });
  
  const strategy: Omit<ContentStrategy, 'id' | 'createdAt' | 'updatedAt'> = {
    siteId,
    niche: analysis.niche,
    mainTopics: analysis.mainTopics,
    subtopics,
    keywordClusters,
    contentCalendar: [], // Will be populated separately
    topicalAuthorityGoal: 80, // Target 80% coverage
    currentCoverage,
  };
  
  console.log('✅ Topical authority strategy generated');
  console.log(`   Current coverage: ${currentCoverage}%`);
  console.log(`   Goal: 80%`);
  console.log(`   Keywords: ${keywordClusters.length}`);
  
  return strategy as ContentStrategy;
}
