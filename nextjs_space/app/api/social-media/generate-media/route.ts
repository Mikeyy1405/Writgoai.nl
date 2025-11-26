

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateMediaImage, generateMediaVideo } from '@/lib/media-generator';
import { getVideoModelById } from '@/lib/video-models';
import { prisma } from '@/lib/db';
import { deductCredits } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, mediaType, style, videoModel } = await req.json();

    if (!content || !mediaType) {
      return NextResponse.json(
        { error: 'Content and mediaType are required' },
        { status: 400 }
      );
    }

    const clientId = (session.user as any).id;

    let mediaUrl: string;
    let costInCredits = 0;

    if (mediaType === 'image') {
      // Images are free (from Pixabay)
      mediaUrl = await generateMediaImage(content, style);
    } else if (mediaType === 'video') {
      // Get video model and check cost
      const modelId = videoModel || 'alibaba/wan2.1-t2v-turbo'; // Default to cheapest
      const model = getVideoModelById(modelId);
      
      if (!model) {
        return NextResponse.json({ error: 'Invalid video model' }, { status: 400 });
      }
      
      costInCredits = model.costPerVideo;
      
      // Check if client has enough credits
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { 
          subscriptionCredits: true,
          topUpCredits: true,
        },
      });
      
      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      
      if (totalCredits < costInCredits) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits', 
            required: costInCredits,
            available: totalCredits,
          },
          { status: 402 }
        );
      }
      
      // Deduct credits first
      await deductCredits(clientId, costInCredits, `Video generation (${model.name})`);
      
      // Generate video
      mediaUrl = await generateMediaVideo(content, modelId);
      
      console.log(`✅ Video generated for ${clientId}, deducted ${costInCredits} credits`);
    } else {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      mediaUrl,
      mediaType,
      style: mediaType === 'video' ? videoModel : style,
      creditsUsed: costInCredits,
    });
  } catch (error) {
    console.error('Error generating media:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate media',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
