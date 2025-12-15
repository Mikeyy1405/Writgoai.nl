
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  generateBlogPromoPost,
  generateTipsPost,
  removeMarkdownForFacebook,
  generateSocialMediaImage,
} from '@/lib/social-media-content-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client/social-media/autopilot-run
 * Run social media autopilot for a project (generate and schedule posts)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get project with config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      include: {
        socialMediaConfig: true,
        articleIdeas: {
          where: {
            status: 'published',
            hasContent: true,
          },
          orderBy: {
            publishedAt: 'desc',
          },
          take: 5, // Get last 5 published articles
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.socialMediaConfig?.autopilotEnabled) {
      return NextResponse.json(
        { error: 'Social media autopilot not enabled' },
        { status: 400 }
      );
    }

    const config = project.socialMediaConfig;

    // Get project context
    const projectContext = {
      brandVoice: project.brandVoice || undefined,
      targetAudience: project.targetAudience || undefined,
      niche: project.niche || undefined,
      tone: config.postTone || undefined,
      includeHashtags: config.includeHashtags,
      includeEmojis: config.includeEmojis,
    };

    const generatedPosts: any[] = [];
    const errors: string[] = [];

    // Check if any accounts are selected
    if (!config.accountIds || config.accountIds.length === 0) {
      return NextResponse.json(
        { error: 'Geen social media accounts geselecteerd. Configureer eerst je accounts in de project instellingen.' },
        { status: 400 }
      );
    }

    // Get platform info from connected accounts
    const connectedAccounts = config.connectedAccounts as Record<string, any> || {};
    const selectedPlatforms = Object.entries(connectedAccounts)
      .filter(([_, accountInfo]) => config.accountIds.includes(accountInfo.id))
      .map(([platform, _]) => platform);

    // Calculate scheduled times if autoApprove is enabled
    const scheduledTimes: Date[] = [];
    if (config.autoApprove || config.autoPublish) {
      const now = new Date();
      const [hours, minutes] = (config.scheduleTime || '09:00').split(':').map(Number);
      
      // Generate schedule times based on scheduleDays
      const daysMap: { [key: string]: number } = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
      };
      const scheduleDayNumbers = (config.scheduleDays || ['monday', 'wednesday', 'friday'])
        .map((day: string) => daysMap[day.toLowerCase()])
        .filter((d: number | undefined): d is number => d !== undefined)
        .sort((a, b) => a - b);
      
      let currentDate = new Date(now);
      const postsToGenerate = config.contentTypes?.length || 1;
      
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

    // Generate posts for each content type (one post per content type for all platforms)
    let postIndex = 0;
    for (const contentType of config.contentTypes) {
      try {
        let contentText = '';
        let linkUrl = null;
        let sourceArticleId = null;

        // Use first platform for generation (content will be the same across platforms)
        const primaryPlatform = selectedPlatforms[0];

        if (contentType === 'blog_promo' && project.articleIdeas.length > 0) {
          // Pick a recent article
          const article = project.articleIdeas[Math.floor(Math.random() * project.articleIdeas.length)];
          
          const generatedPost = await generateBlogPromoPost(
            primaryPlatform as any,
            {
              title: article.title,
              excerpt: article.notes || article.topic,
              url: `${project.websiteUrl}/${article.slug}`,
              keywords: article.secondaryKeywords || [],
            },
            projectContext
          );

          contentText = generatedPost.content;
          linkUrl = `${project.websiteUrl}/${article.slug}`;
          sourceArticleId = article.id;
        } else if (contentType === 'tips') {
          // Generate tips post
          const topic = project.niche || project.targetAudience || 'algemene tips';
          
          const generatedPost = await generateTipsPost(
            primaryPlatform as any,
            topic,
            projectContext
          );

          contentText = generatedPost.content;
        }

        if (contentText) {
          // Remove markdown for Facebook if Facebook is in selected platforms
          const finalContent = selectedPlatforms.includes('facebook') 
            ? removeMarkdownForFacebook(contentText) 
            : contentText;
          
          console.log('🎨 Generating AI image for social media post...');
          
          // Generate AI image for this post
          const imageS3Key = await generateSocialMediaImage(finalContent, {
            niche: projectContext.niche,
            brandVoice: projectContext.brandVoice,
          });
          
          // Determine status and scheduled time
          const scheduledFor = scheduledTimes[postIndex] || null;
          const status = (config.autoApprove || config.autoPublish) && scheduledFor ? 'scheduled' : 'draft';
          
          // Create ONE post for ALL platforms
          const dbPost = await prisma.socialMediaPost.create({
            data: {
              projectId,
              platforms: selectedPlatforms, // Multi-platform post
              content: finalContent,
              mediaUrl: imageS3Key || undefined, // AI-generated image
              linkUrl: linkUrl,
              contentType: contentType,
              sourceArticleId: sourceArticleId,
              status: status,
              scheduledFor: scheduledFor,
            },
          });

          generatedPosts.push({
            id: dbPost.id,
            platforms: selectedPlatforms,
            contentType,
            status,
            scheduledFor: scheduledFor ? scheduledFor.toISOString() : null,
            preview: finalContent.substring(0, 100) + '...',
            hasImage: !!imageS3Key,
          });
          
          postIndex++;
        }
      } catch (error: any) {
        console.error(`Error generating ${contentType} post:`, error);
        errors.push(`${contentType}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedPosts.length,
      posts: generatedPosts,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error running social media autopilot:', error);
    return NextResponse.json(
      { error: 'Failed to run autopilot' },
      { status: 500 }
    );
  }
}
