
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { textToSpeech } from '@/lib/elevenlabs';

/**
 * POST /api/videos/audio-to-video
 * Generate video from text using ElevenLabs + Vadoo
 * Flow: Text → ElevenLabs (audio) → Vadoo (video)
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
      customInstructions
    } = data;

    if (!script || !voiceId) {
      return NextResponse.json(
        { error: 'Script and voice ID are required' },
        { status: 400 }
      );
    }

    // Step 1: Generate audio using ElevenLabs
    console.log('Step 1: Generating audio with ElevenLabs...');
    const audioBuffer = await textToSpeech({
      voice_id: voiceId,
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    });

    // Step 2: Upload audio to Vadoo and generate video
    console.log('Step 2: Uploading audio to Vadoo...');
    
    // Convert ArrayBuffer to base64 for API upload
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    
    // Call Vadoo audio-to-video API
    const vadooResponse = await fetch('https://viralapi.vadoo.tv/api/audio_to_video', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.VADOO_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_base64: audioBase64,
        audio_format: 'mp3',
        style: imageStyle || 'cinematic',
        aspect_ratio: aspectRatio || '9:16',
        theme: captionTheme || 'Hormozi_1',
        bg_music: backgroundMusic || undefined,
        bg_music_volume: '50',
        custom_instruction: customInstructions || undefined,
      }),
    });

    if (!vadooResponse.ok) {
      const errorText = await vadooResponse.text();
      throw new Error(`Vadoo API error: ${vadooResponse.statusText} - ${errorText}`);
    }

    const vadooData = await vadooResponse.json();
    const vadooVideoId = vadooData.vid;

    // Step 3: Save video to database
    const video = await prisma.generatedVideo.create({
      data: {
        seriesId: seriesId || null,
        videoTopic: videoTitle || 'Audio to Video',
        voice: voiceId,
        captionTheme: captionTheme || 'Hormozi_1',
        imageStyle: imageStyle || 'cinematic',
        language: 'Dutch',
        aspectRatio: aspectRatio || '9:16',
        backgroundMusic: backgroundMusic || null,
        backgroundMusicVolume: 50,
        customInstructions: customInstructions || null,
        vadooVideoId: vadooVideoId,
        status: 'GENERATING',
        generationType: 'AUDIO_TO_VIDEO',
      },
    });

    return NextResponse.json({
      success: true,
      video,
      message: 'Video generation started. You will receive the video via webhook in 2-3 minutes.',
    });

  } catch (error) {
    console.error('Error in audio-to-video generation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate video',
      },
      { status: 500 }
    );
  }
}
