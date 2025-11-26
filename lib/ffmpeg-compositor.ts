
/**
 * FFmpeg-based Video Compositor
 * Combines video clips, voiceover, and music into a single MP4
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { uploadFile } from './s3';

const execAsync = promisify(exec);

interface VideoClip {
  url: string;
  duration: number;
}

interface AudioTrack {
  url: string;
  volume: number;
}

interface CompositionOptions {
  videoClips: VideoClip[];
  voiceover?: AudioTrack;
  music?: AudioTrack;
  outputWidth?: number;
  outputHeight?: number;
  fps?: number;
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a file from URL to temp directory
 */
async function downloadFile(url: string, filename: string): Promise<string> {
  const tempDir = '/tmp/video-composition';
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const filepath = path.join(tempDir, filename);

  // Handle data URLs (base64 encoded audio)
  if (url.startsWith('data:')) {
    const base64Data = url.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filepath, buffer);
    return filepath;
  }

  // Download from URL
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));
  return filepath;
}

/**
 * Compose video with FFmpeg
 */
export async function composeVideo(options: CompositionOptions): Promise<string> {
  const {
    videoClips,
    voiceover,
    music,
    outputWidth = 1920,
    outputHeight = 1080,
    fps = 30,
  } = options;

  if (videoClips.length === 0) {
    throw new Error('No video clips provided');
  }

  const tempDir = '/tmp/video-composition';
  const timestamp = Date.now();

  try {
    console.log('[FFmpeg] Starting video composition...');
    console.log('[FFmpeg] Video clips:', videoClips.length);
    console.log('[FFmpeg] Has voiceover:', !!voiceover);
    console.log('[FFmpeg] Has music:', !!music);

    // Download all video clips
    const videoFiles: string[] = [];
    for (let i = 0; i < videoClips.length; i++) {
      console.log(`[FFmpeg] Downloading video clip ${i + 1}/${videoClips.length}...`);
      const filename = `video_${i}.mp4`;
      const filepath = await downloadFile(videoClips[i].url, filename);
      videoFiles.push(filepath);
    }

    // Create concat file for videos
    const concatFilePath = path.join(tempDir, 'concat.txt');
    const concatContent = videoFiles.map(f => `file '${f}'`).join('\n');
    await writeFile(concatFilePath, concatContent);

    // Step 1: Concatenate video clips
    const concatVideoPath = path.join(tempDir, `concat_${timestamp}.mp4`);
    console.log('[FFmpeg] Concatenating video clips...');
    
    await execAsync(
      `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy "${concatVideoPath}"`
    );

    let finalVideoPath = concatVideoPath;

    // Step 2: Add voiceover and/or music
    if (voiceover || music) {
      const audioInputs: string[] = [];
      const filterComplexParts: string[] = [];
      let audioIndex = 1; // 0 is video

      // Download voiceover
      if (voiceover) {
        console.log('[FFmpeg] Adding voiceover...');
        const voiceoverPath = await downloadFile(
          voiceover.url,
          `voiceover_${timestamp}.mp3`
        );
        audioInputs.push(`-i "${voiceoverPath}"`);
        filterComplexParts.push(`[${audioIndex}]volume=${voiceover.volume}[v${audioIndex}]`);
        audioIndex++;
      }

      // Download music
      if (music) {
        console.log('[FFmpeg] Adding background music...');
        const musicPath = await downloadFile(
          music.url,
          `music_${timestamp}.mp3`
        );
        audioInputs.push(`-i "${musicPath}"`);
        filterComplexParts.push(`[${audioIndex}]volume=${music.volume}[m${audioIndex}]`);
        audioIndex++;
      }

      // Mix audio tracks
      const audioMixInputs = voiceover && music
        ? '[v1][m2]'
        : voiceover
        ? '[v1]'
        : '[m1]';

      const filterComplex = [
        ...filterComplexParts,
        `${audioMixInputs}amix=inputs=${voiceover && music ? 2 : 1}:duration=first[aout]`,
      ].join(';');

      const finalOutputPath = path.join(tempDir, `final_${timestamp}.mp4`);
      
      await execAsync(
        `ffmpeg -i "${concatVideoPath}" ${audioInputs.join(' ')} ` +
        `-filter_complex "${filterComplex}" ` +
        `-map 0:v -map "[aout]" ` +
        `-c:v copy -c:a aac -b:a 192k ` +
        `"${finalOutputPath}"`
      );

      finalVideoPath = finalOutputPath;
    }

    // Upload to S3
    console.log('[FFmpeg] Uploading final video to S3...');
    const videoBuffer = await require('fs/promises').readFile(finalVideoPath);
    const s3Key = `ai-videos/${timestamp}.mp4`;
    const s3Url = await uploadFile(videoBuffer, s3Key);

    console.log('[FFmpeg] Composition complete:', s3Url);

    // Cleanup temp files
    console.log('[FFmpeg] Cleaning up temp files...');
    await cleanupTempFiles(tempDir, timestamp);

    return s3Url;
  } catch (error: any) {
    console.error('[FFmpeg] Composition error:', error);
    throw new Error(`Video compositie mislukt: ${error.message}`);
  }
}

/**
 * Cleanup temporary files
 */
async function cleanupTempFiles(tempDir: string, timestamp: number) {
  try {
    const { readdir } = await import('fs/promises');
    const files = await readdir(tempDir);
    
    for (const file of files) {
      if (file.includes(`${timestamp}`) || file.startsWith('video_') || file === 'concat.txt') {
        await unlink(path.join(tempDir, file));
      }
    }
  } catch (error) {
    console.error('[FFmpeg] Cleanup error:', error);
  }
}

