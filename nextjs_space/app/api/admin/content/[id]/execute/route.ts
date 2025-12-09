
import { NextRequest, NextResponse } from 'next/server';
import { generateDailyContentForClient } from '@/lib/professional-content-generator';
import { prisma } from '@/lib/db';


export const maxDuration = 300; // 5 minutes

/**
 * Execute content generation for a specific content piece
 * POST /api/admin/content/[id]/execute
 * Body: { contentTypes: ['blog', 'social', 'tiktok', 'youtube'] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contentId = params.id;
    const body = await request.json();
    const contentTypes: string[] = body.contentTypes || [];
    
    console.log(`🎯 Manual execution requested for content ${contentId}`);
    console.log(`📋 Content types: ${contentTypes.join(', ') || 'all'}`);
    
    // Find the content piece
    const contentPiece = await prisma.contentPiece.findUnique({
      where: { id: contentId },
      include: { client: true }
    });
    
    if (!contentPiece) {
      return NextResponse.json(
        { error: 'Content piece not found' },
        { status: 404 }
      );
    }
    
    // Update status to generating
    await prisma.contentPiece.update({
      where: { id: contentId },
      data: {
        status: 'generating',
        error: null
      }
    });
    
    // Generate content for this specific content piece
    try {
      // We'll need to modify the generator to support specific content piece execution
      // For now, we'll generate new content and update the existing piece
      
      const result = await generateContentForPiece(contentPiece, contentTypes);
      
      if (result) {
        return NextResponse.json({
          success: true,
          message: 'Content generated successfully',
          contentPiece: result
        });
      } else {
        await prisma.contentPiece.update({
          where: { id: contentId },
          data: {
            status: 'failed',
            error: 'Failed to generate content'
          }
        });
        
        return NextResponse.json(
          { error: 'Failed to generate content' },
          { status: 500 }
        );
      }
    } catch (genError) {
      console.error('❌ Content generation error:', genError);
      
      await prisma.contentPiece.update({
        where: { id: contentId },
        data: {
          status: 'failed',
          error: genError instanceof Error ? genError.message : 'Unknown error'
        }
      });
      
      return NextResponse.json(
        { 
          error: 'Content generation failed',
          details: genError instanceof Error ? genError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ Execute API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to execute content generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate content for a specific content piece
 */
async function generateContentForPiece(
  contentPiece: any,
  contentTypes: string[]
) {
  // Import the generation functions
  const { 
    generateHTMLBlogArticle, 
    generateSocialPostWithImage, 
    generateVideoWithAbacus 
  } = await import('@/lib/professional-content-generator');
  
  const updates: any = {};
  
  // Generate only the requested content types
  const shouldGenerateAll = contentTypes.length === 0;
  
  // Create a day object from the content piece
  const day = {
    day: contentPiece.dayNumber,
    date: contentPiece.scheduledFor,
    theme: contentPiece.theme,
    blog: contentPiece.blogTitle ? {
      title: contentPiece.blogTitle,
      description: '',
      keywords: contentPiece.blogKeywords || []
    } : undefined,
    instagram: contentPiece.socialCaption ? {
      caption: contentPiece.socialCaption,
      hashtags: contentPiece.socialHashtags || []
    } : undefined,
    tiktok: contentPiece.tiktokScript ? {
      title: contentPiece.tiktokTitle || '',
      description: '',
      hooks: contentPiece.tiktokHooks || []
    } : undefined,
    youtube: contentPiece.youtubeScript ? {
      title: contentPiece.youtubeTitle || '',
      description: contentPiece.youtubeDescription || '',
      hooks: contentPiece.youtubeHooks || []
    } : undefined
  };
  
  try {
    // Blog
    if (shouldGenerateAll || contentTypes.includes('blog')) {
      console.log('📝 Generating blog content...');
      const blogResult = await generateHTMLBlogArticle(day, contentPiece.client);
      if (blogResult) {
        updates.blogTitle = blogResult.title;
        updates.blogContent = blogResult.content;
        updates.blogMetaDesc = blogResult.metaDescription;
        updates.blogKeywords = blogResult.keywords;
        updates.blogImages = blogResult.images;
        updates.blogInternalLinks = blogResult.internalLinks;
      }
    }
    
    // Social Media
    if (shouldGenerateAll || contentTypes.includes('social')) {
      console.log('📱 Generating social media content...');
      const socialResult = await generateSocialPostWithImage(day, contentPiece.client);
      if (socialResult) {
        updates.socialCaption = socialResult.caption;
        updates.socialHashtags = socialResult.hashtags;
        updates.socialImageUrl = socialResult.imageUrl;
        updates.socialImagePrompt = socialResult.imagePrompt;
      }
    }
    
    // TikTok & YouTube (both use video generation)
    if (shouldGenerateAll || contentTypes.includes('tiktok') || contentTypes.includes('youtube')) {
      console.log('🎬 Generating video content...');
      const videoResult = await generateVideoWithAbacus(day, contentPiece.client, contentPiece.id);
      if (videoResult) {
        // TikTok
        if (shouldGenerateAll || contentTypes.includes('tiktok')) {
          updates.tiktokScript = videoResult.script;
          updates.tiktokTitle = videoResult.title;
          updates.tiktokHooks = videoResult.hooks;
          updates.tiktokHashtags = videoResult.hashtags;
          updates.tiktokVideoUrl = videoResult.videoUrl;
          updates.tiktokDuration = videoResult.duration;
        }
        // YouTube
        if (shouldGenerateAll || contentTypes.includes('youtube')) {
          updates.youtubeTitle = videoResult.title;
          updates.youtubeScript = videoResult.script;
          updates.youtubeDescription = `${videoResult.script.substring(0, 200)}...`;
          updates.youtubeHashtags = videoResult.hashtags;
          updates.youtubeVideoUrl = videoResult.videoUrl;
          updates.youtubeDuration = videoResult.duration;
        }
      }
    }
    
    // Update status
    updates.status = 'ready';
    
    // Update the content piece
    const updated = await prisma.contentPiece.update({
      where: { id: contentPiece.id },
      data: updates
    });
    
    return updated;
    
  } catch (error) {
    console.error('❌ Error generating content:', error);
    throw error;
  }
}
