'use server';

/**
 * 🤖 AutoPilot Server Actions
 * 
 * Consolidates all AutoPilot automation functionality:
 * - Scheduling and configuration
 * - Manual triggers
 * - Job tracking and monitoring
 * - Article idea scheduling
 * 
 * Replaces 5+ API routes:
 * - /api/client/autopilot/start
 * - /api/client/autopilot/schedule
 * - /api/client/autopilot/status
 * - /api/client/article-ideas/schedule
 * - /api/client/autopilot/run-now
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { runAutoPilotJob } from '@/lib/autopilot/autopilot-orchestrator';

// ═════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════

export interface ScheduleAutoPilotInput {
  projectId: string;
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  mode: 'quick' | 'research' | 'premium';
  articlesPerRun: number;
  autoPublish: boolean;
  publishingDays?: string[];
  publishingTime?: string;
}

export interface AutoPilotConfig {
  enabled: boolean;
  frequency: string;
  mode: string;
  articlesPerRun: number;
  autoPublish: boolean;
  publishingDays?: string[];
  publishingTime?: string;
  nextRun?: Date;
}

export interface RunAutoPilotResult {
  success: boolean;
  results: Array<{
    ideaId: string;
    success: boolean;
    contentId?: string;
    error?: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════
// AUTOPILOT SCHEDULING
// ═════════════════════════════════════════════════════════════════════

/**
 * ⚙️ Schedule AutoPilot
 * 
 * Configure automatic content generation
 */
export async function scheduleAutoPilot(
  input: ScheduleAutoPilotInput
): Promise<{ success: boolean; config: AutoPilotConfig; nextRun: Date }> {
  try {
    const client = await getAuthenticatedClient();

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    // Calculate next run time
    const nextRun = calculateNextRun(input.frequency, input.publishingTime);

    // Update or create AutoPilot config in project
    await prisma.project.update({
      where: { id: input.projectId },
      data: {
        autoPilotEnabled: input.enabled,
        autoPilotFrequency: input.frequency,
        autoPilotMode: input.mode,
        autoPilotArticlesPerRun: input.articlesPerRun,
        autoPilotAutoPublish: input.autoPublish,
        autoPilotPublishingDays: input.publishingDays || [],
        autoPilotPublishingTime: input.publishingTime || '09:00',
        autoPilotNextRun: input.enabled ? nextRun : null,
      },
    });

    revalidatePath(`/client-portal/projects/${input.projectId}`);
    revalidatePath('/client-portal/autopilot');

    console.log(`⚙️ AutoPilot configured for project ${input.projectId}: ${input.enabled ? 'enabled' : 'disabled'}`);

    return {
      success: true,
      config: {
        enabled: input.enabled,
        frequency: input.frequency,
        mode: input.mode,
        articlesPerRun: input.articlesPerRun,
        autoPublish: input.autoPublish,
        publishingDays: input.publishingDays,
        publishingTime: input.publishingTime,
        nextRun: input.enabled ? nextRun : undefined,
      },
      nextRun,
    };
  } catch (error: any) {
    console.error('❌ Error scheduling AutoPilot:', error);
    throw new Error(error.message || 'Fout bij configureren van AutoPilot');
  }
}

/**
 * Calculate next run time based on frequency
 */
function calculateNextRun(
  frequency: 'daily' | 'weekly' | 'monthly' | 'once',
  time?: string
): Date {
  const now = new Date();
  const [hours, minutes] = (time || '09:00').split(':').map(Number);

  const nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  // If time has passed today, move to next occurrence
  if (nextRun <= now) {
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
      case 'once':
        nextRun.setMinutes(nextRun.getMinutes() + 5); // Run in 5 minutes
        break;
    }
  }

  return nextRun;
}

// ═════════════════════════════════════════════════════════════════════
// MANUAL EXECUTION
// ═════════════════════════════════════════════════════════════════════

/**
 * ▶️ Run AutoPilot Now
 * 
 * Manually trigger AutoPilot for a project
 */
export async function runAutoPilotNow(
  projectId: string
): Promise<RunAutoPilotResult> {
  try {
    const client = await getAuthenticatedClient();

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    console.log(`▶️ Running AutoPilot now for project ${projectId}`);

    // Get article ideas that are ready for generation
    const articleIdeas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId: client.id,
        status: 'idea',
        isScheduledForAutopilot: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: project.autoPilotArticlesPerRun || 1,
    });

    if (articleIdeas.length === 0) {
      throw new Error('Geen article ideas gevonden om te genereren');
    }

    const results: RunAutoPilotResult['results'] = [];

    // Process each idea
    for (const idea of articleIdeas) {
      try {
        console.log(`🤖 Processing article idea: ${idea.title}`);

        // Run AutoPilot job
        await runAutoPilotJob(idea.id, client.id);

        // Get the generated content
        const savedContent = await prisma.savedContent.findFirst({
          where: {
            clientId: client.id,
            title: idea.title,
          },
          orderBy: { createdAt: 'desc' },
        });

        results.push({
          ideaId: idea.id,
          success: true,
          contentId: savedContent?.id,
        });

        // Update idea status
        await prisma.articleIdea.update({
          where: { id: idea.id },
          data: {
            status: 'completed',
            generatedAt: new Date(),
          },
        });
      } catch (ideaError: any) {
        console.error(`❌ Error processing idea ${idea.id}:`, ideaError);
        results.push({
          ideaId: idea.id,
          success: false,
          error: ideaError.message,
        });
      }
    }

    revalidatePath(`/client-portal/projects/${projectId}`);
    revalidatePath('/client-portal/content-library');

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ AutoPilot completed: ${successCount}/${results.length} successful`);

    return {
      success: true,
      results,
    };
  } catch (error: any) {
    console.error('❌ Error running AutoPilot:', error);
    throw new Error(error.message || 'Fout bij uitvoeren van AutoPilot');
  }
}

// ═════════════════════════════════════════════════════════════════════
// STATUS & MONITORING
// ═════════════════════════════════════════════════════════════════════

/**
 * 📊 Get AutoPilot Status
 * 
 * Get current AutoPilot configuration and status for a project
 */
export async function getAutoPilotStatus(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        autoPilotEnabled: true,
        autoPilotFrequency: true,
        autoPilotMode: true,
        autoPilotArticlesPerRun: true,
        autoPilotAutoPublish: true,
        autoPilotPublishingDays: true,
        autoPilotPublishingTime: true,
        autoPilotNextRun: true,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden of geen toegang');
    }

    // Get recent jobs
    const recentJobs = await prisma.autoPilotJob.findMany({
      where: {
        projectId,
        clientId: client.id,
      },
      orderBy: { startedAt: 'desc' },
      take: 10,
      include: {
        articleIdea: {
          select: {
            title: true,
          },
        },
      },
    });

    // Get scheduled article ideas
    const scheduledIdeas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId: client.id,
        isScheduledForAutopilot: true,
        status: 'idea',
      },
      select: {
        id: true,
        title: true,
        priority: true,
        scheduledFor: true,
      },
      orderBy: { priority: 'desc' },
    });

    return {
      success: true,
      config: {
        enabled: project.autoPilotEnabled || false,
        frequency: project.autoPilotFrequency || 'weekly',
        mode: project.autoPilotMode || 'quick',
        articlesPerRun: project.autoPilotArticlesPerRun || 1,
        autoPublish: project.autoPilotAutoPublish || false,
        publishingDays: project.autoPilotPublishingDays || [],
        publishingTime: project.autoPilotPublishingTime || '09:00',
        nextRun: project.autoPilotNextRun,
      },
      recentJobs,
      scheduledIdeas,
    };
  } catch (error: any) {
    console.error('❌ Error getting AutoPilot status:', error);
    throw new Error('Fout bij ophalen van AutoPilot status');
  }
}

/**
 * 📋 Get AutoPilot Jobs
 * 
 * List all AutoPilot jobs for a project
 */
export async function getAutoPilotJobs(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    const jobs = await prisma.autoPilotJob.findMany({
      where: {
        projectId,
        clientId: client.id,
      },
      include: {
        articleIdea: {
          select: {
            title: true,
            focusKeyword: true,
          },
        },
        savedContent: {
          select: {
            id: true,
            title: true,
            status: true,
            publishedUrl: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    });

    return {
      success: true,
      jobs,
    };
  } catch (error: any) {
    console.error('❌ Error fetching AutoPilot jobs:', error);
    throw new Error('Fout bij ophalen van AutoPilot jobs');
  }
}

/**
 * ❌ Cancel AutoPilot Job
 * 
 * Cancel a running AutoPilot job
 */
export async function cancelAutoPilotJob(jobId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify job ownership
    const job = await prisma.autoPilotJob.findFirst({
      where: {
        id: jobId,
        clientId: client.id,
      },
    });

    if (!job) {
      throw new Error('Job niet gevonden of geen toegang');
    }

    if (job.status === 'completed' || job.status === 'failed') {
      throw new Error('Job is al voltooid of gefaald');
    }

    // Update job status
    await prisma.autoPilotJob.update({
      where: { id: jobId },
      data: {
        status: 'cancelled',
        completedAt: new Date(),
        currentStep: 'Cancelled by user',
      },
    });

    revalidatePath(`/client-portal/projects/${job.projectId}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error cancelling AutoPilot job:', error);
    throw new Error('Fout bij annuleren van AutoPilot job');
  }
}

// ═════════════════════════════════════════════════════════════════════
// ARTICLE IDEA SCHEDULING
// ═════════════════════════════════════════════════════════════════════

/**
 * 📅 Schedule Article Idea
 * 
 * Schedule an article idea for AutoPilot generation
 */
export async function scheduleArticleIdea(
  ideaId: string,
  frequency: 'once' | 'daily' | 'weekly' | 'monthly'
) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      throw new Error('Idee niet gevonden of geen toegang');
    }

    const nextRun = calculateNextRun(frequency);

    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: {
        isScheduledForAutopilot: true,
        autopilotFrequency: frequency,
        autopilotNextRun: nextRun,
        scheduledFor: nextRun,
      },
    });

    revalidatePath(`/client-portal/projects/${idea.projectId}`);

    console.log(`📅 Article idea scheduled: ${idea.title} for ${nextRun}`);

    return {
      success: true,
      nextRun,
    };
  } catch (error: any) {
    console.error('❌ Error scheduling article idea:', error);
    throw new Error('Fout bij inplannen van article idea');
  }
}

/**
 * 📋 Get Scheduled Ideas
 * 
 * List all scheduled article ideas for a project
 */
export async function getScheduledIdeas(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    const ideas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId: client.id,
        isScheduledForAutopilot: true,
      },
      orderBy: [
        { autopilotNextRun: 'asc' },
        { priority: 'desc' },
      ],
    });

    return {
      success: true,
      ideas,
    };
  } catch (error: any) {
    console.error('❌ Error fetching scheduled ideas:', error);
    throw new Error('Fout bij ophalen van geplande ideas');
  }
}

/**
 * 🔄 Unschedule Article Idea
 * 
 * Remove article idea from AutoPilot schedule
 */
export async function unscheduleArticleIdea(ideaId: string) {
  try {
    const client = await getAuthenticatedClient();

    // Verify ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      throw new Error('Idee niet gevonden of geen toegang');
    }

    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: {
        isScheduledForAutopilot: false,
        autopilotFrequency: null,
        autopilotNextRun: null,
        scheduledFor: null,
      },
    });

    revalidatePath(`/client-portal/projects/${idea.projectId}`);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error unscheduling article idea:', error);
    throw new Error('Fout bij uitschakelen van planning');
  }
}
