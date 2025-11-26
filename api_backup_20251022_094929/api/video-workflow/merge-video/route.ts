
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const s3Client = new S3Client({});

/**
 * POST /api/video-workflow/merge-video
 * Merge video with voiceover and background music
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
      videoUrl,
      voiceoverUrl,
      backgroundMusicUrl,
      backgroundMusicVolume = 0.3, // Lower volume for background music
    } = data;

    if (!videoUrl || !voiceoverUrl) {
      return NextResponse.json(
        { error: 'Video URL and voiceover URL are required' },
        { status: 400 }
      );
    }

    console.log('[Merge] Starting video merge process...');
    console.log('[Merge] Video URL:', videoUrl);
    console.log('[Merge] Voiceover URL:', voiceoverUrl);
    console.log('[Merge] Background Music URL:', backgroundMusicUrl || 'None');

    const tempDir = path.join('/tmp', `video-merge-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, 'video.mp4');
    const voiceoverPath = path.join(tempDir, 'voiceover.mp3');
    const musicPath = path.join(tempDir, 'music.mp3');
    const outputPath = path.join(tempDir, 'output.mp4');

    try {
      // Download video
      console.log('[Merge] Downloading video...');
      const videoResponse = await fetch(videoUrl);
      const videoBuffer = await videoResponse.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(videoBuffer));

      // Download voiceover
      console.log('[Merge] Downloading voiceover...');
      const voiceoverResponse = await fetch(voiceoverUrl);
      const voiceoverBuffer = await voiceoverResponse.arrayBuffer();
      await fs.writeFile(voiceoverPath, Buffer.from(voiceoverBuffer));

      // Download background music if provided
      if (backgroundMusicUrl) {
        console.log('[Merge] Downloading background music...');
        const musicResponse = await fetch(backgroundMusicUrl);
        const musicBuffer = await musicResponse.arrayBuffer();
        await fs.writeFile(musicPath, Buffer.from(musicBuffer));
      }

      // Build FFmpeg command
      let ffmpegCommand;
      
      if (backgroundMusicUrl) {
        // Merge video + voiceover + background music
        // Lower the volume of background music and mix with voiceover
        ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${voiceoverPath}" -i "${musicPath}" \
          -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=${backgroundMusicVolume}[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" \
          -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
      } else {
        // Merge video + voiceover only
        ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${voiceoverPath}" \
          -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;
      }

      console.log('[Merge] Running FFmpeg...');
      await execAsync(ffmpegCommand);
      console.log('[Merge] FFmpeg completed successfully');

      // Upload to S3
      console.log('[Merge] Uploading to S3...');
      const bucketName = process.env.AWS_BUCKET_NAME;
      const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
      const fileName = `videos/${Date.now()}-${ideaId || 'merged'}.mp4`;
      const s3Key = `${folderPrefix}${fileName}`;

      const outputBuffer = await fs.readFile(outputPath);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: s3Key,
          Body: outputBuffer,
          ContentType: 'video/mp4',
        })
      );

      const finalVideoUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
      console.log('[Merge] Upload complete:', finalVideoUrl);

      // Update video idea
      if (ideaId) {
        await prisma.videoIdea.update({
          where: { id: ideaId },
          data: {
            finalVideoUrl,
            completedAt: new Date(),
            status: 'COMPLETED',
          },
        });
      }

      // Cleanup temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({
        success: true,
        videoUrl: finalVideoUrl,
        message: 'Video successfully merged and uploaded!',
      });

    } catch (error) {
      // Cleanup on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      throw error;
    }

  } catch (error) {
    console.error('Error merging video:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge video' },
      { status: 500 }
    );
  }
}
