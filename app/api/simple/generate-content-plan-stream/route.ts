import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

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

export async function POST(request: Request) {
  const { website_url } = await request.json();

  if (!website_url) {
    return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const now = new Date();
        const currentMonth = now.toLocaleString('nl-NL', { month: 'long' });
        const currentYear = now.getFullYear();
        const nextYear = currentYear + 1;

        // ============================================
        // STEP 1: Analyze website and detect niche (0-15%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 6,
          progress: 5,
          message: '🔍 Website analyseren...',
          detail: `Analyseren van ${website_url}`,
          estimatedTime: '~2-3 minuten totaal',
        });

        const nichePrompt = `Analyseer deze website en bepaal de content strategie:

Website: ${website_url}
Datum: ${currentMonth} ${currentYear}

Analyseer en geef terug:
1. De exacte niche (specifiek, niet te breed)
2. De primaire taal
3. Alle mogelijke pillar topics (hoofdonderwerpen) - wees UITGEBREID
4. Het geschatte aantal artikelen nodig voor VOLLEDIGE topical authority
5. De concurrentie niveau inschatting

BELANGRIJK voor topical authority:
- Een niche heeft meestal 10-30 pillar topics nodig
- Elke pillar topic heeft 20-50 supporting artikelen nodig
- Totaal voor volledige coverage: meestal 300-1500 artikelen
- Brede niches (zoals "SEO") kunnen 2000+ artikelen nodig hebben
- Smalle niches (zoals "WordPress SEO plugins") hebben ~200-400 nodig

Output als JSON:
{
  "niche": "Specifieke niche naam",
  "language": "nl",
  "competitionLevel": "low|medium|high|very_high",
  "nicheComplexity": "simple|moderate|complex|very_complex",
  "pillarTopics": [
    {
      "topic": "Pillar topic naam",
      "estimatedArticles": 30,
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ],
  "totalArticlesNeeded": 500,
  "reasoning": "Korte uitleg waarom dit aantal nodig is"
}`;

        let nicheData: any = {
          niche: 'SEO & Content Marketing',
          language: 'nl',
          competitionLevel: 'medium',
          nicheComplexity: 'moderate',
          pillarTopics: [],
          totalArticlesNeeded: 500,
          reasoning: 'Default waarde'
        };

        try {
          const nicheResponse = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een SEO expert die topical authority strategieën ontwikkelt. Analyseer grondig en geef een realistische inschatting van het benodigde aantal artikelen voor volledige niche dominantie. Geef alleen valide JSON terug.',
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

Elke pillar topic moet:
- Breed genoeg zijn voor 20-50 supporting artikelen
- Specifiek genoeg om een duidelijk thema te hebben
- Relevant zijn voor ${currentYear}-${nextYear}

Output als JSON array:
[
  {
    "topic": "Pillar topic naam",
    "estimatedArticles": 30,
    "subtopics": ["subtopic1", "subtopic2", "subtopic3", "subtopic4", "subtopic5"]
  }
]`;

            const topicsResponse = await generateAICompletion({
              task: 'content',
              systemPrompt: 'Genereer uitgebreide pillar topics voor topical authority. Output alleen JSON.',
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

Output als JSON:
{
  "pillarTitle": "Complete Gids: ${pillarTopic}",
  "pillarDescription": "Beschrijving",
  "pillarKeywords": ["kw1", "kw2", "kw3"],
  "supportingContent": [
    {
      "title": "Artikel titel met keyword",
      "description": "Korte beschrijving",
      "keywords": ["keyword1", "keyword2"],
      "contentType": "how-to|guide|comparison|list|faq|case-study|news",
      "difficulty": "beginner|intermediate|advanced",
      "searchIntent": "informational|commercial|transactional"
    }
  ]
}`;

            const clusterResponse = await generateAICompletion({
              task: 'content',
              systemPrompt: 'Je bent een SEO content strategist. Genereer uitgebreide content clusters met veel variatie in artikel types en zoekintents. Output alleen valide JSON.',
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
          const modifiers = [
            // Question modifiers
            'hoe', 'wat is', 'waarom', 'wanneer', 'welke', 'hoeveel',
            // Comparison modifiers
            'vs', 'versus', 'of', 'beste', 'top 10', 'top 5', 'vergelijking',
            // Intent modifiers
            'kopen', 'gratis', 'goedkoop', 'premium', 'review', 'ervaringen', 'kosten', 'prijzen',
            // Time modifiers
            `${currentYear}`, `${nextYear}`, 'nieuw', 'update', 'trends', 'toekomst',
            // Audience modifiers
            'beginners', 'gevorderden', 'professionals', 'bedrijven', 'mkb', 'starters',
            // Action modifiers
            'tips', 'gids', 'handleiding', 'checklist', 'template', 'voorbeeld', 'stappenplan',
            // Problem modifiers
            'problemen', 'oplossingen', 'fouten', 'vermijden', 'verbeteren', 'optimaliseren',
          ];

          const contentTypes = ['how-to', 'guide', 'comparison', 'list', 'faq'];
          const difficulties = ['beginner', 'intermediate', 'advanced'];
          const intents = ['informational', 'commercial', 'transactional'];

          for (const pillarData of nicheData.pillarTopics) {
            const topic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
            
            for (const modifier of modifiers) {
              if (allArticles.length >= targetCount) break;

              const title = generateVariationTitle(topic, modifier, currentYear, nextYear);
              
              allArticles.push({
                title,
                category: topic,
                description: `${title} - Uitgebreide informatie over ${topic.toLowerCase()}.`,
                keywords: [`${topic.toLowerCase()} ${modifier}`.trim(), topic.toLowerCase(), modifier],
                contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
                cluster: topic,
                priority: 'low',
                difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
                searchIntent: getSearchIntent(modifier),
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
            
            const dataForSEOResults = await getDataForSEOKeywords(seedKeywords);

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
          language: nicheData.language,
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
function generateVariationTitle(topic: string, modifier: string, currentYear: number, nextYear: number): string {
  const templates = [
    `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}?`,
    `${topic}: ${modifier.charAt(0).toUpperCase() + modifier.slice(1)} Gids`,
    `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic} in ${nextYear}`,
    `De ${modifier} van ${topic}`,
    `${topic} ${modifier}: Complete Handleiding`,
    `Alles over ${topic} ${modifier}`,
    `${topic} voor ${modifier}`,
    `${modifier.charAt(0).toUpperCase() + modifier.slice(1)}: ${topic} Uitgelegd`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function getSearchIntent(modifier: string): string {
  const commercialModifiers = ['kopen', 'prijs', 'kosten', 'goedkoop', 'beste', 'top', 'review', 'vergelijking', 'vs'];
  const transactionalModifiers = ['download', 'gratis', 'template', 'tool', 'software'];
  
  if (commercialModifiers.some(m => modifier.toLowerCase().includes(m))) return 'commercial';
  if (transactionalModifiers.some(m => modifier.toLowerCase().includes(m))) return 'transactional';
  return 'informational';
}
