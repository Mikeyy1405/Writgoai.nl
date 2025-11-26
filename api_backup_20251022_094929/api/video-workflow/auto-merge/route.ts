
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);
const s3Client = new S3Client({});

/**
 * POST /api/video-workflow/auto-merge
 * Automatically merge video with voiceover when both are ready
 */
export async function POST(request: Request) {
  try {
    const { ideaId } = await request.json();

    if (!ideaId) {
      return NextResponse.json({ error: 'Video idea ID is required' }, { status: 400 });
    }

    const idea = await prisma.videoIdea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      return NextResponse.json({ error: 'Video idea not found' }, { status: 404 });
    }

    if (!idea.vadooVideoUrl || !idea.voiceoverUrl) {
      return NextResponse.json({ error: 'Video or voiceover not ready' }, { status: 400 });
    }

    console.log('[Auto-Merge] Starting merge for idea:', ideaId);
    console.log('[Auto-Merge] Video URL:', idea.vadooVideoUrl);
    console.log('[Auto-Merge] Voiceover URL:', idea.voiceoverUrl);

    // Update status
    await prisma.videoIdea.update({
      where: { id: ideaId },
      data: { status: 'MERGING' },
    });

    const tempDir = path.join('/tmp', `video-merge-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    const videoPath = path.join(tempDir, 'video.mp4');
    const voiceoverPath = path.join(tempDir, 'voiceover.mp3');
    const outputPath = path.join(tempDir, 'output.mp4');

    try {
      // Download video
      console.log('[Auto-Merge] Downloading video...');
      const videoResponse = await fetch(idea.vadooVideoUrl);
      const videoBuffer = await videoResponse.arrayBuffer();
      await fs.writeFile(videoPath, Buffer.from(videoBuffer));

      // Download voiceover
      console.log('[Auto-Merge] Downloading voiceover...');
      const voiceoverResponse = await fetch(idea.voiceoverUrl);
      const voiceoverBuffer = await voiceoverResponse.arrayBuffer();
      await fs.writeFile(voiceoverPath, Buffer.from(voiceoverBuffer));

      // Merge with FFmpeg
      const ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${voiceoverPath}" \
        -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${outputPath}"`;

      console.log('[Auto-Merge] Running FFmpeg...');
      await execAsync(ffmpegCommand);
      console.log('[Auto-Merge] FFmpeg completed successfully');

      // Upload to S3
      console.log('[Auto-Merge] Uploading to S3...');
      const bucketName = process.env.AWS_BUCKET_NAME;
      const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
      const fileName = `videos/${Date.now()}-${ideaId}.mp4`;
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
      console.log('[Auto-Merge] Upload complete:', finalVideoUrl);

      // Update video idea
      await prisma.videoIdea.update({
        where: { id: ideaId },
        data: {
          finalVideoUrl,
          completedAt: new Date(),
          status: 'COMPLETED',
        },
      });

      // Cleanup temp files
      await fs.rm(tempDir, { recursive: true, force: true });

      console.log('[Auto-Merge] Merge completed successfully for idea:', ideaId);

      return NextResponse.json({
        success: true,
        videoUrl: finalVideoUrl,
        message: 'Video successfully merged!',
      });

    } catch (error) {
      // Cleanup on error
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      
      // Update status to failed
      await prisma.videoIdea.update({
        where: { id: ideaId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Merge failed',
        },
      });
      
      throw error;
    }

  } catch (error) {
    console.error('[Auto-Merge] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to merge video' },
      { status: 500 }
    );
  }
}
