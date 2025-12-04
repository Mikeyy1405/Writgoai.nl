/**
 * AI Video Creator Pro
 * Professioneel systeem voor het genereren van faceless YouTube video's
 * 
 * Features:
 * - 7-stap workflow (Idee → Script → Beelden → Voice → Muziek → Assemblage)
 * - Niche-specifieke presets
 * - Multi-taal support
 * - Project integratie
 * - YouTube publishing
 */

import { chatCompletion, generateImage, IMAGE_MODELS } from './aiml-api';
import { textToSpeech, getElevenLabsVoices } from './elevenlabs';
import { uploadFile, getDownloadUrl } from './s3';
import { getNichePreset, LANGUAGE_OPTIONS, VIDEO_LENGTH_OPTIONS } from './niche-presets';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const TEMP_DIR = path.join('/tmp', 'video-creator-pro');

export interface VideoIdeaGenerationOptions {
  niche: string;
  onderwerp?: string;
  taal: string;
  projectContext?: {
    naam: string;
    niche?: string;
    brandVoice?: string;
    targetAudience?: string;
    contentPillars?: string[];
  };
}

export interface VideoIdea {
  titel: string;
  beschrijving: string;
  hooks: string[];
  keywords: string[];
  geschatteDuur: string;
  viraalScore: number;
}

export interface VideoScriptOptions {
  videoIdea: VideoIdea;
  niche: string;
  taal: string;
  videoLengte: 'kort' | 'medium' | 'lang';
  toon: string;
  projectContext?: any;
}

export interface VideoScript {
  titel: string;
  introductie: string;
  scenes: ScriptScene[];
  conclusie: string;
  cta: string;
  geschatteDuur: number;
  totalWords: number;
}

export interface ScriptScene {
  sceneNummer: number;
  voiceoverText: string;
  beeldBeschrijving: string;
  duur: number;
}

export interface ImagePromptOptions {
  script: VideoScript;
  niche: string;
  beeldstijl: string;
}

export interface ImagePrompt {
  sceneNummer: number;
  prompt: string;
  stijlBeschrijving: string;
}

export interface GenerateImagesOptions {
  imagePrompts: ImagePrompt[];
  imageModel: string;
  niche: string;
}

export interface GeneratedImage {
  sceneNummer: number;
  imageUrl: string;
  s3Key: string;
  width: number;
  height: number;
}

export interface GenerateVoiceoverOptions {
  script: VideoScript;
  voiceId: string;
  taal: string;
}

export interface Voiceover {
  audioUrl: string;
  s3Key: string;
  duration: number;
  text: string;
}

export interface AssembleVideoOptions {
  images: GeneratedImage[];
  voiceover: Voiceover;
  script: VideoScript;
  aspectRatio: '9:16' | '16:9' | '1:1';
  backgroundMusic?: boolean;
  musicVolume?: number;
}

export interface VideoOutput {
  videoUrl: string;
  thumbnailUrl: string;
  s3VideoKey: string;
  s3ThumbnailKey: string;
  duration: number;
  metadata: {
    titel: string;
    beschrijving: string;
    tags: string[];
    scenes: ScriptScene[];
  };
}

/**
 * AI Video Creator Pro Class
 */
export class AIVideoCreatorPro {
  private sessionId: string;
  private tempDir: string;

  constructor() {
    this.sessionId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.tempDir = path.join(TEMP_DIR, this.sessionId);
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir() {
    if (!existsSync(this.tempDir)) {
      await mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * Stap 1: Genereer 3 virale video-ideeën
   */
  async generateVideoIdeas(options: VideoIdeaGenerationOptions): Promise<VideoIdea[]> {
    console.log('📋 Stap 1: Genereer video-ideeën');

    const nichePreset = getNichePreset(options.niche);
    if (!nichePreset) {
      throw new Error(`Onbekende niche: ${options.niche}`);
    }

    const systemPrompt = `Je bent een expert YouTube content strategist gespecialiseerd in ${nichePreset.naam} content.
Je taak is om virale video-ideeën te genereren die perfect aansluiten bij de niche en doelgroep.

Niche: ${nichePreset.naam}
Beschrijving: ${nichePreset.beschrijving}
Toon: ${nichePreset.toon}
Doelgroep: ${nichePreset.target_demographics.join(', ')}

${options.projectContext ? `
Project Context:
- Naam: ${options.projectContext.naam}
- Brand Voice: ${options.projectContext.brandVoice || 'Niet opgegeven'}
- Target Audience: ${options.projectContext.targetAudience || 'Niet opgegeven'}
- Content Pillars: ${options.projectContext.contentPillars?.join(', ') || 'Niet opgegeven'}
` : ''}

Genereer 3 unieke video-ideeën die:
1. Viraal potentieel hebben
2. Aansluiten bij de niche en doelgroep
3. Een duidelijke hook hebben
4. SEO-vriendelijk zijn
5. Engagement genereren`;

    const userPrompt = options.onderwerp
      ? `Genereer 3 video-ideeën over het onderwerp: "${options.onderwerp}"`
      : `Genereer 3 trending video-ideeën voor de ${nichePreset.naam} niche`;

    const response = await chatCompletion({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `${userPrompt}

Geef je antwoord in JSON formaat als een array van 3 objecten met deze structuur:
{
  "titel": "Pakkende video titel",
  "beschrijving": "Korte beschrijving van de video (50-100 woorden)",
  "hooks": ["Hook 1", "Hook 2", "Hook 3"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "geschatteDuur": "5-8 minuten",
  "viraalScore": 85
}

Belangrijk: Geef ALLEEN de JSON array terug, geen extra tekst.`,
        },
      ],
      temperature: 0.9,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    const ideas = JSON.parse(content.trim());

    console.log(`✅ ${ideas.length} video-ideeën gegenereerd`);
    return ideas;
  }

  /**
   * Stap 2: Schrijf volledig script met scene-indelingen
   */
  async generateScript(options: VideoScriptOptions): Promise<VideoScript> {
    console.log('📝 Stap 2: Genereer video script');

    const nichePreset = getNichePreset(options.niche);
    if (!nichePreset) {
      throw new Error(`Onbekende niche: ${options.niche}`);
    }

    const lengthConfig = VIDEO_LENGTH_OPTIONS.find(l => l.value === options.videoLengte);
    const targetDuration = lengthConfig ? (lengthConfig.duration.min + lengthConfig.duration.max) / 2 : 300;
    const targetWords = Math.floor(targetDuration * 2.5); // ~150 woorden per minuut

    const systemPrompt = `Je bent een professionele YouTube scriptwriter gespecialiseerd in ${nichePreset.naam} content.

Niche: ${nichePreset.naam}
Toon: ${options.toon}
Video Lengte: ${options.videoLengte} (doel: ${Math.floor(targetDuration / 60)} minuten)
Target Woorden: ${targetWords}
Script Structuur: ${nichePreset.script_template.structure}

${options.projectContext ? `
Project Context:
- Brand Voice: ${options.projectContext.brandVoice || 'Niet opgegeven'}
- Target Audience: ${options.projectContext.targetAudience || 'Niet opgegeven'}
` : ''}

Schrijf een boeiend script dat:
1. Start met een krachtige hook
2. De kijker direct betrokken houdt
3. Waarde levert aan de doelgroep
4. Eindigt met een sterke CTA
5. Optimaal is voor voiceover
6. Verdeeld is in 5-8 visuele scenes`;

    const userPrompt = `Schrijf een volledig YouTube script voor deze video:

Titel: ${options.videoIdea.titel}
Beschrijving: ${options.videoIdea.beschrijving}

Geef je antwoord in JSON formaat met deze structuur:
{
  "titel": "Video titel",
  "introductie": "Opening hook en introductie (50-100 woorden)",
  "scenes": [
    {
      "sceneNummer": 1,
      "voiceoverText": "Wat de voiceover zegt in deze scene",
      "beeldBeschrijving": "Korte beschrijving wat visueel te zien is",
      "duur": 30
    }
  ],
  "conclusie": "Conclusie en samenvatting (50-100 woorden)",
  "cta": "Call-to-action (like, subscribe, etc)",
  "geschatteDuur": 420,
  "totalWords": 1050
}

Belangrijk: 
- Maak 5-8 scenes
- Totaal ~${targetWords} woorden
- Voiceover per scene moet natuurlijk en boeiend zijn
- Elke scene moet 30-60 seconden duren
- Geef ALLEEN de JSON terug, geen extra tekst.`;

    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content.trim();
    
    // Extract JSON from potential markdown code blocks
    let jsonContent = content;
    if (content.includes('```json')) {
      jsonContent = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
      jsonContent = content.split('```')[1].split('```')[0].trim();
    }

    const script = JSON.parse(jsonContent);

    console.log(`✅ Script gegenereerd: ${script.scenes.length} scenes, ${script.totalWords} woorden`);
    return script;
  }

  /**
   * Stap 3: Genereer niche-specifieke image prompts
   */
  async generateImagePrompts(options: ImagePromptOptions): Promise<ImagePrompt[]> {
    console.log('🎨 Stap 3: Genereer image prompts');

    const nichePreset = getNichePreset(options.niche);
    if (!nichePreset) {
      throw new Error(`Onbekende niche: ${options.niche}`);
    }

    const systemPrompt = `Je bent een expert in visuele storytelling en image prompt engineering.
Je taak is om perfecte image generation prompts te maken voor ${nichePreset.naam} video content.

Beeldstijl: ${options.beeldstijl}
Kleuren Palette: ${nichePreset.kleuren_palette.join(', ')}

Maak prompts die:
1. Visueel aantrekkelijk zijn
2. Perfect aansluiten bij de beeldstijl
3. De toon van de niche weerspiegelen
4. Goed werken met AI image generation
5. Specifiek en gedetailleerd zijn`;

    const prompts: ImagePrompt[] = [];

    for (const scene of options.script.scenes) {
      const userPrompt = `Maak een perfecte image generation prompt voor deze scene:

Scene ${scene.sceneNummer}:
Voiceover: "${scene.voiceoverText}"
Beeld Beschrijving: "${scene.beeldBeschrijving}"

Maak een prompt die de essentie vangt in 100-150 karakters.
Focus op visuele details, sfeer, en compositie.

Geef ALLEEN de prompt terug, geen extra tekst of uitleg.`;

      const response = await chatCompletion({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const prompt = response.choices[0].message.content.trim();

      prompts.push({
        sceneNummer: scene.sceneNummer,
        prompt: prompt,
        stijlBeschrijving: `${options.beeldstijl}, ${nichePreset.toon} atmosphere`,
      });
    }

    console.log(`✅ ${prompts.length} image prompts gegenereerd`);
    return prompts;
  }

  /**
   * Stap 4: Genereer afbeeldingen
   */
  async generateImages(options: GenerateImagesOptions): Promise<GeneratedImage[]> {
    console.log('🖼️  Stap 4: Genereer afbeeldingen');

    await this.ensureTempDir();

    const images: GeneratedImage[] = [];
    const nichePreset = getNichePreset(options.niche);

    // Map model names to AIML API model IDs
    const modelMap: Record<string, keyof typeof IMAGE_MODELS> = {
      'FLUX_PRO_ULTRA': 'FLUX_PRO_ULTRA',
      'IMAGEN_4': 'IMAGEN_4',
      'DALLE_3': 'DALLE_3',
      'SD_35': 'SD_35',
    };

    const selectedModel = modelMap[options.imageModel] || 'SD_35';

    for (const imagePrompt of options.imagePrompts) {
      try {
        console.log(`  Genereer afbeelding ${imagePrompt.sceneNummer}/${options.imagePrompts.length}...`);

        // Voeg stijl toe aan prompt
        const fullPrompt = `${imagePrompt.prompt}, ${imagePrompt.stijlBeschrijving}`;

        const result = await generateImage({
          prompt: fullPrompt,
          model: selectedModel,
          width: 1024,
          height: 1024,
        });

        if (!result.success || !result.images || result.images.length === 0) {
          throw new Error('Image generation failed');
        }

        // Download image
        const imageUrl = result.images[0];
        let imageBuffer: Buffer;

        if (imageUrl.startsWith('data:')) {
          // Base64 encoded image
          const base64Data = imageUrl.split(',')[1];
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else {
          // URL - download it
          const imageResponse = await fetch(imageUrl);
          imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        }

        // Save to temp
        const tempPath = path.join(this.tempDir, `scene_${imagePrompt.sceneNummer}.png`);
        await writeFile(tempPath, imageBuffer);

        // Upload to S3
        const fileName = `${this.sessionId}_scene_${imagePrompt.sceneNummer}.png`;
        const s3Key = await uploadFile(imageBuffer, `videos/${fileName}`, 'image/png');
        const signedUrl = await getDownloadUrl(s3Key, 7 * 24 * 3600);

        images.push({
          sceneNummer: imagePrompt.sceneNummer,
          imageUrl: signedUrl,
          s3Key: s3Key,
          width: 1024,
          height: 1024,
        });

        console.log(`  ✅ Afbeelding ${imagePrompt.sceneNummer} gegenereerd`);
      } catch (error) {
        console.error(`  ❌ Fout bij afbeelding ${imagePrompt.sceneNummer}:`, error);
        // Continue with other images
      }
    }

    console.log(`✅ ${images.length}/${options.imagePrompts.length} afbeeldingen gegenereerd`);
    return images;
  }

  /**
   * Stap 5: Genereer voiceover
   */
  async generateVoiceover(options: GenerateVoiceoverOptions): Promise<Voiceover> {
    console.log('🎤 Stap 5: Genereer voiceover');

    await this.ensureTempDir();

    // Combineer alle voiceover tekst
    const fullText = [
      options.script.introductie,
      ...options.script.scenes.map(s => s.voiceoverText),
      options.script.conclusie,
      options.script.cta,
    ].join('\n\n');

    console.log(`  Tekst lengte: ${fullText.length} karakters`);

    // Genereer audio met ElevenLabs
    const audioBuffer = await textToSpeech({
      voice_id: options.voiceId,
      text: fullText,
      model_id: 'eleven_multilingual_v2',
    });

    // Save to temp
    const tempPath = path.join(this.tempDir, 'voiceover.mp3');
    await writeFile(tempPath, Buffer.from(audioBuffer));

    // Get duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempPath}"`
    );
    const duration = parseFloat(stdout.trim());

    // Upload to S3
    const fileName = `${this.sessionId}_voiceover.mp3`;
    const s3Key = await uploadFile(Buffer.from(audioBuffer), `videos/${fileName}`, 'audio/mpeg');
    const signedUrl = await getDownloadUrl(s3Key, 7 * 24 * 3600);

    console.log(`✅ Voiceover gegenereerd: ${Math.floor(duration)}s`);

    return {
      audioUrl: signedUrl,
      s3Key: s3Key,
      duration: duration,
      text: fullText,
    };
  }

  /**
   * Stap 6 & 7: Assembleer video met FFmpeg
   */
  async assembleVideo(options: AssembleVideoOptions): Promise<VideoOutput> {
    console.log('🎬 Stap 6-7: Assembleer video');

    await this.ensureTempDir();

    // Check FFmpeg
    try {
      await execAsync('which ffmpeg');
    } catch {
      throw new Error('FFmpeg is niet geïnstalleerd');
    }

    // Download images to temp
    const imagePaths: string[] = [];
    for (const img of options.images) {
      const imgPath = path.join(this.tempDir, `scene_${img.sceneNummer}.png`);
      
      // Download from URL
      const response = await fetch(img.imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(imgPath, buffer);
      
      imagePaths.push(imgPath);
    }

    // Download voiceover
    const audioPath = path.join(this.tempDir, 'voiceover.mp3');
    const audioResponse = await fetch(options.voiceover.audioUrl);
    const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
    await writeFile(audioPath, audioBuffer);

    // Determine dimensions
    const dimensions = {
      '9:16': { width: 1080, height: 1920 },
      '16:9': { width: 1920, height: 1080 },
      '1:1': { width: 1080, height: 1080 },
    }[options.aspectRatio];

    // Create video
    const videoPath = path.join(this.tempDir, 'final_video.mp4');
    const durationPerImage = options.voiceover.duration / imagePaths.length;

    // Create concat file
    const concatPath = path.join(this.tempDir, 'concat.txt');
    const concatContent = imagePaths
      .map(img => `file '${img}'\nduration ${durationPerImage}`)
      .join('\n') + `\nfile '${imagePaths[imagePaths.length - 1]}'`;
    await writeFile(concatPath, concatContent);

    // FFmpeg command - create video from images with Ken Burns effect
    const videoCommand = `ffmpeg -y -f concat -safe 0 -i "${concatPath}" -vf "scale=${dimensions.width}:${dimensions.height}:force_original_aspect_ratio=decrease,pad=${dimensions.width}:${dimensions.height}:(ow-iw)/2:(oh-ih)/2:color=black,fps=25,zoompan=z='min(zoom+0.0015,1.5)':d=25*${durationPerImage}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${dimensions.width}x${dimensions.height}" -c:v libx264 -preset medium -crf 23 -pix_fmt yuv420p -t ${options.voiceover.duration} "${videoPath}.tmp"`;

    console.log('  Maak video van afbeeldingen...');
    await execAsync(videoCommand);

    // Add audio
    const finalCommand = `ffmpeg -y -i "${videoPath}.tmp" -i "${audioPath}" -c:v copy -c:a aac -b:a 192k -shortest "${videoPath}"`;
    console.log('  Voeg audio toe...');
    await execAsync(finalCommand);

    // Clean temp video
    await unlink(`${videoPath}.tmp`);

    // Generate thumbnail (first frame with zoom)
    const thumbnailPath = path.join(this.tempDir, 'thumbnail.jpg');
    await execAsync(
      `ffmpeg -y -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720" "${thumbnailPath}"`
    );

    // Upload to S3
    const videoBuffer = await require('fs/promises').readFile(videoPath);
    const thumbnailBuffer = await require('fs/promises').readFile(thumbnailPath);

    const videoFileName = `${this.sessionId}_final.mp4`;
    const thumbnailFileName = `${this.sessionId}_thumbnail.jpg`;

    const videoS3Key = await uploadFile(videoBuffer, `videos/${videoFileName}`, 'video/mp4');
    const thumbnailS3Key = await uploadFile(
      thumbnailBuffer,
      `videos/${thumbnailFileName}`,
      'image/jpeg'
    );

    const videoUrl = await getDownloadUrl(videoS3Key, 7 * 24 * 3600);
    const thumbnailUrl = await getDownloadUrl(thumbnailS3Key, 7 * 24 * 3600);

    console.log('✅ Video geassembleerd en geüpload');

    // Generate metadata
    const tags = [
      ...options.script.scenes.flatMap(s => 
        s.voiceoverText.split(' ')
          .filter(w => w.length > 5)
          .slice(0, 2)
      ),
    ].slice(0, 15);

    return {
      videoUrl,
      thumbnailUrl,
      s3VideoKey: videoS3Key,
      s3ThumbnailKey: thumbnailS3Key,
      duration: options.voiceover.duration,
      metadata: {
        titel: options.script.titel,
        beschrijving: `${options.script.introductie}\n\n${options.script.conclusie}`,
        tags: [...new Set(tags)],
        scenes: options.script.scenes,
      },
    };
  }

  /**
   * Cleanup temp files
   */
  async cleanup() {
    try {
      const { rm } = require('fs/promises');
      await rm(this.tempDir, { recursive: true, force: true });
      console.log('🧹 Temp files opgeruimd');
    } catch (error) {
      console.error('Fout bij cleanup:', error);
    }
  }
}

/**
 * Helper: Generate YouTube metadata
 */
export async function generateYouTubeMetadata(options: {
  script: VideoScript;
  niche: string;
  keywords: string[];
}): Promise<{
  titel: string;
  beschrijving: string;
  tags: string[];
  category: string;
}> {
  const nichePreset = getNichePreset(options.niche);

  const systemPrompt = `Je bent een YouTube SEO expert.
Maak geoptimaliseerde metadata voor maximale views en ranking.`;

  const userPrompt = `Maak YouTube metadata voor deze video:

Titel: ${options.script.titel}
Niche: ${nichePreset?.naam || options.niche}
Keywords: ${options.keywords.join(', ')}

Introductie: ${options.script.introductie.substring(0, 200)}

Geef je antwoord in JSON formaat:
{
  "titel": "SEO-geoptimaliseerde titel (max 60 karakters)",
  "beschrijving": "Boeiende beschrijving met keywords (200-300 woorden)",
  "tags": ["tag1", "tag2", ...] (max 15 tags),
  "category": "Entertainment" (bijv. "Education", "Entertainment", "People & Blogs", etc.)
}

Geef ALLEEN de JSON terug, geen extra tekst.`;

  const response = await chatCompletion({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0].message.content.trim();
  let jsonContent = content;
  if (content.includes('```json')) {
    jsonContent = content.split('```json')[1].split('```')[0].trim();
  } else if (content.includes('```')) {
    jsonContent = content.split('```')[1].split('```')[0].trim();
  }

  return JSON.parse(jsonContent);
}
