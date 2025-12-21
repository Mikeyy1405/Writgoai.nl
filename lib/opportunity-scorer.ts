/**
 * Opportunity Scoring System for Topical Authority
 * Scores content opportunities based on strategic value
 */

interface OpportunityScore {
  total: number;
  priority: number;
  relevance: number;
  freshness: number;
  authorityPotential: number;
  topic: string;
  shouldGenerate: boolean;
  reason: string;
}

interface Opportunity {
  title: string;
  source_url: string;
  metadata?: {
    description?: string;
    published?: string;
    feedName?: string;
    categories?: string[];
  };
}

// WritGo's core topics for topical authority
const CORE_TOPICS = {
  'google-seo': {
    name: 'Google SEO Updates',
    keywords: ['google', 'core update', 'algorithm', 'search console', 'ranking', 'serp', 'search'],
    priority: 10,
    dailyLimit: 2
  },
  'ai-seo': {
    name: 'AI & SEO',
    keywords: ['chatgpt', 'ai', 'artificial intelligence', 'openai', 'claude', 'gemini', 'llm', 'generative'],
    priority: 9,
    dailyLimit: 1
  },
  'wordpress-seo': {
    name: 'WordPress SEO',
    keywords: ['wordpress', 'yoast', 'wp', 'woocommerce', 'gutenberg'],
    priority: 8,
    dailyLimit: 1
  },
  'content-marketing': {
    name: 'Content Marketing',
    keywords: ['content', 'copywriting', 'link building', 'backlinks', 'e-e-a-t'],
    priority: 7,
    dailyLimit: 1
  },
  'technical-seo': {
    name: 'Technical SEO',
    keywords: ['schema', 'structured data', 'core web vitals', 'page speed', 'crawling', 'indexing'],
    priority: 8,
    dailyLimit: 1
  }
};

export function scoreOpportunity(opportunity: Opportunity): OpportunityScore {
  const title = opportunity.title.toLowerCase();
  const description = (opportunity.metadata?.description || '').toLowerCase();
  const content = `${title} ${description}`;
  
  // 1. Classify topic
  const topic = classifyTopic(content);
  
  // 2. Calculate priority score (1-10)
  const priority = calculatePriority(opportunity, topic);
  
  // 3. Calculate relevance score (1-10)
  const relevance = calculateRelevance(content, topic);
  
  // 4. Calculate freshness score (1-10)
  const freshness = calculateFreshness(opportunity.metadata?.published);
  
  // 5. Calculate authority potential (1-10)
  const authorityPotential = calculateAuthorityPotential(content, topic);
  
  // Total score (max 1000)
  const total = priority * relevance * freshness * authorityPotential;
  
  // Decision threshold
  const shouldGenerate = total >= 200 && relevance >= 5;
  
  const reason = shouldGenerate
    ? `High-value ${topic.name} content (score: ${total})`
    : `Low strategic value (score: ${total}, needs >= 200)`;
  
  return {
    total,
    priority,
    relevance,
    freshness,
    authorityPotential,
    topic: topic.name,
    shouldGenerate,
    reason
  };
}

function classifyTopic(content: string): typeof CORE_TOPICS[keyof typeof CORE_TOPICS] & { key: string } {
  let bestMatch = { key: 'content-marketing', ...CORE_TOPICS['content-marketing'] };
  let bestScore = 0;
  
  for (const [key, topic] of Object.entries(CORE_TOPICS)) {
    const score = topic.keywords.filter(keyword => content.includes(keyword)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { key, ...topic };
    }
  }
  
  return bestMatch;
}

function calculatePriority(opportunity: Opportunity, topic: any): number {
  const feedName = opportunity.metadata?.feedName?.toLowerCase() || '';
  
  // Official sources get max priority
  if (feedName.includes('google search central')) return 10;
  if (feedName.includes('openai')) return 10;
  if (feedName.includes('anthropic')) return 9;
  
  // Industry leaders
  if (feedName.includes('search engine land')) return 9;
  if (feedName.includes('search engine journal')) return 9;
  if (feedName.includes('ahrefs')) return 8;
  if (feedName.includes('moz')) return 8;
  if (feedName.includes('yoast')) return 8;
  
  // Use topic priority as baseline
  return topic.priority || 7;
}

function calculateRelevance(content: string, topic: any): number {
  const keywordMatches = topic.keywords.filter(keyword => 
    content.includes(keyword)
  ).length;
  
  // More keyword matches = higher relevance
  if (keywordMatches >= 3) return 10;
  if (keywordMatches === 2) return 8;
  if (keywordMatches === 1) return 6;
  
  // Check for related terms
  const relatedTerms = [
    'seo', 'optimization', 'ranking', 'traffic', 'keywords',
    'website', 'blog', 'content', 'marketing'
  ];
  
  const relatedMatches = relatedTerms.filter(term => content.includes(term)).length;
  if (relatedMatches >= 2) return 5;
  
  return 3; // Low relevance
}

function calculateFreshness(publishedDate?: string): number {
  if (!publishedDate) return 5; // Unknown = medium freshness
  
  const published = new Date(publishedDate);
  const now = new Date();
  const ageInHours = (now.getTime() - published.getTime()) / (1000 * 60 * 60);
  
  if (ageInHours < 24) return 10;      // Today
  if (ageInHours < 72) return 8;       // Last 3 days
  if (ageInHours < 168) return 5;      // Last week
  if (ageInHours < 336) return 3;      // Last 2 weeks
  
  return 1; // Too old
}

function calculateAuthorityPotential(content: string, topic: any): number {
  // Pillar page indicators
  const pillarIndicators = [
    'complete guide', 'ultimate guide', 'everything you need',
    'comprehensive', 'full guide', 'complete overview'
  ];
  
  if (pillarIndicators.some(indicator => content.includes(indicator))) {
    return 10; // Pillar page potential
  }
  
  // Cluster article indicators
  const clusterIndicators = [
    'how to', 'step by step', 'tutorial', 'guide',
    'tips', 'best practices', 'strategies'
  ];
  
  if (clusterIndicators.some(indicator => content.includes(indicator))) {
    return 8; // Strong cluster article
  }
  
  // News/update indicators
  const newsIndicators = [
    'update', 'new', 'announcement', 'release', 'launched'
  ];
  
  if (newsIndicators.some(indicator => content.includes(indicator))) {
    return 7; // Timely news content
  }
  
  // Supporting content
  return 5;
}

/**
 * Check if daily limit for topic is reached
 */
export async function checkDailyLimit(
  topic: string,
  supabase: any
): Promise<boolean> {
  const topicConfig = Object.values(CORE_TOPICS).find(t => t.name === topic);
  if (!topicConfig) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('writgo_content_queue')
    .select('id')
    .gte('created_at', today.toISOString())
    .ilike('metadata->topic', `%${topic}%`);
  
  if (error) return false;
  
  return (data?.length || 0) >= topicConfig.dailyLimit;
}

/**
 * Get recommended topics for today
 */
export function getRecommendedTopics(): string[] {
  // Prioritize topics by strategic value
  return [
    'Google SEO Updates',
    'AI & SEO',
    'WordPress SEO',
    'Technical SEO',
    'Content Marketing'
  ];
}
