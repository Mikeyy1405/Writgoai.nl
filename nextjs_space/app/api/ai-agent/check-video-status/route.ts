

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getVideoUrl } from '@/lib/vadoo';
import { prisma } from '@/lib/db';


export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { videoId } = await req.json();
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }
    
    console.log(`🔍 Checking Vadoo video status for ID: ${videoId}`);
    
    // Check video status in database first - use database ID, not Vadoo vid
    let video = await prisma.video.findUnique({
      where: { id: videoId },
    });
    
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    // If video is still processing, check with Vadoo API
    if (video.status === 'processing') {
      console.log(`   Checking Vadoo API for video URL with vid: ${video.vid}...`);
      const vadooResult = await getVideoUrl(video.vid);
      
      if (vadooResult.url && vadooResult.status === 'complete') {
        // Video is ready! Update database
        video = await prisma.video.update({
          where: { id: videoId },
          data: {
            status: 'completed',
            videoUrl: vadooResult.url,
            updatedAt: new Date(),
          },
        });
        
        console.log(`✅ Video ${videoId} is ready! URL: ${vadooResult.url}`);
      } else {
        console.log(`   Video still processing...`);
      }
    }
    
    // Prepare detailed response with all video data
    return NextResponse.json({
      success: true,
      status: video.status,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      topic: video.topic,
      script: video.script,
      duration: video.duration,
      language: video.language,
      voice: video.voiceId,
      theme: video.style,
    });
    
  } catch (error: any) {
    console.error('❌ Video status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check video status', 
        message: error.message 
      },
      { status: 500 }
    );
  }
}
