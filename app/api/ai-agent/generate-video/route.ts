

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateCustomVideo } from '@/lib/custom-video-generator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { prompt, model, clientId, style = 'realistic', aspectRatio = '9:16' } = await req.json();
    
    // Auth check - allow if session OR clientId is provided (for internal calls)
    const session = await getServerSession(authOptions);
    if (!session?.user?.id && !clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    console.log(`🎬 Generating video with Custom Video Generator`);
    console.log(`   Prompt: ${prompt}`);
    console.log(`   Style: ${style}`);
    console.log(`   Aspect Ratio: ${aspectRatio}`);
    
    // Generate unique video ID
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save initial video record to database
    const video = await prisma.video.create({
      data: {
        vid: videoId,
        topic: prompt.slice(0, 100), // Use first 100 chars as topic
        script: prompt, // Full prompt as script
        language: 'Dutch',
        voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger (Nederlands)
        style: style,
        duration: aspectRatio === '9:16' ? '30-60' : '60-120',
        status: 'processing',
        clientId: clientId || null,
      },
    });
    
    // Start video generation in background
    generateVideoInBackground(videoId, prompt, style, aspectRatio);
    
    return NextResponse.json({
      success: true,
      videos: [{
        id: videoId,
        status: 'processing',
      }],
      message: 'Video wordt gegenereerd! Dit duurt 2-5 minuten. Je kunt de status controleren via de video status API.',
    });
    
  } catch (error: any) {
    console.error('❌ Video generation error:', error);
    return NextResponse.json(
      { 
        error: 'Video generation failed', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Generate video in background to avoid timeout
async function generateVideoInBackground(
  videoId: string,
  prompt: string,
  style: string,
  aspectRatio: string
) {
  try {
    console.log(`🎬 Starting background video generation for ${videoId}`);
    
    const result = await generateCustomVideo({
      script: prompt,
      style: style as any,
      aspectRatio: aspectRatio as any,
      backgroundMusic: true,
      musicVolume: 30,
      imageCount: 5,
    });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    // Update database with completed video
    await prisma.video.update({
      where: { vid: videoId },
      data: {
        status: 'completed',
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration.toString(),
      },
    });
    
    console.log(`✅ Video generation completed for ${videoId}`);
    console.log(`   Video URL: ${result.videoUrl}`);
    
  } catch (error: any) {
    console.error(`❌ Background video generation failed for ${videoId}:`, error);
    
    // Update database with error
    await prisma.video.update({
      where: { vid: videoId },
      data: {
        status: 'failed',
        error: error.message,
      },
    }).catch(console.error);
  }
}
