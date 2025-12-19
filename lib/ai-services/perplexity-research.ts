/**
 * Perplexity API for real-time research
 * - Trending topics finding
 * - Competitor analysis
 * - Fact checking
 * - Recent statistics
 */

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || '';
const PERPLEXITY_BASE_URL = 'https://api.perplexity.ai';

if (!PERPLEXITY_API_KEY) {
  console.warn('⚠️ PERPLEXITY_API_KEY not set. Perplexity research will not work.');
}

export interface PerplexityResearchOptions {
  query: string;
  niche?: string;
  includeStats?: boolean;
  includeTrends?: boolean;
  maxSources?: number;
}

export interface PerplexityResearchResult {
  summary: string;
  keyPoints: string[];
  statistics: Array<{ fact: string; source: string }>;
  trendingTopics: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  relatedQueries: string[];
  timestamp: Date;
}

export interface CompetitorAnalysis {
  url: string;
  strengths: string[];
  gaps: string[];
}

/**
 * Research a topic with Perplexity API
 */
export async function researchTopicWithPerplexity(
  options: PerplexityResearchOptions
): Promise<PerplexityResearchResult> {
  const { query, niche, includeStats = true, includeTrends = true, maxSources = 10 } = options;

  console.log(`🔍 Researching with Perplexity: "${query}"`);

  // Build the research prompt
  let researchPrompt = `Research the following topic in detail: ${query}`;
  
  if (niche) {
    researchPrompt += ` in the context of ${niche}`;
  }

  if (includeStats) {
    researchPrompt += `\n\nInclude recent statistics, facts, and data points with sources.`;
  }

  if (includeTrends) {
    researchPrompt += `\n\nIdentify current trends and recent developments (2024-2025).`;
  }

  researchPrompt += `\n\nProvide your response in the following JSON format:
{
  "summary": "A comprehensive summary of the topic",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "statistics": [{"fact": "Statistic description", "source": "Source name"}],
  "trendingTopics": ["Trending topic 1", "Trending topic 2", ...],
  "relatedQueries": ["Related query 1", "Related query 2", ...]
}`;

  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro', // Best model for research
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant that provides accurate, up-to-date information with proper citations.',
          },
          {
            role: 'user',
            content: researchPrompt,
          },
        ],
        temperature: 0.2, // Low temperature for factual accuracy
        max_tokens: 4000,
        return_citations: true,
        return_related_questions: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Perplexity');
    }

    // Parse the JSON response
    let researchData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/) ||
        [null, content];
      researchData = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.warn('Failed to parse Perplexity JSON, using fallback extraction');
      researchData = extractResearchFromText(content);
    }

    // Extract sources from citations
    const sources = extractSources(data, maxSources);

    // Get related queries from API response
    const relatedQueries = data.choices?.[0]?.message?.related_questions || researchData.relatedQueries || [];

    const result: PerplexityResearchResult = {
      summary: researchData.summary || content.substring(0, 500),
      keyPoints: researchData.keyPoints || [],
      statistics: researchData.statistics || [],
      trendingTopics: researchData.trendingTopics || [],
      sources,
      relatedQueries,
      timestamp: new Date(),
    };

    console.log(`✅ Research completed: ${result.keyPoints.length} key points, ${result.sources.length} sources`);

    return result;
  } catch (error) {
    console.error('❌ Error researching with Perplexity:', error);
    throw error;
  }
}

/**
 * Find trending topics in a niche
 */
export async function findTrendingTopics(
  niche: string,
  count: number = 10
): Promise<string[]> {
  console.log(`🔥 Finding trending topics in: ${niche}`);

  const prompt = `What are the top ${count} trending topics, questions, and pain points in the ${niche} niche right now in 2025? 

Focus on:
- Current trends and hot topics
- Common questions people are asking
- Problems people are trying to solve
- Recent developments and news

Provide your response as a JSON array of trending topics:
["Topic 1", "Topic 2", "Topic 3", ...]`;

  try {
    const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a trend research specialist who identifies current trending topics and content opportunities.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Perplexity');
    }

    // Parse the JSON array
    let topics: string[];
    try {
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/) ||
        content.match(/\[([\s\S]*?)\]/) ||
        [null, content];
      topics = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      // Fallback: extract topics from numbered list
      topics = extractTopicsFromList(content);
    }

    console.log(`✅ Found ${topics.length} trending topics`);

    return topics.slice(0, count);
  } catch (error) {
    console.error('❌ Error finding trending topics:', error);
    throw error;
  }
}

/**
 * Analyze competitors' content
 */
export async function analyzeCompetitors(
  topic: string,
  competitorUrls: string[]
): Promise<CompetitorAnalysis[]> {
  console.log(`🔍 Analyzing ${competitorUrls.length} competitors for: ${topic}`);

  const analyses: CompetitorAnalysis[] = [];

  for (const url of competitorUrls) {
    try {
      const prompt = `Analyze the content at this URL in the context of the topic "${topic}":
${url}

Identify:
1. STRENGTHS: What does this content do well? What makes it valuable?
2. GAPS: What's missing? What could be improved or added?

Provide your response in JSON format:
{
  "strengths": ["Strength 1", "Strength 2", ...],
  "gaps": ["Gap 1", "Gap 2", ...]
}`;

      const response = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a content analysis expert who evaluates competitor content to identify strengths and opportunities.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        console.warn(`Failed to analyze ${url}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        try {
          const jsonMatch =
            content.match(/```json\n([\s\S]*?)\n```/) ||
            content.match(/```\n([\s\S]*?)\n```/) ||
            [null, content];
          const analysis = JSON.parse(jsonMatch[1] || content);

          analyses.push({
            url,
            strengths: analysis.strengths || [],
            gaps: analysis.gaps || [],
          });
        } catch (parseError) {
          console.warn(`Failed to parse analysis for ${url}`);
        }
      }

      // Rate limiting: wait a bit between requests
      await new Promise((resolve) => setTimeout(resolve, 1200)); // ~50 requests/minute
    } catch (error) {
      console.warn(`Error analyzing ${url}:`, error);
    }
  }

  console.log(`✅ Analyzed ${analyses.length} competitors`);

  return analyses;
}

/**
 * Extract sources from Perplexity API response
 */
function extractSources(
  data: any,
  maxSources: number
): Array<{ title: string; url: string; snippet: string }> {
  const sources: Array<{ title: string; url: string; snippet: string }> = [];

  // Try to extract citations from the response
  const citations = data.citations || [];
  
  for (let i = 0; i < Math.min(citations.length, maxSources); i++) {
    const citation = citations[i];
    sources.push({
      title: citation.title || `Source ${i + 1}`,
      url: citation.url || '',
      snippet: citation.snippet || '',
    });
  }

  return sources;
}

/**
 * Fallback: Extract research data from plain text
 */
function extractResearchFromText(text: string): any {
  const lines = text.split('\n').filter((line) => line.trim());

  return {
    summary: lines.slice(0, 3).join(' '),
    keyPoints: lines.filter((line) => line.match(/^[-•*]\s/)).map((line) => line.replace(/^[-•*]\s/, '')),
    statistics: [],
    trendingTopics: [],
    relatedQueries: [],
  };
}

/**
 * Extract topics from a numbered or bulleted list
 */
function extractTopicsFromList(text: string): string[] {
  const lines = text.split('\n').filter((line) => line.trim());
  const topics: string[] = [];

  for (const line of lines) {
    // Match numbered lists (1. Topic) or bulleted lists (- Topic, * Topic)
    const match = line.match(/^(?:\d+\.|[-•*])\s*(.+)$/);
    if (match) {
      topics.push(match[1].trim());
    }
  }

  return topics;
}

/**
 * Cache for research results (24 hours)
 */
const researchCache = new Map<string, { data: PerplexityResearchResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get cached research or perform new research
 */
export async function getCachedResearch(
  options: PerplexityResearchOptions
): Promise<PerplexityResearchResult> {
  const cacheKey = JSON.stringify(options);
  const cached = researchCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('📦 Using cached research data');
    return cached.data;
  }

  const result = await researchTopicWithPerplexity(options);
  researchCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}
