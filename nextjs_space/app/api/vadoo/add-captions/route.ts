

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { addAICaptions } from '@/lib/vadoo';

const prisma = new PrismaClient();

/**
 * Add AI Captions to an existing video
 * POST /api/vadoo/add-captions
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { videoUrl, theme, language } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Get client to check credits
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check if user has enough credits (1 credit for caption generation)
    const availableCredits = client.subscriptionCredits + client.topUpCredits;
    if (!client.isUnlimited && availableCredits < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    console.log('🎬 Adding AI captions to video:', videoUrl);

    // Call Vadoo API to add captions
    const response = await addAICaptions({
      url: videoUrl,
      theme: theme || 'Hormozi_1',
      language: language || 'English',
    });

    console.log('✅ Vadoo captions request created:', response.vid);

    // Create Video record in database
    const video = await prisma.video.create({
      data: {
        vid: response.vid,
        clientId: client.id,
        topic: `Add captions to video: ${videoUrl}`,
        script: 'AI Caption generation',
        voiceId: 'none',
        style: theme || 'Hormozi_1',
        status: 'processing',
      },
    });

    // Deduct 1 credit (unless unlimited)
    if (!client.isUnlimited) {
      // Deduct from subscription credits first, then top-up credits
      const newSubCredits = Math.max(0, client.subscriptionCredits - 1);
      const remainingToDeduct = 1 - (client.subscriptionCredits - newSubCredits);
      const newTopUpCredits = Math.max(0, client.topUpCredits - remainingToDeduct);
      
      await prisma.client.update({
        where: { id: client.id },
        data: {
          subscriptionCredits: newSubCredits,
          topUpCredits: newTopUpCredits,
          totalCreditsUsed: client.totalCreditsUsed + 1,
        },
      });
      
      console.log(`💰 Deducted 1 credit. Remaining: ${newSubCredits + newTopUpCredits}`);
    } else {
      console.log('💎 Unlimited account - no credit deduction');
    }

    return NextResponse.json({
      success: true,
      videoId: video.id,
      vid: response.vid,
      status: 'processing',
      message: 'Captions worden toegevoegd. Je video is klaar in 2-3 minuten.',
    });

  } catch (error: any) {
    console.error('❌ Error adding captions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add captions' },
      { status: 500 }
    );
  }
}
