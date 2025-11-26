
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Manual Autopilot Run API
 * Allows users to trigger an immediate autopilot run for their project
 * Selects and generates articles based on project settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { projectId, articlesCount = 1, performResearch: manualResearch = false, language } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID verplicht' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get project with settings and article ideas
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        clientId: client.id, // Security: ensure project belongs to client
      },
      include: {
        articleIdeas: {
          where: {
            status: 'idea',
            hasContent: false,
          },
          orderBy: [
            { priority: 'asc' }, // high priority first
            { aiScore: 'desc' }, // then by AI score
            { searchVolume: 'desc' }, // then by search volume
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // 🔍 AUTO-ENABLE RESEARCH MODE based on project autopilot settings
    // If project autopilotMode is "research", always perform keyword research first
    const performResearch = manualResearch || project.autopilotMode === 'research';

    // 🔍 PERFORM KEYWORD RESEARCH IF REQUESTED
    if (performResearch) {
      console.log('🔍 Starting keyword research for project:', project.name);
      
      // Create a temporary job for tracking research progress
      const researchJob = await prisma.autopilotJob.create({
        data: {
          client: { connect: { id: client.id } },
          articleId: 'research-job-' + Date.now(), // Unique identifier for research job
          projectId: projectId,
          status: 'generating',
          progress: 5,
          currentStep: '🔍 Starting keyword research...',
        },
      });
      
      try {
        // 🎯 STEP 1: Check existing WordPress content to avoid duplicates
        let existingTopics: Set<string> = new Set();
        
        await prisma.autopilotJob.update({
          where: { id: researchJob.id },
          data: {
            progress: 15,
            currentStep: '📊 Analyseren bestaande WordPress content...',
          },
        });
        
        // WordPress duplicate check uitgeschakeld (Content Optimizer verwijderd)
        if (project.wordpressUrl) {
          console.log('ℹ️ WordPress duplicate check is uitgeschakeld');
        }
        
        // 🔍 STEP 2: Perform keyword research
        await prisma.autopilotJob.update({
          where: { id: researchJob.id },
          data: {
            progress: 30,
            currentStep: '🔍 Uitvoeren keyword research...',
          },
        });
        
        const { performCompleteContentResearch } = await import('@/lib/intelligent-content-planner');
        
        // Perform content research to find new keywords and topics
        const researchResult = await performCompleteContentResearch(
          project.websiteUrl || '',
          project.niche || project.description || '',
          project.targetAudience || 'Algemeen publiek',
          [], // primaryKeywords - will be discovered by the research
          project.name || 'Project'
        );
        
        await prisma.autopilotJob.update({
          where: { id: researchJob.id },
          data: {
            progress: 60,
            currentStep: `✅ ${researchResult.contentIdeas?.length || 0} keywords gevonden!`,
          },
        });

        // 🎯 STEP 3: Filter out duplicate topics and save new article ideas
        if (researchResult.contentIdeas && researchResult.contentIdeas.length > 0) {
          let savedCount = 0;
          let skippedCount = 0;
          
          for (const idea of researchResult.contentIdeas.slice(0, 10)) {
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
              console.log(`⏭️ Skipping duplicate topic: ${idea.title}`);
              skippedCount++;
              continue;
            }
            // Generate base slug from title
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
                  clientId: client.id,
                  slug: uniqueSlug,
                },
              });
              
              if (!existing) break;
              
              slugAttempt++;
              uniqueSlug = `${slug}-${slugAttempt}`;
            }
            
            await prisma.articleIdea.create({
              data: {
                clientId: client.id,
                projectId: projectId,
                title: idea.title,
                slug: uniqueSlug, // Use unique slug
                focusKeyword: idea.focusKeyword,
                secondaryKeywords: idea.secondaryKeywords || [],
                topic: idea.title, // Use title as topic
                contentType: 'blog',
                priority: idea.priority || 'medium',
                status: 'idea',
                aiScore: Math.round((100 - (idea.estimatedDifficulty || 50)) * 0.8), // Convert difficulty to score
                trending: idea.trending || false,
                competitorGap: idea.competitorGap || false,
                seasonal: false,
                searchIntent: idea.searchIntent || 'informational',
                difficulty: idea.estimatedDifficulty || 50,
                targetWordCount: 1500, // Default word count
                searchVolume: 0, // Not available from research
              },
            });
            
            savedCount++;
          }

          console.log(`✅ Created ${savedCount} new article ideas from research`);
          console.log(`⏭️ Skipped ${skippedCount} duplicate topics`);
          
          // Update progress with results
          await prisma.autopilotJob.update({
            where: { id: researchJob.id },
            data: {
              progress: 90,
              currentStep: `📝 ${savedCount} nieuwe artikelideeën opgeslagen! (${skippedCount} duplicaten overgeslagen)`,
            },
          });
        }

        // Update project research status
        await prisma.project.update({
          where: { id: projectId },
          data: {
            keywordResearchDate: new Date(),
            keywordResearchStatus: 'completed',
          },
        });
        
        // Mark research job as completed
        await prisma.autopilotJob.update({
          where: { id: researchJob.id },
          data: {
            status: 'completed',
            progress: 100,
            currentStep: '✅ Keyword research voltooid!',
            completedAt: new Date(),
          },
        });

      } catch (error: any) {
        console.error('❌ Keyword research failed:', error);
        
        // Mark research job as failed
        await prisma.autopilotJob.update({
          where: { id: researchJob.id },
          data: {
            status: 'failed',
            error: error.message,
            completedAt: new Date(),
          },
        });
        
        // Continue anyway - we'll use existing article ideas
      }

      // Reload article ideas after research
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
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
        project.articleIdeas = updatedProject.articleIdeas;
      }
    }

    // Filter articles based on project autopilot priority setting
    let eligibleArticles = project.articleIdeas;
    
    if (project.autopilotPriority === 'high') {
      eligibleArticles = eligibleArticles.filter(a => a.priority === 'high');
    } else if (project.autopilotPriority === 'medium') {
      eligibleArticles = eligibleArticles.filter(a => 
        a.priority === 'high' || a.priority === 'medium'
      );
    }
    // 'all' = no filtering

    // Filter by content type if specified
    if (project.autopilotContentType && project.autopilotContentType !== 'all') {
      eligibleArticles = eligibleArticles.filter(a => 
        a.category === project.autopilotContentType ||
        a.topic?.toLowerCase().includes(project.autopilotContentType.toLowerCase())
      );
    }

    if (eligibleArticles.length === 0) {
      return NextResponse.json({ 
        error: 'Geen geschikte artikelen gevonden',
        message: 'Er zijn geen artikel-ideeën die voldoen aan de autopilot instellingen voor dit project.'
      }, { status: 400 });
    }

    // Select articles to process (limited by articlesCount)
    const articlesToProcess = eligibleArticles.slice(0, Math.min(articlesCount, 5)); // Max 5 at once

    console.log(`🚀 Manual autopilot run started for project ${project.name}`);
    console.log(`📝 Selected ${articlesToProcess.length} articles to generate`);

    // Create autopilot jobs for each article
    const jobs = [];
    for (const article of articlesToProcess) {
      const job = await prisma.autopilotJob.create({
        data: {
          client: { connect: { id: client.id } },
          articleId: article.id,
          projectId: project.id,
          status: 'pending',
          progress: 0,
          currentStep: 'Wacht in wachtrij...',
        },
      });
      jobs.push(job);

      // Update article status to queued
      await prisma.articleIdea.update({
        where: { id: article.id },
        data: { status: 'queued' },
      });
    }

    // ✅ UPDATE LAST RUN TIMESTAMP
    // Dit zorgt ervoor dat de schedule check weet wanneer de laatste run was
    await prisma.project.update({
      where: { id: projectId },
      data: {
        autopilotLastRun: new Date(),
      },
    });
    
    console.log('✅ Updated project lastRun timestamp');

    // ✅ NIEUWE AANPAK: Start elk artikel ONAFHANKELIJK
    // Elk artikel krijgt zijn eigen API call die niet wacht op anderen
    // Dit voorkomt timeout problemen en zorgt dat alle artikelen starten
    const baseUrl = process.env.NEXTAUTH_URL || 'https://WritgoAI.nl';
    
    console.log(`🚀 Starting ${articlesToProcess.length} independent generation processes...`);
    
    // Start all articles immediately without waiting for completion
    for (let i = 0; i < articlesToProcess.length; i++) {
      const article = articlesToProcess[i];
      const job = jobs[i];
      
      // Fire and forget - each article generates independently
      fetch(`${baseUrl}/api/client/autopilot/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: article.id,
          projectId,
          clientId: client.id,
          settings: {
            includeBolcomProducts: true,
            includeImages: true,
            includeAffiliateLinks: true,
            language: language || project.language || 'NL', // Include language
          },
        }),
      }).catch(error => {
        console.error(`❌ Error starting generation for ${article.id}:`, error);
        // Mark as failed if we can't even start the request
        prisma.autopilotJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: 'Kon generatie niet starten: ' + (error.message || 'Unknown error'),
            completedAt: new Date(),
          },
        }).catch(e => console.error('Failed to mark job as failed:', e));
      });
      
      console.log(`✅ Started generation ${i + 1}/${articlesToProcess.length}: ${article.title}`);
    }

    return NextResponse.json({
      success: true,
      message: `${articlesToProcess.length} artikel(en) worden gegenereerd`,
      jobIds: jobs.map(j => j.id),
      articleIds: articlesToProcess.map(a => a.id),
      articlesCount: articlesToProcess.length,
    });

  } catch (error: any) {
    console.error('❌ Manual autopilot run failed:', error);
    return NextResponse.json(
      { error: error.message || 'Run mislukt' },
      { status: 500 }
    );
  }
}
