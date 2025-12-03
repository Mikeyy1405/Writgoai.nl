
/**
 * Complete Video Composer
 * Combines multiple Runway ML clips, voiceover, and music into a single MP4
 */

import { generateTextToVideo } from './runway-ml-api';

interface VideoSegment {
  videoUrl: string;
  duration: number;
  startTime: number;
}

interface AudioSegment {
  audioUrl: string;
  volume: number;
  startTime: number;
  duration: number;
}

interface VideoComposition {
  segments: VideoSegment[];
  voiceover?: AudioSegment;
  music?: AudioSegment;
  totalDuration: number;
}

/**
 * Generate video segments from script
 */
export async function generateVideoFromScript(
  script: { text: string; segments?: Array<{ text: string; duration: number }> },
  platform: 'youtube' | 'tiktok' | 'instagram'
): Promise<VideoSegment[]> {
  const segments = script.segments || [
    { text: script.text, duration: 10 }
  ];

  const videoSegments: VideoSegment[] = [];
  let currentTime = 0;

  console.log('[Video Composer] Generating', segments.length, 'video segments...');

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const visualPrompt = await createVisualPrompt(segment.text, platform);

    try {
      console.log(`[Video Composer] Generating segment ${i + 1}/${segments.length}:`, visualPrompt);
      
      const videoUrl = await generateTextToVideo({
        prompt: visualPrompt,
        duration: Math.min(segment.duration, 10), // Max 10 seconds per Runway ML clip
        watermark: false,
      });

      videoSegments.push({
        videoUrl,
        duration: segment.duration,
        startTime: currentTime,
      });

      currentTime += segment.duration;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`[Video Composer] Failed to generate segment ${i + 1}:`, error);
      throw error;
    }
  }

  return videoSegments;
}

/**
 * Create a visual prompt for Runway ML from script text
 */
async function createVisualPrompt(scriptText: string, platform: string): Promise<string> {
  // Use AI to convert script text to visual description
  const response = await fetch('https://api.aimlapi.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Je bent een expert in het maken van visuele prompts voor AI video generatie. Converteer script tekst naar een gedetailleerde visuele beschrijving voor Runway ML.

Richtlijnen:
- Focus op visuele elementen, beweging, camera work
- Gebruik filmtermen: close-up, pan, zoom, tracking shot
- Beschrijf licht, kleuren, sfeer
- Houd het onder 200 karakters
- Platform: ${platform}
- GEEN tekst/woorden in de video
- GEEN mensen tenzij absoluut noodzakelijk

Voorbeeld input: "Welkom bij onze tutorial over social media marketing"
Voorbeeld output: "professional office workspace, laptop screen showing colorful social media icons, smooth camera pan left to right, bright natural lighting, modern minimalist aesthetic, shallow depth of field"`,
        },
        {
          role: 'user',
          content: scriptText,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const visualPrompt = data.choices[0].message.content.trim();
  
  console.log('[Video Composer] Script →Visual:', scriptText, '→', visualPrompt);
  return visualPrompt;
}

/**
 * Create composition metadata for client-side rendering
 */
export function createCompositionData(
  videoSegments: VideoSegment[],
  voiceoverUrl: string | null,
  musicUrl: string | null,
  totalDuration: number
): VideoComposition {
  const composition: VideoComposition = {
    segments: videoSegments,
    totalDuration,
  };

  if (voiceoverUrl) {
    composition.voiceover = {
      audioUrl: voiceoverUrl,
      volume: 1.0,
      startTime: 0,
      duration: totalDuration,
    };
  }

  if (musicUrl) {
    composition.music = {
      audioUrl: musicUrl,
      volume: 0.25, // Background music at 25% volume
      startTime: 0,
      duration: totalDuration,
    };
  }

  return composition;
}

/**
 * Estimate generation time
 */
export function estimateGenerationTime(duration: number, segmentCount: number): number {
  // Runway ML: ~30-60 seconds per 10-second clip
  // ElevenLabs: ~5 seconds
  // Processing overhead: ~10%
  
  const runwayTime = segmentCount * 45; // Average 45s per clip
  const elevenLabsTime = 5;
  const overhead = (runwayTime + elevenLabsTime) * 0.1;
  
  return Math.ceil(runwayTime + elevenLabsTime + overhead);
}

