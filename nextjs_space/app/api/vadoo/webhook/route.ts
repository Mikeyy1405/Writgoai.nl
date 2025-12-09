import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';


/**
 * Vadoo webhook handler
 * Receives video completion notifications from Vadoo API
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log('📹 Vadoo webhook received:', data);
    
    // Vadoo webhook format:
    // {
    //   vid: "video-id",
    //   video_url: "https://i.ytimg.com/vi/_uVtcQdw1-I/maxresdefault.jpg",
    //   thumbnail_url: "https://i.ytimg.com/vi/_uVtcQdw1-I/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDy7Zp7IQ-YplpTkMIImF9NjaBhVA",
    //   status: "completed" | "failed"
    // }
    
    const { vid, video_url, thumbnail_url, status, error } = data;
    
    if (!vid) {
      return NextResponse.json({ error: 'Missing vid' }, { status: 400 });
    }
    
    // Try to find a standalone Video first
    const video = await prisma.video.findUnique({
      where: { vid }
    });
    
    if (video) {
      // Update standalone Video record
      await prisma.video.update({
        where: { id: video.id },
        data: {
          videoUrl: video_url || null,
          thumbnailUrl: thumbnail_url || null,
          status: status === 'completed' ? 'completed' : 'failed',
          error: error || null,
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Video ${video.id} updated: ${status}`);
      console.log(`   Video URL: ${video_url || 'N/A'}`);
      
      return NextResponse.json({ success: true });
    }
    
    // Otherwise find content piece by reelVadooId (legacy)
    const contentPiece = await prisma.contentPiece.findFirst({
      where: { reelVadooId: vid }
    });
    
    if (!contentPiece) {
      console.error('❌ Content/Video not found for vid:', vid);
      return NextResponse.json({ error: 'Content/Video not found' }, { status: 404 });
    }
    
    // Update ContentPiece with video URL and status
    await prisma.contentPiece.update({
      where: { id: contentPiece.id },
      data: {
        reelVideoUrl: video_url || null,
        reelThumbnailUrl: thumbnail_url || null,
        reelVideoStatus: status === 'completed' ? 'completed' : 'failed',
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ ContentPiece ${contentPiece.id} video updated: ${status}`);
    console.log(`   Video URL: ${video_url || 'N/A'}`);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Vadoo webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
