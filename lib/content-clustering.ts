/**
 * Content Clustering System for Topical Authority
 * Groups related content into topic clusters with pillar pages
 */

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  focus_keyword?: string;
  metadata?: any;
}

interface Cluster {
  pillarPage: Article | null;
  clusterArticles: Article[];
  supportingContent: Article[];
  topic: string;
  keywords: string[];
}

// Define pillar page topics
const PILLAR_TOPICS = {
  'google-seo-updates': {
    title: 'Google SEO Updates: Complete Gids 2025',
    keywords: ['google update', 'core update', 'algorithm', 'ranking', 'serp'],
    description: 'Alles over Google Core Updates, algorithm changes en ranking factors'
  },
  'ai-seo-tools': {
    title: 'AI & SEO: Complete Gids voor 2025',
    keywords: ['ai seo', 'chatgpt', 'ai tools', 'artificial intelligence'],
    description: 'Hoe AI de toekomst van SEO verandert'
  },
  'wordpress-seo-optimization': {
    title: 'WordPress SEO Optimization: Complete Gids',
    keywords: ['wordpress seo', 'yoast', 'wp optimization', 'wordpress speed'],
    description: 'Optimaliseer je WordPress site voor Google'
  },
  'content-marketing-strategy': {
    title: 'Content Marketing Strategie: Complete Gids',
    keywords: ['content marketing', 'content strategy', 'link building', 'e-e-a-t'],
    description: 'Bouw een succesvolle content marketing strategie'
  },
  'technical-seo-guide': {
    title: 'Technical SEO: Complete Gids 2025',
    keywords: ['technical seo', 'schema markup', 'core web vitals', 'crawling'],
    description: 'Master technical SEO voor betere rankings'
  }
};

/**
 * Classify article into topic cluster
 */
export function classifyArticle(article: Article): string | null {
  const content = `${article.title} ${article.content}`.toLowerCase();
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const [key, pillar] of Object.entries(PILLAR_TOPICS)) {
    const score = pillar.keywords.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }
  
  return bestScore >= 2 ? bestMatch : null;
}

/**
 * Generate internal links for article based on cluster
 */
export async function generateClusterLinks(
  article: Article,
  supabase: any
): Promise<string[]> {
  const cluster = classifyArticle(article);
  if (!cluster) return [];
  
  const pillarTopic = PILLAR_TOPICS[cluster as keyof typeof PILLAR_TOPICS];
  const links: string[] = [];
  
  // Get related articles in same cluster
  const { data: relatedArticles } = await supabase
    .from('articles')
    .select('slug, title')
    .neq('id', article.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5);
  
  if (relatedArticles) {
    for (const related of relatedArticles) {
      const relatedContent = related.title.toLowerCase();
      const isRelated = pillarTopic.keywords.some(keyword =>
        relatedContent.includes(keyword.toLowerCase())
      );
      
      if (isRelated) {
        links.push(`/blog/${related.slug}`);
      }
    }
  }
  
  return links;
}

/**
 * Generate breadcrumb schema for article
 */
export function generateBreadcrumbSchema(article: Article): any {
  const cluster = classifyArticle(article);
  const pillarTopic = cluster ? PILLAR_TOPICS[cluster as keyof typeof PILLAR_TOPICS] : null;
  
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://writgo.nl"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://writgo.nl/blog"
    }
  ];
  
  if (pillarTopic) {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": pillarTopic.title,
      "item": `https://writgo.nl/blog/${cluster}`
    });
    
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 4,
      "name": article.title
    });
  } else {
    breadcrumbs.push({
      "@type": "ListItem",
      "position": 3,
      "name": article.title
    });
  }
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs
  };
}

/**
 * Get recommended next articles for reader
 */
export async function getRecommendedArticles(
  article: Article,
  supabase: any
): Promise<Article[]> {
  const cluster = classifyArticle(article);
  if (!cluster) {
    // Return recent articles if no cluster
    const { data } = await supabase
      .from('articles')
      .select('*')
      .neq('id', article.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    
    return data || [];
  }
  
  const pillarTopic = PILLAR_TOPICS[cluster as keyof typeof PILLAR_TOPICS];
  
  // Get articles in same cluster
  const { data: clusterArticles } = await supabase
    .from('articles')
    .select('*')
    .neq('id', article.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);
  
  if (!clusterArticles) return [];
  
  // Filter by cluster keywords
  const related = clusterArticles.filter((a: Article) => {
    const content = `${a.title} ${a.content}`.toLowerCase();
    return pillarTopic.keywords.some(keyword =>
      content.includes(keyword.toLowerCase())
    );
  });
  
  return related.slice(0, 3);
}

/**
 * Check if article should be a pillar page
 */
export function isPillarPageCandidate(article: Article): boolean {
  const title = article.title.toLowerCase();
  const content = article.content.toLowerCase();
  
  // Pillar page indicators
  const indicators = [
    'complete gids',
    'ultimate guide',
    'alles over',
    'complete overview',
    'definitieve gids',
    'everything you need'
  ];
  
  const hasIndicator = indicators.some(indicator => 
    title.includes(indicator) || content.includes(indicator)
  );
  
  // Check word count (pillar pages should be long)
  const wordCount = article.content.split(/\s+/).length;
  const isLongForm = wordCount >= 3000;
  
  return hasIndicator && isLongForm;
}

/**
 * Generate pillar page structure
 */
export function generatePillarPageStructure(topic: keyof typeof PILLAR_TOPICS): string {
  const pillar = PILLAR_TOPICS[topic];
  
  return `
# ${pillar.title}

## Inhoudsopgave
1. Wat is ${pillar.title.split(':')[0]}?
2. Waarom is dit belangrijk?
3. Geschiedenis & Ontwikkeling
4. Belangrijkste Concepten
5. Best Practices
6. Tools & Resources
7. Veelgestelde Vragen
8. Conclusie

## Gerelateerde Artikelen

Deze pillar page linkt naar alle cluster artikelen over dit onderwerp.

---

**Laatste update:** ${new Date().toLocaleDateString('nl-NL')}
**Topic:** ${pillar.description}
**Keywords:** ${pillar.keywords.join(', ')}
`;
}

/**
 * Calculate topical authority score
 */
export async function calculateTopicalAuthority(
  topic: string,
  supabase: any
): Promise<number> {
  const pillarTopic = PILLAR_TOPICS[topic as keyof typeof PILLAR_TOPICS];
  if (!pillarTopic) return 0;
  
  // Get all articles in this cluster
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content, published_at')
    .eq('status', 'published');
  
  if (!articles) return 0;
  
  // Filter by cluster keywords
  const clusterArticles = articles.filter((a: Article) => {
    const content = `${a.title} ${a.content}`.toLowerCase();
    return pillarTopic.keywords.some(keyword =>
      content.includes(keyword.toLowerCase())
    );
  });
  
  // Calculate score based on:
  // - Number of articles (more = better)
  // - Recency (recent = better)
  // - Depth (longer = better)
  
  const articleCount = clusterArticles.length;
  const avgWordCount = clusterArticles.reduce((sum: number, a: Article) => 
    sum + a.content.split(/\s+/).length, 0
  ) / (articleCount || 1);
  
  const recentArticles = clusterArticles.filter((a: Article) => {
    const published = new Date(a.published_at);
    const monthsAgo = (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monthsAgo <= 6; // Last 6 months
  }).length;
  
  // Score formula
  const score = (
    (articleCount * 10) +           // 10 points per article
    (avgWordCount / 100) +          // Points for depth
    (recentArticles * 5)            // 5 points per recent article
  );
  
  return Math.min(100, Math.round(score)); // Max 100
}
