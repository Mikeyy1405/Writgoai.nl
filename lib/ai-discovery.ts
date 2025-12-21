/**
 * AI-Powered Content Discovery Service
 * Uses Perplexity via AIML API for intelligent topic discovery
 * No RSS feeds needed - AI discovers trending topics and content gaps
 */

import OpenAI from 'openai';

// Initialize OpenAI client with AIML API base URL for Perplexity
const aimlClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY || '',
  baseURL: 'https://api.aimlapi.com/v1',
});

export interface DiscoveredTopic {
  title: string;
  description: string;
  keywords: string[];
  suggestedTopicId: string;
  contentType: 'pillar' | 'cluster' | 'supporting';
  reasoning: string;
  sources: string[];
  trending: boolean;
  searchVolume?: number;
}

export interface TopicClassification {
  topicId: string;
  topicName: string;
  confidence: number;
  contentType: 'pillar' | 'cluster' | 'supporting';
  reasoning: string;
}

export interface OpportunityScore {
  priorityScore: number; // 0-1000
  breakdown: {
    priority: number; // 1-10
    relevance: number; // 1-10
    freshness: number; // 1-10
    authority: number; // 1-10
  };
  shouldGenerate: boolean;
  reasoning: string;
}

/**
 * Discover trending topics using Perplexity AI
 */
export async function discoverTrendingTopics(
  topics: string[],
  count: number = 10
): Promise<DiscoveredTopic[]> {
  const topicsStr = topics.join(', ');
  
  const prompt = `Je bent een SEO content strategist voor WritGo.nl, een Nederlandse SEO blog.

Ontdek de meest trending en relevante content onderwerpen voor deze topics: ${topicsStr}

Zoek naar:
1. Recente Google algorithm updates en aankondigingen
2. Nieuwe AI tools en features (ChatGPT, Claude, Gemini, etc.)
3. WordPress SEO updates en nieuwe plugins
4. Trending SEO technieken en best practices
5. Content gaps waar WritGo.nl nog niet over schrijft

Geef ${count} concrete content ideeën terug in JSON formaat:

[
  {
    "title": "Concrete artikel titel in het Nederlands",
    "description": "Korte beschrijving van het onderwerp",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "suggestedTopicId": "google-seo-updates" of "ai-seo" of "wordpress-seo" of "content-marketing" of "local-seo",
    "contentType": "pillar" of "cluster" of "supporting",
    "reasoning": "Waarom is dit relevant en trending?",
    "sources": ["url1", "url2"],
    "trending": true of false
  }
]

Focus op:
- Actuele onderwerpen (laatste 7 dagen)
- High search intent
- Onderwerpen waar WritGo.nl authority in kan opbouwen
- Nederlandse markt relevantie`;

  try {
    const response = await aimlClient.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert SEO content strategist die trending onderwerpen identificeert voor Nederlandse SEO blogs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON found in AI response');
      return [];
    }
    
    const topics: DiscoveredTopic[] = JSON.parse(jsonMatch[0]);
    return topics;
  } catch (error) {
    console.error('Error discovering topics with AI:', error);
    return [];
  }
}

/**
 * Discover content gaps based on existing content
 */
export async function discoverContentGaps(
  topicId: string,
  existingArticles: string[]
): Promise<DiscoveredTopic[]> {
  const topicNames: Record<string, string> = {
    'google-seo-updates': 'Google SEO Updates',
    'ai-seo': 'AI & SEO',
    'wordpress-seo': 'WordPress SEO',
    'content-marketing': 'Content Marketing',
    'local-seo': 'Local SEO'
  };

  const topicName = topicNames[topicId] || topicId;
  const articlesStr = existingArticles.slice(0, 20).join('\n- ');

  const prompt = `Je bent een SEO content strategist voor WritGo.nl.

Topic: ${topicName}

Bestaande artikelen:
- ${articlesStr}

Identificeer 5-10 content gaps: onderwerpen die nog NIET gedekt zijn maar wel belangrijk zijn voor topical authority in ${topicName}.

Geef suggesties terug in JSON formaat:

[
  {
    "title": "Artikel titel",
    "description": "Beschrijving",
    "keywords": ["keyword1", "keyword2"],
    "suggestedTopicId": "${topicId}",
    "contentType": "cluster" of "supporting",
    "reasoning": "Waarom is deze gap belangrijk?",
    "sources": [],
    "trending": false
  }
]`;

  try {
    const response = await aimlClient.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het identificeren van content gaps voor SEO blogs.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error discovering content gaps:', error);
    return [];
  }
}

/**
 * Classify content opportunity into topic
 */
export async function classifyOpportunity(
  title: string,
  description?: string,
  keywords?: string[]
): Promise<TopicClassification> {
  const prompt = `Je bent een content strategist voor WritGo.nl, een Nederlandse SEO blog.

Classificeer dit content idee in een van deze topics:
1. google-seo-updates: Google algorithm updates, Search Console features, ranking factors
2. ai-seo: ChatGPT, AI tools, AI-powered SEO, future of AI in search
3. wordpress-seo: Yoast, technical WP SEO, speed optimization, schema
4. content-marketing: SEO copywriting, content strategie, link building, E-E-A-T
5. local-seo: Google Business Profile, local rankings, citations

Content:
Titel: ${title}
Beschrijving: ${description || 'Geen beschrijving'}
Keywords: ${keywords?.join(', ') || 'Geen keywords'}

Bepaal ook het content type:
- pillar: Grote, uitgebreide gids (5000+ woorden) die het hele topic dekt
- cluster: Specifiek subtopic artikel (2500-3000 woorden)
- supporting: Specifieke vraag of how-to (1500-2000 woorden)

Geef antwoord in JSON formaat:
{
  "topicId": "google-seo-updates",
  "topicName": "Google SEO Updates",
  "confidence": 0.95,
  "contentType": "cluster",
  "reasoning": "Dit gaat over een Google Core Update, past perfect bij Google SEO Updates topic"
}`;

  try {
    const response = await aimlClient.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het classificeren van SEO content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in classification response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error classifying opportunity:', error);
    // Fallback to content-marketing with low confidence
    return {
      topicId: 'content-marketing',
      topicName: 'Content Marketing',
      confidence: 0.3,
      contentType: 'supporting',
      reasoning: 'Kon niet automatisch classificeren, fallback naar Content Marketing'
    };
  }
}

/**
 * Score opportunity based on multiple factors
 */
export function scoreOpportunity(
  opportunity: {
    topicId: string;
    contentType: string;
    detectedAt: Date;
    keywords?: string[];
    source?: string;
  }
): OpportunityScore {
  // Priority (1-10)
  let priority = 5;
  if (opportunity.source === 'ai' && opportunity.topicId === 'google-seo-updates') priority = 10;
  else if (opportunity.topicId === 'google-seo-updates') priority = 9;
  else if (opportunity.topicId === 'ai-seo') priority = 8;
  else if (opportunity.topicId === 'wordpress-seo') priority = 7;
  else if (opportunity.topicId === 'content-marketing') priority = 6;

  // Check for high-priority keywords
  const highPriorityKeywords = ['google update', 'core update', 'algorithm', 'chatgpt', 'gemini', 'claude'];
  if (opportunity.keywords?.some(k => highPriorityKeywords.some(hp => k.toLowerCase().includes(hp)))) {
    priority = Math.min(10, priority + 2);
  }

  // Relevance (1-10)
  let relevance = 7;
  if (opportunity.contentType === 'pillar') relevance = 10;
  else if (opportunity.contentType === 'cluster') relevance = 8;
  else if (opportunity.contentType === 'supporting') relevance = 6;

  // Freshness (1-10)
  const hoursAgo = (Date.now() - opportunity.detectedAt.getTime()) / (1000 * 60 * 60);
  let freshness = 10;
  if (hoursAgo > 24) freshness = 8;
  if (hoursAgo > 72) freshness = 5;
  if (hoursAgo > 168) freshness = 2;

  // Authority Potential (1-10)
  let authority = 5;
  if (opportunity.contentType === 'pillar') authority = 10;
  else if (opportunity.contentType === 'cluster') authority = 8;
  else if (opportunity.contentType === 'supporting') authority = 5;

  // Calculate total score (0-1000)
  const priorityScore = priority * relevance * freshness * authority;

  // Should generate? (minimum score: 200)
  const shouldGenerate = priorityScore >= 200;

  return {
    priorityScore,
    breakdown: {
      priority,
      relevance,
      freshness,
      authority
    },
    shouldGenerate,
    reasoning: `Score: ${priorityScore}/1000. Priority: ${priority}/10 (${opportunity.topicId}), Relevance: ${relevance}/10 (${opportunity.contentType}), Freshness: ${freshness}/10 (${Math.round(hoursAgo)}h ago), Authority: ${authority}/10.`
  };
}

/**
 * Generate keyword cluster for a topic
 */
export async function generateKeywordCluster(
  topicId: string,
  seedKeyword: string
): Promise<{
  clusterName: string;
  pillarKeyword: string;
  keywords: string[];
  contentType: 'pillar' | 'cluster' | 'supporting';
}> {
  const topicNames: Record<string, string> = {
    'google-seo-updates': 'Google SEO Updates',
    'ai-seo': 'AI & SEO',
    'wordpress-seo': 'WordPress SEO',
    'content-marketing': 'Content Marketing',
    'local-seo': 'Local SEO'
  };

  const topicName = topicNames[topicId] || topicId;

  const prompt = `Je bent een SEO keyword research expert.

Topic: ${topicName}
Seed Keyword: ${seedKeyword}

Genereer een keyword cluster met:
1. Cluster naam (beschrijvend)
2. Pillar keyword (hoofd keyword)
3. 10-20 gerelateerde keywords
4. Content type (pillar, cluster, of supporting)

Geef antwoord in JSON formaat:
{
  "clusterName": "Google Core Updates",
  "pillarKeyword": "google core update",
  "keywords": ["core update google", "algorithm update", "google update 2024", ...],
  "contentType": "cluster"
}`;

  try {
    const response = await aimlClient.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in SEO keyword research en clustering.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in keyword cluster response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error generating keyword cluster:', error);
    return {
      clusterName: seedKeyword,
      pillarKeyword: seedKeyword,
      keywords: [seedKeyword],
      contentType: 'supporting'
    };
  }
}
