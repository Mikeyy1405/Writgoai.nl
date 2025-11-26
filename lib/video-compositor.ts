
/**
 * Video Compositor for AI Video Maker
 * Combines Runway ML video clips, voiceover, and music into a single MP4 file
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
  volume?: number;
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
 * Downloads a file from URL to temp directory
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
 * Compose multiple video clips with audio into a single MP4
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

  if (!videoClips || videoClips.length === 0) {
    throw new Error('At least one video clip is required');
  }

  console.log('[Video Compositor] Starting composition:', {
    clips: videoClips.length,
    hasVoiceover: !!voiceover,
    hasMusic: !!music,
  });

  const tempDir = '/tmp/video-composition';
  const timestamp = Date.now();

  try {
    // Download all video clips
    console.log('[Video Compositor] Downloading video clips...');
    const videoFiles = await Promise.all(
      videoClips.map((clip, i) => downloadFile(clip.url, `clip_${timestamp}_${i}.mp4`))
    );

    // Create concat file for FFmpeg
    const concatFile = path.join(tempDir, `concat_${timestamp}.txt`);
    const concatContent = videoFiles.map(f => `file '${f}'`).join('\n');
    await writeFile(concatFile, concatContent);

    // Download audio files
    let voiceoverFile: string | null = null;
    let musicFile: string | null = null;

    if (voiceover) {
      console.log('[Video Compositor] Downloading voiceover...');
      voiceoverFile = await downloadFile(voiceover.url, `voiceover_${timestamp}.mp3`);
    }

    if (music) {
      console.log('[Video Compositor] Downloading music...');
      musicFile = await downloadFile(music.url, `music_${timestamp}.mp3`);
    }

    // Build FFmpeg command
    const outputFile = path.join(tempDir, `output_${timestamp}.mp4`);
    let ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${concatFile}`;

    // Add audio inputs
    if (voiceoverFile) {
      ffmpegCmd += ` -i ${voiceoverFile}`;
    }
    if (musicFile) {
      ffmpegCmd += ` -i ${musicFile}`;
    }

    // Build filter complex for audio mixing
    if (voiceoverFile && musicFile) {
      const musicVol = music?.volume || 0.3;
      ffmpegCmd += ` -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=${musicVol}[music];[voice][music]amix=inputs=2:duration=first[audio]" -map 0:v -map "[audio]"`;
    } else if (voiceoverFile) {
      ffmpegCmd += ` -map 0:v -map 1:a`;
    } else if (musicFile) {
      const musicVol = music?.volume || 0.5;
      ffmpegCmd += ` -filter_complex "[1:a]volume=${musicVol}[audio]" -map 0:v -map "[audio]"`;
    } else {
      ffmpegCmd += ` -map 0:v`;
    }

    // Output settings
    ffmpegCmd += ` -c:v libx264 -preset fast -crf 23 -r ${fps} -s ${outputWidth}x${outputHeight} -c:a aac -b:a 192k -movflags +faststart -y ${outputFile}`;

    console.log('[Video Compositor] Running FFmpeg...');
    console.log('[FFmpeg Command]:', ffmpegCmd);

    const { stdout, stderr } = await execAsync(ffmpegCmd);
    console.log('[FFmpeg stdout]:', stdout);
    if (stderr) console.log('[FFmpeg stderr]:', stderr);

    // Check if output file exists
    if (!existsSync(outputFile)) {
      throw new Error('FFmpeg failed to create output file');
    }

    console.log('[Video Compositor] Video composition complete!');

    // Upload to S3
    console.log('[Video Compositor] Uploading to S3...');
    const folderPrefix = process.env.AWS_FOLDER_PREFIX || '';
    const s3Key = `${folderPrefix}ai-videos/${timestamp}-composed.mp4`;
    
    const fileBuffer = await require('fs/promises').readFile(outputFile);
    const s3Url = await uploadFile(fileBuffer, s3Key);

    // Cleanup temp files
    console.log('[Video Compositor] Cleaning up temp files...');
    await Promise.all([
      ...videoFiles.map(f => unlink(f).catch(e => console.warn('Cleanup warning:', e))),
      unlink(concatFile).catch(e => console.warn('Cleanup warning:', e)),
      unlink(outputFile).catch(e => console.warn('Cleanup warning:', e)),
      voiceoverFile ? unlink(voiceoverFile).catch(e => console.warn('Cleanup warning:', e)) : Promise.resolve(),
      musicFile ? unlink(musicFile).catch(e => console.warn('Cleanup warning:', e)) : Promise.resolve(),
    ]);

    return s3Url;
  } catch (error: any) {
    console.error('[Video Compositor] Composition error:', error);
    throw new Error(`Video composition failed: ${error.message}`);
  }
}

/**
 * Estimate composition time based on video duration
 */
export function estimateCompositionTime(totalDuration: number, clipCount: number): string {
  // Rough estimate: 1 second of video = 2-3 seconds processing
  const processTime = Math.ceil((totalDuration * 2.5 + clipCount * 10) / 60);
  return processTime === 1 ? '1 minuut' : `${processTime} minuten`;
}
