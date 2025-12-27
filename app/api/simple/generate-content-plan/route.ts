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

Maak een uitgebreide lijst van ${articlesPerPillar} SPECIFIEKE en WAARDEVOLLE artikel ideeën.

❌ NIET GENERIEK zoals:
- "Wat is ${pillarTopic}?"
- "Ervaringen met ${pillarTopic}"
- "Test ${pillarTopic}"
- "Review ${pillarTopic}"

✅ WEL SPECIFIEK zoals:
- "Hoe kies je de beste ${pillarTopic} voor beginners in 2025?"
- "5 Veelgemaakte fouten bij ${pillarTopic} en hoe je ze vermijdt"
- "${pillarTopic} A vs B: Welke past bij jouw situatie?"
- "Stap-voor-stap: ${pillarTopic} implementeren in 30 dagen"

CLUSTER STRUCTUUR:
1. 1 Pillar Page - Compleet overzicht met alle aspecten
2. ${Math.floor(articlesPerPillar * 0.3)} How-to Guides - Praktische stap-voor-stap handleidingen
3. ${Math.floor(articlesPerPillar * 0.2)} Vergelijkingen - Specifieke A vs B vergelijkingen
4. ${Math.floor(articlesPerPillar * 0.2)} Lijstartikelen - Concrete tips, tools, voorbeelden
5. ${Math.floor(articlesPerPillar * 0.15)} Probleemoplossing - Veelvoorkomende problemen en oplossingen
6. ${Math.floor(articlesPerPillar * 0.1)} Case Studies - Concrete voorbeelden en succesverhalen
7. ${Math.floor(articlesPerPillar * 0.05)} Trends & Updates - Actuele ontwikkelingen ${currentYear}-${nextYear}

EISEN PER ARTIKEL:
1. Specifieke doelgroep (beginners/gevorderden/professionals/bedrijven)
2. Duidelijke waardepropositie (wat leert de lezer?)
3. Concreet en actionable (geen vage titels)
4. Unieke hoek of perspectief
5. Zoekbaar en relevant voor ${currentYear}

VOORBEELDEN VAN GOEDE TITELS:
- "7 Manieren om [specifiek probleem] op te lossen met ${pillarTopic}"
- "Complete Gids: ${pillarTopic} voor [doelgroep] - Van Start tot Expert"
- "${pillarTopic} Kosten in Nederland: Wat betaal je echt in 2025?"
- "[Tool/Methode A] vs [Tool/Methode B]: Welke is beter voor ${pillarTopic}?"
- "Fouten die iedereen maakt met ${pillarTopic} (en hoe je ze voorkomt)"

VARIEER IN:
- Doelgroep (beginners, gevorderden, professionals, specifieke sectoren)
- Probleem/oplossing focus
- Vergelijkingen (A vs B, voor vs nadelen, oude vs nieuwe methode)
- Tijdframe (2025, toekomst, trends)
- Gebruik specifieke getallen (5 tips, 10 voorbeelden, 3 stappen)

Output als JSON (ALLEEN de object, geen markdown):
{
  "pillarTitle": "Specifieke titel met waarde propositie",
  "pillarDescription": "Wat de lezer precies leert en waarom het waardevol is",
  "pillarKeywords": ["hoofdkeyword", "long-tail variant", "vraag-gebaseerd"],
  "focusKeyword": "primair zoekwoord voor dit artikel (2-4 woorden)",
  "supportingContent": [
    {
      "title": "Specifieke, actionable titel met duidelijke waarde",
      "description": "Concrete beschrijving wat de lezer leert",
      "keywords": ["specifiek keyword", "long-tail variant"],
      "focusKeyword": "primair zoekwoord (2-4 woorden)",
      "contentType": "how-to|guide|comparison|list|case-study|faq|news",
      "searchIntent": "informational|commercial|transactional"
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
            focusKeyword: cluster.focusKeyword || cluster.pillarKeywords?.[0] || pillarTopic.toLowerCase(),
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
              focusKeyword: article.focusKeyword || article.keywords?.[0] || pillarTopic.toLowerCase(),
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

// Generate additional specific, valuable content ideas
async function generateLongTailVariations(
  niche: string,
  pillarTopics: string[],
  count: number,
  currentYear: number,
  nextYear: number
): Promise<any[]> {
  const variations: any[] = [];

  // Specific content templates that create valuable, actionable articles
  const contentTemplates = [
    // Problem-solving templates
    {
      template: (topic: string) => `${getNumber()} Veelgemaakte fouten bij ${topic} (en hoe je ze vermijdt)`,
      contentType: 'list',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} fouten`, `${topic} problemen`, `${topic} vermijden`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} fouten`,
    },
    {
      template: (topic: string) => `Hoe los je ${getCommonProblem()} op met ${topic}?`,
      contentType: 'how-to',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} oplossing`, `${topic} probleem`, `hoe ${topic}`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} oplossing`,
    },

    // Comparison templates
    {
      template: (topic: string) => `${topic} voor beginners vs gevorderden: Wat zijn de verschillen?`,
      contentType: 'comparison',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} vergelijking`, `${topic} beginners`, `${topic} gevorderden`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} vergelijking`,
    },
    {
      template: (topic: string) => `Gratis vs Betaald ${topic}: Waar moet je op letten?`,
      contentType: 'comparison',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} gratis`, `${topic} betaald`, `${topic} kosten`],
      focusKeyword: (topic: string) => `gratis ${topic.toLowerCase()}`,
    },

    // How-to templates
    {
      template: (topic: string) => `Stap-voor-stap: ${topic} implementeren in ${getTimeframe()} dagen`,
      contentType: 'how-to',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} implementeren`, `${topic} stappen`, `${topic} handleiding`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} implementeren`,
    },
    {
      template: (topic: string) => `Complete ${topic} checklist voor ${getAudience()} in ${nextYear}`,
      contentType: 'guide',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} checklist`, `${topic} ${nextYear}`, `${topic} gids`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} checklist`,
    },

    // List templates
    {
      template: (topic: string) => `Top ${getNumber()} ${topic} tools die je moet kennen in ${nextYear}`,
      contentType: 'list',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} tools`, `beste ${topic}`, `${topic} ${nextYear}`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} tools`,
    },
    {
      template: (topic: string) => `${getNumber()} Manieren om ${getTopic(topic)} te verbeteren met ${topic}`,
      contentType: 'list',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} tips`, `${topic} verbeteren`, `${topic} technieken`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} tips`,
    },

    // Buying guides
    {
      template: (topic: string) => `${topic} kosten in Nederland: Complete prijsoverzicht ${nextYear}`,
      contentType: 'guide',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} kosten`, `${topic} prijs`, `${topic} nederland`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} kosten`,
    },
    {
      template: (topic: string) => `Waar koop je de beste ${topic} voor ${getAudience()}?`,
      contentType: 'guide',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} kopen`, `beste ${topic}`, `${topic} aanbieding`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} kopen`,
    },

    // Audience-specific templates
    {
      template: (topic: string) => `${topic} voor ${getAudience()}: Complete gids van start tot expert`,
      contentType: 'guide',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} ${getAudience()}`, `${topic} gids`, `${topic} leren`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} gids`,
    },
    {
      template: (topic: string) => `Welke ${topic} past het beste bij ${getAudience()}?`,
      contentType: 'comparison',
      intent: 'commercial',
      keywords: (topic: string) => [`${topic} kiezen`, `${topic} advies`, `${topic} ${getAudience()}`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} kiezen`,
    },

    // Trend/update templates
    {
      template: (topic: string) => `${topic} trends in ${nextYear}: Wat moet je weten?`,
      contentType: 'news',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} trends`, `${topic} ${nextYear}`, `${topic} toekomst`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} trends ${nextYear}`,
    },
    {
      template: (topic: string) => `Nieuwe ontwikkelingen in ${topic}: ${nextYear} update`,
      contentType: 'news',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} nieuw`, `${topic} ${nextYear}`, `${topic} ontwikkelingen`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} ${nextYear}`,
    },

    // Case study templates
    {
      template: (topic: string) => `Case study: Hoe ${getCompany()} ${getResult()} behaalde met ${topic}`,
      contentType: 'case-study',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} case study`, `${topic} succesverhaal`, `${topic} voorbeeld`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} case study`,
    },

    // FAQ templates
    {
      template: (topic: string) => `${getNumber()} Meestgestelde vragen over ${topic} beantwoord`,
      contentType: 'faq',
      intent: 'informational',
      keywords: (topic: string) => [`${topic} vragen`, `${topic} antwoorden`, `${topic} faq`],
      focusKeyword: (topic: string) => `${topic.toLowerCase()} vragen`,
    },
  ];

  // Generate variations using templates
  for (const topic of pillarTopics) {
    if (variations.length >= count) break;

    // Use each template multiple times with different random values
    for (const templateObj of contentTemplates) {
      if (variations.length >= count) break;

      const title = templateObj.template(topic);
      const description = generateValueDescription(title, topic, templateObj.contentType);
      const keywords = templateObj.keywords(topic);
      const focusKeyword = templateObj.focusKeyword(topic);

      // Validate title is meaningful
      if (!isValidTitle(title)) continue;

      variations.push({
        title,
        category: topic,
        description,
        keywords,
        focusKeyword,
        contentType: templateObj.contentType,
        searchIntent: templateObj.intent,
        cluster: topic,
        priority: templateObj.contentType === 'how-to' || templateObj.contentType === 'case-study' ? 'medium' : 'low',
        generated: 'specific-content-expansion',
      });
    }
  }

  return variations.slice(0, count);
}

// Helper functions for generating specific content
function getNumber(): number {
  const numbers = [3, 5, 7, 10, 12, 15];
  return numbers[Math.floor(Math.random() * numbers.length)];
}

function getTimeframe(): number {
  const timeframes = [7, 14, 30, 60, 90];
  return timeframes[Math.floor(Math.random() * timeframes.length)];
}

function getAudience(): string {
  const audiences = [
    'beginners',
    'gevorderden',
    'professionals',
    'kleine bedrijven',
    'mkb',
    'startups',
    'ondernemers',
    'studenten',
  ];
  return audiences[Math.floor(Math.random() * audiences.length)];
}

function getCommonProblem(): string {
  const problems = [
    'weinig tijd',
    'een beperkt budget',
    'geen ervaring',
    'complexe situaties',
    'veel concurrentie',
    'technische uitdagingen',
  ];
  return problems[Math.floor(Math.random() * problems.length)];
}

function getTopic(baseTopic: string): string {
  const topics = [
    'resultaten',
    'efficiency',
    'productiviteit',
    'kwaliteit',
    'conversies',
    'bereik',
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

function getCompany(): string {
  const companies = [
    'een Nederlands bedrijf',
    'startup X',
    'dit mkb-bedrijf',
    'deze organisatie',
    'ondernemer Y',
  ];
  return companies[Math.floor(Math.random() * companies.length)];
}

function getResult(): string {
  const results = [
    '200% groei',
    'succesvol',
    'snelle resultaten',
    'aanzienlijke verbetering',
    'meetbaar succes',
  ];
  return results[Math.floor(Math.random() * results.length)];
}

function generateValueDescription(title: string, topic: string, contentType: string): string {
  const descriptions: Record<string, string> = {
    'how-to': `Leer precies hoe je ${topic.toLowerCase()} succesvol toepast. Praktische stappen met concrete voorbeelden en direct toepasbare tips.`,
    'guide': `Uitgebreide gids over ${topic.toLowerCase()} met alle informatie die je nodig hebt. Van basics tot geavanceerde strategieën.`,
    'comparison': `Objectieve vergelijking van verschillende opties voor ${topic.toLowerCase()}. Ontdek welke het beste bij jouw situatie past.`,
    'list': `Handige lijst met de beste opties, tools en tips voor ${topic.toLowerCase()}. Bespaar tijd met deze gecureerde selectie.`,
    'case-study': `Concrete voorbeelden en succesverhalen over ${topic.toLowerCase()}. Leer van echte ervaringen en bewezen resultaten.`,
    'faq': `Antwoorden op alle belangrijke vragen over ${topic.toLowerCase()}. Helder en begrijpelijk uitgelegd.`,
    'news': `Blijf up-to-date met de laatste ontwikkelingen in ${topic.toLowerCase()}. Wat betekent dit voor jou?`,
  };

  return descriptions[contentType] || `Waardevolle informatie over ${topic.toLowerCase()} die je direct kunt toepassen.`;
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
