
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {

  generateBlogPromoPost,
  generateProductHighlightPost,
  generateTipsPost,
  removeMarkdownForFacebook,
  generateSocialMediaImage,
} from '@/lib/social-media-content-generator';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client/social-media/generate-post
 * Generate social media post content using AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, platform, contentType, sourceData } = body;

    if (!projectId || !platform || !contentType) {
      return NextResponse.json(
        { error: 'Project ID, platform, and content type are required' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership and get config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.socialMediaConfig) {
      return NextResponse.json(
        { error: 'Social media not configured for this project' },
        { status: 400 }
      );
    }

    // Get project context
    const projectContext = {
      brandVoice: project.brandVoice || undefined,
      targetAudience: project.targetAudience || undefined,
      niche: project.niche || undefined,
      tone: project.socialMediaConfig.postTone || undefined,
      includeHashtags: project.socialMediaConfig.includeHashtags,
      includeEmojis: project.socialMediaConfig.includeEmojis,
    };

    let generatedPost;

    // Generate post based on content type
    switch (contentType) {
      case 'blog_promo':
        if (!sourceData?.title || !sourceData?.excerpt || !sourceData?.url) {
          return NextResponse.json(
            { error: 'Blog promo requires title, excerpt, and url' },
            { status: 400 }
          );
        }
        generatedPost = await generateBlogPromoPost(
          platform as any,
          {
            title: sourceData.title,
            excerpt: sourceData.excerpt,
            url: sourceData.url,
            keywords: sourceData.keywords || [],
          },
          projectContext
        );
        break;

      case 'product_highlight':
        if (!sourceData?.productName || !sourceData?.productUrl) {
          return NextResponse.json(
            { error: 'Product highlight requires productName and productUrl' },
            { status: 400 }
          );
        }
        generatedPost = await generateProductHighlightPost(
          platform as any,
          {
            productName: sourceData.productName,
            productUrl: sourceData.productUrl,
            benefits: sourceData.benefits || [],
            price: sourceData.price,
          },
          projectContext
        );
        break;

      case 'tips':
        if (!sourceData?.topic) {
          return NextResponse.json(
            { error: 'Tips post requires a topic' },
            { status: 400 }
          );
        }
        generatedPost = await generateTipsPost(
          platform as any,
          sourceData.topic,
          projectContext
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid content type' },
          { status: 400 }
        );
    }

    // Remove markdown for Facebook
    if (platform === 'facebook' && generatedPost.content) {
      generatedPost.content = removeMarkdownForFacebook(generatedPost.content);
    }

    // Generate AI image
    console.log('🎨 Generating AI image for social media post...');
    const imageS3Key = await generateSocialMediaImage(generatedPost.content, {
      niche: projectContext.niche,
      brandVoice: projectContext.brandVoice,
    });

    return NextResponse.json({
      success: true,
      post: {
        ...generatedPost,
        mediaUrl: imageS3Key,
      },
    });
  } catch (error) {
    console.error('Error generating social media post:', error);
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    );
  }
}
