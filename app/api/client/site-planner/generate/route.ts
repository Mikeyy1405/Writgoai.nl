import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getBannedWordsInstructions } from '@/lib/banned-words';
import { loadWordPressSitemap, SitemapData } from '@/lib/sitemap-loader';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * 🗺️ SITE PLANNER - AI Content Strategy Generator
 * Genereert een volledig contentplan voor een website
 * Nu met sitemap-analyse om bestaande onderwerpen uit te sluiten
 */

interface ContentItem {
  id: string;
  title: string;
  url: string;
  type: 'homepage' | 'pillar' | 'cluster' | 'blog';
  description: string;
  keywords: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedWords: number;
}

interface SitePlan {
  siteName: string;
  strategy: string;
  contentItems: ContentItem[];
  totalEstimatedCredits: number;
  existingTopics?: string[]; // Bestaande onderwerpen uit sitemap
}

export async function POST(req: NextRequest) {
  console.log('🗺️ [Site Planner] API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error('❌ [Site Planner] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('✅ [Site Planner] Authenticated:', session.user.id);

    // 2. Parse request
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error('❌ [Site Planner] Invalid JSON');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { projectId, forceRegenerate, onlyLoadExisting } = body;
    console.log('📦 [Site Planner] Request:', { projectId, forceRegenerate, onlyLoadExisting });

    // 3. Validate required fields
    if (!projectId) {
      console.error('❌ [Site Planner] Missing required fields');
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // 4. Fetch project with client
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        wordpressUrl: true,
        description: true,
        niche: true,
        targetAudience: true,
        keywords: true,
        language: true,
        clientId: true,
        sitemap: true,
        sitemapScannedAt: true,
        sitePlan: {
          select: {
            id: true,
            planData: true,
            keywords: true,
            language: true,
            name: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!project) {
      console.error('❌ [Site Planner] Project not found:', projectId);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    console.log('✅ [Site Planner] Project loaded:', project.name);

    // 5. Check if plan already exists and return it if not forcing regenerate
    if (project.sitePlan && !forceRegenerate) {
      console.log('✅ [Site Planner] Existing plan found, returning it');
      return NextResponse.json({
        success: true,
        plan: project.sitePlan.planData,
        planId: project.sitePlan.id,
        planName: project.sitePlan.name,
        isExisting: true,
      });
    }

    // 5b. If onlyLoadExisting is true and no plan exists, return empty response
    if (onlyLoadExisting && !project.sitePlan) {
      console.log('ℹ️ [Site Planner] No existing plan found, onlyLoadExisting mode');
      return NextResponse.json({
        success: true,
        noPlan: true,
        message: 'Geen bestaand plan gevonden',
      });
    }

    if (forceRegenerate && project.sitePlan) {
      console.log('🔄 [Site Planner] Regenerating plan...');
    }

    // 5. Create streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    let streamClosed = false;
    const sendSSE = (data: any) => {
      if (streamClosed) return;
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err: any) {
        console.error('[Site Planner] Write error:', err.message);
        streamClosed = true;
      }
    };

    // 6. Generate plan in background
    (async () => {
      try {
        sendSSE({ progress: 5, message: 'Project wordt geanalyseerd...' });

        // 6a. Load existing sitemap to find existing topics
        let existingTopics: string[] = [];
        let sitemapData: SitemapData | null = null;
        
        if (project.websiteUrl) {
          sendSSE({ progress: 10, message: 'Bestaande sitemap wordt geladen...' });
          
          try {
            // Try to load fresh sitemap
            sitemapData = await loadWordPressSitemap(
              project.websiteUrl,
              project.wordpressUrl || undefined
            );
            
            if (sitemapData && sitemapData.pages.length > 0) {
              // Extract existing topics from sitemap
              existingTopics = sitemapData.pages
                .filter(page => page.type === 'post' || page.type === 'page')
                .map(page => {
                  // Extract topic from title and URL
                  const title = page.title || '';
                  const urlSlug = page.url.split('/').filter(Boolean).pop() || '';
                  return title || urlSlug.replace(/-/g, ' ');
                })
                .filter(topic => topic.length > 0);
              
              console.log(`✅ [Site Planner] Found ${existingTopics.length} existing topics from sitemap`);
              
              // Update project sitemap in database
              await prisma.project.update({
                where: { id: projectId },
                data: {
                  sitemap: sitemapData as any,
                  sitemapScannedAt: new Date(),
                },
              });
            }
          } catch (sitemapError) {
            console.warn('⚠️ [Site Planner] Could not load sitemap:', sitemapError);
            // Continue without sitemap - will generate all new topics
          }
        }
        
        sendSSE({ 
          progress: 15, 
          message: existingTopics.length > 0 
            ? `${existingTopics.length} bestaande onderwerpen gevonden, nieuwe worden gegenereerd...` 
            : 'Geen bestaande content gevonden, volledig nieuw plan wordt gemaakt...'
        });

        // Build prompt with project data
        const promptLanguage = project.language || 'NL';
        const languageMap: Record<string, string> = {
          NL: 'Nederlands',
          EN: 'Engels',
          DE: 'Duits',
          ES: 'Spaans',
          nl: 'Nederlands',
          en: 'Engels',
          de: 'Duits',
          es: 'Spaans'
        };
        
        const languageCode = promptLanguage.toLowerCase() as 'nl' | 'en' | 'de' | 'es';
        const languageName = languageMap[promptLanguage] || 'Nederlands';
        
        // Use project keywords or generate from project data
        const projectKeywords = project.keywords?.length 
          ? project.keywords.join(', ') 
          : `${project.name}, ${project.niche || ''}`;
        
        const bannedWordsLang = (languageCode === 'nl' || languageCode === 'en' || languageCode === 'de') ? languageCode : 'nl';
        
        // Build existing topics exclusion section
        const existingTopicsSection = existingTopics.length > 0 
          ? `
🚫 BESTAANDE ONDERWERPEN (NIET OPNIEUW GENEREREN):
De volgende ${existingTopics.length} onderwerpen bestaan al op de website en mogen NIET in het nieuwe plan voorkomen:
${existingTopics.slice(0, 150).map((topic, i) => `${i + 1}. ${topic}`).join('\n')}
${existingTopics.length > 150 ? `\n... en nog ${existingTopics.length - 150} andere bestaande onderwerpen.` : ''}

⚠️ KRITIEK: Genereer ALLEEN NIEUWE onderwerpen die NIET in bovenstaande lijst staan!
Vermijd ook variaties, synoniemen of zeer vergelijkbare titels van bestaande onderwerpen.
`
          : '';

        const prompt = `Je bent een expert contentstrateeg die een volledig contentplan maakt voor websites.

✨ ANALYSEER AUTOMATISCH HET PROJECT EN MAAK EEN COMPLEET PLAN MET NIEUWE ONDERWERPEN

PROJECT INFORMATIE:
Project naam: ${project.name}
${project.websiteUrl ? `Website: ${project.websiteUrl}` : ''}
${project.niche ? `Niche: ${project.niche}` : ''}
${project.description ? `Project beschrijving: ${project.description}` : ''}
${project.targetAudience ? `Doelgroep: ${project.targetAudience}` : ''}
Keywords: ${projectKeywords}
Content taal: ${languageName} (${languageCode})
${existingTopicsSection}
🎯 TAAK:
Analyseer het project en maak AUTOMATISCH een volledig strategisch contentplan met ALLEEN NIEUWE onderwerpen:
1. Begrijp waar de site over gaat
2. Identificeer de doelgroep
3. Bepaal realistische doelen
4. Maak een SEO-geoptimaliseerd contentplan met NIEUWE content ideeën
${existingTopics.length > 0 ? '5. VERMIJD alle bestaande onderwerpen uit de sitemap!' : ''}

Maak een volledig contentplan voor deze website in het ${languageName} met:

1. Een overkoepelende contentstrategie (2-3 zinnen) die beschrijft:
   - Waar de site over gaat
   - Welke waarde het biedt aan de doelgroep
   - Hoe het de gestelde doelen gaat bereiken

2. MINIMAAL 100-120 NIEUWE content items verdeeld over een hiërarchische structuur:
   - Homepage content (1 item)
   - Pillar pages (5-6 grote hoofdonderwerpen die de kern vormen)
   - Cluster content (per pillar: 4-5 clusters = 20-30 totaal)
   - Blog posts (per cluster: 4-5 blogs = 80-150 totaal)

STRUCTUUR VOORBEELD:
- Homepage (1)
  - Pillar 1: Hoofdonderwerp A
    - Cluster 1.1: Subonderwerp (met 4-5 blogs)
    - Cluster 1.2: Subonderwerp (met 4-5 blogs)
    - Cluster 1.3: Subonderwerp (met 4-5 blogs)
    - Cluster 1.4: Subonderwerp (met 4-5 blogs)
  - Pillar 2: Hoofdonderwerp B (met 4-5 clusters en blogs)
  - Pillar 3: Hoofdonderwerp C (met 4-5 clusters en blogs)
  - Pillar 4: Hoofdonderwerp D (met 4-5 clusters en blogs)
  - Pillar 5: Hoofdonderwerp E (met 4-5 clusters en blogs)
  - Pillar 6: Hoofdonderwerp F (met 4-5 clusters en blogs)

TOTAAL ITEMS: 1 homepage + 5-6 pillars + 20-30 clusters + 80-150 blogs = 106-187 items

🚨 BELANGRIJK: Genereer MINIMAAL 100 NIEUWE items totaal. Dit is een strenge eis!
${existingTopics.length > 0 ? '🚨 GEEN van deze items mag overlappen met de bestaande onderwerpen!' : ''}

Voor elk content item geef:
- Titel (SEO-geoptimaliseerd, pakkend, UNIEK - niet bestaand)
- URL (ALLEEN hoofdkeyword, lowercase, hyphens, max 40 chars)
  * Homepage: "home"
  * Pillar: "yoga-beginners" (NIET "complete-gids-yoga")
  * Cluster: "yoga-oefeningen" (NIET "beste-yoga-oefeningen")
  * Blog: "yoga-mat-kiezen" (NIET "yoga-mat-kiezen-2024")
- Type (homepage/pillar/cluster/blog)
- Beschrijving (1 kort zinnetje, max 15 woorden)
- 3-4 keywords (long-tail SEO)
- Prioriteit (high/medium/low)
- Geschat woorden (1500-2500)

URL REGELS:
- ALLEEN hoofdkeyword (geen "complete", "beste", jaartallen)
- Lowercase, hyphens, 2-4 woorden max
- Geen speciale tekens of leestekens
- GEEN URLs die al bestaan op de website

${getBannedWordsInstructions(bannedWordsLang)}

TITELS & BESCHRIJVINGEN:
- GEEN verboden woorden
- Natuurlijk en SEO-vriendelijk
- Taal: ${languageName}
- UNIEK en niet bestaand op de website

OUTPUT FORMAT (exact deze JSON structuur):
{
  "siteName": "Pakkende site naam die duidelijk maakt waar de site over gaat",
  "strategy": "Korte strategie beschrijving die uitlegt waar de site over gaat, welke waarde het biedt, en hoe het de doelgroep helpt",
  "contentItems": [
    {
      "title": "Homepage Titel",
      "url": "home",
      "type": "homepage",
      "description": "Homepage beschrijving",
      "keywords": ["keyword 1", "keyword 2"],
      "priority": "high",
      "estimatedWords": 1500
    },
    {
      "title": "Pillar Pagina Titel",
      "url": "hoofdkeyword",
      "type": "pillar",
      "description": "Pillar beschrijving",
      "keywords": ["keyword 1", "keyword 2"],
      "priority": "high",
      "estimatedWords": 2500
    },
    {
      "title": "Cluster Artikel Titel",
      "url": "subkeyword",
      "type": "cluster",
      "description": "Cluster beschrijving",
      "keywords": ["keyword 1", "keyword 2"],
      "priority": "medium",
      "estimatedWords": 2000
    },
    {
      "title": "Blog Post Titel",
      "url": "specifiek-keyword",
      "type": "blog",
      "description": "Blog beschrijving",
      "keywords": ["keyword 1", "keyword 2"],
      "priority": "medium",
      "estimatedWords": 1500
    }
  ]
}

⚠️ BELANGRIJK:
- Genereer MINIMAAL 100 NIEUWE items totaal (1 homepage + 5-6 pillars + 20-30 clusters + 80-150 blogs)
- URL = ALLEEN hoofdkeyword (geen "beste", "complete", jaartallen, etc.)
- Zorg voor logische verdeling: elke pillar heeft 4-5 clusters, elk cluster heeft 4-5 blogs
- Dit is een STRENGE VEREISTE: minder dan 100 items is niet acceptabel
${existingTopics.length > 0 ? '- ALLE items moeten NIEUW zijn en NIET overlappen met bestaande content!' : ''}
- Geef ALLEEN de JSON, geen extra tekst`;

        sendSSE({ progress: 30, message: 'AI genereert contentplan...' });

        // Start heartbeat to show progress during AI generation
        let currentProgress = 30;
        const heartbeatInterval = setInterval(() => {
          if (currentProgress < 68) {
            currentProgress += 2;
            const messages = [
              'AI denkt na over jouw contentplan...',
              'Contentstructuur wordt opgebouwd...',
              'Keywords en SEO worden geoptimaliseerd...',
              'Pillars en clusters worden gegenereerd...',
              'Blog posts worden uitgewerkt...',
            ];
            const messageIndex = Math.floor((currentProgress - 30) / 10) % messages.length;
            sendSSE({ progress: currentProgress, message: messages[messageIndex] });
          }
        }, 8000); // Every 8 seconds (slower updates for longer generation)

        try {
          // Call AI using proven AIML API
          console.log('🤖 [Site Planner] Calling Claude 4.5 Sonnet...');
          const aiStartTime = Date.now();
          
          const aiResponse = await Promise.race([
            chatCompletion({
              model: TEXT_MODELS.CLAUDE_45, // Use proven Claude 4.5 Sonnet
              messages: [
                {
                  role: 'system',
                  content: 'Je bent een expert contentstrateeg. Antwoord ALLEEN met valid JSON, geen extra tekst of uitleg. Begin direct met { en eindig met }.',
                },
                {
                  role: 'user',
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 16000, // Increased for 100+ items
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI timeout after 4 minutes - probeer het opnieuw')), 240000)
            ),
          ]);

          // Stop heartbeat
          clearInterval(heartbeatInterval);

          const aiDuration = Date.now() - aiStartTime;
          console.log(`✅ [Site Planner] AI response received in ${aiDuration}ms`);

          sendSSE({ progress: 70, message: 'Plan wordt verwerkt...' });

          // Parse AI response
          const aiText = aiResponse.choices[0]?.message?.content || '';
          console.log('📄 [Site Planner] AI response length:', aiText.length);
          console.log('📄 [Site Planner] First 200 chars:', aiText.substring(0, 200));
          console.log('📄 [Site Planner] Last 200 chars:', aiText.substring(Math.max(0, aiText.length - 200)));

          let planData: SitePlan;
          try {
            // Try multiple parsing strategies
            let jsonText = aiText.trim();
            
            // Strategy 1: Remove markdown code blocks if present
            if (jsonText.startsWith('```json')) {
              jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonText.startsWith('```')) {
              jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            
            // Strategy 2: Extract JSON between first { and last }
            const firstBrace = jsonText.indexOf('{');
            const lastBrace = jsonText.lastIndexOf('}');
            
            if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
              throw new Error('No valid JSON braces found in AI response');
            }
            
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
            
            // Parse the extracted JSON
            planData = JSON.parse(jsonText);
            
            // Validate required fields
            if (!planData.siteName || !planData.contentItems || !Array.isArray(planData.contentItems)) {
              throw new Error('Invalid plan structure: missing siteName or contentItems');
            }
            
            console.log('✅ [Site Planner] Successfully parsed plan with', planData.contentItems.length, 'items');
            
          } catch (parseError: any) {
            console.error('❌ [Site Planner] Failed to parse AI response:', parseError);
            console.error('Full AI text:', aiText);
            sendSSE({ 
              error: 'Failed to parse AI response',
              message: 'AI gaf een onverwacht antwoord. Probeer het opnieuw.',
              progress: 0,
            });
            await writer.close();
            streamClosed = true;
            return;
          }

          // Validate minimum item count
          if (planData.contentItems.length < 100) {
            console.error('❌ [Site Planner] Plan has less than 100 items:', planData.contentItems.length);
            sendSSE({ 
              error: 'Insufficient content items',
              message: `Plan heeft slechts ${planData.contentItems.length} items, maar minimaal 100 is vereist. Probeer het opnieuw.`,
              progress: 0,
            });
            await writer.close();
            streamClosed = true;
            return;
          }

          // Add IDs and calculate credits
          planData.contentItems = planData.contentItems.map((item, index) => ({
            ...item,
            id: `item-${index + 1}`,
          }));

          // Restructure for frontend: separate homepage and pillars
          const homepage = planData.contentItems.find(item => item.type === 'homepage');
          const pillars = planData.contentItems.filter(item => item.type === 'pillar');
          const clusters = planData.contentItems.filter(item => item.type === 'cluster');
          const blogs = planData.contentItems.filter(item => item.type === 'blog');

          // Estimate total credits (25 per item for full generation)
          const totalItems = planData.contentItems.length;
          const totalEstimatedCredits = totalItems * 25;

          console.log('✅ [Site Planner] Plan generated:', {
            siteName: planData.siteName,
            items: totalItems,
            homepage: !!homepage,
            pillars: pillars.length,
            clusters: clusters.length,
            blogs: blogs.length,
            estimatedCredits: totalEstimatedCredits,
          });

          sendSSE({ progress: 90, message: 'Plan wordt opgeslagen...' });

          // Prepare frontend-compatible structure
          const frontendPlan = {
            siteName: planData.siteName,
            strategy: planData.strategy,
            homepage: homepage,
            pillars: [
              ...pillars,
              ...clusters.map(c => ({ ...c, type: 'cluster' as const })),
              ...blogs.map(b => ({ ...b, type: 'blog' as const })),
            ],
            totalEstimatedCredits: totalEstimatedCredits,
            existingTopics: existingTopics, // Include existing topics for frontend display
            existingTopicsCount: existingTopics.length,
          };

          // Save or update the plan in database
          let savedPlan;
          if (project.sitePlan) {
            // Update existing plan
            savedPlan = await prisma.sitePlan.update({
              where: { id: project.sitePlan.id },
              data: {
                planData: frontendPlan as any,
                keywords: projectKeywords.split(',').map(k => k.trim()),
                language: languageCode,
                name: planData.siteName,
                updatedAt: new Date(),
              },
            });
            console.log('✅ [Site Planner] Plan updated:', savedPlan.id);
          } else {
            // Create new plan
            savedPlan = await prisma.sitePlan.create({
              data: {
                clientId: project.clientId,
                projectId: project.id,
                planData: frontendPlan as any,
                keywords: projectKeywords.split(',').map(k => k.trim()),
                language: languageCode,
                name: planData.siteName,
              },
            });
            console.log('✅ [Site Planner] Plan created:', savedPlan.id);
          }

          // Send final result
          sendSSE({
            progress: 100,
            message: 'Plan gereed!',
            plan: frontendPlan,
            planId: savedPlan.id,
          });

          await writer.close();
          streamClosed = true;
          console.log('✅ [Site Planner] Stream closed successfully');

        } catch (aiError: any) {
          // Stop heartbeat on error
          clearInterval(heartbeatInterval);
          
          console.error('❌ [Site Planner] AI generation error:', aiError);
          console.error('Error stack:', aiError.stack);
          
          if (!streamClosed) {
            sendSSE({ 
              error: aiError.message || 'AI generation failed',
              message: aiError.message || 'Er ging iets mis bij het genereren van het plan',
              progress: 0,
            });
            await writer.close();
            streamClosed = true;
          }
        }

      } catch (error: any) {
        console.error('❌ [Site Planner] Generation error:', error);
        console.error('Error stack:', error.stack);
        
        if (!streamClosed) {
          sendSSE({ 
            error: error.message || 'Generation failed',
            message: error.message || 'Er ging iets mis bij het genereren van het plan',
            progress: 0,
          });
          await writer.close();
          streamClosed = true;
        }
      }
    })();

    // Return stream
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('❌ [Site Planner] Initialization error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Initialization failed' },
      { status: 500 }
    );
  }
}
