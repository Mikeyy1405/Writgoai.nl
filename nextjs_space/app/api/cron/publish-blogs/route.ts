import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma-shim';
import { generateBlogContent } from '@/lib/services/aiml';
import { publishToWordPress } from '@/lib/services/wordpress';

/**
 * POST /api/cron/publish-blogs
 * Cron job to automatically publish scheduled blog posts
 * 
 * This should be called daily (e.g., every hour) by a cron service like:
 * - Vercel Cron Jobs
 * - EasyCron
 * - Or manual deployment platform cron
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

    console.log('🔵 Running blog publishing cron job...');

    // Get current time
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Get all scheduled blog posts that should be published now
    const scheduledPosts = await prisma.blogPost.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          gte: now,
          lte: oneHourFromNow
        }
      }
    });

    console.log(`📝 Found ${scheduledPosts.length} scheduled blog posts to process`);

    let published = 0;
    let errors = 0;
    const results = [];

    for (const post of scheduledPosts) {
      try {
        console.log(`🔵 Processing post: ${post.title}`);

        // Get project
        const project = await prisma.project.findUnique({
          where: { id: post.projectId }
        });

        if (!project) {
          console.log(`⚠️ Skipping post ${post.id}: Project not found`);
          results.push({
            postId: post.id,
            title: post.title,
            status: 'skipped',
            reason: 'Project not found'
          });
          continue;
        }

        // Check if WordPress is configured
        if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
          console.log(`⚠️ Skipping post ${post.id}: WordPress not configured`);
          results.push({
            postId: post.id,
            title: post.title,
            status: 'skipped',
            reason: 'WordPress not configured'
          });
          continue;
        }

        // Check if autopilot is active
        const autopilot = await prisma.autopilotConfig.findFirst({
          where: { 
            projectId: post.projectId,
            enabled: true
          }
        });

        if (!autopilot) {
          console.log(`⚠️ Skipping post ${post.id}: Autopilot not active`);
          results.push({
            postId: post.id,
            title: post.title,
            status: 'skipped',
            reason: 'Autopilot not active'
          });
          continue;
        }

        // Generate full content if needed (content is just outline)
        let content = post.content;
        if (!content || content.length < 500) {
          console.log(`🤖 Generating full content for: ${post.title}`);
          content = await generateBlogContent({
            title: post.title,
            outline: post.content || '',
            niche: project.niche || undefined,
            targetAudience: project.targetAudience || undefined,
            keywords: post.keywords || [],
            tone: project.brandVoice || undefined
          });
          console.log(`✅ Content generated (${content.length} chars)`);
        }

        // Publish to WordPress
        console.log(`📤 Publishing to WordPress: ${post.title}`);
        const wpResult = await publishToWordPress({
          wordpressUrl: project.wordpressUrl,
          username: project.wordpressUsername,
          password: project.wordpressPassword,
          title: post.title,
          content: content,
          status: 'publish',
          excerpt: post.excerpt || undefined,
          categories: project.wordpressCategory ? [parseInt(project.wordpressCategory)] : undefined
        });

        console.log(`✅ Published to WordPress:`, {
          wordpressId: wpResult.id,
          link: wpResult.link
        });

        // Update post in database
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            wordpressId: wpResult.id.toString(),
            content: content
          }
        });

        // Log success
        await prisma.autopilotLog.create({
          data: {
            projectId: post.projectId,
            action: 'blog_published',
            status: 'success',
            postId: post.id,
            details: {
              postId: post.id,
              wordpressId: wpResult.id,
              title: post.title,
              link: wpResult.link
            }
          }
        });

        published++;
        results.push({
          postId: post.id,
          title: post.title,
          status: 'published',
          wordpressId: wpResult.id,
          link: wpResult.link
        });

        console.log(`✅ Successfully published: ${post.title}`);

      } catch (error: any) {
        console.error(`❌ Error publishing post ${post.id}:`, error);
        
        // Log error
        await prisma.autopilotLog.create({
          data: {
            projectId: post.projectId,
            action: 'blog_publish_error',
            status: 'error',
            postId: post.id,
            errorMessage: error.message,
            details: { 
              postId: post.id,
              error: error.message 
            }
          }
        });

        errors++;
        results.push({
          postId: post.id,
          title: post.title,
          status: 'error',
          error: error.message
        });
      }

      // Rate limiting: wait 2 seconds between posts
      await new Promise(resolve => setTimeout(resolve, 2000));
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
    message: 'Blog publishing cron job endpoint',
    status: 'ready',
    timestamp: new Date().toISOString()
  });
}

// Enable dynamic route
export const dynamic = 'force-dynamic';
