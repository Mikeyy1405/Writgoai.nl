/**
 * WordPress Autopilot Scheduler Cron Job
 * Automatically generates and publishes scheduled content
 * 
 * Should run: Every 1 hour
 * Vercel Cron: 0 * * * * (every hour)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateBlog } from '@/lib/aiml-agent';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { getNextScheduledPosts, updateContentCalendarItem } from '@/lib/wordpress-autopilot/database';
import { deductCredits, CREDIT_COSTS } from '@/lib/credits';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('🤖 WordPress Autopilot Scheduler started');
    
    // Get next scheduled posts (due now)
    const scheduledPosts = await getNextScheduledPosts(5); // Process max 5 per run
    
    if (scheduledPosts.length === 0) {
      console.log('✅ No scheduled posts due at this time');
      return NextResponse.json({
        success: true,
        message: 'No posts scheduled',
        processed: 0,
      });
    }
    
    console.log(`📋 Found ${scheduledPosts.length} scheduled posts`);
    
    const results = [];
    
    for (const post of scheduledPosts) {
      try {
        console.log(`\n📝 Processing: ${post.title}`);
        
        // Get site
        const site = await prisma.wordPressAutopilotSite.findUnique({
          where: { id: post.siteId },
          include: {
            client: true,
          },
        });
        
        if (!site || site.status !== 'active') {
          console.log(`⏭️ Skipping - site not active`);
          continue;
        }
        
        // Check client credits
        const client = site.client;
        const totalCredits = client.subscriptionCredits + client.topUpCredits;
        
        if (!client.isUnlimited && totalCredits < CREDIT_COSTS.BLOG_POST) {
          console.log(`⚠️ Skipping - insufficient credits for client ${client.email}`);
          
          // Update status to failed
          await updateContentCalendarItem(post.id, {
            status: 'failed',
            error: 'Insufficient credits',
          });
          
          results.push({
            postId: post.id,
            title: post.title,
            success: false,
            error: 'Insufficient credits',
          });
          continue;
        }
        
        // Update status to generating
        await updateContentCalendarItem(post.id, {
          status: 'generating',
        });
        
        // Generate content
        const keywords = [post.focusKeyword, ...post.secondaryKeywords];
        
        console.log(`🧠 Generating content...`);
        const htmlContent = await generateBlog(
          post.title,
          keywords,
          'professioneel en informatief',
          site.name,
          {
            targetWordCount: 2000,
            language: (site.language || 'NL') as any,
            includeFAQ: true,
            includeDirectAnswer: true,
          }
        );
        
        console.log(`✅ Content generated`);
        
        // Save to SavedContent
        const savedContent = await prisma.savedContent.create({
          data: {
            clientId: client.id,
            type: 'blog',
            title: post.title,
            content: htmlContent,
            contentHtml: htmlContent,
            language: site.language || 'NL',
            keywords,
            generatorType: 'wordpress-autopilot-cron',
          },
        });
        
        // Update calendar item
        await updateContentCalendarItem(post.id, {
          status: 'generated',
          contentId: savedContent.id,
          generatedAt: new Date(),
        });
        
        // Publish to WordPress
        console.log(`🚀 Publishing to WordPress...`);
        
        const publishResult = await publishToWordPress(
          {
            siteUrl: site.siteUrl,
            username: site.username,
            applicationPassword: site.applicationPassword,
          },
          {
            title: post.title,
            content: htmlContent,
            excerpt: htmlContent.substring(0, 200).replace(/<[^>]+>/g, ''),
            status: 'publish',
            tags: keywords,
            focusKeyword: post.focusKeyword,
            useGutenberg: true,
          }
        );
        
        // Update calendar item with published info
        await updateContentCalendarItem(post.id, {
          status: 'published',
          publishedUrl: publishResult.link,
          publishedAt: new Date(),
          wordpressPostId: publishResult.id,
        });
        
        // Update site stats
        await prisma.wordPressAutopilotSite.update({
          where: { id: site.id },
          data: {
            totalPosts: { increment: 1 },
            lastPostDate: new Date(),
          },
        });
        
        // Deduct credits
        await deductCredits(
          client.id,
          CREDIT_COSTS.BLOG_POST,
          `WordPress Autopilot (Cron): ${post.title}`,
          { model: 'claude-sonnet-4' }
        );
        
        console.log(`✅ Published: ${publishResult.link}`);
        
        results.push({
          postId: post.id,
          title: post.title,
          success: true,
          url: publishResult.link,
        });
        
      } catch (error: any) {
        console.error(`❌ Failed to process post ${post.id}:`, error);
        
        // Update status to failed
        await updateContentCalendarItem(post.id, {
          status: 'failed',
          error: error.message || 'Processing failed',
        });
        
        results.push({
          postId: post.id,
          title: post.title,
          success: false,
          error: error.message,
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`\n✅ Scheduler completed`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
    
  } catch (error: any) {
    console.error('❌ Scheduler failed:', error);
    return NextResponse.json(
      { error: error.message || 'Scheduler failed' },
      { status: 500 }
    );
  }
}
