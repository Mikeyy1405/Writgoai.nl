
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This endpoint will be called by a cron job to process project-specific autopilot runs
export async function POST(request: Request) {
  try {
    // Check for cron secret to secure the endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('[Project Autopilot] ❌ Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`[Project Autopilot] 🚀 Starting autopilot run at ${now.toISOString()}`);

    // Find all projects with autopilot enabled that need to run
    const projects = await prisma.project.findMany({
      where: {
        autopilotEnabled: true,
        OR: [
          { autopilotNextRun: null }, // Never run before
          { autopilotNextRun: { lte: now } }, // Time to run
        ],
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        articleIdeas: {
          where: {
            status: 'idea',
            hasContent: false,
          },
          orderBy: [
            { priority: 'asc' }, // high = 0, medium = 1, low = 2 (in most systems)
            { aiScore: 'desc' },
            { searchVolume: 'desc' },
          ],
        },
      },
    });

    console.log(`[Project Autopilot] Found ${projects.length} projects to process`);

    const results = [];

    for (const project of projects) {
      try {
        console.log(`[Project Autopilot] Processing project: ${project.name} (${project.id})`);

        // Filter articles based on priority setting
        let eligibleArticles = project.articleIdeas;
        
        if (project.autopilotPriority === 'high') {
          eligibleArticles = eligibleArticles.filter(a => a.priority === 'high');
        } else if (project.autopilotPriority === 'medium') {
          eligibleArticles = eligibleArticles.filter(a => 
            a.priority === 'high' || a.priority === 'medium'
          );
        }

        // Filter by content type if specified
        if (project.autopilotContentType && project.autopilotContentType !== 'all') {
          eligibleArticles = eligibleArticles.filter(a => 
            a.category === project.autopilotContentType ||
            a.topic?.toLowerCase().includes(project.autopilotContentType.toLowerCase())
          );
        }

        // Select articles to process (up to articlesPerRun)
        const articlesToProcess = eligibleArticles.slice(0, project.autopilotArticlesPerRun || 5);

        if (articlesToProcess.length === 0) {
          console.log(`[Project Autopilot] No eligible articles found for project ${project.id}`);
          
          // Update next run even if no articles were processed
          await prisma.project.update({
            where: { id: project.id },
            data: {
              autopilotLastRun: now,
              autopilotNextRun: calculateNextRun(now, project.autopilotFrequency),
            },
          });
          
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'no_articles',
            message: 'No eligible articles found',
          });
          continue;
        }

        // 🔍 RESEARCH MODE: If project uses research mode, perform keyword research FIRST
        if (project.autopilotMode === 'research') {
          console.log(`[Project Autopilot] 🔬 Research mode enabled for project ${project.name}`);
          
          // 🎯 STEP 1: Check existing WordPress content to avoid duplicates
          let existingTopics: Set<string> = new Set();
          
          // WordPress duplicate check uitgeschakeld (Content Optimizer verwijderd)
          if (project.wordpressUrl) {
            console.log(`[Project Autopilot] ℹ️ WordPress duplicate check is uitgeschakeld`);
          }
          
          // 🔍 STEP 2: Perform keyword research with timeout protection
          console.log(`[Project Autopilot] 🔎 Starting keyword research...`);
          
          try {
            const { performCompleteContentResearch } = await import('@/lib/intelligent-content-planner');
            
            // Add timeout protection for research (max 2 minutes)
            const researchTimeout = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Research timeout after 2 minutes')), 120000);
            });
            
            const researchPromise = performCompleteContentResearch(
              project.websiteUrl || '',
              project.niche || project.description || '',
              project.targetAudience || 'Algemeen publiek',
              [],
              project.name || 'Project'
            );
            
            const researchResult = await Promise.race([researchPromise, researchTimeout]) as any;

            // 🎯 STEP 3: Filter out duplicate topics and save new article ideas
            if (researchResult.contentIdeas && researchResult.contentIdeas.length > 0) {
              let savedCount = 0;
              let skippedCount = 0;
              
              for (const idea of researchResult.contentIdeas.slice(0, 20)) {
                // Check if this topic already exists on WordPress
                const normalizedTitle = idea.title.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .trim();
                
                // Check for overlap with existing content
                const isDuplicate = Array.from(existingTopics).some(existingTopic => {
                  // Check if titles are very similar (>70% overlap)
                  const words1 = normalizedTitle.split(/\s+/).filter(w => w.length > 3);
                  const words2 = existingTopic.split(/\s+/).filter(w => w.length > 3);
                  const overlap = words1.filter(w => words2.includes(w)).length;
                  const similarity = overlap / Math.max(words1.length, words2.length);
                  return similarity > 0.7;
                });
                
                if (isDuplicate) {
                  console.log(`[Project Autopilot] ⏭️ Skipping duplicate topic: ${idea.title}`);
                  skippedCount++;
                  continue;
                }
                
                // Generate unique slug
                let slug = idea.title
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 100);
                
                // 🔧 FIX: Check if slug already exists and make it unique
                let slugAttempt = 0;
                let uniqueSlug = slug;
                while (true) {
                  const existing = await prisma.articleIdea.findFirst({
                    where: {
                      clientId: project.clientId,
                      slug: uniqueSlug,
                    },
                  });
                  
                  if (!existing) break;
                  
                  slugAttempt++;
                  uniqueSlug = `${slug}-${slugAttempt}`;
                }
                
                await prisma.articleIdea.create({
                  data: {
                    clientId: project.clientId,
                    projectId: project.id,
                    title: idea.title,
                    slug: uniqueSlug,
                    focusKeyword: idea.focusKeyword,
                    secondaryKeywords: idea.secondaryKeywords || [],
                    topic: idea.title,
                    contentType: 'blog',
                    priority: idea.priority || 'medium',
                    status: 'idea',
                    aiScore: Math.round((100 - (idea.estimatedDifficulty || 50)) * 0.8),
                    trending: idea.trending || false,
                    competitorGap: idea.competitorGap || false,
                    seasonal: false,
                    searchIntent: idea.searchIntent || 'informational',
                    difficulty: idea.estimatedDifficulty || 50,
                    targetWordCount: 1500,
                    searchVolume: 0,
                  },
                });
                
                savedCount++;
                
                // Stop if we have enough new ideas
                if (savedCount >= 10) break;
              }

              console.log(`[Project Autopilot] ✅ Created ${savedCount} new article ideas from research`);
              console.log(`[Project Autopilot] ⏭️ Skipped ${skippedCount} duplicate topics`);
              
              // Reload article ideas after research
              const updatedProject = await prisma.project.findUnique({
                where: { id: project.id },
                include: {
                  articleIdeas: {
                    where: {
                      status: 'idea',
                      hasContent: false,
                    },
                    orderBy: [
                      { priority: 'asc' },
                      { aiScore: 'desc' },
                      { searchVolume: 'desc' },
                    ],
                  },
                },
              });

              if (updatedProject) {
                // Re-filter articles with updated list
                eligibleArticles = updatedProject.articleIdeas;
                
                if (project.autopilotPriority === 'high') {
                  eligibleArticles = eligibleArticles.filter(a => a.priority === 'high');
                } else if (project.autopilotPriority === 'medium') {
                  eligibleArticles = eligibleArticles.filter(a => 
                    a.priority === 'high' || a.priority === 'medium'
                  );
                }

                if (project.autopilotContentType && project.autopilotContentType !== 'all') {
                  eligibleArticles = eligibleArticles.filter(a => 
                    a.category === project.autopilotContentType ||
                    a.topic?.toLowerCase().includes(project.autopilotContentType.toLowerCase())
                  );
                }

                // Re-select articles
                articlesToProcess.length = 0; // Clear array
                articlesToProcess.push(...eligibleArticles.slice(0, project.autopilotArticlesPerRun || 5));
              }
            }
          } catch (researchError: any) {
            console.error(`[Project Autopilot] ⚠️ Research failed for project ${project.name}:`, researchError.message);
            console.log('[Project Autopilot] 📝 Continuing with existing article ideas...');
            // Continue anyway with existing article ideas
          }
        }
        
        // Double-check that we have articles to process
        if (articlesToProcess.length === 0) {
          console.log(`[Project Autopilot] ⚠️ No articles to process after filtering for project ${project.id}`);
          
          // Update next run even if no articles were processed
          await prisma.project.update({
            where: { id: project.id },
            data: {
              autopilotLastRun: now,
              autopilotNextRun: calculateNextRun(now, project.autopilotFrequency),
            },
          });
          
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'no_articles',
            message: 'No eligible articles found after filtering',
          });
          continue;
        }

        let successCount = 0;
        let failCount = 0;

        // Process each article
        for (const article of articlesToProcess) {
          try {
            console.log(`[Project Autopilot] Generating content for article: ${article.title}`);
            
            // Create job record for tracking
            const job = await prisma.autopilotJob.create({
              data: {
                client: { connect: { id: project.clientId } },
                articleId: article.id,
                projectId: project.id,
                status: 'generating',
                progress: 0,
                currentStep: 'Initializing...',
              },
            });

            // Generate content
            const generateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/client/autopilot/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleId: article.id,
                projectId: project.id,
                clientId: project.clientId,
                jobId: job.id,
                // ✅ Autopilot settings voor links en producten
                settings: {
                  includeBolcomProducts: true, // ✅ Altijd bol.com producten toevoegen in autopilot
                  includeAffiliateLinks: true, // ✅ Altijd affiliate links toevoegen in autopilot
                  includeImages: true,
                },
                // Pass SEO settings from project configuration
                includeFAQ: project.autopilotIncludeFAQ ?? false,
                includeDirectAnswer: project.autopilotIncludeDirectAnswer ?? true,
                includeYouTube: project.autopilotIncludeYouTube ?? false,
              }),
            });

            if (!generateResponse.ok) {
              throw new Error('Failed to generate content');
            }

            const generateData = await generateResponse.json();
            const contentId = generateData.contentId;

            // Update job status
            await prisma.autopilotJob.update({
              where: { id: job.id },
              data: {
                status: 'completed',
                progress: 100,
                currentStep: 'Content generated',
                contentId,
              },
            });

            // Publish to WordPress if enabled
            if (project.autopilotAutoPublish && project.wordpressUrl) {
              console.log(`[Project Autopilot] Publishing content to WordPress for article: ${article.title}`);
              
              await prisma.autopilotJob.update({
                where: { id: job.id },
                data: {
                  status: 'publishing',
                  currentStep: 'Publishing to WordPress...',
                },
              });

              const publishResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/client/autopilot/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contentId,
                  projectId: project.id,
                  clientId: project.clientId, // Pass clientId for authentication
                }),
              });

              if (!publishResponse.ok) {
                const errorData = await publishResponse.json().catch(() => ({ error: 'Unknown error' }));
                console.error(`[Project Autopilot] ❌ Publish failed with status ${publishResponse.status}:`, errorData);
                throw new Error(errorData.error || `Failed to publish content (HTTP ${publishResponse.status})`);
              }

              const publishData = await publishResponse.json();

              await prisma.autopilotJob.update({
                where: { id: job.id },
                data: {
                  status: 'completed',
                  publishedUrl: publishData.url,
                  currentStep: 'Published to WordPress',
                },
              });
            }

            successCount++;
          } catch (error: any) {
            console.error(`[Project Autopilot] Error processing article ${article.id}:`, error);
            failCount++;

            // Update job with error
            const existingJob = await prisma.autopilotJob.findFirst({
              where: {
                articleId: article.id,
                status: { in: ['pending', 'generating', 'publishing'] },
              },
            });

            if (existingJob) {
              await prisma.autopilotJob.update({
                where: { id: existingJob.id },
                data: {
                  status: 'failed',
                  error: error.message,
                },
              });
            }
          }

          // Small delay between articles to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Update project autopilot status
        await prisma.project.update({
          where: { id: project.id },
          data: {
            autopilotLastRun: now,
            autopilotNextRun: calculateNextRun(now, project.autopilotFrequency),
          },
        });

        results.push({
          projectId: project.id,
          projectName: project.name,
          processed: articlesToProcess.length,
          successful: successCount,
          failed: failCount,
        });

      } catch (error: any) {
        console.error(`[Project Autopilot] ❌ Error processing project ${project.id}:`, error);
        console.error(`[Project Autopilot] Error stack:`, error.stack);

        results.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message,
          status: 'error',
        });
      }
    }

    console.log(`[Project Autopilot] ✅ Autopilot run completed. Processed ${projects.length} projects`);
    console.log(`[Project Autopilot] Results summary:`, JSON.stringify(results, null, 2));

    return NextResponse.json({
      success: true,
      processed: projects.length,
      results,
      timestamp: now.toISOString(),
    });

  } catch (error: any) {
    console.error('[Project Autopilot] ❌ Fatal error:', error);
    console.error('[Project Autopilot] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run time based on frequency
function calculateNextRun(lastRun: Date, frequency: string | null): Date {
  const nextRun = new Date(lastRun);

  switch (frequency) {
    case 'twice_daily':
      // 2 keer per dag - elke 12 uur
      nextRun.setHours(nextRun.getHours() + 12);
      break;
      
    case 'daily':
      // 1 keer per dag
      nextRun.setDate(nextRun.getDate() + 1);
      break;
      
    case 'three_weekly':
      // 3 keer per week - elke ~2.3 dagen (Ma, Wo, Vr patroon)
      // We plannen om de 2 dagen, wat uitkomt op ~3.5x per week
      nextRun.setDate(nextRun.getDate() + 2);
      break;
      
    case 'weekdays':
      // Elke werkdag (Ma-Vr)
      nextRun.setDate(nextRun.getDate() + 1);
      // Skip weekends
      while (nextRun.getDay() === 0 || nextRun.getDay() === 6) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      // 1 keer per week
      nextRun.setDate(nextRun.getDate() + 7);
      break;
      
    case 'monthly':
      // 1 keer per maand
      nextRun.setMonth(nextRun.getMonth() + 1);
      break;
      
    default:
      // Default to weekly
      nextRun.setDate(nextRun.getDate() + 7);
  }

  return nextRun;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes
