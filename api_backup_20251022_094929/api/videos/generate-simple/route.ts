
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { textToSpeech, getElevenLabsVoices } from '@/lib/elevenlabs';
import { createAudioToVideo } from '@/lib/vadoo';

/**
 * POST /api/videos/generate-simple
 * Generate a simple video using ElevenLabs + Vadoo workflow
 * This is a streamlined API that handles the full pipeline
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
    const { 
      script, 
      voiceId, 
      seriesId,
      videoTitle,
      imageStyle,
      aspectRatio,
      captionTheme,
      backgroundMusic,
      backgroundMusicVolume,
      customInstructions
    } = data;

    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }

    // Use default voice if not provided
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId) {
      // Get available voices and use the first one
      const voices = await getElevenLabsVoices();
      selectedVoiceId = voices[0]?.voice_id || 'CwhRBWXzGAHq8TQ4Fs17'; // Fallback to Roger
    }

    console.log(`[Video Generation] Starting with voice: ${selectedVoiceId}`);

    // Step 1: Generate audio using ElevenLabs
    console.log('[Video Generation] Step 1/3: Generating audio with ElevenLabs...');
    let audioBuffer: ArrayBuffer;
    try {
      audioBuffer = await textToSpeech({
        voice_id: selectedVoiceId,
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
    } catch (error) {
      console.error('[Video Generation] ✗ ElevenLabs error:', error);
      throw new Error(`Audio generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 2: Convert audio to base64
    console.log('[Video Generation] Step 2/3: Converting audio to base64...');
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    console.log('[Video Generation] ✓ Audio converted successfully');

    // Step 3: Send to Vadoo for video generation
    console.log('[Video Generation] Step 3/3: Sending to Vadoo for video generation...');
    let vadooResponse;
    try {
      vadooResponse = await createAudioToVideo({
        audio_base64: audioBase64,
        audio_format: 'mp3',
        style: imageStyle || 'realistic',
        aspect_ratio: aspectRatio || '9:16',
        theme: captionTheme || 'Hormozi_1',
        bg_music: backgroundMusic || undefined,
        bg_music_volume: (backgroundMusicVolume || 50).toString(),
        custom_instruction: customInstructions || undefined,
      });
      console.log('[Video Generation] ✓ Vadoo request submitted successfully. Video ID:', vadooResponse.vid);
    } catch (error) {
      console.error('[Video Generation] ✗ Vadoo error:', error);
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Step 4: Save to database
    console.log('[Video Generation] Step 4/4: Saving to database...');
    const video = await prisma.generatedVideo.create({
      data: {
        seriesId: seriesId || null,
        videoTopic: videoTitle || 'Generated Video',
        voice: selectedVoiceId,
        captionTheme: captionTheme || 'Hormozi_1',
        imageStyle: imageStyle || 'realistic',
        language: 'Dutch',
        aspectRatio: aspectRatio || '9:16',
        backgroundMusic: backgroundMusic || null,
        backgroundMusicVolume: backgroundMusicVolume || 50,
        customInstructions: customInstructions || null,
        vadooVideoId: vadooResponse.vid,
        status: 'GENERATING',
        generationType: 'AUDIO_TO_VIDEO',
      },
    });
    console.log('[Video Generation] ✓ Video saved to database with ID:', video.id);

    return NextResponse.json({
      success: true,
      video,
      message: 'Video generation started successfully. It will be ready in 2-3 minutes.',
    });

  } catch (error) {
    console.error('[Video Generation] ERROR:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate video',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
