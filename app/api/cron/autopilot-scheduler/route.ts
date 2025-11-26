
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// This endpoint will be called by a cron job to process scheduled autopilot runs
export async function POST(request: Request) {
  try {
    // Check for cron secret to secure the endpoint
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();

    // Find all active schedules that need to run
    const schedules = await prisma.autopilotSchedule.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
            bolcomEnabled: true,
            bolcomClientId: true,
            bolcomClientSecret: true,
            bolcomAffiliateId: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`[Autopilot Scheduler] Found ${schedules.length} schedules to process`);

    const results = [];

    for (const schedule of schedules) {
      try {
        console.log(`[Autopilot Scheduler] Processing schedule: ${schedule.name} (${schedule.id})`);

        // Get articles to process
        const articlesToProcess = schedule.articleIds
          .filter(id => !schedule.processedArticleIds.includes(id))
          .slice(0, schedule.articlesPerRun);

        if (articlesToProcess.length === 0) {
          console.log(`[Autopilot Scheduler] No more articles to process for schedule ${schedule.id}`);
          
          // If it's a one-time schedule, deactivate it
          if (schedule.scheduleType === 'once') {
            await prisma.autopilotSchedule.update({
              where: { id: schedule.id },
              data: { isActive: false },
            });
          } else {
            // For recurring schedules, reset processed articles and schedule next run
            await prisma.autopilotSchedule.update({
              where: { id: schedule.id },
              data: {
                processedArticleIds: [],
                nextRunAt: calculateNextRun(schedule),
              },
            });
          }
          continue;
        }

        let successCount = 0;
        let failCount = 0;

        // Process each article
        for (const articleId of articlesToProcess) {
          try {
            // Generate content
            const generateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/client/autopilot/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                articleId,
                projectId: schedule.projectId,
              }),
            });

            if (!generateResponse.ok) {
              throw new Error('Failed to generate content');
            }

            const generateData = await generateResponse.json();
            const contentId = generateData.contentId;

            // Publish to WordPress if enabled
            if (schedule.autoPublish && schedule.project.wordpressUrl) {
              const publishResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/client/autopilot/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contentId,
                  projectId: schedule.projectId,
                }),
              });

              if (!publishResponse.ok) {
                throw new Error('Failed to publish content');
              }
            }

            successCount++;
          } catch (error) {
            console.error(`[Autopilot Scheduler] Error processing article ${articleId}:`, error);
            failCount++;
          }
        }

        // Update schedule
        const updatedProcessedIds = [
          ...schedule.processedArticleIds,
          ...articlesToProcess,
        ];

        const updateData: any = {
          lastRunAt: now,
          totalRuns: schedule.totalRuns + 1,
          successfulRuns: schedule.successfulRuns + successCount,
          failedRuns: schedule.failedRuns + failCount,
          processedArticleIds: updatedProcessedIds,
        };

        // Calculate next run for recurring schedules
        if (schedule.scheduleType !== 'once') {
          updateData.nextRunAt = calculateNextRun(schedule);
        } else {
          updateData.isActive = false;
        }

        await prisma.autopilotSchedule.update({
          where: { id: schedule.id },
          data: updateData,
        });

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          processed: articlesToProcess.length,
          successful: successCount,
          failed: failCount,
        });

      } catch (error: any) {
        console.error(`[Autopilot Scheduler] Error processing schedule ${schedule.id}:`, error);
        
        await prisma.autopilotSchedule.update({
          where: { id: schedule.id },
          data: {
            lastError: error.message,
            failedRuns: schedule.failedRuns + 1,
          },
        });

        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: schedules.length,
      results,
    });

  } catch (error: any) {
    console.error('[Autopilot Scheduler] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run time
function calculateNextRun(schedule: any): Date {
  const now = new Date();
  const [hours, minutes] = (schedule.timeOfDay || '09:00').split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  // Use frequency instead of scheduleType for better accuracy
  const frequency = schedule.frequency || schedule.scheduleType;

  switch (frequency) {
    case 'once-daily':
      // Run every day - already set to tomorrow if needed
      break;
      
    case 'twice-daily':
      // Run twice daily - this handles the first run time
      // The second run should be handled separately by checking secondTimeOfDay
      break;
      
    case 'three-weekly':
      // Run Monday (1), Wednesday (3), Friday (5)
      while (![1, 3, 5].includes(nextRun.getDay())) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'custom-days':
      // NEW: Run on specific days of the week
      if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
        // Find the next occurrence of any selected day
        while (!schedule.daysOfWeek.includes(nextRun.getDay())) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'weekly':
      if (schedule.dayOfWeek !== null && schedule.dayOfWeek !== undefined) {
        while (nextRun.getDay() !== schedule.dayOfWeek) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'monthly':
      if (schedule.dayOfMonth) {
        nextRun.setDate(schedule.dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;
      
    case 'custom':
      if (schedule.customInterval) {
        nextRun.setDate(nextRun.getDate() + schedule.customInterval);
      }
      break;
      
    // Legacy support for old schedule types
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;
  }

  return nextRun;
}
