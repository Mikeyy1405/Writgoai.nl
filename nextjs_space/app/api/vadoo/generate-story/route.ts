

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createAIVideo } from '@/lib/vadoo';
import { prisma } from '@/lib/db';


/**
 * Generate AI Story Video
 * POST /api/vadoo/generate-story
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      topic,
      prompt,
      voice,
      theme,
      style,
      language,
      duration,
      aspectRatio,
      customInstructions,
      bgMusic,
      bgMusicVolume,
    } = body;

    // Get client to check credits
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate credits needed based on duration
    const creditsNeeded = calculateCredits(duration || '30-60');
    const availableCredits = client.subscriptionCredits + client.topUpCredits;
    
    if (!client.isUnlimited && availableCredits < creditsNeeded) {
      return NextResponse.json(
        { error: `Insufficient credits. Need ${creditsNeeded} credits for this video.` },
        { status: 402 }
      );
    }

    console.log('🎬 Creating AI Story Video:', topic || 'Custom');
    console.log('   Duration:', duration);
    console.log('   Voice:', voice);
    console.log('   Theme:', theme);

    // Call Vadoo API to generate video
    // Valid topics according to official docs:
    // Random AI Story, Scary Stories, Motivational, Bedtime Stories,
    // Interesting History, Fun Facts, Long Form Jokes, Life Pro Tips, Philosophy, Custom
    const videoOptions: any = {
      topic: topic || 'Random AI Story',
      voice: voice || 'Charlie',
      theme: theme || 'Hormozi_1',
      style: style || 'None',
      language: language || 'Dutch',  // Default to Dutch for Netherlands
      duration: duration || '30-60',
      aspect_ratio: aspectRatio || '9:16',
      use_ai: '1',  // Always use AI to modify script
      include_voiceover: '1',  // Always include voiceover
    };

    // Only add prompt for Custom topic
    if (topic === 'Custom' && prompt) {
      videoOptions.prompt = prompt;
    }

    // Only add custom_instruction if provided
    if (customInstructions) {
      videoOptions.custom_instruction = customInstructions;
    }

    // Only add bg_music if provided
    if (bgMusic) {
      videoOptions.bg_music = bgMusic;
    }

    // Only add bg_music_volume if bg_music is provided
    if (bgMusic && bgMusicVolume) {
      videoOptions.bg_music_volume = bgMusicVolume;
    }

    console.log('🎬 Calling Vadoo API with options:', JSON.stringify(videoOptions, null, 2));

    let vadooResponse;
    try {
      vadooResponse = await createAIVideo(videoOptions);
      console.log('✅ Vadoo API Success:', vadooResponse);
    } catch (vadooError: any) {
      console.error('❌ Vadoo API Error:', vadooError);
      
      // Check for specific error messages
      if (vadooError.message && vadooError.message.toLowerCase().includes('generation limits over')) {
        return NextResponse.json(
          { 
            error: 'Vadoo account heeft geen credits meer. Upgrade je Vadoo account op vadoo.tv om video\'s te kunnen genereren.',
            errorType: 'vadoo_credits_exhausted'
          },
          { status: 402 }
        );
      }
      
      // Even if Vadoo returns an error, the video might still be generating
      // Check if we got a vid back
      if (vadooError.message && vadooError.message.includes('vid')) {
        // Try to extract vid from error message
        const vidMatch = vadooError.message.match(/"vid":\s*"?(\d+)"?/);
        if (vidMatch) {
          vadooResponse = { vid: vidMatch[1] };
          console.log('⚠️ Extracted vid from error, continuing:', vadooResponse.vid);
        } else {
          throw vadooError;
        }
      } else {
        throw vadooError;
      }
    }

    // Create Video record in database
    const video = await prisma.video.create({
      data: {
        vid: vadooResponse.vid,
        clientId: client.id,
        topic: topic === 'Custom' ? (prompt || 'Custom Story') : (topic || 'Random AI Story'),
        script: prompt || 'AI Generated Story',
        voiceId: voice || 'Charlie',
        style: theme || 'Hormozi_1',
        duration: duration || '30-60',
        language: language || 'Dutch',
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
      vid: vadooResponse.vid,
      status: 'processing',
      creditsUsed: client.isUnlimited ? 0 : creditsNeeded,
      message: `AI Story Video wordt gegenereerd. Je video is klaar in 2-3 minuten.`,
    });

  } catch (error: any) {
    console.error('❌ Error generating AI Story Video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI Story Video' },
      { status: 500 }
    );
  }
}

/**
 * Calculate credits needed based on video duration
 */
function calculateCredits(duration: string): number {
  const durationMap: Record<string, number> = {
    '30-60': 2,
    '60-90': 3,
    '90-120': 4,
    '120-180': 5,
    '5 min': 6,
    '10 min': 10,
  };
  
  return durationMap[duration] || 2;
}
