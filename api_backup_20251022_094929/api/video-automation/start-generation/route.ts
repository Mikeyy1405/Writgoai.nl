
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { textToSpeech } from '@/lib/elevenlabs';
import { createAudioToVideo } from '@/lib/vadoo';

/**
 * POST /api/video-automation/start-generation
 * Start video generation for a scheduled video
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();
    const { videoId } = data;

    // Get the video
    const video = await prisma.generatedVideo.findUnique({
      where: { id: videoId },
      include: {
        Series: true
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.status !== 'PENDING' && video.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Video cannot be started in current status' },
        { status: 400 }
      );
    }

    // Update status to GENERATING
    await prisma.generatedVideo.update({
      where: { id: video.id },
      data: { status: 'GENERATING' }
    });

    // Generate video using ElevenLabs + Vadoo workflow
    try {
      console.log(`[Video Generation] Starting for video: ${video.id}`);
      
      // Step 1: Generate script if not already exists
      let script = video.customInstructions;
      if (!script || script.length < 100) {
        console.log('[Video Generation] Generating script with AI...');
        script = await generateVideoScript(
          video.videoTopic,
          video.description || '',
          video.Series?.niche || '',
          video.language
        );
        console.log('[Video Generation] ✓ Script generated:', script.length, 'characters');
        
        // Save script to database
        await prisma.generatedVideo.update({
          where: { id: video.id },
          data: { customInstructions: script }
        });
      }
      
      // Step 2: Generate audio using ElevenLabs
      console.log('[Video Generation] Step 1/3: Generating audio with ElevenLabs...');
      const audioBuffer = await textToSpeech({
        voice_id: video.voice || 'CwhRBWXzGAHq8TQ4Fs17', // Default to Roger
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      });
      console.log('[Video Generation] ✓ Audio generated successfully');

      // Step 3: Convert audio to base64
      console.log('[Video Generation] Step 2/3: Converting audio to base64...');
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');
      console.log('[Video Generation] ✓ Audio converted successfully');

      // Step 4: Send to Vadoo for video generation
      console.log('[Video Generation] Step 3/3: Sending to Vadoo...');
      const vadooResponse = await createAudioToVideo({
        audio_base64: audioBase64,
        audio_format: 'mp3',
        style: video.imageStyle || 'realistic',
        aspect_ratio: video.aspectRatio || '9:16',
        theme: video.captionTheme || 'Hormozi_1',
        bg_music: video.Series?.backgroundMusic || undefined,
        bg_music_volume: video.backgroundMusicVolume?.toString() || '50',
        custom_instruction: video.Series?.niche || undefined,
      });
      console.log('[Video Generation] ✓ Vadoo request submitted. Video ID:', vadooResponse.vid);

      // Update video with Vadoo video ID and status
      await prisma.generatedVideo.update({
        where: { id: video.id },
        data: {
          vadooVideoId: vadooResponse.vid,
          status: 'GENERATING',
          generationType: 'AUDIO_TO_VIDEO'
        }
      });

      return NextResponse.json({
        success: true,
        video: {
          id: video.id,
          vadooVideoId: vadooResponse.vid,
          status: 'GENERATING'
        },
        message: 'Video generation started successfully. It will be ready in 2-3 minutes.'
      });
    } catch (error) {
      console.error('[Video Generation] Error:', error);
      
      // Update video status to failed
      await prisma.generatedVideo.update({
        where: { id: video.id },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Failed to generate video',
        },
      });

      throw error;
    }
  } catch (error) {
    console.error('Error starting video generation:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start video generation',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate video script using AI
 */
async function generateVideoScript(
  topic: string,
  description: string,
  niche: string,
  language: string
): Promise<string> {
  try {
    const systemPrompt = `Je bent een professionele video script writer die korte, boeiende scripts schrijft voor social media video's (30-90 seconden).

Schrijf een natuurlijk en conversationeel script in het ${language} voor een video over: "${topic}"

${description ? `Context: ${description}` : ''}
${niche ? `Niche: ${niche}` : ''}

Script requirements:
- Natuurlijke, gesproken taal (alsof je tegen een vriend praat)
- Direct en pakkend beginnen (eerste 3 seconden zijn cruciaal)
- Duidelijke, korte zinnen
- Geen hashtags of emojis in het script
- 150-250 woorden (30-60 seconden gesproken)
- Praktische waarde of entertainment
- Eindig met een call-to-action of impactvolle boodschap

Geef ALLEEN het script terug, zonder titels, labels of extra uitleg.`;

    const response = await fetch('https://api.abacus.ai/v1/chat/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Schrijf een video script voor: ${topic}` }
        ],
        temperature: 0.8,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const result = await response.json();
    const script = result.choices[0]?.message?.content;

    if (!script) {
      throw new Error('No script generated');
    }

    return script.trim();
  } catch (error) {
    console.error('Error generating script:', error);
    // Fallback to simple script
    return `${topic}. ${description || 'Interessante informatie over dit onderwerp.'}`;
  }
}
