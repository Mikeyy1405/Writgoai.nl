import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { VIDEO_MODELS, VIDEO_STYLES, VideoModelId } from '@/lib/aiml-api-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Available voices for ElevenLabs
const AVAILABLE_VOICES = [
  'Rachel', 'Drew', 'Clyde', 'Paul', 'Domi',
  'Dave', 'Fin', 'Sarah', 'Antoni', 'Thomas',
  'Charlie', 'Emily'
];

interface VideoProject {
  id: string;
  user_id: string;
  title: string;
  description: string;
  aspect_ratio: string;
  status: string;
  final_video_url: string | null;
  total_duration: number;
  total_credits_used: number;
  created_at: string;
  updated_at: string;
  scenes?: VideoScene[];
}

interface VideoScene {
  id: string;
  project_id: string;
  scene_number: number;
  prompt: string;
  model: string;
  duration: number;
  video_url: string | null;
  status: string;
  error_message: string | null;
  credits_used: number;
}

/**
 * GET /api/video-studio/projects
 * Get all video projects for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get projects with scenes
    const { data: projects, error } = await supabase
      .from('video_projects')
      .select(`
        *,
        scenes:video_scenes(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    return NextResponse.json({ projects });

  } catch (error: any) {
    console.error('Projects GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/video-studio/projects
 * Create a new video project with AI-generated scenes including narration
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      aspectRatio = '9:16', // Default to TikTok/Shorts format
      numberOfScenes = 6,
      sceneDuration = 5,
      model = 'luma/ray-2',
      voiceId = 'Rachel',
      musicPrompt,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Generate complete scene data using AI (prompts, narration, and styles)
    const sceneData = await generateCompleteScenes(
      title,
      description,
      numberOfScenes
    );

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from('video_projects')
      .insert({
        user_id: user.id,
        title,
        description,
        aspect_ratio: aspectRatio,
        voice_id: voiceId,
        music_prompt: musicPrompt || `Upbeat background music for ${title}`,
        status: 'draft',
        total_duration: numberOfScenes * sceneDuration,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    // Create scenes with all data
    const scenesData = sceneData.map((scene, index) => ({
      project_id: project.id,
      scene_number: index + 1,
      prompt: scene.visualPrompt,
      narration_text: scene.narration,
      style: scene.style,
      model,
      duration: sceneDuration,
      status: 'pending',
    }));

    const { data: scenes, error: scenesError } = await supabase
      .from('video_scenes')
      .insert(scenesData)
      .select();

    if (scenesError) {
      console.error('Error creating scenes:', scenesError);
      await supabase.from('video_projects').delete().eq('id', project.id);
      return NextResponse.json({ error: 'Failed to create scenes' }, { status: 500 });
    }

    // Calculate estimated credits
    const modelConfig = VIDEO_MODELS[model as VideoModelId];
    const estimatedCredits = numberOfScenes * (modelConfig?.credits || 10) +
                             numberOfScenes * 2 + // Voice-over
                             5; // Music

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        scenes,
      },
      estimatedCredits,
      availableModels: Object.entries(VIDEO_MODELS).map(([id, config]) => ({
        id,
        ...config,
      })),
      availableVoices: AVAILABLE_VOICES,
      availableStyles: VIDEO_STYLES,
    });

  } catch (error: any) {
    console.error('Projects POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface GeneratedScene {
  visualPrompt: string;
  narration: string;
  style: string;
}

/**
 * Generate complete scene data using AI (visual prompts, narration, and styles)
 */
async function generateCompleteScenes(
  title: string,
  description: string,
  numberOfScenes: number
): Promise<GeneratedScene[]> {
  // Available styles for variety
  const styleIds = VIDEO_STYLES.map(s => s.id);

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Je bent een expert video producer die video scripts creëert voor TikTok/YouTube Shorts.

Voor elke scene genereer je:
1. Een visuele prompt (Engels) voor AI video generatie met camera bewegingen en sfeer
2. Een korte voice-over tekst (Nederlands) van max 2 zinnen
3. Een visuele stijl uit deze opties: ${styleIds.join(', ')}

BELANGRIJK: Varieer de stijlen voor visuele interesse!

Geef output in JSON formaat:
[
  {
    "visualPrompt": "Cinematic drone shot over...",
    "narration": "Nederlandse tekst voor voice-over...",
    "style": "cinematic_drone"
  }
]`,
        },
        {
          role: 'user',
          content: `Maak ${numberOfScenes} scenes voor een video:

Titel: ${title}
Beschrijving: ${description}

Zorg voor een logische verhaallijn en varieer de visuele stijlen.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    // Handle both array and object with scenes property
    const scenes: GeneratedScene[] = Array.isArray(parsed) ? parsed : parsed.scenes || [];

    // Validate and fill in missing scenes
    while (scenes.length < numberOfScenes) {
      const styleIndex = scenes.length % styleIds.length;
      scenes.push({
        visualPrompt: `Cinematic establishing shot for ${title}, professional quality, smooth motion`,
        narration: `${title} - scene ${scenes.length + 1}`,
        style: styleIds[styleIndex],
      });
    }

    // Validate styles and ensure they're valid
    return scenes.slice(0, numberOfScenes).map((scene, index) => ({
      visualPrompt: scene.visualPrompt || `Scene ${index + 1} of ${title}`,
      narration: scene.narration || '',
      style: styleIds.includes(scene.style) ? scene.style : styleIds[index % styleIds.length],
    }));

  } catch (error) {
    console.error('Error generating scene data:', error);

    // Fallback: generate basic scenes
    return Array(numberOfScenes).fill(null).map((_, i) => ({
      visualPrompt: `Cinematic scene ${i + 1} of ${title}, ${description.slice(0, 50)}, professional quality`,
      narration: '',
      style: styleIds[i % styleIds.length],
    }));
  }
}
