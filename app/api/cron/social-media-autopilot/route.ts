

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  generateBlogPromoPost,
  generateProductHighlightPost,
  generateTipsPost,
} from '@/lib/social-media-content-generator';
import { publishToLateDev } from '@/lib/late-dev-api';

// Platform credit costs
const PLATFORM_CREDITS: { [key: string]: number } = {
  linkedin: 5,
  facebook: 4,
  instagram: 4,
  twitter: 3,
  youtube: 5,
};

/**
 * Social Media Autopilot Cron Job
 * Automatically generates and optionally publishes social media posts
 * based on project configuration and schedule
 */
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
    console.log(`[Social Media Autopilot] Starting cron job at ${now.toISOString()}`);

    // Find all projects with social media autopilot enabled and due for execution
    const configs = await prisma.socialMediaConfig.findMany({
      where: {
        autopilotEnabled: true,
        OR: [
          { nextScheduledRun: null }, // Never run before
          { nextScheduledRun: { lte: now } }, // Time to run
        ],
      },
      include: {
        project: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                name: true,
                subscriptionCredits: true,
                topUpCredits: true,
              },
            },
            articleIdeas: {
              where: {
                status: 'idea',
                hasContent: true,
              },
              orderBy: {
                updatedAt: 'desc',
              },
              take: 5,
            },
          },
        },
      },
    });

    console.log(`[Social Media Autopilot] Found ${configs.length} projects to process`);

    const results = [];

    for (const config of configs) {
      try {
        const project = config.project;
        console.log(`[Social Media Autopilot] Processing project: ${project.name} (${project.id})`);

        // Check if centralized WritgoAI API key is available
        if (!process.env.LATE_DEV_API_KEY) {
          console.log(`[Social Media Autopilot] No LATE_DEV_API_KEY configured in environment, skipping`);
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'skipped',
            message: 'WritgoAI Late.dev integration not configured',
          });
          continue;
        }

        // Get connected platforms from connectedAccounts
        if (!config.accountIds || config.accountIds.length === 0) {
          console.log(`[Social Media Autopilot] Project ${project.id} has no accounts selected`);
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'error',
            message: 'No accounts selected',
          });
          continue;
        }

        const connectedAccountsData = config.connectedAccounts as Record<string, any> || {};
        const connectedPlatforms = Object.entries(connectedAccountsData)
          .filter(([_, accountInfo]) => config.accountIds.includes(accountInfo.id))
          .map(([platform, _]) => platform);

        if (connectedPlatforms.length === 0) {
          console.log(`[Social Media Autopilot] Project ${project.id} has no valid platforms`);
          results.push({
            projectId: project.id,
            projectName: project.name,
            status: 'error',
            message: 'No valid platforms found',
          });
          continue;
        }

        // Determine number of posts to generate based on postsPerWeek and connected platforms
        const postsToGenerate = config.postsPerRun || 1;
        const generatedPosts = [];

        // Calculate next scheduled times based on schedule
        const scheduledTimes: Date[] = [];
        if (config.autoPublish || config.autoApprove) {
          const startDate = new Date(now);
          const [hours, minutes] = (config.scheduleTime || '09:00').split(':').map(Number);
          
          // Generate schedule times based on scheduleDays
          const daysMap: { [key: string]: number } = {
            sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
          };
          const scheduleDayNumbers = (config.scheduleDays || ['monday', 'wednesday', 'friday'])
            .map(day => daysMap[day.toLowerCase()])
            .sort((a, b) => a - b);
          
          let currentDate = new Date(startDate);
          while (scheduledTimes.length < postsToGenerate) {
            currentDate.setDate(currentDate.getDate() + 1);
            const dayOfWeek = currentDate.getDay();
            if (scheduleDayNumbers.includes(dayOfWeek)) {
              const scheduledTime = new Date(currentDate);
              scheduledTime.setHours(hours, minutes, 0, 0);
              scheduledTimes.push(scheduledTime);
            }
          }
        }

        for (let i = 0; i < postsToGenerate; i++) {
          // Select random content type from configured types
          const contentTypes = config.contentTypes || ['tips'];
          const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];

          let content = '';
          let sourceArticleId = null;
          let linkUrl = null;

          // Generate content based on type
          if (contentType === 'blog_promo' && project.articleIdeas.length > 0) {
            // Pick a random published article to promote
            const article = project.articleIdeas[Math.floor(Math.random() * project.articleIdeas.length)];
            const generatedPost = await generateBlogPromoPost(
              connectedPlatforms[0] as any, // Use first platform for generation
              {
                title: article.topic,
                excerpt: article.topic,
                url: `${project.websiteUrl}/${article.slug || article.id}`,
                keywords: article.focusKeyword ? [article.focusKeyword] : [],
              },
              {
                brandVoice: project.brandVoice || undefined,
                targetAudience: project.targetAudience || undefined,
                niche: project.niche || undefined,
                tone: config.postTone || 'professional',
                includeHashtags: config.includeHashtags,
                includeEmojis: config.includeEmojis,
              }
            );
            content = generatedPost.content;
            sourceArticleId = article.id;
            linkUrl = `${project.websiteUrl}/${article.slug || article.id}`;
          } else if (contentType === 'tips') {
            const generatedPost = await generateTipsPost(
              connectedPlatforms[0] as any, // Use first platform for generation
              project.niche || project.description || 'jouw niche',
              {
                brandVoice: project.brandVoice || undefined,
                targetAudience: project.targetAudience || undefined,
                niche: project.niche || undefined,
                tone: config.postTone || 'professional',
                includeHashtags: config.includeHashtags,
                includeEmojis: config.includeEmojis,
              }
            );
            content = generatedPost.content;
          }

          if (!content) {
            console.log(`[Social Media Autopilot] Failed to generate content for ${contentType}`);
            continue;
          }

          // Determine status and scheduled time
          const scheduledFor = scheduledTimes[i] || null;
          const status = (config.autoPublish || config.autoApprove) ? 'scheduled' : 'draft';

          // Create the post record with ALL connected platforms
          const post = await prisma.socialMediaPost.create({
            data: {
              projectId: project.id,
              platforms: connectedPlatforms, // All platforms at once
              content,
              contentType,
              sourceArticleId,
              linkUrl,
              status,
              scheduledFor,
            },
          });

          generatedPosts.push(post);

          // Auto-schedule/publish if enabled
          if (config.autoPublish && scheduledFor) {
            // Check if client has enough credits for all platforms
            const totalCredits = (project.client.subscriptionCredits || 0) + (project.client.topUpCredits || 0);
            const requiredCredits = connectedPlatforms.reduce((sum, platform) => sum + (PLATFORM_CREDITS[platform] || 0), 0);

            if (totalCredits >= requiredCredits) {
              // Schedule post to ALL connected platforms at once via Late.dev
              const platformStatuses: any = {};
              const platformPostIds: any = {};
              const platformErrors: any = {};
              let totalCreditsUsed = 0;

              for (const platform of connectedPlatforms) {
                try {
                  // Get account ID for platform from connectedAccounts
                  const connectedAccounts = config.connectedAccounts as Record<string, any> || {};
                  const accountInfo = connectedAccounts[platform];
                  const accountId = accountInfo?.id || null;

                  if (!accountId || !config.accountIds.includes(accountId)) {
                    platformStatuses[platform] = 'failed';
                    platformErrors[platform] = 'Account not configured for this project';
                    continue;
                  }

                  // Use Late.dev API with CENTRALIZED key
                  const mediaItems = post.mediaUrl ? [{ type: 'image', url: post.mediaUrl }] : [];
                  const result = await publishToLateDev({
                    accountIds: [accountId],
                    platforms: [{ platform, accountId }],
                    content: post.content,
                    mediaItems,
                    scheduledFor,
                    timezone: 'Europe/Amsterdam',
                    publishNow: false,
                  });

                  if (result.success) {
                    platformStatuses[platform] = 'scheduled';
                    platformPostIds[platform] = result.postId;
                    totalCreditsUsed += PLATFORM_CREDITS[platform] || 0;
                  } else {
                    platformStatuses[platform] = 'failed';
                    platformErrors[platform] = result.error || 'Unknown error';
                  }
                } catch (error: any) {
                  platformStatuses[platform] = 'failed';
                  platformErrors[platform] = error.message;
                  console.error(`[Social Media Autopilot] Error scheduling to ${platform}:`, error);
                }
              }

              // Determine overall status
              const allScheduled = Object.values(platformStatuses).every(s => s === 'scheduled');
              const someScheduled = Object.values(platformStatuses).some(s => s === 'scheduled');
              const overallStatus = allScheduled ? 'scheduled' : someScheduled ? 'partially_published' : 'failed';

              // Update post status
              await prisma.socialMediaPost.update({
                where: { id: post.id },
                data: {
                  status: overallStatus,
                  platformStatuses,
                  platformPostIds,
                  platformErrors: Object.keys(platformErrors).length > 0 ? platformErrors : null,
                  creditsUsed: totalCreditsUsed,
                },
              });

              // Deduct credits for scheduled posts
              if (totalCreditsUsed > 0) {
                const subscriptionCredits = project.client.subscriptionCredits || 0;
                const topUpCredits = project.client.topUpCredits || 0;

                let creditsToDeductFromSub = Math.min(subscriptionCredits, totalCreditsUsed);
                let creditsToDeductFromTopUp = totalCreditsUsed - creditsToDeductFromSub;

                await prisma.client.update({
                  where: { id: project.client.id },
                  data: {
                    subscriptionCredits: subscriptionCredits - creditsToDeductFromSub,
                    topUpCredits: topUpCredits - creditsToDeductFromTopUp,
                  },
                });

                // Record credit transaction
                await prisma.creditTransaction.create({
                  data: {
                    clientId: project.client.id,
                    amount: -totalCreditsUsed,
                    type: 'usage',
                    description: `Social media post scheduled to ${connectedPlatforms.join(', ')} for ${scheduledFor.toLocaleDateString('nl-NL')}`,
                    balanceAfter: (project.client.subscriptionCredits || 0) + (project.client.topUpCredits || 0) - totalCreditsUsed,
                  },
                });
              }

              console.log(`[Social Media Autopilot] Scheduled post ${post.id} for ${scheduledFor.toISOString()} with status: ${overallStatus}`);
            } else {
              console.log(`[Social Media Autopilot] Insufficient credits for project ${project.id}`);
              await prisma.socialMediaPost.update({
                where: { id: post.id },
                data: {
                  status: 'failed',
                  error: 'Insufficient credits',
                },
              });
            }
          }
        }

        // Update next scheduled run
        const nextRun = calculateNextRun(now, config.scheduleFrequency, config.scheduleDays, config.scheduleTime);
        await prisma.socialMediaConfig.update({
          where: { id: config.id },
          data: {
            lastAutopilotRun: now,
            nextScheduledRun: nextRun,
          },
        });

        results.push({
          projectId: project.id,
          projectName: project.name,
          status: 'success',
          postsGenerated: generatedPosts.length,
          postsPublished: generatedPosts.filter(p => p.status === 'published').length,
        });

        console.log(`[Social Media Autopilot] Successfully processed project ${project.id}`);
      } catch (error: any) {
        console.error(`[Social Media Autopilot] Error processing project ${config.project.id}:`, error);
        results.push({
          projectId: config.project.id,
          projectName: config.project.name,
          status: 'error',
          message: error.message,
        });
      }
    }

    console.log(`[Social Media Autopilot] Cron job completed. Processed ${configs.length} projects.`);

    return NextResponse.json({
      success: true,
      message: `Processed ${configs.length} projects`,
      results,
    });
  } catch (error: any) {
    console.error('[Social Media Autopilot] Fatal error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate next scheduled run based on frequency and settings
 */
function calculateNextRun(
  lastRun: Date,
  frequency: string,
  scheduleDays: string[],
  scheduleTime: string | null
): Date {
  const nextRun = new Date(lastRun);
  const [hours, minutes] = (scheduleTime || '09:00').split(':').map(Number);

  if (frequency === 'daily') {
    // Run every day at the scheduled time
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  } else if (frequency === 'weekly' || frequency === 'custom-days') {
    // Run on specific days of the week
    const daysMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    if (!scheduleDays || scheduleDays.length === 0) {
      // Default to next week if no days specified
      nextRun.setDate(nextRun.getDate() + 7);
      nextRun.setHours(hours, minutes, 0, 0);
      return nextRun;
    }

    // Find the next scheduled day
    const currentDay = nextRun.getDay();
    const scheduledDayNumbers = scheduleDays.map(day => daysMap[day.toLowerCase()]).sort((a, b) => a - b);

    let daysUntilNext = 7; // Default to next week
    for (const day of scheduledDayNumbers) {
      let diff = day - currentDay;
      if (diff <= 0) diff += 7; // Move to next week if day has passed
      if (diff < daysUntilNext) daysUntilNext = diff;
    }

    nextRun.setDate(nextRun.getDate() + daysUntilNext);
    nextRun.setHours(hours, minutes, 0, 0);
  } else {
    // Default to daily if unknown frequency
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  return nextRun;
}
