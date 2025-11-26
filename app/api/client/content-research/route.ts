

export const dynamic = "force-dynamic";
export const maxDuration = 600; // 10 minutes timeout for long research (increased for stability)

/**
 * Content Research API with Real-time Progress Updates
 * Main endpoint for comprehensive content research & planning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  performCompleteContentResearch,
  MasterContentPlan 
} from '@/lib/intelligent-content-planner';

// Helper to send SSE progress updates
function createProgressStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;
  let isClosed = false; // Track if stream is closed

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const sendUpdate = (status: string, progress: number, details?: string) => {
    if (isClosed) {
      console.warn('⚠️  Attempted to send update on closed stream:', status);
      return; // Silently ignore updates after stream is closed
    }
    try {
      const data = JSON.stringify({ status, progress, details, timestamp: new Date().toISOString() });
      controller.enqueue(encoder.encode(`data: ${data}\n\n`));
    } catch (error) {
      console.error('Error sending stream update:', error);
      isClosed = true; // Mark as closed if enqueue fails
    }
  };

  const sendData = (data: any) => {
    if (isClosed) {
      console.warn('⚠️  Attempted to send data on closed stream');
      return; // Silently ignore data after stream is closed
    }
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (error) {
      console.error('Error sending stream data:', error);
      isClosed = true; // Mark as closed if enqueue fails
    }
  };

  const close = () => {
    if (!isClosed) {
      try {
        controller.close();
        isClosed = true;
      } catch (error) {
        console.error('Error closing stream:', error);
        isClosed = true; // Mark as closed anyway
      }
    }
  };

  return { stream, sendUpdate, sendData, close };
}

// POST: Start new content research with real-time updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { projects: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { projectId, keyword, language } = body;

    // Check if client wants streaming updates
    const wantsStream = request.headers.get('accept') === 'text/event-stream';

    if (wantsStream) {
      // Return streaming response with progress updates
      const { stream, sendUpdate, sendData, close } = createProgressStream();

      // Process in background
      (async () => {
        try {
          sendUpdate('🚀 Start analyse...', 0, 'Voorbereiden van content research');

          // Check if we're in keyword mode or project mode
          const isKeywordMode = !projectId && keyword;
          
          let websiteUrl = '';
          let niche = '';
          let targetAudience = 'Nederlandse lezers';
          let keywords: string[] = [];

          if (isKeywordMode) {
            sendUpdate('🎯 Keyword modus', 5, `Analyseren van keyword: "${keyword}"`);
            niche = keyword;
            keywords = [keyword];
          } else {
            if (!projectId) {
              sendUpdate('❌ Fout', 0, 'Project of keyword vereist');
              close();
              return;
            }

            const project = await prisma.project.findUnique({
              where: { id: projectId, clientId: client.id }
            });

            if (!project) {
              sendUpdate('❌ Fout', 0, 'Project niet gevonden');
              close();
              return;
            }

            sendUpdate('📂 Project laden', 10, `Project: ${project.name}`);
            
            websiteUrl = project.websiteUrl || '';
            niche = project.niche || project.name || 'algemeen';
            targetAudience = project.targetAudience || 'Nederlandse lezers';
            keywords = project.keywords || [];
          }

          // Get project name for research
          let projectName = 'Algemeen';
          if (!isKeywordMode && projectId) {
            const project = await prisma.project.findUnique({
              where: { id: projectId }
            });
            projectName = project?.name || 'Onbekend Project';
          }

          // Phase 1: Website Analysis
          sendUpdate('🌐 Website analyseren', 20, websiteUrl ? `Diepgaande scan van ${websiteUrl}` : 'Overslaan (geen URL)');
          
          // Phase 2: Competitor Analysis
          await new Promise(resolve => setTimeout(resolve, 1000));
          sendUpdate('🔍 Concurrenten analyseren', 40, 'Zoeken naar concurrent content en kansen');
          
          // Phase 3: Trending Topics
          await new Promise(resolve => setTimeout(resolve, 1000));
          sendUpdate('📈 Trending topics zoeken', 60, 'Analyseren van actuele onderwerpen en trends');
          
          // Phase 4: Generate Content Ideas - STEP BY STEP with real progress
          sendUpdate('💡 Content ideeën genereren', 80, 'Start content research...');
          
          // Import the individual steps so we can call them with progress updates
          const { 
            analyzeWebsiteDeep,
            analyzeCompetitors, 
            findTrendingTopics,
            generateMasterContentPlan 
          } = await import('@/lib/intelligent-content-planner');
          
          // Step 1: Website Analysis (20-30% of time)
          sendUpdate('🌐 Website analyseren', 82, websiteUrl ? `Diepgaand scannen van ${websiteUrl}...` : 'Overslaan (geen URL)');
          const websiteAnalysis = await analyzeWebsiteDeep(websiteUrl, niche, projectName);
          
          // Step 2: Competitor Analysis (20-30% of time)
          sendUpdate('🎯 Concurrent analyse', 86, 'Analyseren van concurrent content en kansen...');
          const competitorAnalysis = await analyzeCompetitors(niche, keywords);
          
          // Step 3: Trending Topics (15-20% of time)
          sendUpdate('📈 Trending topics', 90, 'Zoeken naar actuele onderwerpen...');
          const trendingTopics = await findTrendingTopics(niche);
          
          // Step 4: Generate Content Plan (20-30% of time)
          sendUpdate('✨ Content plan maken', 93, 'AI genereert content ideeën...');
          const contentIdeas = await generateMasterContentPlan(
            websiteAnalysis,
            competitorAnalysis,
            trendingTopics,
            niche,
            targetAudience
          );
          
          // Build complete content plan
          const summary = {
            totalIdeas: contentIdeas.length,
            highPriority: contentIdeas.filter(i => i.priority === 'high').length,
            mediumPriority: contentIdeas.filter(i => i.priority === 'medium').length,
            lowPriority: contentIdeas.filter(i => i.priority === 'low').length,
            competitorGaps: contentIdeas.filter(i => i.competitorGap).length,
            trendingTopics: contentIdeas.filter(i => i.trending).length,
          };
          
          const contentPlan: MasterContentPlan = {
            websiteAnalysis,
            competitorAnalysis,
            trendingTopics,
            contentIdeas,
            summary,
            generatedAt: new Date(),
          };
          
          sendUpdate('💾 Opslaan', 94, 'Content ideeën opslaan in database...');

          // Save content ideas as ArticleIdea records (PROJECT-SPECIFIC!)
          const articleIdeasData = contentPlan.contentIdeas.map(idea => ({
            clientId: client.id,
            projectId: projectId || null,  // NIEUW: Koppel aan specifiek project
            title: idea.title,
            slug: idea.title.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            focusKeyword: idea.focusKeyword,
            topic: idea.description,
            secondaryKeywords: idea.secondaryKeywords,
            searchIntent: idea.searchIntent,
            difficulty: idea.estimatedDifficulty,
            contentOutline: { sections: idea.outline.map(h2 => ({ heading: h2, subpoints: [] })) },
            contentType: idea.contentType,
            priority: idea.priority,
            aiScore: idea.trending ? 90 : (idea.competitorGap ? 80 : 70),
            trending: idea.trending,
            competitorGap: idea.competitorGap,
            status: 'idea',
          }));

          console.log(`💾 [CONTENT RESEARCH] Saving ${articleIdeasData.length} article ideas to database...`);

          // Save results to database (only in project mode)
          if (!isKeywordMode && projectId) {
            try {
              sendUpdate('💾 Opslaan', 95, 'Project updaten...');
              
              const project = await prisma.project.findUnique({
                where: { id: projectId, clientId: client.id }
              });
              
              if (project) {
                // Update project with BOTH content analysis AND content strategy
                await prisma.project.update({
                  where: { id: project.id },
                  data: {
                    // Save website analysis separately (project-specific!)
                    contentAnalysis: {
                      websiteAnalysis: contentPlan.websiteAnalysis,
                      competitorAnalysis: contentPlan.competitorAnalysis,
                      trendingTopics: contentPlan.trendingTopics,
                    } as any,
                    contentAnalysisStatus: 'completed',
                    contentAnalysisDate: new Date(),
                    
                    // Save full content strategy
                    contentStrategy: contentPlan as any,
                    contentStrategyStatus: 'completed',
                    contentStrategyDate: new Date(),
                  }
                });

                sendUpdate('💾 Opslaan', 96, 'Oude content opruimen...');

                // BELANGRIJK: Behoud bestaande ideeën, voeg alleen nieuwe toe
                // Verwijder alleen ideeën die al geschreven of gepubliceerd zijn na 30 dagen
                // EN alleen van DIT project (niet van andere projecten!)
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                await prisma.articleIdea.deleteMany({
                  where: {
                    clientId: client.id,
                    projectId: projectId,  // NIEUW: Alleen dit project
                    status: { in: ['written', 'published'] },
                    createdAt: { lt: thirtyDaysAgo }
                  }
                });

                sendUpdate('💾 Opslaan', 97, `${articleIdeasData.length} content ideeën opslaan...`);

                // Voeg nieuwe ideeën toe (duplicaten worden automatisch vermeden door slug)
                // CRITICAL: Use Promise.all to save all ideas in parallel AND wait for completion
                console.log(`   Saving ${articleIdeasData.length} ideas via upsert...`);
                const saveResults = await Promise.all(
                  articleIdeasData.map(ideaData => 
                    prisma.articleIdea.upsert({
                      where: {
                        clientId_slug: {
                          clientId: client.id,
                          slug: ideaData.slug,
                        }
                      },
                      update: {
                        // Update alleen als het een nieuwe versie is met betere info
                        secondaryKeywords: ideaData.secondaryKeywords,
                        contentOutline: ideaData.contentOutline,
                        aiScore: ideaData.aiScore,
                        trending: ideaData.trending,
                        competitorGap: ideaData.competitorGap,
                      },
                      create: ideaData,
                    }).catch((err) => {
                      console.error(`❌ Failed to save idea "${ideaData.title}":`, err);
                      return null; // Continue with other ideas
                    })
                  )
                );
                
                const successCount = saveResults.filter(r => r !== null).length;
                console.log(`✅ [CONTENT RESEARCH] ${successCount}/${articleIdeasData.length} ideas saved successfully!`);
                
                if (successCount === 0) {
                  throw new Error('Failed to save any ideas to database');
                }
              }
            } catch (saveError: any) {
              console.error('❌ Error saving to database:', saveError);
              sendUpdate('⚠️ Waarschuwing', 98, 'Database save fout - maar content is wel gegenereerd');
              // Don't throw - we still want to return the data even if save fails
            }
          } else {
            console.log(`ℹ️  [CONTENT RESEARCH] Keyword mode - skipping database save`);
          }

          sendUpdate('✅ Voltooid!', 98, `${contentPlan.summary.totalIdeas} content ideeën gegenereerd`);
          
          // Wait a bit to ensure the update is received
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // CRITICAL FIX: Send data in smaller chunks to avoid SSE payload limits
          // Instead of sending all data at once, send a completion signal and let frontend reload
          sendUpdate('✅ Voltooid!', 100, 'Klaar! Resultaten laden...');
          
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Send completion signal WITHOUT the large articleIdeas array
          sendData({
            type: 'complete',
            success: true,
            totalIdeas: contentPlan.summary.totalIdeas,
            message: `${contentPlan.summary.totalIdeas} content ideeën gegenereerd!`,
            // Don't send plan or articleIdeas - too large for SSE
            // Frontend will reload from database
          });
          
          // Small delay before closing to ensure message is sent
          await new Promise(resolve => setTimeout(resolve, 200));
          close();

        } catch (error: any) {
          console.error('❌ Error during streaming research:', error);
          sendUpdate('❌ Fout', 0, error.message);
          
          // Send error event so frontend knows to stop
          sendData({
            type: 'error',
            error: error.message,
            message: 'Er is een fout opgetreden tijdens de research.',
          });
          
          await new Promise(resolve => setTimeout(resolve, 200));
          close();
        }
      })();

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Non-streaming fallback (original behavior)
    const isKeywordMode = !projectId && keyword;
    
    let websiteUrl = '';
    let niche = '';
    let targetAudience = 'Nederlandse lezers';
    let keywords: string[] = [];

    if (isKeywordMode) {
      console.log(`🎯 Starting keyword-based content research for: "${keyword}"`);
      niche = keyword;
      keywords = [keyword];
    } else {
      if (!projectId) {
        return NextResponse.json({ error: 'projectId of keyword is required' }, { status: 400 });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId, clientId: client.id }
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      console.log(`🚀 Starting content research for project: ${project.name}`);
      
      websiteUrl = project.websiteUrl || '';
      niche = project.niche || project.name || 'algemeen';
      targetAudience = project.targetAudience || 'Nederlandse lezers';
      keywords = project.keywords || [];
    }

    // Get project name for research
    let projectName = 'Algemeen';
    if (!isKeywordMode && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, clientId: client.id }
      });
      projectName = project?.name || 'Onbekend Project';
    }

    const contentPlan: MasterContentPlan = await performCompleteContentResearch(
      websiteUrl,
      niche,
      targetAudience,
      keywords,
      projectName  // NEW: Pass project name
    );

    const articleIdeasData = contentPlan.contentIdeas.map(idea => ({
      clientId: client.id,
      projectId: projectId || null,  // NIEUW: Koppel aan specifiek project
      title: idea.title,
      slug: idea.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      focusKeyword: idea.focusKeyword,
      topic: idea.description,
      secondaryKeywords: idea.secondaryKeywords,
      searchIntent: idea.searchIntent,
      difficulty: idea.estimatedDifficulty,
      contentOutline: { sections: idea.outline.map(h2 => ({ heading: h2, subpoints: [] })) },
      contentType: idea.contentType,
      priority: idea.priority,
      aiScore: idea.trending ? 90 : (idea.competitorGap ? 80 : 70),
      trending: idea.trending,
      competitorGap: idea.competitorGap,
      status: 'idea',
    }));

    if (!isKeywordMode && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, clientId: client.id }
      });
      
      if (project) {
        await prisma.project.update({
          where: { id: project.id },
          data: {
            // Save website analysis separately (project-specific!)
            contentAnalysis: {
              websiteAnalysis: contentPlan.websiteAnalysis,
              competitorAnalysis: contentPlan.competitorAnalysis,
              trendingTopics: contentPlan.trendingTopics,
            } as any,
            contentAnalysisStatus: 'completed',
            contentAnalysisDate: new Date(),
            
            // Save full content strategy
            contentStrategy: contentPlan as any,
            contentStrategyStatus: 'completed',
            contentStrategyDate: new Date(),
          }
        });

        // BELANGRIJK: Behoud bestaande ideeën, voeg alleen nieuwe toe
        // Verwijder alleen ideeën die al geschreven of gepubliceerd zijn na 30 dagen
        // EN alleen van DIT project (niet van andere projecten!)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        await prisma.articleIdea.deleteMany({
          where: {
            clientId: client.id,
            projectId: projectId,  // NIEUW: Alleen dit project
            status: { in: ['written', 'published'] },
            createdAt: { lt: thirtyDaysAgo }
          }
        });

        // Voeg nieuwe ideeën toe (duplicaten worden automatisch vermeden door slug)
        for (const ideaData of articleIdeasData) {
          await prisma.articleIdea.upsert({
            where: {
              clientId_slug: {
                clientId: client.id,
                slug: ideaData.slug,
              }
            },
            update: {
              // Update alleen als het een nieuwe versie is met betere info
              secondaryKeywords: ideaData.secondaryKeywords,
              contentOutline: ideaData.contentOutline,
              aiScore: ideaData.aiScore,
              trending: ideaData.trending,
              competitorGap: ideaData.competitorGap,
            },
            create: ideaData,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      plan: contentPlan,
      articleIdeas: articleIdeasData,
      message: `${contentPlan.summary.totalIdeas} content ideeën gegenereerd!`,
    });

  } catch (error: any) {
    console.error('❌ Content research error:', error);
    return NextResponse.json({ 
      error: 'Content research failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// GET: Retrieve existing content plan
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Get project with content strategy
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get article ideas with saved content relation (PROJECT-SPECIFIC!)
    const articleIdeas = await prisma.articleIdea.findMany({
      where: { 
        clientId: client.id,
        projectId: projectId  // NIEUW: Filter op project!
      },
      include: {
        savedContent: {
          select: {
            id: true,
            publishedUrl: true,
            publishedAt: true,
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { aiScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        niche: project.niche,
      },
      contentStrategy: project.contentStrategy,
      articleIdeas,
      hasData: !!project.contentStrategy,
    });

  } catch (error: any) {
    console.error('❌ Get content plan error:', error);
    return NextResponse.json({ 
      error: 'Failed to get content plan', 
      details: error.message 
    }, { status: 500 });
  }
}
