
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { textToSpeech } from '@/lib/elevenlabs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

/**
 * POST /api/video-workflow/generate-voiceover
 * Generate voiceover using ElevenLabs
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
      ideaId,
      script, 
      voiceId = 'CwhRBWXzGAHq8TQ4Fs17', // Roger (default Dutch voice)
      stability = 0.5,
      similarityBoost = 0.75,
      style = 0.0,
    } = data;

    if (!script) {
      return NextResponse.json(
        { error: 'Script is required' },
        { status: 400 }
      );
    }

    console.log('[Voiceover] Generating audio with ElevenLabs...');
    console.log('[Voiceover] Voice ID:', voiceId);
    console.log('[Voiceover] Script length:', script.length, 'characters');

    // Generate audio using ElevenLabs
    const audioBuffer = await textToSpeech({
      voice_id: voiceId,
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: true,
      },
    });

    console.log('[Voiceover] Audio generated successfully');

    // Upload to S3
    const bucketName = process.env.AWS_BUCKET_NAME;
    const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
    const fileName = `voiceovers/${Date.now()}-${ideaId || 'temp'}.mp3`;
    const s3Key = `${folderPrefix}${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: Buffer.from(audioBuffer),
        ContentType: 'audio/mpeg',
      })
    );

    console.log('[Voiceover] Uploaded to S3:', s3Key);

    const audioUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;

    // Update video idea if ideaId is provided
    if (ideaId) {
      await prisma.videoIdea.update({
        where: { id: ideaId },
        data: {
          voiceoverUrl: audioUrl,
          voiceoverGeneratedAt: new Date(),
          voiceId,
          status: 'VOICEOVER_READY',
        },
      });
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      audioKey: s3Key,
      message: 'Voiceover gegenereerd en opgeslagen!',
    });

  } catch (error) {
    console.error('Error generating voiceover:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate voiceover' },
      { status: 500 }
    );
  }
}
