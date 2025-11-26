

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { createAIClips } from '@/lib/vadoo';

const prisma = new PrismaClient();

/**
 * Create AI clips from a long-form video (YouTube URL)
 * POST /api/vadoo/create-clips
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { youtubeUrl, theme, language, numClips } = body;

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
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

    // Check if user has enough credits (2 credits per clip)
    const clipsToGenerate = numClips || 1;
    const creditsNeeded = clipsToGenerate * 2;
    const availableCredits = client.subscriptionCredits + client.topUpCredits;
    
    if (!client.isUnlimited && availableCredits < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for ${clipsToGenerate} clip(s).` },
        { status: 402 }
      );
    }

    console.log(`🎬 Creating ${clipsToGenerate} AI clip(s) from YouTube video:`, youtubeUrl);

    // Call Vadoo API to create clips
    const response = await createAIClips({
      url: youtubeUrl,
      theme: theme || 'Hormozi_1',
      language: language || 'English',
      num_clips: clipsToGenerate,
    });

    console.log('✅ Vadoo AI clips request created:', response.vid);

    // Create Video record in database
    const video = await prisma.video.create({
      data: {
        vid: response.vid,
        clientId: client.id,
        topic: `Create ${clipsToGenerate} AI clip(s) from: ${youtubeUrl}`,
        script: 'AI Clips generation from YouTube',
        voiceId: 'none',
        style: theme || 'Hormozi_1',
        status: 'processing',
      },
    });

    // Deduct credits (unless unlimited)
    if (!client.isUnlimited) {
      // Deduct from subscription credits first, then top-up credits
      const newSubCredits = Math.max(0, client.subscriptionCredits - creditsNeeded);
      const remainingToDeduct = creditsNeeded - (client.subscriptionCredits - newSubCredits);
      const newTopUpCredits = Math.max(0, client.topUpCredits - remainingToDeduct);
      
      await prisma.client.update({
        where: { id: client.id },
        data: {
          subscriptionCredits: newSubCredits,
          topUpCredits: newTopUpCredits,
          totalCreditsUsed: client.totalCreditsUsed + creditsNeeded,
        },
      });
      
      console.log(`💰 Deducted ${creditsNeeded} credits. Remaining: ${newSubCredits + newTopUpCredits}`);
    } else {
      console.log('💎 Unlimited account - no credit deduction');
    }

    return NextResponse.json({
      success: true,
      videoId: video.id,
      vid: response.vid,
      status: 'processing',
      numClips: clipsToGenerate,
      creditsUsed: creditsNeeded,
      message: `${clipsToGenerate} AI clip(s) worden gegenereerd. Je video's zijn klaar in 2-3 minuten.`,
    });

  } catch (error: any) {
    console.error('❌ Error creating AI clips:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create AI clips' },
      { status: 500 }
    );
  }
}
