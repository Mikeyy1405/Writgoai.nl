
/**
 * CRON Job: Automatic Content Generation
 * Runs daily to generate and publish content based on master plan
 * Handles: Articles, Instagram Reels, TikTok Reels, YouTube Shorts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateArticleWithLinks } from '@/lib/article-generator-v2';
import { publishToWordPress } from '@/lib/wordpress-publisher';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting automatic content generation...');

    const now = new Date();
    const results = {
      articlesGenerated: 0,
      instagramReelsGenerated: 0,
      tiktokReelsGenerated: 0,
      youtubeShortsGenerated: 0,
      errors: [] as string[],
    };

    // Get all active clients with master plans
    const clients = await prisma.client.findMany({
      where: {
        isActive: true,
        MasterContentPlan: {
          status: { in: ['READY', 'ACTIVE'] },
        },
      },
      include: {
        MasterContentPlan: {
          include: {
            MasterArticles: {
              where: {
                status: 'AVAILABLE',
                isReleased: false,
              },
              orderBy: { priority: 'desc' },
              take: 1, // Get next article to publish
            },
          },
        },
        AIProfile: true,
        AutoContentStrategy: true,
        WordPressConfig: true,
        SocialMediaCredentials: true,
      },
    });

    console.log(`[CRON] Found ${clients.length} active clients`);

    for (const client of clients) {
      try {
        const strategy = client.AutoContentStrategy;
        if (!strategy || !strategy.isEnabled) {
          console.log(`[CRON] Skipping ${client.name} - automation disabled`);
          continue;
        }

        const masterPlan = client.MasterContentPlan;
        if (!masterPlan || !masterPlan.seoStrategy) {
          console.log(`[CRON] Skipping ${client.name} - no master plan`);
          continue;
        }

        const fullPlan = JSON.parse(masterPlan.seoStrategy);

        // Check what content is due today
        const todayStr = now.toISOString().split('T')[0];

        // 1. Generate Articles
        const dueArticles = fullPlan.articles?.filter((a: any) => {
          const schedDate = new Date(a.scheduledDate).toISOString().split('T')[0];
          return schedDate === todayStr;
        }) || [];

        for (const articlePlan of dueArticles) {
          try {
            await generateAndPublishArticle(client, articlePlan);
            results.articlesGenerated++;
          } catch (error) {
            console.error(`[CRON] Error generating article for ${client.name}:`, error);
            results.errors.push(`Article error for ${client.name}: ${error}`);
          }
        }

        // 2. Generate Instagram/Facebook Reels
        const dueInstagramReels = fullPlan.instagramReels?.filter((r: any) => {
          const schedDate = new Date(r.scheduledDate).toISOString().split('T')[0];
          return schedDate === todayStr;
        }) || [];

        for (const reelPlan of dueInstagramReels) {
          try {
            await generateAndPublishReel(client, reelPlan, 'instagram');
            results.instagramReelsGenerated++;
          } catch (error) {
            console.error(`[CRON] Error generating Instagram reel for ${client.name}:`, error);
            results.errors.push(`Instagram reel error for ${client.name}: ${error}`);
          }
        }

        // 3. Generate TikTok Reels
        const dueTikTokReels = fullPlan.tiktokReels?.filter((r: any) => {
          const schedDate = new Date(r.scheduledDate).toISOString().split('T')[0];
          return schedDate === todayStr;
        }) || [];

        for (const reelPlan of dueTikTokReels) {
          try {
            await generateAndPublishReel(client, reelPlan, 'tiktok');
            results.tiktokReelsGenerated++;
          } catch (error) {
            console.error(`[CRON] Error generating TikTok reel for ${client.name}:`, error);
            results.errors.push(`TikTok reel error for ${client.name}: ${error}`);
          }
        }

        // 4. Generate YouTube Shorts
        const dueYouTubeShorts = fullPlan.youtubeShorts?.filter((s: any) => {
          const schedDate = new Date(s.scheduledDate).toISOString().split('T')[0];
          return schedDate === todayStr;
        }) || [];

        for (const shortPlan of dueYouTubeShorts) {
          try {
            await generateAndPublishReel(client, shortPlan, 'youtube');
            results.youtubeShortsGenerated++;
          } catch (error) {
            console.error(`[CRON] Error generating YouTube short for ${client.name}:`, error);
            results.errors.push(`YouTube short error for ${client.name}: ${error}`);
          }
        }

      } catch (error) {
        console.error(`[CRON] Error processing client ${client.name}:`, error);
        results.errors.push(`Client error for ${client.name}: ${error}`);
      }
    }

    console.log('[CRON] Automatic content generation completed', results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[CRON] Fatal error in auto-generate-content:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAndPublishArticle(client: any, articlePlan: any) {
  const profile = client.AIProfile;
  if (!profile) {
    throw new Error('No AI profile found');
  }

  console.log(`[CRON] Generating article: ${articlePlan.title}`);

  // Generate article content
  const articleContent = await generateArticleWithLinks({
    topic: articlePlan.topic,
    keywords: articlePlan.keywords,
    client: client,
    profile: profile,
    includeLinks: true,
  });

  // Save to database
  const publishedArticle = await prisma.publishedArticle.create({
    data: {
      clientId: client.id,
      title: articleContent.title,
      slug: articleContent.slug,
      content: articleContent.content,
      excerpt: articleContent.excerpt,
      seoTitle: articleContent.seoTitle,
      metaDescription: articleContent.metaDescription,
      keywords: articleContent.keywords,
      publishStatus: profile.autopilotEnabled ? 'PUBLISHED' : 'DRAFT',
      internalLinks: articleContent.internalLinks || [],
      externalLinks: articleContent.externalLinks || [],
    },
  });

  // Publish to WordPress if autopilot enabled
  if (profile.autopilotEnabled && client.WordPressConfig?.verified) {
    try {
      const wpResult = await publishToWordPress(
        {
          siteUrl: client.WordPressConfig.siteUrl,
          username: client.WordPressConfig.username,
          applicationPassword: client.WordPressConfig.applicationPassword,
        },
        {
          title: articleContent.title,
          content: articleContent.content,
          excerpt: articleContent.excerpt,
          status: 'publish',
        }
      );

      await prisma.publishedArticle.update({
        where: { id: publishedArticle.id },
        data: {
          wordpressPostId: wpResult.id,
          wordpressUrl: wpResult.link,
          publishStatus: 'PUBLISHED',
        },
      });

      console.log(`[CRON] Published article to WordPress: ${wpResult.link}`);
    } catch (error) {
      console.error('[CRON] Error publishing to WordPress:', error);
    }
  }

  return publishedArticle;
}

async function generateAndPublishReel(client: any, reelPlan: any, platform: 'instagram' | 'tiktok' | 'youtube') {
  console.log(`[CRON] Generating ${platform} reel: ${reelPlan.title}`);

  // Generate video using Vadoo API (faceless video)
  const vadooApiKey = process.env.VADOO_API_KEY;
  if (!vadooApiKey) {
    throw new Error('Vadoo API key not configured');
  }

  // Create video generation prompt
  const videoPrompt = `${reelPlan.hook}\n\n${reelPlan.topic}`;

  const vadooResponse = await fetch('https://api.vadoo.tv/videos/text-to-video', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${vadooApiKey}`,
    },
    body: JSON.stringify({
      prompt: videoPrompt,
      duration: platform === 'youtube' ? 60 : 45,
      voice: 'charlie',
      caption_theme: 'Hormozi_1',
      aspect_ratio: '9:16',
      language: 'English',
    }),
  });

  if (!vadooResponse.ok) {
    throw new Error(`Vadoo API error: ${vadooResponse.status}`);
  }

  const vadooData = await vadooResponse.json();

  // Store generated video
  const generatedVideo = await prisma.generatedVideo.create({
    data: {
      videoTopic: reelPlan.title,
      vadooVideoId: vadooData.video_id || vadooData.id,
      status: 'GENERATING',
      generationType: 'TEXT_TO_VIDEO',
      voice: 'charlie',
      captionTheme: 'Hormozi_1',
      language: 'English',
      aspectRatio: '9:16',
      title: reelPlan.title,
      description: reelPlan.topic,
      hashtags: reelPlan.keywords || [],
    },
  });

  console.log(`[CRON] ${platform} reel generation started:`, generatedVideo.id);

  // Note: Video generation is async. We'll need a webhook or polling to get the final video URL
  // and then post it to the social media platforms

  return generatedVideo;
}
