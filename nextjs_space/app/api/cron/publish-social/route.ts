import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-shim';
import { generateSocialContent } from '@/lib/services/aiml';
import { schedulePost } from '@/lib/services/getlatedev';

/**
 * POST /api/cron/publish-social
 * Cron job to automatically publish scheduled social media posts
 * 
 * This should be called daily (e.g., every hour) by a cron service
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔵 Running social media publishing cron job...');

    // Get current time
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all scheduled social posts that should be published now
    const scheduledPosts = await prisma.socialMediaPost.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          gte: now,
          lte: oneHourFromNow
        }
      }
    });

    console.log(`📱 Found ${scheduledPosts.length} scheduled social media posts to process`);

    let published = 0;
    let errors = 0;
    const results = [];

    for (const post of scheduledPosts) {
      try {
        console.log(`🔵 Processing social post: ${post.content?.substring(0, 50)}...`);

        // Get strategy and client info
        const strategy = await prisma.socialMediaStrategy.findUnique({
          where: { id: post.strategyId }
        });

        if (!strategy) {
          console.log(`⚠️ Skipping post ${post.id}: Strategy not found`);
          results.push({
            postId: post.id,
            status: 'skipped',
            reason: 'Strategy not found'
          });
          continue;
        }

        // Get project from client
        const project = await prisma.project.findFirst({
          where: { clientId: strategy.clientId }
        });

        if (!project) {
          console.log(`⚠️ Skipping post ${post.id}: Project not found`);
          results.push({
            postId: post.id,
            status: 'skipped',
            reason: 'Project not found'
          });
          continue;
        }

        // Check if autopilot is active
        const autopilot = await prisma.autopilotConfig.findFirst({
          where: { 
            clientId: strategy.clientId,
            enabled: true,
            type: 'social'
          }
        });

        if (!autopilot) {
          console.log(`⚠️ Skipping post ${post.id}: Autopilot not active`);
          results.push({
            postId: post.id,
            status: 'skipped',
            reason: 'Autopilot not active'
          });
          continue;
        }

        // Generate full content if needed (content might be just a topic)
        let content = post.content;
        let hashtags = post.hashtags || [];
        
        if (!content || content.length < 50) {
          console.log(`🤖 Generating social content for: ${post.content}`);
          const generated = await generateSocialContent({
            topic: post.content || 'Social media post',
            platform: post.platform,
            niche: strategy.niche || undefined,
            tone: strategy.tone || undefined
          });
          content = generated.content;
          hashtags = generated.hashtags;
          console.log(`✅ Content generated (${content.length} chars, ${hashtags.length} hashtags)`);
        }

        // Check if we have connected social accounts via Getlate
        const connectedAccounts = await prisma.connectedSocialAccount.findMany({
          where: { 
            clientId: strategy.clientId,
            platform: post.platform,
            isActive: true
          }
        });

        if (connectedAccounts.length === 0) {
          console.log(`⚠️ Skipping post ${post.id}: No connected accounts for ${post.platform}`);
          results.push({
            postId: post.id,
            status: 'skipped',
            reason: `No connected accounts for ${post.platform}`
          });
          continue;
        }

        // Publish via Getlate.dev
        console.log(`📤 Publishing to ${post.platform} via Getlate.dev`);
        
        // Create a complete DistributionTask object
        const now = new Date();
        const task = {
          id: `task_${post.id}_${Date.now()}`,
          content_id: post.id,
          client_id: strategy.clientId,
          platforms: [post.platform as any],
          scheduled_at: now,
          status: 'pending' as any,
          created_at: now,
          updated_at: now,
          metadata: {
            content: content,
            hashtags: hashtags.join(' '),
            preview: content.substring(0, 100)
          }
        };
        
        const jobId = await schedulePost(task);

        console.log(`✅ Scheduled on Getlate.dev:`, { jobId });

        // Update post in database
        await prisma.socialMediaPost.update({
          where: { id: post.id },
          data: {
            status: 'posted',
            publishedAt: new Date(),
            content: content,
            hashtags: hashtags,
            getlatePostId: jobId
          }
        });

        // Log success
        await prisma.autopilotLog.create({
          data: {
            projectId: project.id,
            action: 'social_published',
            status: 'success',
            postId: post.id,
            details: {
              postId: post.id,
              platform: post.platform,
              getlateJobId: jobId,
              contentPreview: content.substring(0, 100)
            }
          }
        });

        published++;
        results.push({
          postId: post.id,
          platform: post.platform,
          status: 'published',
          getlateJobId: jobId
        });

        console.log(`✅ Successfully published social post: ${post.platform}`);

      } catch (error: any) {
        console.error(`❌ Error publishing social post ${post.id}:`, error);
        
        // Get project for logging
        let projectId = null;
        try {
          const strategy = await prisma.socialMediaStrategy.findUnique({
            where: { id: post.strategyId }
          });
          if (strategy) {
            const project = await prisma.project.findFirst({
              where: { clientId: strategy.clientId }
            });
            projectId = project?.id;
          }
        } catch (e) {
          console.error('Error getting project for logging:', e);
        }

        // Log error
        if (projectId) {
          await prisma.autopilotLog.create({
            data: {
              projectId,
              action: 'social_publish_error',
              status: 'error',
              postId: post.id,
              errorMessage: error.message,
              details: { 
                postId: post.id,
                platform: post.platform,
                error: error.message 
              }
            }
          });
        }

        errors++;
        results.push({
          postId: post.id,
          platform: post.platform,
          status: 'error',
          error: error.message
        });
      }

      // Rate limiting: wait 3 seconds between posts
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`✅ Cron job complete: ${published} published, ${errors} errors`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total: scheduledPosts.length,
        published,
        errors,
        skipped: scheduledPosts.length - published - errors
      },
      results
    });

  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// Allow GET for manual testing
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      message: 'Add Authorization header with Bearer token'
    }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Social media publishing cron job endpoint',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}

// Enable dynamic route
export const dynamic = 'force-dynamic';
