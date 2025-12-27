import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DataForSEO API integration
async function getDataForSEOKeywords(
  seedKeywords: string[],
  locationCode: number = 2528,
  languageCode: string = 'nl'
): Promise<any[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) {
    console.warn('DataForSEO credentials not configured, skipping keyword enrichment');
    return [];
  }
  
  const credentials = Buffer.from(`${login}:${password}`).toString('base64');
  
  try {
    const response = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live',
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{
          keywords: seedKeywords.slice(0, 20),
          location_code: locationCode,
          language_code: languageCode,
          sort_by: 'search_volume',
        }]),
      }
    );

    if (!response.ok) {
      console.error('DataForSEO API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.tasks?.[0]?.result || [];
  } catch (error) {
    console.error('DataForSEO fetch error:', error);
    return [];
  }
}

// Content cluster structure
interface ContentCluster {
  pillarTopic: string;
  pillarTitle: string;
  pillarDescription: string;
  pillarKeywords: string[];
  supportingContent: Array<{
    title: string;
    description: string;
    keywords: string[];
    searchVolume?: number;
    competition?: string;
    contentType: 'how-to' | 'guide' | 'comparison' | 'list' | 'case-study' | 'faq' | 'news';
  }>;
}

export async function POST(request: Request) {
  try {
    const { website_url, target_count = 500 } = await request.json();

    if (!website_url) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Get current date dynamically
    const now = new Date();
    const currentMonth = now.toLocaleString('nl-NL', { month: 'long' });
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    // Step 1: AI analyzes website to detect niche and main topics
    const nichePrompt = `Analyseer deze website URL en bepaal:
1. De hoofdniche (max 5 woorden)
2. 10 hoofd-onderwerpen/pillar topics binnen deze niche
3. De primaire taal van de doelgroep

Website: ${website_url}

Output als JSON (geen markdown):
{
  "niche": "Hoofd niche",
  "language": "nl",
  "pillarTopics": [
    "Pillar topic 1",
    "Pillar topic 2",
    ...
  ]
}`;

    let nicheData = {
      niche: 'SEO & Content Marketing',
      language: 'nl',
      pillarTopics: ['SEO Basics', 'Content Strategy', 'Keyword Research', 'Link Building', 'Technical SEO']
    };
    
    try {
      const nicheResponse = await generateAICompletion({
        task: 'quick',
        systemPrompt: 'Je bent een expert in het identificeren van website niches en content strategie. Geef alleen valide JSON terug.',
        userPrompt: nichePrompt,
        maxTokens: 500,
        temperature: 0.5,
      });
      
      // Parse JSON response
      const jsonMatch = nicheResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nicheData = JSON.parse(jsonMatch[0]);
      }
    } catch (nicheError) {
      console.warn('Niche detection failed, using default:', nicheError);
    }

    // Step 2: Generate comprehensive topical authority clusters
    const clusters: ContentCluster[] = [];
    const allArticles: any[] = [];
    
    // Calculate how many articles per pillar topic
    const pillarCount = nicheData.pillarTopics.length || 5;
    const articlesPerPillar = Math.ceil(target_count / pillarCount);
    
    // Generate content clusters for each pillar topic
    for (const pillarTopic of nicheData.pillarTopics.slice(0, 10)) {
      const clusterPrompt = `Huidige datum: ${currentMonth} ${currentYear}

Genereer een COMPLETE topical authority cluster voor: "${pillarTopic}"
Niche: ${nicheData.niche}
Website: ${website_url}

Maak een uitgebreide lijst van ${articlesPerPillar} artikel ideeën die VOLLEDIGE topical authority opbouwen.

CLUSTER STRUCTUUR:
1. 1 Pillar Page (uitgebreide 5000+ woorden gids)
2. ${Math.floor(articlesPerPillar * 0.3)} How-to Guides (praktische handleidingen)
3. ${Math.floor(articlesPerPillar * 0.2)} Vergelijkingen & Reviews
4. ${Math.floor(articlesPerPillar * 0.2)} Lijstartikelen (Top 10, Best X)
5. ${Math.floor(articlesPerPillar * 0.15)} FAQ & Beginner content
6. ${Math.floor(articlesPerPillar * 0.1)} Case Studies & Voorbeelden
7. ${Math.floor(articlesPerPillar * 0.05)} Nieuws & Trends ${currentYear}-${nextYear}

KEYWORD VARIATIES (genereer voor elk artikel):
- Exacte match keywords
- Long-tail variaties
- Vraag-gebaseerde keywords (hoe, wat, waarom, wanneer)
- Vergelijkende keywords (vs, beste, top, review)
- Lokale variaties (Nederland, België)
- Intent variaties (kopen, leren, vergelijken)

BELANGRIJK:
- Focus op ${currentYear}-${nextYear} relevantie
- Elk artikel moet uniek zijn (geen duplicaten)
- Varieer in zoekintent (informational, commercial, transactional)
- Denk aan alle fases van de customer journey
- Include long-tail keywords met lage concurrentie

Output als JSON (ALLEEN de array, geen markdown):
{
  "pillarTitle": "Uitgebreide titel voor pillar page",
  "pillarDescription": "Beschrijving van de pillar page",
  "pillarKeywords": ["keyword1", "keyword2", "keyword3"],
  "supportingContent": [
    {
      "title": "Artikel titel met keyword",
      "description": "Korte beschrijving",
      "keywords": ["keyword1", "keyword2"],
      "contentType": "how-to|guide|comparison|list|case-study|faq|news",
      "searchIntent": "informational|commercial|transactional|navigational"
    }
  ]
}`;

      try {
        const clusterResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `Je bent een SEO content strategist gespecialiseerd in topical authority. 
Genereer uitgebreide content clusters met ${articlesPerPillar} unieke artikel ideeën.
Output alleen valide JSON zonder markdown formatting.`,
          userPrompt: clusterPrompt,
          maxTokens: 8000,
          temperature: 0.8,
        });

        // Parse cluster JSON
        let cluster: any = null;
        try {
          const jsonMatch = clusterResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            cluster = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.error('Cluster parse error for', pillarTopic);
        }

        if (cluster && cluster.supportingContent) {
          clusters.push({
            pillarTopic,
            pillarTitle: cluster.pillarTitle || `${pillarTopic}: Complete Gids ${nextYear}`,
            pillarDescription: cluster.pillarDescription || `Alles wat je moet weten over ${pillarTopic}`,
            pillarKeywords: cluster.pillarKeywords || [pillarTopic.toLowerCase()],
            supportingContent: cluster.supportingContent,
          });

          // Add pillar page to articles
          allArticles.push({
            title: cluster.pillarTitle || `${pillarTopic}: Complete Gids ${nextYear}`,
            category: pillarTopic,
            description: cluster.pillarDescription,
            keywords: cluster.pillarKeywords,
            contentType: 'pillar',
            cluster: pillarTopic,
            priority: 'high',
          });

          // Add supporting content
          for (const article of cluster.supportingContent) {
            allArticles.push({
              title: article.title,
              category: pillarTopic,
              description: article.description,
              keywords: article.keywords || [],
              contentType: article.contentType || 'guide',
              searchIntent: article.searchIntent || 'informational',
              cluster: pillarTopic,
              priority: article.contentType === 'how-to' ? 'high' : 'medium',
            });
          }
        }
      } catch (clusterError) {
        console.error('Cluster generation error for', pillarTopic, clusterError);
      }
    }

    // Step 3: Enrich with DataForSEO data if available
    let enrichedArticles = allArticles;
    
    if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) {
      try {
        // Get seed keywords from pillar topics
        const seedKeywords = nicheData.pillarTopics.slice(0, 20);
        const dataForSEOResults = await getDataForSEOKeywords(seedKeywords);
        
        if (dataForSEOResults.length > 0) {
          // Create a map of keyword data
          const keywordDataMap = new Map();
          for (const kw of dataForSEOResults) {
            keywordDataMap.set(kw.keyword?.toLowerCase(), {
              searchVolume: kw.search_volume,
              competition: kw.competition,
              competitionIndex: kw.competition_index,
              cpc: kw.cpc,
            });
          }

          // Enrich articles with search volume data
          enrichedArticles = allArticles.map(article => {
            const primaryKeyword = article.keywords?.[0]?.toLowerCase();
            const kwData = keywordDataMap.get(primaryKeyword);
            
            return {
              ...article,
              searchVolume: kwData?.searchVolume || null,
              competition: kwData?.competition || null,
              competitionIndex: kwData?.competitionIndex || null,
              cpc: kwData?.cpc || null,
            };
          });

          // Sort by search volume (high volume first) and competition (low first)
          enrichedArticles.sort((a, b) => {
            // Pillar pages first
            if (a.contentType === 'pillar' && b.contentType !== 'pillar') return -1;
            if (b.contentType === 'pillar' && a.contentType !== 'pillar') return 1;
            
            // Then by search volume
            const volA = a.searchVolume || 0;
            const volB = b.searchVolume || 0;
            if (volB !== volA) return volB - volA;
            
            // Then by competition (lower is better)
            const compA = a.competitionIndex || 50;
            const compB = b.competitionIndex || 50;
            return compA - compB;
          });
        }
      } catch (dataForSEOError) {
        console.warn('DataForSEO enrichment failed:', dataForSEOError);
      }
    }

    // Step 4: Generate additional long-tail variations if needed
    if (enrichedArticles.length < target_count) {
      const additionalNeeded = target_count - enrichedArticles.length;
      const additionalArticles = await generateLongTailVariations(
        nicheData.niche,
        nicheData.pillarTopics,
        additionalNeeded,
        currentYear,
        nextYear
      );
      enrichedArticles = [...enrichedArticles, ...additionalArticles];
    }

    // Step 5: Deduplicate and limit to target count
    const uniqueArticles = deduplicateArticles(enrichedArticles).slice(0, target_count);

    // Calculate statistics
    const stats = {
      totalArticles: uniqueArticles.length,
      pillarPages: uniqueArticles.filter(a => a.contentType === 'pillar').length,
      clusters: clusters.length,
      byContentType: {
        pillar: uniqueArticles.filter(a => a.contentType === 'pillar').length,
        'how-to': uniqueArticles.filter(a => a.contentType === 'how-to').length,
        guide: uniqueArticles.filter(a => a.contentType === 'guide').length,
        comparison: uniqueArticles.filter(a => a.contentType === 'comparison').length,
        list: uniqueArticles.filter(a => a.contentType === 'list').length,
        'case-study': uniqueArticles.filter(a => a.contentType === 'case-study').length,
        faq: uniqueArticles.filter(a => a.contentType === 'faq').length,
        news: uniqueArticles.filter(a => a.contentType === 'news').length,
      },
      dataForSEOEnriched: enrichedArticles.some(a => a.searchVolume !== null),
    };

    return NextResponse.json({
      success: true,
      niche: nicheData.niche,
      language: nicheData.language,
      clusters: clusters.map(c => ({
        pillarTopic: c.pillarTopic,
        pillarTitle: c.pillarTitle,
        articleCount: c.supportingContent.length + 1,
      })),
      plan: uniqueArticles,
      count: uniqueArticles.length,
      stats,
    });

  } catch (error: any) {
    console.error('Content plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}

// Generate additional long-tail keyword variations
async function generateLongTailVariations(
  niche: string,
  pillarTopics: string[],
  count: number,
  currentYear: number,
  nextYear: number
): Promise<any[]> {
  const variations: any[] = [];

  // Organized modifier groups with specific content types
  const modifierGroups = {
    questions: {
      modifiers: ['hoe werkt', 'wat is', 'waarom is', 'wanneer gebruik je', 'welke zijn de beste'],
      contentType: 'faq',
      intent: 'informational',
    },
    howTo: {
      modifiers: ['hoe gebruik je', 'handleiding voor', 'stap voor stap', 'uitleg over', 'werken met'],
      contentType: 'how-to',
      intent: 'informational',
    },
    comparisons: {
      modifiers: ['vergelijken', 'verschillen tussen', 'alternatieven voor', 'versus'],
      contentType: 'comparison',
      intent: 'commercial',
    },
    lists: {
      modifiers: ['top 10', 'beste', '5 tips voor', 'voorbeelden van', 'soorten'],
      contentType: 'list',
      intent: 'informational',
    },
    buying: {
      modifiers: ['kopen', 'prijs van', 'waar te koop', 'goedkope', 'aanbiedingen'],
      contentType: 'guide',
      intent: 'commercial',
    },
    reviews: {
      modifiers: ['ervaringen met', 'test van', 'beoordeling van', 'voor- en nadelen'],
      contentType: 'comparison',
      intent: 'commercial',
    },
    audience: {
      modifiers: ['voor beginners', 'voor professionals', 'voor gevorderden', 'voor mkb'],
      contentType: 'guide',
      intent: 'informational',
    },
    location: {
      modifiers: ['in nederland', 'in belgie', 'nederlandse', 'belgische'],
      contentType: 'guide',
      intent: 'informational',
    },
  };

  for (const topic of pillarTopics) {
    // Skip if we already have enough variations
    if (variations.length >= count) break;

    // Generate variations for each modifier group
    for (const [groupName, group] of Object.entries(modifierGroups)) {
      if (variations.length >= count) break;

      for (const modifier of group.modifiers) {
        if (variations.length >= count) break;

        // Clean the topic to avoid duplicates
        const cleanTopic = topic.toLowerCase();

        // Skip if modifier words already exist in topic (avoid duplicates)
        const modifierWords = modifier.toLowerCase().split(' ');
        const topicWords = cleanTopic.split(' ');
        const hasDuplicate = modifierWords.some(word =>
          word.length > 3 && topicWords.includes(word)
        );

        if (hasDuplicate) continue;

        // Generate contextual title based on modifier type
        const title = generateContextualTitle(topic, modifier, groupName, nextYear);

        // Validate title is meaningful
        if (!isValidTitle(title)) continue;

        variations.push({
          title,
          category: topic,
          description: generateContextualDescription(title, topic, modifier, groupName),
          keywords: generateRelevantKeywords(topic, modifier, groupName),
          contentType: group.contentType,
          searchIntent: group.intent,
          cluster: topic,
          priority: groupName === 'howTo' || groupName === 'reviews' ? 'medium' : 'low',
          generated: 'long-tail-expansion',
        });
      }
    }
  }

  return variations.slice(0, count);
}

function generateContextualTitle(topic: string, modifier: string, groupName: string, nextYear: number): string {
  const templates: Record<string, string[]> = {
    questions: [
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}?`,
      `${topic}: ${modifier}`,
    ],
    howTo: [
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}`,
      `${topic}: ${modifier}`,
    ],
    comparisons: [
      `${topic} ${modifier}`,
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)}: ${topic}`,
    ],
    lists: [
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}`,
      `${topic}: ${modifier}`,
    ],
    buying: [
      `${topic} ${modifier}`,
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)}: ${topic}`,
    ],
    reviews: [
      `${topic}: ${modifier}`,
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}`,
    ],
    audience: [
      `${topic} ${modifier}`,
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)}: ${topic}`,
    ],
    location: [
      `${topic} ${modifier}`,
      `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}`,
    ],
  };

  const templateList = templates[groupName] || templates.questions;
  const template = templateList[Math.floor(Math.random() * templateList.length)];

  return template;
}

function generateContextualDescription(title: string, topic: string, modifier: string, groupName: string): string {
  const descriptions: Record<string, string> = {
    questions: `Ontdek het antwoord op veel gestelde vragen over ${topic.toLowerCase()}. Compleet overzicht met praktische informatie.`,
    howTo: `Praktische handleiding voor ${topic.toLowerCase()}. Stap voor stap uitleg met voorbeelden en tips.`,
    comparisons: `Vergelijk verschillende opties en ontdek de verschillen. Objectief overzicht van ${topic.toLowerCase()}.`,
    lists: `Overzichtelijke lijst met de beste opties, tips en voorbeelden voor ${topic.toLowerCase()}.`,
    buying: `Koopgids voor ${topic.toLowerCase()}. Prijzen, aanbieders en waar je het beste kunt kopen.`,
    reviews: `Onafhankelijke reviews en ervaringen met ${topic.toLowerCase()}. Voor- en nadelen op een rij.`,
    audience: `Toegespitste informatie over ${topic.toLowerCase()} voor jouw doelgroep. Praktische tips en advies.`,
    location: `Alles wat je moet weten over ${topic.toLowerCase()} specifiek voor de Nederlandse markt.`,
  };

  return descriptions[groupName] || `Uitgebreide informatie over ${topic.toLowerCase()}.`;
}

function generateRelevantKeywords(topic: string, modifier: string, groupName: string): string[] {
  const keywords: string[] = [];
  const cleanTopic = topic.toLowerCase();
  const cleanModifier = modifier.toLowerCase();

  // Primary keyword: combination of topic and modifier
  keywords.push(`${cleanTopic} ${cleanModifier}`.trim());

  // Secondary: topic alone
  keywords.push(cleanTopic);

  // Tertiary: related variations based on group
  const variations: Record<string, string[]> = {
    questions: [`${cleanTopic} vraag`, `${cleanTopic} antwoord`],
    howTo: [`${cleanTopic} tutorial`, `${cleanTopic} gids`],
    comparisons: [`${cleanTopic} vergelijking`, `${cleanTopic} verschillen`],
    lists: [`beste ${cleanTopic}`, `top ${cleanTopic}`],
    buying: [`${cleanTopic} kopen`, `${cleanTopic} prijs`],
    reviews: [`${cleanTopic} review`, `${cleanTopic} ervaringen`],
    audience: [cleanTopic],
    location: [`${cleanTopic} nederland`],
  };

  const groupVariations = variations[groupName] || [];
  keywords.push(...groupVariations.slice(0, 2));

  return keywords.filter((kw, idx) => keywords.indexOf(kw) === idx).slice(0, 5);
}

function isValidTitle(title: string): boolean {
  // Check for duplicate words (case insensitive)
  const words = title.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words.filter(w => w.length > 3)); // Only check words longer than 3 chars

  // If there are significant duplicates, it's invalid
  const significantWords = words.filter(w => w.length > 3);
  if (significantWords.length > uniqueWords.size) {
    return false;
  }

  // Check minimum length
  if (title.length < 10) {
    return false;
  }

  // Check it doesn't have too many special characters
  const specialCharCount = (title.match(/[^a-zA-Z0-9\s\-:?]/g) || []).length;
  if (specialCharCount > 3) {
    return false;
  }

  return true;
}

function generateVariationTitle(topic: string, modifier: string, currentYear: number, nextYear: number): string {
  // This function is kept for backward compatibility but should not be used
  return generateContextualTitle(topic, modifier, 'questions', nextYear);
}

function getSearchIntent(modifier: string): string {
  const commercialModifiers = ['kopen', 'prijs', 'kosten', 'goedkoop', 'beste', 'top', 'review'];
  const transactionalModifiers = ['download', 'gratis', 'template', 'tool'];
  
  if (commercialModifiers.some(m => modifier.includes(m))) return 'commercial';
  if (transactionalModifiers.some(m => modifier.includes(m))) return 'transactional';
  return 'informational';
}

function deduplicateArticles(articles: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  
  for (const article of articles) {
    // Create a normalized key from the title
    const key = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(article);
    }
  }
  
  return unique;
}
