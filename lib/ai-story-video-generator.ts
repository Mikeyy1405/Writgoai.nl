
/**
 * 🎬 AI Story Video Generator
 * 
 * Genereert complete AI story videos met meerdere scènes
 * - Elk scène heeft eigen script deel en afbeelding
 * - Voiceover over alle scènes
 * - Background muziek
 * - FFmpeg compositie
 */

import { generateCustomVideo } from './custom-video-generator';

export interface StoryScene {
  description: string;  // Visual description voor DALL-E
  duration: number;     // Duration in seconds
  text?: string;        // Optional text overlay
}

export interface StoryVideoConfig {
  topic: string;
  script: string;
  scenes: StoryScene[];
  voiceId?: string;
  style?: 'realistic' | 'cinematic' | 'animated' | 'cartoon' | 'fantasy' | 'digital-art' | '3d';
  aspectRatio?: '9:16' | '16:9' | '1:1';
  backgroundMusic?: boolean;
  musicVolume?: number;
}

export async function generateStoryVideo(config: StoryVideoConfig) {
  const {
    topic,
    script,
    scenes,
    voiceId = 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Nederlands
    style = 'cinematic',
    aspectRatio = '9:16',
    backgroundMusic = true,
    musicVolume = 30,
  } = config;

  console.log(`🎬 Generating AI Story Video: ${topic}`);
  console.log(`📋 Script: ${script.length} characters`);
  console.log(`🎞️  Scenes: ${scenes.length} scenes`);

  // Validate scenes
  if (scenes.length < 3) {
    throw new Error('Een AI story moet minimaal 3 scènes hebben');
  }

  if (scenes.length > 10) {
    throw new Error('Maximum 10 scènes per video (om lange generatie tijd te vermijden)');
  }

  // Generate video met custom generator
  // De custom generator kan al meerdere afbeeldingen aan, maar we willen meer controle
  // over de timing en beschrijvingen per scène
  
  try {
    // Voor nu gebruiken we de custom video generator met de scène count
    // Later kunnen we dit uitbreiden met per-scene timing control
    const sceneDescriptions = scenes.map(s => s.description).join('. ');
    const enhancedScript = `${script}\n\nVisuele scènes: ${sceneDescriptions}`;

    const result = await generateCustomVideo({
      script: enhancedScript,
      voiceId,
      style,
      aspectRatio,
      backgroundMusic,
      musicVolume,
      imageCount: Math.min(scenes.length, 8), // Max 8 afbeeldingen voor performance
    });

    return {
      ...result,
      sceneCount: scenes.length,
      storyMode: true,
    };
  } catch (error: any) {
    console.error('❌ Story video generation failed:', error);
    throw error;
  }
}

/**
 * Helper functie om automatisch scènes te genereren vanuit een script
 * Splits het script in logische delen en genereert visuele beschrijvingen
 */
export async function generateScenesFromScript(
  script: string,
  topic: string,
  sceneCount: number = 5
): Promise<StoryScene[]> {
  // Voor nu een simpele verdeling - later kunnen we AI gebruiken om dit intelligenter te doen
  const words = script.split(' ');
  const wordsPerScene = Math.ceil(words.length / sceneCount);
  
  const scenes: StoryScene[] = [];
  
  for (let i = 0; i < sceneCount; i++) {
    const startIdx = i * wordsPerScene;
    const endIdx = Math.min((i + 1) * wordsPerScene, words.length);
    const sceneText = words.slice(startIdx, endIdx).join(' ');
    
    // Generate visual description based on scene text
    // Dit zou met AI kunnen worden verbeterd
    scenes.push({
      description: `${topic} - ${sceneText.slice(0, 100)}`, // Simple description
      duration: Math.ceil(sceneText.split(' ').length / 3), // Rough estimate: 3 words per second
    });
  }
  
  return scenes;
}

/**
 * AI-powered scene generation
 * Gebruikt AI om het script te analyseren en optimale scènes te genereren
 */
export async function generateScenesWithAI(
  script: string,
  topic: string,
  style: string,
  sceneCount: number = 5
): Promise<StoryScene[]> {
  const { default: OpenAI } = await import('openai');
  
  const openai = new OpenAI({
    baseURL: 'https://api.aimlapi.com/v1',
    apiKey: process.env.AIML_API_KEY,
  });

  const prompt = `Analyseer dit script voor een ${style} video over "${topic}" en genereer ${sceneCount} visuele scènes.

Script:
${script}

Genereer een JSON array met ${sceneCount} scènes. Elke scène moet hebben:
- description: Gedetailleerde visuele beschrijving voor ${style} stijl (bijv. "Cinematic shot of a modern office, sunlight through windows, professional atmosphere")
- duration: Geschatte duur in seconden (totaal moet ongeveer 60-90 sec zijn)

Output format:
\`\`\`json
[
  {
    "description": "...",
    "duration": 12
  },
  ...
]
\`\`\``;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/);
    
    if (jsonMatch) {
      const scenes = JSON.parse(jsonMatch[1]);
      return scenes;
    }

    throw new Error('Failed to parse AI-generated scenes');
  } catch (error) {
    console.error('AI scene generation failed, using fallback:', error);
    // Fallback to simple scene generation
    return generateScenesFromScript(script, topic, sceneCount);
  }
}
