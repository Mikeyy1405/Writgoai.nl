

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateCustomVideo, VIDEO_STYLES, ASPECT_RATIOS } from '@/lib/custom-video-generator';
import { deductCredits, getClientCredits } from '@/lib/credits';

// Video generation kost credits
const VIDEO_GENERATION_COST = 80; // 80 credits per video met voiceover & muziek

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd. Log in om video\'s te genereren.' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      script,
      voiceId,
      style = 'realistic',
      aspectRatio = '9:16',
      backgroundMusic = true,
      musicVolume = 30,
      imageCount = 5,
    } = body;

    if (!script || script.trim().length === 0) {
      return NextResponse.json(
        { error: 'Script is verplicht voor video generatie.' },
        { status: 400 }
      );
    }

    // Check credits
    const clientEmail = session.user.email;
    const creditsInfo = await getClientCredits(clientEmail);
    
    if (!creditsInfo || creditsInfo.isUnlimited === false) {
      const totalCredits = (creditsInfo?.subscriptionCredits || 0) + (creditsInfo?.topUpCredits || 0);
      
      if (totalCredits < VIDEO_GENERATION_COST) {
        return NextResponse.json(
          { 
            error: `Onvoldoende credits. Video generatie kost ${VIDEO_GENERATION_COST} credits. Je hebt ${totalCredits} credits.`,
            requiredCredits: VIDEO_GENERATION_COST,
            currentCredits: totalCredits,
          },
          { status: 402 }
        );
      }
    }

    // Genereer video
    console.log('Starting video generation for:', clientEmail);
    const result = await generateCustomVideo({
      script,
      voiceId,
      style: style as any,
      aspectRatio: aspectRatio as any,
      backgroundMusic,
      musicVolume,
      imageCount,
    });

    if (result.error) {
      return NextResponse.json(
        { error: `Video generatie mislukt: ${result.error}` },
        { status: 500 }
      );
    }

    // Deduct credits na succesvolle generatie
    if (!creditsInfo?.isUnlimited) {
      await deductCredits(clientEmail, VIDEO_GENERATION_COST, 'Video generatie');
    }
    
    const remainingCredits = creditsInfo?.isUnlimited 
      ? 999999 
      : (creditsInfo?.subscriptionCredits || 0) + (creditsInfo?.topUpCredits || 0) - VIDEO_GENERATION_COST;

    return NextResponse.json({
      success: true,
      video: result,
      creditsUsed: VIDEO_GENERATION_COST,
      creditsRemaining: remainingCredits,
    });

  } catch (error) {
    console.error('Error in generate-custom-video API:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het genereren van de video.' },
      { status: 500 }
    );
  }
}

// GET endpoint voor opties/configuratie
export async function GET() {
  return NextResponse.json({
    styles: VIDEO_STYLES,
    aspectRatios: ASPECT_RATIOS,
    cost: VIDEO_GENERATION_COST,
  });
}

