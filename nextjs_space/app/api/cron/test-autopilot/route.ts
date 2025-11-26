
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Test endpoint voor autopilot setup verificatie
 * Dit endpoint test of alles correct geconfigureerd is zonder daadwerkelijk content te genereren
 */
export async function POST(request: Request) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized',
          message: 'Invalid CRON_SECRET. Check Authorization header.',
        },
        { status: 401 }
      );
    }

    console.log('[Test Autopilot] 🧪 Running autopilot configuration test...');

    // Test 1: Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[Test Autopilot] ✅ Database connection OK');
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 2: Find autopilot-enabled projects
    const projects = await prisma.project.findMany({
      where: {
        autopilotEnabled: true,
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
          take: 5,
        },
      },
    });

    console.log(`[Test Autopilot] Found ${projects.length} autopilot-enabled projects`);

    // Test 3: Analyze each project
    const projectAnalysis = projects.map(project => {
      const eligibleArticles = project.articleIdeas.length;
      const hasWordPress = !!project.wordpressUrl;
      const autoPublish = project.autopilotAutoPublish;
      
      return {
        id: project.id,
        name: project.name,
        clientEmail: project.client.email,
        autopilotEnabled: project.autopilotEnabled,
        autopilotFrequency: project.autopilotFrequency,
        autopilotMode: project.autopilotMode,
        autopilotLastRun: project.autopilotLastRun,
        autopilotNextRun: project.autopilotNextRun,
        eligibleArticles,
        articlesPerRun: project.autopilotArticlesPerRun,
        hasWordPress,
        autoPublish,
        status: eligibleArticles === 0 ? '⚠️ No articles to process' :
                !hasWordPress && autoPublish ? '⚠️ Auto-publish enabled but no WordPress URL' :
                '✅ Ready to run',
      };
    });

    // Test 4: Check recent autopilot jobs
    const recentJobs = await prisma.autopilotJob.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
    });

    // Test 5: Environment check
    const envCheck = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
      CRON_SECRET: process.env.CRON_SECRET ? '✅ Set' : '❌ Not set',
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Not set',
    };

    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Autopilot configuration test completed',
      statistics: {
        totalProjects: projects.length,
        projectsReady: projectAnalysis.filter(p => p.status.includes('✅')).length,
        projectsWithIssues: projectAnalysis.filter(p => p.status.includes('⚠️')).length,
        totalEligibleArticles: projectAnalysis.reduce((sum, p) => sum + p.eligibleArticles, 0),
        recentJobsCount: recentJobs.length,
      },
      projects: projectAnalysis,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        projectId: job.projectId,
        articleId: job.articleId,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      })),
      environment: envCheck,
    };

    console.log('[Test Autopilot] ✅ Test completed successfully');
    console.log('[Test Autopilot] Summary:', JSON.stringify(summary, null, 2));

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('[Test Autopilot] ❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing in browser
export async function GET(request: Request) {
  return POST(request);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

