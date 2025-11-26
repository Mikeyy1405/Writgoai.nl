
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateTopicalMap } from '@/lib/topical-map-generator';

/**
 * 🚀 POST /api/client/topical-mapping/generate-auto
 * 
 * MAXIMALE TOPICAL MAP GENERATIE met Gemini 3 Pro
 * - Analyseert automatisch de website/project
 * - Bepaalt zelf de niche en hoofdonderwerp  
 * - Genereert 1000-1600+ unieke artikel ideeën (GEEN LIMIET!)
 * - Geen keyword input nodig!
 * - AI haalt het onderste uit de kan voor volledige niche coverage
 */
// Verhoog timeout voor lange AI generaties (tot 10 minuten voor grote batches)
export const maxDuration = 600; // 10 minuten max voor grote topical maps
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      projectId,
      targetArticles = 300, // REALISTISCH DEFAULT - gebruiker kan verhogen indien gewenst
      autoAnalyze = true,
      stream = true // Support for streaming progress updates
    } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Haal project informatie op inclusief bestaande content
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      },
      include: {
        savedContent: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          select: {
            title: true,
            language: true
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 🌊 STREAMING MODE - Real-time progress updates
    if (stream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const sendProgress = (step: string, progress: number, message: string) => {
            const data = `data: ${JSON.stringify({ step, progress, message })}\n\n`;
            controller.enqueue(encoder.encode(data));
          };

          try {
            sendProgress('init', 0, '🚀 Topical map generatie gestart...');
            await new Promise(resolve => setTimeout(resolve, 300));

            sendProgress('analyze', 10, `📊 Analyseren van project: ${project.name}...`);
            await new Promise(resolve => setTimeout(resolve, 500));

            sendProgress('niche', 20, '🎯 Bepalen van niche en hoofdonderwerp...');
            const mainTopic = project.name;
            const language = project.language || 'NL';
            await new Promise(resolve => setTimeout(resolve, 400));

            sendProgress('context', 30, `🔍 Verzamelen van context: ${project.savedContent.length} bestaande artikelen...`);
            await new Promise(resolve => setTimeout(resolve, 500));

            sendProgress('ai-start', 40, '🤖 Claude Sonnet 4-5 wordt opgestart...');
            await new Promise(resolve => setTimeout(resolve, 600));

            sendProgress('generating', 50, `✨ Genereren van ${targetArticles}+ unieke artikel ideeën...`);
            sendProgress('generating', 52, '⏳ Dit kan 1-3 minuten duren...');
            await new Promise(resolve => setTimeout(resolve, 800));

            // Genereer topical map met volledige context
            console.log('[Auto Topical Map] Calling generateTopicalMap...');
            
            let mapResult;
            try {
              // Start progress tracking tijdens AI generatie
              sendProgress('processing', 55, '⚡ AI analyseert jouw niche...');
              
              // Heartbeat updates tijdens lang wachten (nu met LANGERE interval en MEER berichten)
              let currentProgress = 55;
              const progressMessages = [
                '🔍 Identificeren van hoofdcategorieën...',
                '📊 Analyseren van zoektrends en search volumes...',
                '💡 Genereren van content ideeën (dit kan 2-5 minuten duren)...',
                '🎯 Bepalen van prioriteiten per topic...',
                '🔗 Structureren van interne links en clusters...',
                '✨ Optimaliseren van topical authority score...',
                '📈 Berekenen van SEO potentieel en difficulty...',
                '🎨 Finaliseren van content strategie...',
                '⏳ Nog even geduld, bijna klaar...',
                '🚀 Laatste touches aan de topical map...'
              ];
              
              // LANGERE interval (5 sec) en KLEINERE increments (1%) voor stabieler beeld
              const progressInterval = setInterval(() => {
                if (currentProgress < 70) { // Stop bij 70% om ruimte te houden
                  currentProgress += 1;
                  const messageIndex = Math.min(
                    Math.floor((currentProgress - 55) / 2),
                    progressMessages.length - 1
                  );
                  sendProgress('processing', currentProgress, progressMessages[messageIndex]);
                }
              }, 5000); // Update elke 5 seconden voor stabielere SSE
              
              try {
                mapResult = await generateTopicalMap({
                  mainTopic,
                  language,
                  depth: 2,
                  targetArticles,
                  includeCommercial: true,
                  commercialRatio: 0.4,
                  websiteUrl: project.websiteUrl || undefined,
                  projectContext: {
                    name: project.name,
                    description: project.description || undefined,
                    targetAudience: project.targetAudience || undefined,
                    existingContent: project.savedContent.map(c => c.title)
                  }
                });
              } finally {
                clearInterval(progressInterval);
              }
              
              sendProgress('structuring', 75, '🏗️ Structureren van categorieën en subcategorieën...');
              await new Promise(resolve => setTimeout(resolve, 500));

              console.log('[Auto Topical Map] ✅ generateTopicalMap completed successfully');
              console.log('[Auto Topical Map] Generated categories:', mapResult.categories?.length || 0);
            } catch (genError: any) {
              console.error('[Auto Topical Map] ❌ generateTopicalMap failed:', genError);
              
              let errorMessage = genError.message;
              
              // Friendly error messages
              if (errorMessage.includes('timeout')) {
                errorMessage = '⏰ De AI generatie duurde te lang. Probeer een kleinere batch (bijv. 500 topics in plaats van 1500)';
              } else if (errorMessage.includes('rate limit')) {
                errorMessage = '⚠️ API limiet bereikt. Wacht 1 minuut en probeer opnieuw';
              } else if (errorMessage.includes('overloaded')) {
                errorMessage = '⚠️ AI is overbelast. Probeer het over 30 seconden opnieuw';
              }
              
              sendProgress('error', 0, `❌ ${errorMessage}`);
              const errorData = `data: ${JSON.stringify({ 
                error: errorMessage,
                step: 'error',
                progress: 0
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
              return;
            }

            // Valideer de structuur
            if (!mapResult.categories || !Array.isArray(mapResult.categories)) {
              sendProgress('error', 0, '❌ Ongeldige data structuur ontvangen');
              controller.close();
              return;
            }

            sendProgress('saving', 85, `💾 Opslaan in database: ${mapResult.categories.length} categorieën...`);
            await new Promise(resolve => setTimeout(resolve, 400));

            // Flatten de structuur
            const categoriesToCreate = mapResult.categories.flatMap((category) => {
              if (!category.subcategories || !Array.isArray(category.subcategories)) {
                return [];
              }

              return category.subcategories
                .filter(subcategory => subcategory.topics && subcategory.topics.length > 0)
                .map((subcategory) => ({
                  name: `${category.name} - ${subcategory.name}`,
                  priority: category.priority || 'medium',
                  articleCount: subcategory.articles || subcategory.topics?.length || 0,
                  commercialRatio: category.commercialRatio || 0.4,
                  topics: {
                    create: (subcategory.topics || []).map((topic) => ({
                      title: topic.title || 'Untitled',
                      type: topic.type || 'informational',
                      keywords: topic.keywords || [],
                      searchVolume: topic.searchVolume || null,
                      difficulty: topic.difficulty || null,
                      priority: topic.priority || 5
                    }))
                  }
                }));
            });

            if (categoriesToCreate.length === 0) {
              sendProgress('error', 0, '❌ Geen valide topics gegenereerd');
              controller.close();
              return;
            }

            sendProgress('creating', 90, `📝 Aanmaken van ${categoriesToCreate.length} categorieën...`);
            await new Promise(resolve => setTimeout(resolve, 600));

            const topicalMap = await prisma.topicalMap.create({
              data: {
                projectId,
                mainTopic: mapResult.mainTopic || mainTopic,
                language,
                depth: 2,
                totalArticles: mapResult.totalArticles,
                categories: {
                  create: categoriesToCreate
                }
              },
              include: {
                categories: {
                  include: {
                    topics: true
                  }
                }
              }
            });

            const totalTopicsGenerated = topicalMap.categories.reduce(
              (sum, cat) => sum + cat.topics.length,
              0
            );

            sendProgress('complete', 100, `🎉 ${totalTopicsGenerated} unieke topics succesvol gegenereerd!`);
            await new Promise(resolve => setTimeout(resolve, 500));

            // Send final result
            const completeData = `data: ${JSON.stringify({
              step: 'done',
              progress: 100,
              success: true,
              topicalMap: {
                id: topicalMap.id,
                mainTopic: topicalMap.mainTopic,
                totalArticles: topicalMap.totalArticles,
                categories: topicalMap.categories.length,
                totalTopics: totalTopicsGenerated
              },
              message: `🚀 ${totalTopicsGenerated} unieke topics gegenereerd met Gemini 3 Pro!`
            })}\n\n`;
            controller.enqueue(encoder.encode(completeData));
            
          } catch (error) {
            console.error('[Streaming] Error:', error);
            const errorData = `data: ${JSON.stringify({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              step: 'error',
              progress: 0
            })}\n\n`;
            controller.enqueue(encoder.encode(errorData));
          } finally {
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // NON-STREAMING MODE (fallback)
    console.log('[Auto Topical Map] Starting automatic generation for:', {
      project: project.name,
      website: project.websiteUrl,
      targetArticles
    });

    const mainTopic = project.name;
    const language = project.language || 'NL';

    console.log('[Auto Topical Map] Calling generateTopicalMap...');
    
    let mapResult;
    try {
      mapResult = await generateTopicalMap({
        mainTopic,
        language,
        depth: 2,
        targetArticles,
        includeCommercial: true,
        commercialRatio: 0.4,
        websiteUrl: project.websiteUrl || undefined,
        projectContext: {
          name: project.name,
          description: project.description || undefined,
          targetAudience: project.targetAudience || undefined,
          existingContent: project.savedContent.map(c => c.title)
        }
      });
      console.log('[Auto Topical Map] ✅ generateTopicalMap completed successfully');
      console.log('[Auto Topical Map] Generated categories:', mapResult.categories?.length || 0);
    } catch (genError: any) {
      console.error('[Auto Topical Map] ❌ generateTopicalMap failed:', {
        message: genError.message,
        stack: genError.stack?.substring(0, 500)
      });
      
      let userMessage = 'Topical map generatie mislukt';
      let tip = 'Probeer het opnieuw. Als het probleem aanhoudt, kies een kleinere hoeveelheid artikelen.';
      
      if (genError.message?.includes('JSON') || genError.message?.includes('parse')) {
        userMessage = '⚠️ AI genereerde ongeldige data';
        tip = 'Klik opnieuw op "Genereer" om het nog een keer te proberen.';
      } else if (genError.message?.includes('timeout') || genError.message?.includes('timed out')) {
        userMessage = '⏱️ Generatie duurde te lang';
        tip = 'Probeer met minder artikelen te beginnen (bijv. 200-300 in plaats van 500+).';
      } else if (genError.message?.includes('rate limit') || genError.message?.includes('overbelast')) {
        userMessage = '🔄 AI is momenteel druk';
        tip = 'Wacht 10-30 seconden en probeer dan opnieuw.';
      }
      
      return NextResponse.json({
        error: userMessage,
        details: genError.message,
        tip: tip
      }, { status: 500 });
    }

    // Save topical map to database
    console.log('[Auto Topical Map] Saving to database...');
    console.log('[Auto Topical Map] Raw result:', JSON.stringify(mapResult, null, 2));
    console.log('[Auto Topical Map] Categories count:', mapResult.categories?.length || 0);
    
    // Valideer de structuur
    if (!mapResult.categories || !Array.isArray(mapResult.categories)) {
      console.error('[Auto Topical Map] Invalid categories structure');
      return NextResponse.json({
        error: 'Topical map generatie mislukt: ongeldige structuur',
        details: 'Geen categories ontvangen van AI'
      }, { status: 500 });
    }

    // Flatten de structuur: maak parent categories en subcategories beide als TopicalCategory
    const categoriesToCreate = mapResult.categories.flatMap((category) => {
      if (!category.subcategories || !Array.isArray(category.subcategories)) {
        console.warn('[Auto Topical Map] Category zonder subcategories:', category.name);
        return [];
      }

      // Elk subcategory wordt een eigen category met topics
      return category.subcategories
        .filter(subcategory => subcategory.topics && subcategory.topics.length > 0)
        .map((subcategory) => ({
          name: `${category.name} - ${subcategory.name}`,
          priority: category.priority || 'medium',
          articleCount: subcategory.articles || subcategory.topics?.length || 0,
          commercialRatio: category.commercialRatio || 0.4,
          topics: {
            create: (subcategory.topics || []).map((topic) => ({
              title: topic.title || 'Untitled',
              type: topic.type || 'informational',
              keywords: topic.keywords || [],
              searchVolume: topic.searchVolume || null,
              difficulty: topic.difficulty || null,
              priority: topic.priority || 5
            }))
          }
        }));
    });

    console.log('[Auto Topical Map] Flattened categories count:', categoriesToCreate.length);

    if (categoriesToCreate.length === 0) {
      console.error('[Auto Topical Map] Geen valide categories na flattening');
      return NextResponse.json({
        error: 'Topical map generatie mislukt: geen valide topics',
        details: 'AI genereerde geen bruikbare topics'
      }, { status: 500 });
    }

    const topicalMap = await prisma.topicalMap.create({
      data: {
        projectId,
        mainTopic,
        language,
        depth: 2,
        totalArticles: mapResult.totalArticles,
        categories: {
          create: categoriesToCreate
        }
      },
      include: {
        categories: {
          include: {
            topics: true
          }
        }
      }
    });

    const totalTopicsGenerated = topicalMap.categories.reduce(
      (sum, cat) => sum + cat.topics.length,
      0
    );

    console.log('[Auto Topical Map] Successfully generated:', {
      id: topicalMap.id,
      mainTopic,
      categories: topicalMap.categories.length,
      totalTopics: totalTopicsGenerated,
      seoScore: mapResult.seoOpportunityScore
    });

    return NextResponse.json({
      success: true,
      topicalMap: {
        id: topicalMap.id,
        mainTopic: topicalMap.mainTopic,
        totalArticles: topicalMap.totalArticles,
        categories: topicalMap.categories.length,
        totalTopics: totalTopicsGenerated
      },
      message: `🚀 ${totalTopicsGenerated} unieke topics automatisch gegenereerd met Gemini 3 Pro!`,
      estimatedMonths: mapResult.estimatedMonths,
      seoOpportunityScore: mapResult.seoOpportunityScore
    });

  } catch (error) {
    console.error('[Auto Topical Map] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate topical map automatically',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
