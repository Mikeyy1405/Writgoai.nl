
/**
 * Custom Video Generator
 * Eigen video generatie systeem met afbeeldingen, voiceover en muziek
 * Vervangt Vadoo met volledige controle en kostenbesparing
 */

import { textToSpeech } from './elevenlabs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// AIML API configuratie voor afbeeldingen
const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com/v1';

export interface VideoGenerationOptions {
  script: string;
  voiceId?: string;
  style?: 'realistic' | 'cinematic' | 'animated' | 'cartoon' | 'fantasy' | 'digital-art' | '3d';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  duration?: number;
  backgroundMusic?: boolean;
  musicVolume?: number;
  imageCount?: number;
}

export interface VideoGenerationResult {
  videoUrl: string;
  duration: number;
  thumbnailUrl?: string;
  error?: string;
}

// Temp directory voor video generatie
const TEMP_DIR = path.join('/tmp', 'video-generation');

/**
 * Zorgt dat temp directory bestaat
 */
async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

/**
 * Check of FFmpeg geïnstalleerd is
 */
async function checkFFmpegInstalled(): Promise<boolean> {
  try {
    await execAsync('which ffmpeg');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Genereer afbeeldingen via AIML API
 */
async function generateImage(prompt: string, style: string): Promise<Buffer> {
  try {
    // Style mapping naar DALL-E prompts
    const stylePrompts: Record<string, string> = {
      'realistic': 'photorealistic, high quality, detailed',
      'cinematic': 'cinematic lighting, dramatic, film still, widescreen',
      'animated': 'animated style, colorful, cartoon animation',
      'cartoon': '2D cartoon style, vibrant colors, simplified shapes',
      'fantasy': 'fantasy art, magical, ethereal, epic fantasy illustration',
      'digital-art': 'digital art, modern, artistic, creative digital painting',
      '3d': '3D render, CGI, volumetric lighting, professional 3D visualization'
    };

    const styleAddition = stylePrompts[style] || stylePrompts['realistic'];
    const fullPrompt = `${prompt}, ${styleAddition}`;

    const response = await fetch(`${AIML_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    // Download de afbeelding
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Split script in scènes voor afbeeldingen
 */
function splitScriptIntoScenes(script: string, sceneCount: number): string[] {
  const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
  const scenesPerImage = Math.ceil(sentences.length / sceneCount);
  const scenes: string[] = [];

  for (let i = 0; i < sceneCount; i++) {
    const start = i * scenesPerImage;
    const end = Math.min(start + scenesPerImage, sentences.length);
    const sceneText = sentences.slice(start, end).join(' ').trim();
    if (sceneText) {
      scenes.push(sceneText);
    }
  }

  return scenes;
}

/**
 * Genereer afbeelding prompts van script scènes
 */
async function generateImagePrompts(scenes: string[]): Promise<string[]> {
  const prompts: string[] = [];

  for (const scene of scenes) {
    // Gebruik AIML om een visuele beschrijving te maken
    try {
      const response = await fetch(`${AIML_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert in het maken van visuele beschrijvingen voor afbeeldingen. Maak een korte, visuele beschrijving (max 100 karakters) die perfect is voor afbeelding generatie. Wees specifiek en beschrijvend.'
            },
            {
              role: 'user',
              content: `Maak een visuele beschrijving voor deze tekst: "${scene.substring(0, 200)}"`
            }
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const prompt = data.choices[0].message.content.trim();
        prompts.push(prompt);
      } else {
        // Fallback: gebruik de eerste paar woorden
        prompts.push(scene.substring(0, 100));
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      prompts.push(scene.substring(0, 100));
    }
  }

  return prompts;
}

/**
 * Download background muziek (gratis royalty-free bronnen)
 */
async function getBackgroundMusic(): Promise<string | null> {
  // Voor nu gebruiken we een stille audio als placeholder
  // In productie zou je een library van royalty-free muziek kunnen hebben
  return null;
}

/**
 * Maak video met FFmpeg - ULTRA SIMPLIFIED & ROBUST versie
 */
async function createVideoWithFFmpeg(
  imagePaths: string[],
  audioPath: string,
  outputPath: string,
  aspectRatio: string,
  musicPath?: string,
  musicVolume: number = 30
): Promise<void> {
  const dimensions = {
    '9:16': { width: 1080, height: 1920 },
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1080, height: 1080 },
  }[aspectRatio] || { width: 1080, height: 1920 };

  console.log(`🎬 Creating video: ${imagePaths.length} images, aspect ratio ${aspectRatio}`);
  
  // Als er GEEN afbeeldingen zijn, maak een simpele video met alleen audio
  if (imagePaths.length === 0) {
    console.log('🚀 FAST MODE: Alleen audio, geen afbeeldingen');
    
    const ffmpegCommand = `ffmpeg -y -f lavfi -i color=c=black:s=${dimensions.width}x${dimensions.height}:r=25 -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -crf 28 -c:a aac -b:a 128k -shortest "${outputPath}"`;
    
    console.log('FFmpeg command (fast):', ffmpegCommand);
    
    try {
      const { stdout, stderr } = await execAsync(ffmpegCommand);
      console.log('✅ FFmpeg success (fast mode)');
      if (stderr) console.log('FFmpeg stderr:', stderr);
      return;
    } catch (error: any) {
      console.error('❌ FFmpeg error (fast mode):', error);
      console.error('FFmpeg stderr:', error.stderr);
      console.error('FFmpeg stdout:', error.stdout);
      throw new Error(`FFmpeg fout: ${error.stderr || error.message}`);
    }
  }
  
  // Bereken duration per afbeelding
  try {
    const { stdout: audioInfo } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`);
    const totalDuration = parseFloat(audioInfo.trim());
    const durationPerImage = Math.max(2, totalDuration / imagePaths.length); // Min 2 seconden per afbeelding
    
    console.log(`⏱️  Audio duration: ${totalDuration}s, ${durationPerImage}s per image`);

    // 🎯 ULTRA SIMPLIFIED: Gebruik concat demuxer i.p.v. filter_complex
    // Dit is VEEL betrouwbaarder en sneller
    
    // Stap 1: Maak eerst een concat file
    const concatFilePath = path.join(path.dirname(outputPath), `concat_${Date.now()}.txt`);
    const concatContent = imagePaths.map(imgPath => 
      `file '${imgPath}'\nduration ${durationPerImage}`
    ).join('\n') + '\n' + `file '${imagePaths[imagePaths.length - 1]}'`; // Laatste frame nog een keer
    
    await writeFile(concatFilePath, concatContent);
    console.log('📝 Concat file created:', concatFilePath);
    
    // Stap 2: Maak eerst video van afbeeldingen (zonder audio)
    const tempVideoPath = path.join(path.dirname(outputPath), `temp_video_${Date.now()}.mp4`);
    
    const videoCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" -vf "scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:color=black,fps=25" -c:v libx264 -preset ultrafast -crf 28 -pix_fmt yuv420p -t ${totalDuration} "${tempVideoPath}"`;
    
    console.log('🎥 Creating video from images...');
    console.log('Video command:', videoCommand);
    
    try {
      const { stdout, stderr } = await execAsync(videoCommand);
      console.log('✅ Video from images created');
      if (stderr) console.log('FFmpeg stderr:', stderr);
    } catch (error: any) {
      console.error('❌ FFmpeg error (video creation):', error);
      console.error('FFmpeg stderr:', error.stderr);
      await unlink(concatFilePath).catch(() => {});
      throw new Error(`FFmpeg fout bij video maken: ${error.stderr || error.message}`);
    }
    
    // Stap 3: Voeg audio toe (en optioneel muziek)
    let finalCommand: string;
    
    if (musicPath && existsSync(musicPath)) {
      console.log('🎵 Adding audio + background music...');
      // Met muziek: mix audio en muziek
      finalCommand = `ffmpeg -y -i "${tempVideoPath}" -i "${audioPath}" -i "${musicPath}" -filter_complex "[1:a]volume=1.0[voice];[2:a]volume=${musicVolume / 100},afade=t=in:st=0:d=2,afade=t=out:st=${totalDuration - 2}:d=2[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`;
    } else {
      console.log('🎵 Adding audio...');
      // Zonder muziek: alleen voiceover
      finalCommand = `ffmpeg -y -i "${tempVideoPath}" -i "${audioPath}" -c:v copy -c:a aac -b:a 128k -shortest "${outputPath}"`;
    }
    
    console.log('Final command:', finalCommand);
    
    try {
      const { stdout, stderr } = await execAsync(finalCommand);
      console.log('✅ Final video created successfully!');
      if (stderr) console.log('FFmpeg stderr:', stderr);
    } catch (error: any) {
      console.error('❌ FFmpeg error (final composition):', error);
      console.error('FFmpeg stderr:', error.stderr);
      throw new Error(`FFmpeg fout bij samenstellen: ${error.stderr || error.message}`);
    } finally {
      // Cleanup temp files
      await unlink(concatFilePath).catch(() => {});
      await unlink(tempVideoPath).catch(() => {});
    }
    
  } catch (error: any) {
    console.error('❌ Video creation failed:', error);
    
    // 🔄 FALLBACK: Als alles faalt, maak een simpele zwarte video met audio
    console.log('🔄 Trying fallback method: black video with audio...');
    try {
      const fallbackCommand = `ffmpeg -y -f lavfi -i color=c=black:s=${dimensions.width}x${dimensions.height}:r=25 -i "${audioPath}" -c:v libx264 -preset ultrafast -tune stillimage -crf 28 -c:a aac -b:a 128k -shortest "${outputPath}"`;
      await execAsync(fallbackCommand);
      console.log('✅ Fallback video created (zwart met audio)');
      return;
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
      throw new Error(`FFmpeg fout: Kon geen video maken. Details: ${error.message}`);
    }
  }
}

/**
 * Upload video naar S3 (gebruik bestaande S3 configuratie)
 */
async function uploadVideoToS3(videoPath: string, fileName: string): Promise<string> {
  const { uploadFile } = await import('./s3');
  const fs = await import('fs');
  const videoBuffer = await fs.promises.readFile(videoPath);
  
  // Detecteer content type gebaseerd op bestandsextensie
  const contentType = fileName.endsWith('.mp4') ? 'video/mp4' : 
                      fileName.endsWith('.jpg') ? 'image/jpeg' : 
                      fileName.endsWith('.png') ? 'image/png' : 
                      'application/octet-stream';
  
  const s3Key = await uploadFile(videoBuffer, `videos/${fileName}`, contentType);
  return s3Key;
}

/**
 * Genereer thumbnail van video
 */
async function generateThumbnail(videoPath: string, outputPath: string): Promise<void> {
  const command = `ffmpeg -y -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=1080:-1" "${outputPath}"`;
  await execAsync(command);
}

/**
 * Hoofdfunctie: Genereer complete video
 */
export async function generateCustomVideo(
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  console.log('Starting custom video generation with options:', options);

  try {
    // Check FFmpeg
    const ffmpegInstalled = await checkFFmpegInstalled();
    if (!ffmpegInstalled) {
      throw new Error('FFmpeg is niet geïnstalleerd op de server. Video generatie is niet mogelijk zonder FFmpeg. Installeer FFmpeg met: sudo apt-get install ffmpeg');
    }

    await ensureTempDir();

    const {
      script,
      voiceId = 'CwhRBWXzGAHq8TQ4Fs17', // Roger (Nederlands)
      style = 'realistic',
      aspectRatio = '9:16',
      backgroundMusic = true,
      musicVolume = 30,
      imageCount = 5,
    } = options;

    const timestamp = Date.now();
    const sessionId = `video_${timestamp}`;

    // Stap 1: Genereer voiceover met ElevenLabs
    console.log('Step 1: Generating voiceover...');
    const audioBuffer = await textToSpeech({
      voice_id: voiceId,
      text: script,
    });

    const audioPath = path.join(TEMP_DIR, `${sessionId}_audio.mp3`);
    await writeFile(audioPath, Buffer.from(audioBuffer));
    console.log('Voiceover generated:', audioPath);

    // Stap 2: Split script in scènes
    console.log('Step 2: Splitting script into scenes...');
    const scenes = splitScriptIntoScenes(script, imageCount);
    console.log(`Script split into ${scenes.length} scenes`);

    // Stap 3: Genereer afbeelding prompts
    console.log('Step 3: Generating image prompts...');
    const imagePrompts = await generateImagePrompts(scenes);
    console.log('Image prompts generated:', imagePrompts);

    // Stap 4: Genereer afbeeldingen
    console.log('Step 4: Generating images...');
    const imagePaths: string[] = [];
    
    for (let i = 0; i < imagePrompts.length; i++) {
      try {
        console.log(`Generating image ${i + 1}/${imagePrompts.length}...`);
        const imageBuffer = await generateImage(imagePrompts[i], style);
        const imagePath = path.join(TEMP_DIR, `${sessionId}_img_${i}.png`);
        await writeFile(imagePath, imageBuffer);
        imagePaths.push(imagePath);
        console.log(`✅ Image ${i + 1} generated successfully`);
      } catch (error) {
        console.error(`❌ Failed to generate image ${i + 1}:`, error);
        // Skip deze afbeelding, ga door met de rest
        console.log(`⚠️  Skipping image ${i + 1}, continuing with remaining images...`);
      }
    }
    
    console.log(`All images processed: ${imagePaths.length}/${imagePrompts.length} successful`);
    
    // Als we GEEN afbeeldingen hebben kunnen genereren, gebruiken we fallback
    if (imagePaths.length === 0) {
      console.log('⚠️  No images generated, will create audio-only video');
    }

    // Stap 5: Download background music (optioneel)
    let musicPath: string | undefined;
    if (backgroundMusic) {
      console.log('Step 5: Getting background music...');
      musicPath = await getBackgroundMusic() || undefined;
    }

    // Stap 6: Maak video met FFmpeg
    console.log('Step 6: Creating video with FFmpeg...');
    const videoPath = path.join(TEMP_DIR, `${sessionId}_final.mp4`);
    await createVideoWithFFmpeg(
      imagePaths,
      audioPath,
      videoPath,
      aspectRatio,
      musicPath,
      musicVolume
    );
    console.log('Video created:', videoPath);

    // Stap 7: Genereer thumbnail
    console.log('Step 7: Generating thumbnail...');
    const thumbnailPath = path.join(TEMP_DIR, `${sessionId}_thumb.jpg`);
    await generateThumbnail(videoPath, thumbnailPath);
    console.log('Thumbnail generated:', thumbnailPath);

    // Stap 8: Bereken duration VOORDAT we cleanen
    console.log('Step 8: Getting video duration...');
    const { stdout: durationStr } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    ).catch(() => ({ stdout: '30' }));
    const duration = parseFloat(durationStr) || 30;
    console.log(`Video duration: ${duration}s`);

    // Stap 9: Upload naar S3
    console.log('Step 9: Uploading to S3...');
    const videoS3Key = await uploadVideoToS3(videoPath, `${sessionId}.mp4`);
    const thumbnailS3Key = await uploadVideoToS3(thumbnailPath, `${sessionId}_thumb.jpg`);
    console.log('Files uploaded to S3:', { videoS3Key, thumbnailS3Key });

    // Stap 9b: Genereer signed URLs voor direct access
    console.log('Step 9b: Generating signed URLs...');
    const { getDownloadUrl } = await import('./s3');
    const videoUrl = await getDownloadUrl(videoS3Key, 7 * 24 * 3600); // 7 dagen geldig
    const thumbnailUrl = await getDownloadUrl(thumbnailS3Key, 7 * 24 * 3600);
    console.log('Generated URLs:', { videoUrl: videoUrl.substring(0, 100) + '...', thumbnailUrl: thumbnailUrl.substring(0, 100) + '...' });

    // Stap 10: Cleanup temp files
    console.log('Step 10: Cleaning up temp files...');
    await Promise.all([
      unlink(audioPath).catch(console.error),
      unlink(videoPath).catch(console.error),
      unlink(thumbnailPath).catch(console.error),
      ...imagePaths.map(p => unlink(p).catch(console.error)),
    ]);

    console.log('✅ Video generation complete!');

    return {
      videoUrl: videoUrl,
      thumbnailUrl: thumbnailUrl,
      duration,
    };

  } catch (error) {
    console.error('Error in generateCustomVideo:', error);
    return {
      videoUrl: '',
      duration: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Beschikbare stijlen
 */
export const VIDEO_STYLES = [
  { value: 'realistic', label: 'Realistisch', description: 'Fotorealistische afbeeldingen' },
  { value: 'cinematic', label: 'Cinematisch', description: 'Filmische look met dramatische belichting' },
  { value: 'animated', label: 'Geanimeerd', description: 'Cartoon animatie stijl' },
  { value: 'cartoon', label: 'Cartoon', description: '2D cartoon tekeningen' },
  { value: 'fantasy', label: 'Fantasy', description: 'Fantasie kunst met magische elementen' },
  { value: 'digital-art', label: 'Digital Art', description: 'Moderne digitale kunst' },
  { value: '3d', label: '3D Render', description: 'Professionele 3D visualisaties' },
] as const;

/**
 * Aspect ratio opties
 */
export const ASPECT_RATIOS = [
  { value: '9:16', label: 'Verticaal (9:16)', description: 'Perfect voor TikTok, Reels, Shorts' },
  { value: '16:9', label: 'Horizontaal (16:9)', description: 'Perfect voor YouTube' },
  { value: '1:1', label: 'Vierkant (1:1)', description: 'Perfect voor Instagram feed' },
] as const;

