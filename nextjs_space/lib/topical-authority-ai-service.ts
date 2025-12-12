/**
 * Topical Authority Map AI Service
 * 
 * Generates comprehensive topical authority maps with pillar/cluster structure
 * Supports 100-500 article generation with advanced SEO optimization
 */

import { chatCompletion } from './aiml-api';

export interface TopicalMapConfig {
  niche: string;
  targetAudience: string;
  language: string;
  tone: string;
  keywords?: string[];
  totalArticles: number; // 100-500
  pillarClusterRatio: string; // e.g., "1:10"
}

export interface PillarArticle {
  title: string;
  description: string;
  type: 'pillar';
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  wordCount: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  priority: number;
}

export interface ClusterArticle {
  title: string;
  description: string;
  type: 'cluster';
  parentPillarIndex: number; // Index of parent pillar in the array
  primaryKeyword: string;
  secondaryKeywords: string[];
  contentType: string;
  wordCount: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  order: number;
  priority: number;
}

export type TopicalMapArticle = PillarArticle | ClusterArticle;

export interface TopicalMapStructure {
  totalArticles: number;
  pillarCount: number;
  clusterCount: number;
  articles: TopicalMapArticle[];
  keywordCoverage: string[];
  estimatedTimeWeeks: number;
}

/**
 * Generate a complete topical authority map structure
 */
export async function generateTopicalAuthorityMap(
  config: TopicalMapConfig
): Promise<TopicalMapStructure> {
  console.log('[Topical Authority AI] Generating map for:', config);

  // Calculate pillar and cluster counts
  const { pillarCount, clusterCount } = calculateArticleCounts(
    config.totalArticles,
    config.pillarClusterRatio
  );

  console.log(`[Topical Authority AI] Planning: ${pillarCount} pillars, ${clusterCount} clusters`);

  // Generate the map structure
  const prompt = buildTopicalMapPrompt(config, pillarCount, clusterCount);

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-4',
    temperature: 0.8,
    max_tokens: 16000, // Large token limit for comprehensive maps
  });

  let aiContent = response.choices[0]?.message?.content || '';
  
  // Clean up the response
  aiContent = cleanAIResponse(aiContent);

  console.log('[Topical Authority AI] AI response received, parsing...');

  // Parse the AI response
  let parsedData: any;
  try {
    parsedData = JSON.parse(aiContent);
    
    if (!parsedData.pillars || !Array.isArray(parsedData.pillars)) {
      throw new Error('Invalid structure: missing pillars array');
    }

    console.log(`[Topical Authority AI] Parsed ${parsedData.pillars.length} pillars`);

  } catch (parseError: any) {
    console.error('[Topical Authority AI] Failed to parse AI response:', parseError);
    console.error('[Topical Authority AI] Raw content:', aiContent.substring(0, 2000));
    
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }

  // Convert parsed data to structured format
  const articles: TopicalMapArticle[] = [];
  const keywordCoverage: string[] = [];
  let articleOrder = 0;

  // Process pillars and their clusters
  for (let pillarIndex = 0; pillarIndex < parsedData.pillars.length; pillarIndex++) {
    const pillar = parsedData.pillars[pillarIndex];
    
    // Add pillar article
    const pillarArticle: PillarArticle = {
      title: pillar.title,
      description: pillar.description,
      type: 'pillar',
      primaryKeyword: pillar.primaryKeyword,
      secondaryKeywords: pillar.secondaryKeywords || [],
      contentType: pillar.contentType || 'Comprehensive Guide',
      wordCount: pillar.wordCount || 2500,
      difficultyLevel: pillar.difficultyLevel || 'intermediate',
      order: articleOrder++,
      priority: 100 - pillarIndex, // Higher priority for earlier pillars
    };
    
    articles.push(pillarArticle);
    keywordCoverage.push(pillar.primaryKeyword);
    keywordCoverage.push(...(pillar.secondaryKeywords || []));

    // Add cluster articles for this pillar
    if (pillar.clusters && Array.isArray(pillar.clusters)) {
      for (const cluster of pillar.clusters) {
        const clusterArticle: ClusterArticle = {
          title: cluster.title,
          description: cluster.description,
          type: 'cluster',
          parentPillarIndex: pillarIndex,
          primaryKeyword: cluster.primaryKeyword,
          secondaryKeywords: cluster.secondaryKeywords || [],
          contentType: cluster.contentType || 'How-to',
          wordCount: cluster.wordCount || 1200,
          difficultyLevel: cluster.difficultyLevel || 'beginner',
          order: articleOrder++,
          priority: 50 - Math.floor(articleOrder / 10), // Decrease priority over time
        };
        
        articles.push(clusterArticle);
        keywordCoverage.push(cluster.primaryKeyword);
        keywordCoverage.push(...(cluster.secondaryKeywords || []));
      }
    }
  }

  // Calculate estimated time (assuming 3 articles per week)
  const estimatedTimeWeeks = Math.ceil(articles.length / 3);

  console.log(`[Topical Authority AI] Generated ${articles.length} total articles`);
  console.log(`[Topical Authority AI] Keyword coverage: ${keywordCoverage.length} unique keywords`);

  return {
    totalArticles: articles.length,
    pillarCount: articles.filter(a => a.type === 'pillar').length,
    clusterCount: articles.filter(a => a.type === 'cluster').length,
    articles,
    keywordCoverage: [...new Set(keywordCoverage)], // Remove duplicates
    estimatedTimeWeeks,
  };
}

/**
 * Calculate pillar and cluster counts based on total and ratio
 */
function calculateArticleCounts(
  totalArticles: number,
  ratio: string
): { pillarCount: number; clusterCount: number } {
  // Parse ratio like "1:10" -> 1 pillar per 10 clusters
  const [pillarPart, clusterPart] = ratio.split(':').map(Number);
  
  if (!pillarPart || !clusterPart) {
    throw new Error('Invalid ratio format. Expected "1:10"');
  }

  const totalParts = pillarPart + clusterPart;
  const pillarCount = Math.max(
    3, // Minimum 3 pillars
    Math.round((totalArticles * pillarPart) / totalParts)
  );
  const clusterCount = totalArticles - pillarCount;

  return { pillarCount, clusterCount };
}

/**
 * Build comprehensive AI prompt for topical authority map
 */
function buildTopicalMapPrompt(
  config: TopicalMapConfig,
  pillarCount: number,
  clusterCount: number
): string {
  return `Genereer een complete TOPICAL AUTHORITY MAP voor een blog over "${config.niche}" gericht op "${config.targetAudience}".

SPECIFICATIES:
- Totaal aantal artikelen: ${config.totalArticles}
- Aantal PILLAR PAGES: ${pillarCount}
- Aantal CLUSTER ARTIKELEN: ${clusterCount}
- Taal: ${config.language}
- Tone: ${config.tone}
${config.keywords && config.keywords.length > 0 ? `- Focus keywords: ${config.keywords.join(', ')}` : ''}

STRUCTUUR:
Een topical authority map heeft een hiërarchische structuur:
1. **PILLAR PAGES** (${pillarCount}x):
   - Hoofdonderwerpen die de kern van de niche dekken
   - Uitgebreide, diepgaande content (2000-3000 woorden)
   - Breed onderwerp met veel zoekvolume
   - Linkt naar alle gerelateerde cluster artikelen

2. **CLUSTER ARTIKELEN** (${clusterCount}x):
   - Ondersteunende content die dieper ingaat op specifieke aspecten
   - Middellange content (1000-1500 woorden)
   - Specifieke long-tail keywords
   - Linkt altijd terug naar parent pillar

VEREISTEN VOOR ELKE PILLAR PAGE:
1. SEO-geoptimaliseerde titel (50-60 karakters, keyword-rijk)
2. Beschrijving (3-4 zinnen wat de pillar behandelt)
3. Primary keyword (breed, hoog zoekvolume)
4. 8-12 secondary keywords
5. Content type (meestal: "Comprehensive Guide", "Ultimate Guide", "Complete Overview")
6. Woordenaantal: 2000-3000
7. Difficulty level: meestal "intermediate" of "advanced"
8. 8-12 cluster artikelen per pillar

VEREISTEN VOOR ELK CLUSTER ARTIKEL:
1. SEO-geoptimaliseerde titel (50-60 karakters, long-tail keyword)
2. Beschrijving (2-3 zinnen)
3. Primary keyword (specifiek, long-tail)
4. 5-8 secondary keywords
5. Content type (variëren: "How-to", "Tutorial", "Listicle", "Case Study", "Comparison", "Review")
6. Woordenaantal: 1000-1500
7. Difficulty level: "beginner" tot "intermediate"

CONTENT STRATEGIE:
- Begin met fundamentele onderwerpen (beginner)
- Bouw op naar geavanceerde topics (advanced)
- Zorg voor volledige keyword coverage van de niche
- Elke pillar moet een specifiek hoofdonderwerp dekken
- Clusters moeten logisch aansluiten bij hun pillar
- Zorg voor interne linking mogelijkheden
- Mix verschillende content types voor diversiteit
- Focus op search intent en user value

SEO BEST PRACTICES:
- Gebruik actuele keywords relevant voor ${new Date().getFullYear()}
- Target verschillende zoekintents (informational, navigational, transactional)
- Optimaliseer voor featured snippets
- Denk aan voice search queries
- Zorg voor topical relevance en semantic SEO

BELANGRIJK:
Retourneer ALLEEN een geldig JSON object in deze EXACTE structuur:

{
  "pillars": [
    {
      "title": "Pillar titel hier",
      "description": "Beschrijving van 3-4 zinnen.",
      "primaryKeyword": "breed keyword",
      "secondaryKeywords": ["keyword1", "keyword2", "..."],
      "contentType": "Comprehensive Guide",
      "wordCount": 2500,
      "difficultyLevel": "intermediate",
      "clusters": [
        {
          "title": "Cluster artikel titel",
          "description": "Beschrijving van 2-3 zinnen.",
          "primaryKeyword": "specifiek long-tail keyword",
          "secondaryKeywords": ["keyword1", "keyword2", "..."],
          "contentType": "How-to",
          "wordCount": 1200,
          "difficultyLevel": "beginner"
        }
        // ... meer clusters (8-12 per pillar)
      ]
    }
    // ... meer pillars (totaal ${pillarCount})
  ]
}

Genereer nu de complete topical authority map met ${pillarCount} pillars en ${clusterCount} clusters.`;
}

/**
 * Clean AI response to extract JSON
 */
function cleanAIResponse(content: string): string {
  content = content.trim();
  
  // Remove markdown code blocks
  if (content.startsWith('```json')) {
    content = content.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (content.startsWith('```')) {
    content = content.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
  }
  
  // Try to find JSON object in the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    content = jsonMatch[0];
  }
  
  return content;
}

/**
 * Generate a single blog article from a topical map article
 */
export async function generateArticleContent(
  article: TopicalMapArticle,
  mapConfig: TopicalMapConfig,
  parentPillar?: PillarArticle
): Promise<{ title: string; content: string; excerpt: string }> {
  const prompt = `Schrijf een complete blog post voor:

ARTIKEL INFO:
- Type: ${article.type === 'pillar' ? 'PILLAR PAGE (hoofdonderwerp)' : 'CLUSTER ARTIKEL (ondersteunend)'}
- Titel: ${article.title}
- Primary keyword: ${article.primaryKeyword}
- Secondary keywords: ${article.secondaryKeywords.join(', ')}
- Content type: ${article.contentType}
- Doelgroep: ${mapConfig.targetAudience}
- Niche: ${mapConfig.niche}
- Taal: ${mapConfig.language}
- Tone: ${mapConfig.tone}
- Woordenaantal: ${article.wordCount}
- Difficulty level: ${article.difficultyLevel}
${parentPillar ? `- Parent pillar: ${parentPillar.title}` : ''}

VEREISTEN:
- Schrijf ${article.wordCount} woorden
- Gebruik de tone: ${mapConfig.tone}
- Optimaliseer voor SEO met primary en secondary keywords
- Maak het ${article.difficultyLevel} niveau geschikt
- Gebruik koppen (H2, H3) voor structuur
- Voeg praktische voorbeelden toe
- Sluit af met een conclusie en CTA
${parentPillar ? `- Link conceptueel naar de parent pillar "${parentPillar.title}"` : ''}

FORMAT:
Retourneer ALLEEN een JSON object met deze structuur:
{
  "title": "SEO-geoptimaliseerde titel",
  "content": "Volledige artikel content in HTML format met <h2>, <h3>, <p>, <ul>, etc.",
  "excerpt": "Korte samenvatting van 2-3 zinnen voor preview"
}

Genereer nu het artikel.`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'claude-4',
    temperature: 0.7,
    max_tokens: 8000,
  });

  let aiContent = response.choices[0]?.message?.content || '';
  aiContent = cleanAIResponse(aiContent);

  try {
    const parsed = JSON.parse(aiContent);
    
    if (!parsed.title || !parsed.content || !parsed.excerpt) {
      throw new Error('Missing required fields in AI response');
    }

    return parsed;
  } catch (error: any) {
    console.error('[Topical Authority AI] Failed to parse article content:', error);
    throw new Error(`Failed to generate article content: ${error.message}`);
  }
}
