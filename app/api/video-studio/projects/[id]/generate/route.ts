import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCreditBalance, deductCredits } from '@/lib/credit-manager';
import {
  VIDEO_MODELS,
  VideoModelId,
  VIDEO_STYLES,
  generateVideoWithPolling,
  generateVoiceOverWithPolling,
  generateMusicWithPolling,
} from '@/lib/aiml-api-client';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface VideoScene {
  id: string;
  project_id: string;
  scene_number: number;
  prompt: string;
  narration_text: string;
  style: string;
  model: string;
  duration: number;
  video_url: string | null;
  voice_url: string | null;
  status: string;
}

/**
 * POST /api/video-studio/projects/[id]/generate
 * Generate all scenes for a project including video, voice-over, and music
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body for options
    const body = await req.json().catch(() => ({}));
    const { voiceId = 'Rachel', generateMusic = true, musicPrompt } = body;

    // Get project with scenes
    const { data: project, error: projectError } = await supabase
      .from('video_projects')
      .select(`
        *,
        scenes:video_scenes(*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.scenes || project.scenes.length === 0) {
      return NextResponse.json({ error: 'Project has no scenes' }, { status: 400 });
    }

    // Sort scenes by scene_number
    const scenes: VideoScene[] = project.scenes.sort((a: VideoScene, b: VideoScene) =>
      a.scene_number - b.scene_number
    );

    // Calculate total credits needed
    let totalCreditsNeeded = 0;
    for (const scene of scenes) {
      if (scene.status !== 'completed') {
        const modelConfig = VIDEO_MODELS[scene.model as VideoModelId];
        if (modelConfig) {
          totalCreditsNeeded += modelConfig.credits;
          totalCreditsNeeded += 2; // Voice-over credits
        }
      }
    }
    if (generateMusic) {
      totalCreditsNeeded += 5; // Music credits
    }

    // Check credits
    const balance = await getCreditBalance(user.id);
    if (!balance) {
      return NextResponse.json({ error: 'Unable to fetch credit balance' }, { status: 500 });
    }

    if (!balance.is_admin) {
      if (!balance.subscription_active) {
        return NextResponse.json({ error: 'Subscription not active' }, { status: 402 });
      }

      if (balance.credits_remaining < totalCreditsNeeded) {
        return NextResponse.json({
          error: 'Insufficient credits',
          required: totalCreditsNeeded,
          available: balance.credits_remaining,
        }, { status: 402 });
      }
    }

    // Update project status to processing
    await supabase
      .from('video_projects')
      .update({ status: 'processing' })
      .eq('id', projectId);

    // Results tracking
    const results: {
      sceneNumber: number;
      success: boolean;
      videoUrl?: string;
      voiceUrl?: string;
      error?: string;
    }[] = [];
    let totalCreditsUsed = 0;

    // Generate each scene (video + voice-over)
    for (const scene of scenes) {
      // Skip already completed scenes
      if (scene.status === 'completed' && scene.video_url) {
        results.push({
          sceneNumber: scene.scene_number,
          success: true,
          videoUrl: scene.video_url,
          voiceUrl: scene.voice_url || undefined,
        });
        continue;
      }

      // Update scene status to generating
      await supabase
        .from('video_scenes')
        .update({ status: 'generating' })
        .eq('id', scene.id);

      try {
        const modelConfig = VIDEO_MODELS[scene.model as VideoModelId];
        if (!modelConfig) {
          throw new Error(`Unknown model: ${scene.model}`);
        }

        // Get style prompt
        const styleConfig = VIDEO_STYLES.find(s => s.id === scene.style);
        const stylePrompt = styleConfig?.prompt || '';

        // Combine scene prompt with style
        const fullPrompt = `${scene.prompt}. ${stylePrompt}`;

        console.log(`Generating scene ${scene.scene_number}:`, {
          prompt: fullPrompt.substring(0, 100),
          model: scene.model,
          duration: scene.duration,
        });

        // Generate video
        const videoUrl = await generateVideoWithPolling(
          fullPrompt,
          scene.model as VideoModelId,
          project.aspect_ratio as '16:9' | '9:16' | '1:1',
          scene.duration
        );

        // Generate voice-over if there's narration text
        let voiceUrl: string | undefined;
        if (scene.narration_text && scene.narration_text.trim()) {
          console.log(`Generating voice-over for scene ${scene.scene_number}`);
          voiceUrl = await generateVoiceOverWithPolling(
            scene.narration_text,
            voiceId,
            'elevenlabs/eleven_multilingual_v2'
          );
          totalCreditsUsed += 2;
        }

        // Update scene with video and voice URLs
        await supabase
          .from('video_scenes')
          .update({
            video_url: videoUrl,
            voice_url: voiceUrl || null,
            status: 'completed',
            credits_used: modelConfig.credits + (voiceUrl ? 2 : 0),
          })
          .eq('id', scene.id);

        // Deduct credits
        await deductCredits(user.id, 'video_generation' as any, modelConfig.credits);
        totalCreditsUsed += modelConfig.credits;

        results.push({
          sceneNumber: scene.scene_number,
          success: true,
          videoUrl,
          voiceUrl,
        });

      } catch (error: any) {
        console.error(`Error generating scene ${scene.scene_number}:`, error);

        await supabase
          .from('video_scenes')
          .update({
            status: 'failed',
            error_message: error.message,
          })
          .eq('id', scene.id);

        results.push({
          sceneNumber: scene.scene_number,
          success: false,
          error: error.message,
        });
      }
    }

    // Generate background music if requested
    let musicUrl: string | undefined;
    if (generateMusic && results.some(r => r.success)) {
      try {
        console.log('Generating background music');
        const defaultMusicPrompt = `Background music for ${project.title}. ${project.description}. Upbeat, modern, suitable for social media video.`;
        musicUrl = await generateMusicWithPolling(
          musicPrompt || defaultMusicPrompt,
          60, // 60 seconds
          'stable-audio'
        );
        totalCreditsUsed += 5;
        await deductCredits(user.id, 'music_generation' as any, 5);
      } catch (error: any) {
        console.error('Error generating music:', error);
        // Music generation failure shouldn't fail the whole project
      }
    }

    // Check if all scenes succeeded
    const allSucceeded = results.every(r => r.success);
    const videoUrls = results.filter(r => r.success).map(r => r.videoUrl!);
    const voiceUrls = results.filter(r => r.success && r.voiceUrl).map(r => r.voiceUrl!);

    // Calculate total duration
    const totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);

    // Update project
    const projectUpdate: any = {
      total_credits_used: totalCreditsUsed,
      total_duration: totalDuration,
      status: allSucceeded ? 'completed' : 'failed',
      music_url: musicUrl || null,
    };

    // For now, we store the scene URLs and let the frontend handle stitching display
    // In a production environment, you'd use a service like Shotstack or Creatomate
    // to stitch the videos together server-side

    await supabase
      .from('video_projects')
      .update(projectUpdate)
      .eq('id', projectId);

    // Get updated project with scenes
    const { data: updatedProject } = await supabase
      .from('video_projects')
      .select(`
        *,
        scenes:video_scenes(*)
      `)
      .eq('id', projectId)
      .single();

    // Sort scenes in updated project
    if (updatedProject?.scenes) {
      updatedProject.scenes.sort((a: any, b: any) => a.scene_number - b.scene_number);
    }

    return NextResponse.json({
      success: allSucceeded,
      project: updatedProject,
      results,
      totalCreditsUsed,
      musicUrl,
      message: allSucceeded
        ? 'All scenes generated successfully!'
        : `${results.filter(r => r.success).length}/${results.length} scenes generated`,
    });

  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 });
  }
}

/**
 * GET /api/video-studio/projects/[id]/generate
 * Get generation status for a project
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error } = await supabase
      .from('video_projects')
      .select(`
        *,
        scenes:video_scenes(*)
      `)
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Sort scenes
    if (project.scenes) {
      project.scenes.sort((a: any, b: any) => a.scene_number - b.scene_number);
    }

    // Calculate progress
    const completedScenes = project.scenes?.filter((s: any) => s.status === 'completed').length || 0;
    const totalScenes = project.scenes?.length || 0;
    const progress = totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0;

    return NextResponse.json({
      project,
      progress,
      completedScenes,
      totalScenes,
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
