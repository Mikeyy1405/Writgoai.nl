import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Language configuration
const LANGUAGE_CONFIG: Record<string, {
  name: string;
  locationCode: number;
  modifiers: string[];
  templates: string[];
}> = {
  nl: {
    name: 'Nederlands',
    locationCode: 2528,
    modifiers: [
      'hoe', 'wat is', 'waarom', 'wanneer', 'welke', 'hoeveel',
      'vs', 'versus', 'of', 'beste', 'top 10', 'top 5', 'vergelijking',
      'kopen', 'gratis', 'goedkoop', 'premium', 'review', 'ervaringen', 'kosten', 'prijzen',
      'beginners', 'gevorderden', 'professionals', 'bedrijven', 'mkb', 'starters',
      'tips', 'handleiding', 'checklist', 'template', 'voorbeeld', 'stappenplan',
      'problemen', 'oplossingen', 'fouten', 'vermijden', 'verbeteren', 'optimaliseren',
    ],
    templates: [
      '{modifier} {topic}?',
      '{topic}: {modifier} handleiding',
      '{modifier} {topic} in {year}',
      'De {modifier} van {topic}',
      '{topic} {modifier}: complete gids',
      'Alles over {topic} {modifier}',
      '{topic} voor {modifier}',
      '{modifier}: {topic} uitgelegd',
    ],
  },
  en: {
    name: 'English',
    locationCode: 2840,
    modifiers: [
      'how to', 'what is', 'why', 'when', 'which', 'how much',
      'vs', 'versus', 'or', 'best', 'top 10', 'top 5', 'comparison',
      'buy', 'free', 'cheap', 'premium', 'review', 'reviews', 'cost', 'pricing',
      'beginners', 'advanced', 'professionals', 'business', 'enterprise', 'startups',
      'tips', 'guide', 'checklist', 'template', 'example', 'step by step',
      'problems', 'solutions', 'mistakes', 'avoid', 'improve', 'optimize',
    ],
    templates: [
      '{modifier} {topic}?',
      '{topic}: {modifier} guide',
      '{modifier} {topic} in {year}',
      'The {modifier} of {topic}',
      '{topic} {modifier}: complete guide',
      'Everything about {topic} {modifier}',
      '{topic} for {modifier}',
      '{modifier}: {topic} explained',
    ],
  },
  de: {
    name: 'Deutsch',
    locationCode: 2276,
    modifiers: [
      'wie', 'was ist', 'warum', 'wann', 'welche', 'wie viel',
      'vs', 'versus', 'oder', 'beste', 'top 10', 'top 5', 'vergleich',
      'kaufen', 'kostenlos', 'günstig', 'premium', 'bewertung', 'erfahrungen', 'kosten', 'preise',
      'anfänger', 'fortgeschrittene', 'profis', 'unternehmen', 'kmu', 'gründer',
      'tipps', 'anleitung', 'checkliste', 'vorlage', 'beispiel', 'schritt für schritt',
      'probleme', 'lösungen', 'fehler', 'vermeiden', 'verbessern', 'optimieren',
    ],
    templates: [
      '{modifier} {topic}?',
      '{topic}: {modifier} Anleitung',
      '{modifier} {topic} in {year}',
      'Die {modifier} von {topic}',
      '{topic} {modifier}: Kompletter Leitfaden',
      'Alles über {topic} {modifier}',
      '{topic} für {modifier}',
      '{modifier}: {topic} erklärt',
    ],
  },
  fr: {
    name: 'Français',
    locationCode: 2250,
    modifiers: [
      'comment', 'qu\'est-ce que', 'pourquoi', 'quand', 'quel', 'combien',
      'vs', 'versus', 'ou', 'meilleur', 'top 10', 'top 5', 'comparaison',
      'acheter', 'gratuit', 'pas cher', 'premium', 'avis', 'expériences', 'coût', 'prix',
      'débutants', 'avancés', 'professionnels', 'entreprises', 'pme', 'startups',
      'conseils', 'guide', 'checklist', 'modèle', 'exemple', 'étape par étape',
      'problèmes', 'solutions', 'erreurs', 'éviter', 'améliorer', 'optimiser',
    ],
    templates: [
      '{modifier} {topic}?',
      '{topic}: guide {modifier}',
      '{modifier} {topic} en {year}',
      'Le {modifier} de {topic}',
      '{topic} {modifier}: guide complet',
      'Tout sur {topic} {modifier}',
      '{topic} pour {modifier}',
      '{modifier}: {topic} expliqué',
    ],
  },
  es: {
    name: 'Español',
    locationCode: 2724,
    modifiers: [
      'cómo', 'qué es', 'por qué', 'cuándo', 'cuál', 'cuánto',
      'vs', 'versus', 'o', 'mejor', 'top 10', 'top 5', 'comparación',
      'comprar', 'gratis', 'barato', 'premium', 'reseña', 'opiniones', 'costo', 'precios',
      'principiantes', 'avanzados', 'profesionales', 'empresas', 'pymes', 'startups',
      'consejos', 'guía', 'checklist', 'plantilla', 'ejemplo', 'paso a paso',
      'problemas', 'soluciones', 'errores', 'evitar', 'mejorar', 'optimizar',
    ],
    templates: [
      '¿{modifier} {topic}?',
      '{topic}: guía {modifier}',
      '{modifier} {topic} en {year}',
      'El {modifier} de {topic}',
      '{topic} {modifier}: guía completa',
      'Todo sobre {topic} {modifier}',
      '{topic} para {modifier}',
      '{modifier}: {topic} explicado',
    ],
  },
};

// DataForSEO API integration
async function getDataForSEOKeywords(
  seedKeywords: string[],
  locationCode: number = 2528,
  languageCode: string = 'nl'
): Promise<any[]> {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  
  if (!login || !password) return [];
  
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

    if (!response.ok) return [];
    const data = await response.json();
    return data.tasks?.[0]?.result || [];
  } catch {
    return [];
  }
}

// Detect website language
async function detectWebsiteLanguage(websiteUrl: string): Promise<{ language: string; languageName: string }> {
  try {
    // Try to fetch the website and detect language from HTML
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Check HTML lang attribute
      const langMatch = html.match(/<html[^>]*lang=["']([a-z]{2})/i);
      if (langMatch) {
        const lang = langMatch[1].toLowerCase();
        if (LANGUAGE_CONFIG[lang]) {
          return { language: lang, languageName: LANGUAGE_CONFIG[lang].name };
        }
      }
      
      // Check meta content-language
      const metaLangMatch = html.match(/<meta[^>]*content=["']([a-z]{2})/i);
      if (metaLangMatch) {
        const lang = metaLangMatch[1].toLowerCase();
        if (LANGUAGE_CONFIG[lang]) {
          return { language: lang, languageName: LANGUAGE_CONFIG[lang].name };
        }
      }
      
      // Check for common Dutch words
      const dutchWords = ['de', 'het', 'een', 'van', 'voor', 'met', 'zijn', 'worden', 'naar', 'ook'];
      const germanWords = ['der', 'die', 'das', 'und', 'für', 'mit', 'sind', 'werden', 'nach', 'auch'];
      const frenchWords = ['le', 'la', 'les', 'de', 'pour', 'avec', 'sont', 'être', 'vers', 'aussi'];
      const spanishWords = ['el', 'la', 'los', 'de', 'para', 'con', 'son', 'ser', 'hacia', 'también'];
      
      const lowerHtml = html.toLowerCase();
      const dutchCount = dutchWords.filter(w => lowerHtml.includes(` ${w} `)).length;
      const germanCount = germanWords.filter(w => lowerHtml.includes(` ${w} `)).length;
      const frenchCount = frenchWords.filter(w => lowerHtml.includes(` ${w} `)).length;
      const spanishCount = spanishWords.filter(w => lowerHtml.includes(` ${w} `)).length;
      
      const maxCount = Math.max(dutchCount, germanCount, frenchCount, spanishCount);
      
      if (maxCount >= 3) {
        if (dutchCount === maxCount) return { language: 'nl', languageName: 'Nederlands' };
        if (germanCount === maxCount) return { language: 'de', languageName: 'Deutsch' };
        if (frenchCount === maxCount) return { language: 'fr', languageName: 'Français' };
        if (spanishCount === maxCount) return { language: 'es', languageName: 'Español' };
      }
      
      // Check TLD
      const url = new URL(websiteUrl);
      const tld = url.hostname.split('.').pop()?.toLowerCase();
      if (tld === 'nl') return { language: 'nl', languageName: 'Nederlands' };
      if (tld === 'de' || tld === 'at' || tld === 'ch') return { language: 'de', languageName: 'Deutsch' };
      if (tld === 'fr') return { language: 'fr', languageName: 'Français' };
      if (tld === 'es') return { language: 'es', languageName: 'Español' };
    }
  } catch (e) {
    console.warn('Language detection failed:', e);
  }
  
  // Fallback: check TLD if HTML fetch failed
  try {
    const url = new URL(websiteUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname.endsWith('.nl')) {
      return { language: 'nl', languageName: 'Nederlands' };
    }
    if (hostname.endsWith('.de')) {
      return { language: 'de', languageName: 'Deutsch' };
    }
    if (hostname.endsWith('.fr')) {
      return { language: 'fr', languageName: 'Français' };
    }
    if (hostname.endsWith('.es')) {
      return { language: 'es', languageName: 'Español' };
    }
  } catch {}

  return { language: 'en', languageName: 'English' };
}

export async function POST(request: Request) {
  const { website_url } = await request.json();

  if (!website_url) {
    return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;

        // ============================================
        // STEP 1: Detect language and analyze website (0-15%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 6,
          progress: 2,
          message: '🌍 Taal detecteren...',
          detail: `Analyseren van ${website_url}`,
          estimatedTime: '~2-3 minuten totaal',
        });

        // Detect website language
        const { language, languageName } = await detectWebsiteLanguage(website_url);
        const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];
        
        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 6,
          progress: 5,
          message: `🌍 Taal gedetecteerd: ${languageName}`,
          detail: `Content plan wordt in het ${languageName} gegenereerd`,
        });

        const currentMonth = now.toLocaleString(language === 'nl' ? 'nl-NL' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });

        // Language-specific prompts
        const languageInstructions: Record<string, string> = {
          nl: 'Schrijf ALLES in het Nederlands. Gebruik "je" en "jij" (informeel). Alle titels, beschrijvingen en keywords moeten in het Nederlands zijn.',
          en: 'Write EVERYTHING in English. All titles, descriptions and keywords must be in English.',
          de: 'Schreibe ALLES auf Deutsch. Verwende "du" (informell). Alle Titel, Beschreibungen und Keywords müssen auf Deutsch sein.',
          fr: 'Écrivez TOUT en français. Utilisez "tu" (informel). Tous les titres, descriptions et mots-clés doivent être en français.',
          es: 'Escribe TODO en español. Usa "tú" (informal). Todos los títulos, descripciones y palabras clave deben estar en español.',
        };

        const nichePrompt = `Analyseer deze website en bepaal de content strategie:

Website: ${website_url}
Datum: ${currentMonth} ${currentYear}

BELANGRIJK: ${languageInstructions[language]}

Analyseer en geef terug:
1. De exacte niche (specifiek, niet te breed)
2. Alle mogelijke pillar topics (hoofdonderwerpen) - wees UITGEBREID
3. Het geschatte aantal artikelen nodig voor VOLLEDIGE topical authority
4. De concurrentie niveau inschatting

BELANGRIJK voor topical authority:
- Een niche heeft meestal 10-30 pillar topics nodig
- Elke pillar topic heeft 20-50 supporting artikelen nodig
- Totaal voor volledige coverage: meestal 300-1500 artikelen
- Brede niches kunnen 2000+ artikelen nodig hebben
- Smalle niches hebben ~200-400 nodig

Output als JSON (alle tekst in ${languageName}):
{
  "niche": "Specifieke niche naam in ${languageName}",
  "competitionLevel": "low|medium|high|very_high",
  "nicheComplexity": "simple|moderate|complex|very_complex",
  "pillarTopics": [
    {
      "topic": "Pillar topic naam in ${languageName}",
      "estimatedArticles": 30,
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ],
  "totalArticlesNeeded": 500,
  "reasoning": "Korte uitleg in ${languageName} waarom dit aantal nodig is"
}`;

        let nicheData: any = {
          niche: 'Content Marketing',
          competitionLevel: 'medium',
          nicheComplexity: 'moderate',
          pillarTopics: [],
          totalArticlesNeeded: 500,
          reasoning: 'Default waarde'
        };

        try {
          const nicheResponse = await generateAICompletion({
            task: 'content',
            systemPrompt: `Je bent een SEO expert die topical authority strategieën ontwikkelt. ${languageInstructions[language]} Geef alleen valide JSON terug.`,
            userPrompt: nichePrompt,
            maxTokens: 2000,
            temperature: 0.6,
          });

          const jsonMatch = nicheResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            nicheData = { ...nicheData, ...parsed };
          }
        } catch (e) {
          console.warn('Niche detection failed:', e);
        }

        const targetCount = Math.min(Math.max(nicheData.totalArticlesNeeded || 500, 100), 2000);
        const pillarTopics = nicheData.pillarTopics || [];

        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 6,
          progress: 15,
          message: `✅ Niche geanalyseerd: ${nicheData.niche}`,
          detail: `${pillarTopics.length} pillar topics • ${targetCount} artikelen nodig • Concurrentie: ${nicheData.competitionLevel}`,
          nicheInfo: {
            niche: nicheData.niche,
            language,
            languageName,
            targetCount,
            competitionLevel: nicheData.competitionLevel,
            reasoning: nicheData.reasoning,
          },
        });

        // ============================================
        // STEP 2: Generate pillar topics if needed (15-25%)
        // ============================================
        if (pillarTopics.length < 5) {
          sendSSE(controller, {
            type: 'progress',
            step: 2,
            totalSteps: 6,
            progress: 18,
            message: '📊 Extra pillar topics genereren...',
            detail: 'Uitbreiden van topic structuur',
          });

          try {
            const topicsPrompt = `Genereer 15-20 pillar topics voor de niche: "${nicheData.niche}"

${languageInstructions[language]}

Elke pillar topic moet:
- Breed genoeg zijn voor 20-50 supporting artikelen
- Specifiek genoeg om een duidelijk thema te hebben
- Relevant zijn voor ${currentYear}-${nextYear}

Output als JSON array (alle tekst in ${languageName}):
[
  {
    "topic": "Pillar topic naam in ${languageName}",
    "estimatedArticles": 30,
    "subtopics": ["subtopic1", "subtopic2", "subtopic3", "subtopic4", "subtopic5"]
  }
]`;

            const topicsResponse = await generateAICompletion({
              task: 'content',
              systemPrompt: `Genereer uitgebreide pillar topics voor topical authority. ${languageInstructions[language]} Output alleen JSON.`,
              userPrompt: topicsPrompt,
              maxTokens: 3000,
              temperature: 0.7,
            });

            const jsonMatch = topicsResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              nicheData.pillarTopics = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.warn('Topics generation failed:', e);
          }
        }

        sendSSE(controller, {
          type: 'progress',
          step: 2,
          totalSteps: 6,
          progress: 25,
          message: `✅ ${nicheData.pillarTopics.length} pillar topics klaar`,
          detail: 'Topic structuur compleet',
        });

        // ============================================
        // STEP 3: Generate content clusters (25-70%)
        // ============================================
        const clusters: any[] = [];
        const allArticles: any[] = [];
        const pillarCount = nicheData.pillarTopics.length;

        for (let i = 0; i < pillarCount; i++) {
          const pillarData = nicheData.pillarTopics[i];
          const pillarTopic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
          const subtopics = typeof pillarData === 'object' ? pillarData.subtopics : [];
          const estimatedArticles = typeof pillarData === 'object' ? pillarData.estimatedArticles : Math.ceil(targetCount / pillarCount);
          
          const progress = 25 + Math.round((i / pillarCount) * 45);

          sendSSE(controller, {
            type: 'progress',
            step: 3,
            totalSteps: 6,
            progress,
            message: `📝 Cluster ${i + 1}/${pillarCount}: ${pillarTopic}`,
            detail: `Genereren van ~${estimatedArticles} artikelen voor dit cluster`,
            currentCluster: {
              index: i + 1,
              total: pillarCount,
              topic: pillarTopic,
            },
          });

          try {
            const clusterPrompt = `Genereer een UITGEBREID content cluster voor: "${pillarTopic}"
Niche: ${nicheData.niche}
Subtopics om te behandelen: ${subtopics.join(', ')}
Aantal artikelen nodig: ${estimatedArticles}
Jaar: ${currentYear}-${nextYear}

${languageInstructions[language]}

Genereer:
1. Een pillar page (uitgebreide 5000+ woorden gids)
2. ${Math.floor(estimatedArticles * 0.3)} How-to guides
3. ${Math.floor(estimatedArticles * 0.2)} Vergelijkingen & reviews
4. ${Math.floor(estimatedArticles * 0.2)} Lijstartikelen
5. ${Math.floor(estimatedArticles * 0.15)} FAQ content
6. ${Math.floor(estimatedArticles * 0.1)} Case studies
7. ${Math.floor(estimatedArticles * 0.05)} Nieuws/trends

BELANGRIJK:
- Elk artikel moet een unieke invalshoek hebben
- Include long-tail keyword variaties
- Denk aan alle zoekintents (informational, commercial, transactional)
- Varieer in moeilijkheidsgraad (beginner tot expert)
- ALLE titels, beschrijvingen en keywords in ${languageName}

Output als JSON (alle tekst in ${languageName}):
{
  "pillarTitle": "Complete Gids: ${pillarTopic}",
  "pillarDescription": "Beschrijving in ${languageName}",
  "pillarKeywords": ["kw1", "kw2", "kw3"],
  "supportingContent": [
    {
      "title": "Artikel titel met keyword in ${languageName}",
      "description": "Korte beschrijving in ${languageName}",
      "keywords": ["keyword1", "keyword2"],
      "contentType": "how-to|guide|comparison|list|faq|case-study|news",
      "difficulty": "beginner|intermediate|advanced",
      "searchIntent": "informational|commercial|transactional"
    }
  ]
}`;

            const clusterResponse = await generateAICompletion({
              task: 'content',
              systemPrompt: `Je bent een SEO content strategist. ${languageInstructions[language]} Genereer uitgebreide content clusters met veel variatie. Output alleen valide JSON.`,
              userPrompt: clusterPrompt,
              maxTokens: 8000,
              temperature: 0.8,
            });

            const jsonMatch = clusterResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const cluster = JSON.parse(jsonMatch[0]);

              clusters.push({
                pillarTopic,
                pillarTitle: cluster.pillarTitle,
                articleCount: (cluster.supportingContent?.length || 0) + 1,
              });

              // Add pillar page
              allArticles.push({
                title: cluster.pillarTitle,
                category: pillarTopic,
                description: cluster.pillarDescription,
                keywords: cluster.pillarKeywords || [],
                contentType: 'pillar',
                cluster: pillarTopic,
                priority: 'high',
                difficulty: 'comprehensive',
                searchIntent: 'informational',
              });

              // Add supporting content
              for (const article of (cluster.supportingContent || [])) {
                allArticles.push({
                  title: article.title,
                  category: pillarTopic,
                  description: article.description,
                  keywords: article.keywords || [],
                  contentType: article.contentType || 'guide',
                  cluster: pillarTopic,
                  priority: article.contentType === 'how-to' ? 'high' : 'medium',
                  difficulty: article.difficulty || 'intermediate',
                  searchIntent: article.searchIntent || 'informational',
                });
              }
            }
          } catch (e) {
            console.error('Cluster generation error:', e);
          }

          // Small delay between clusters to avoid rate limiting
          if (i < pillarCount - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        sendSSE(controller, {
          type: 'progress',
          step: 3,
          totalSteps: 6,
          progress: 70,
          message: `✅ ${clusters.length} clusters gegenereerd`,
          detail: `${allArticles.length} artikelen tot nu toe`,
        });

        // ============================================
        // STEP 4: Generate long-tail variations (70-80%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 4,
          totalSteps: 6,
          progress: 72,
          message: '🔄 Long-tail variaties genereren...',
          detail: `Uitbreiden naar ${targetCount} ideeën`,
        });

        if (allArticles.length < targetCount) {
          const modifiers = langConfig.modifiers;
          const templates = langConfig.templates;
          const contentTypes = ['how-to', 'guide', 'comparison', 'list', 'faq'];
          const difficulties = ['beginner', 'intermediate', 'advanced'];

          for (const pillarData of nicheData.pillarTopics) {
            const topic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
            
            for (const modifier of modifiers) {
              if (allArticles.length >= targetCount) break;

              const title = generateVariationTitle(topic, modifier, currentYear, nextYear, templates);
              
              allArticles.push({
                title,
                category: topic,
                description: `${title} - Uitgebreide informatie over ${topic.toLowerCase()}.`,
                keywords: [`${topic.toLowerCase()} ${modifier}`.trim(), topic.toLowerCase(), modifier],
                contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
                cluster: topic,
                priority: 'low',
                difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
                searchIntent: getSearchIntent(modifier, language),
                generated: 'long-tail',
              });
            }
          }
        }

        sendSSE(controller, {
          type: 'progress',
          step: 4,
          totalSteps: 6,
          progress: 80,
          message: `✅ ${allArticles.length} artikel ideeën gegenereerd`,
          detail: 'Long-tail variaties toegevoegd',
        });

        // ============================================
        // STEP 5: DataForSEO enrichment (80-90%)
        // ============================================
        let enrichedArticles = allArticles;
        const hasDataForSEO = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD;

        if (hasDataForSEO) {
          sendSSE(controller, {
            type: 'progress',
            step: 5,
            totalSteps: 6,
            progress: 82,
            message: '📊 Zoekvolume data ophalen...',
            detail: 'DataForSEO API aanroepen',
          });

          try {
            const seedKeywords = nicheData.pillarTopics
              .map((p: any) => typeof p === 'string' ? p : p.topic)
              .slice(0, 20);
            
            const dataForSEOResults = await getDataForSEOKeywords(seedKeywords, langConfig.locationCode, language);

            if (dataForSEOResults.length > 0) {
              const keywordDataMap = new Map();
              for (const kw of dataForSEOResults) {
                keywordDataMap.set(kw.keyword?.toLowerCase(), {
                  searchVolume: kw.search_volume,
                  competition: kw.competition,
                  competitionIndex: kw.competition_index,
                  cpc: kw.cpc,
                });
              }

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

              // Sort by search volume
              enrichedArticles.sort((a, b) => {
                if (a.contentType === 'pillar' && b.contentType !== 'pillar') return -1;
                if (b.contentType === 'pillar' && a.contentType !== 'pillar') return 1;
                return (b.searchVolume || 0) - (a.searchVolume || 0);
              });
            }

            sendSSE(controller, {
              type: 'progress',
              step: 5,
              totalSteps: 6,
              progress: 90,
              message: '✅ DataForSEO data toegevoegd',
              detail: `${dataForSEOResults.length} keywords verrijkt met zoekvolume`,
            });
          } catch (e) {
            console.warn('DataForSEO enrichment failed:', e);
            sendSSE(controller, {
              type: 'progress',
              step: 5,
              totalSteps: 6,
              progress: 90,
              message: '⚠️ DataForSEO data niet beschikbaar',
              detail: 'Doorgaan zonder zoekvolume data',
            });
          }
        } else {
          sendSSE(controller, {
            type: 'progress',
            step: 5,
            totalSteps: 6,
            progress: 90,
            message: '⏭️ DataForSEO overgeslagen',
            detail: 'Geen credentials geconfigureerd',
          });
        }

        // ============================================
        // STEP 6: Finalize (90-100%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 6,
          totalSteps: 6,
          progress: 95,
          message: '🎯 Content plan afronden...',
          detail: 'Dedupliceren en organiseren',
        });

        // Deduplicate
        const seen = new Set<string>();
        const uniqueArticles = enrichedArticles.filter(article => {
          const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Calculate stats
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
          byDifficulty: {
            beginner: uniqueArticles.filter(a => a.difficulty === 'beginner').length,
            intermediate: uniqueArticles.filter(a => a.difficulty === 'intermediate').length,
            advanced: uniqueArticles.filter(a => a.difficulty === 'advanced').length,
          },
          bySearchIntent: {
            informational: uniqueArticles.filter(a => a.searchIntent === 'informational').length,
            commercial: uniqueArticles.filter(a => a.searchIntent === 'commercial').length,
            transactional: uniqueArticles.filter(a => a.searchIntent === 'transactional').length,
          },
          dataForSEOEnriched: hasDataForSEO,
          targetReached: uniqueArticles.length >= targetCount * 0.8,
        };

        // Send final result
        sendSSE(controller, {
          type: 'progress',
          step: 6,
          totalSteps: 6,
          progress: 100,
          message: '✅ Content plan voltooid!',
          detail: `${uniqueArticles.length} unieke artikel ideeën voor volledige topical authority`,
        });

        sendSSE(controller, {
          type: 'complete',
          success: true,
          niche: nicheData.niche,
          language,
          languageName,
          competitionLevel: nicheData.competitionLevel,
          reasoning: nicheData.reasoning,
          clusters,
          plan: uniqueArticles,
          count: uniqueArticles.length,
          targetCount,
          stats,
        });

      } catch (error: any) {
        console.error('Content plan stream error:', error);
        sendSSE(controller, {
          type: 'error',
          message: error.message || 'Er is een fout opgetreden',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper functions
function generateVariationTitle(topic: string, modifier: string, currentYear: number, nextYear: number, templates: string[]): string {
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template
    .replace('{modifier}', modifier.charAt(0).toUpperCase() + modifier.slice(1))
    .replace('{topic}', topic)
    .replace('{year}', String(nextYear));
}

function getSearchIntent(modifier: string, language: string): string {
  const commercialModifiers: Record<string, string[]> = {
    nl: ['kopen', 'prijs', 'kosten', 'goedkoop', 'beste', 'top', 'review', 'vergelijking', 'vs'],
    en: ['buy', 'price', 'cost', 'cheap', 'best', 'top', 'review', 'comparison', 'vs'],
    de: ['kaufen', 'preis', 'kosten', 'günstig', 'beste', 'top', 'bewertung', 'vergleich', 'vs'],
    fr: ['acheter', 'prix', 'coût', 'pas cher', 'meilleur', 'top', 'avis', 'comparaison', 'vs'],
    es: ['comprar', 'precio', 'costo', 'barato', 'mejor', 'top', 'reseña', 'comparación', 'vs'],
  };
  
  const transactionalModifiers: Record<string, string[]> = {
    nl: ['download', 'gratis', 'template', 'tool', 'software'],
    en: ['download', 'free', 'template', 'tool', 'software'],
    de: ['download', 'kostenlos', 'vorlage', 'tool', 'software'],
    fr: ['télécharger', 'gratuit', 'modèle', 'outil', 'logiciel'],
    es: ['descargar', 'gratis', 'plantilla', 'herramienta', 'software'],
  };
  
  const commercial = commercialModifiers[language] || commercialModifiers['en'];
  const transactional = transactionalModifiers[language] || transactionalModifiers['en'];
  
  if (commercial.some(m => modifier.toLowerCase().includes(m))) return 'commercial';
  if (transactional.some(m => modifier.toLowerCase().includes(m))) return 'transactional';
  return 'informational';
}
