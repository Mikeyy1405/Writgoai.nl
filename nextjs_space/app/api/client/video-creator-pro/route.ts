/**
 * API Route: Video Creator Pro
 * Endpoint voor het genereren van complete faceless YouTube video's
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  AIVideoCreatorPro,
  VideoIdeaGenerationOptions,
  VideoScriptOptions,
  ImagePromptOptions,
  GenerateImagesOptions,
  GenerateVoiceoverOptions,
  AssembleVideoOptions,
  generateYouTubeMetadata,
} from '@/lib/ai-video-creator-pro';
import { getNichePreset, LANGUAGE_OPTIONS } from '@/lib/niche-presets';

export const dynamic = 'force-dynamic';

export const maxDuration = 300; // 5 minutes

interface VideoCreatorRequest {
  action:
    | 'generate_ideas'
    | 'generate_script'
    | 'generate_image_prompts'
    | 'generate_images'
    | 'generate_voiceover'
    | 'assemble_video'
    | 'generate_complete'; // All steps in one
  data: any;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body: VideoCreatorRequest = await req.json();
    const { action, data } = body;

    const videoCreator = new AIVideoCreatorPro();

    try {
      switch (action) {
        case 'generate_ideas': {
          const { niche, onderwerp, taal, projectId } = data;

          // Get project context if provided
          let projectContext;
          if (projectId) {
            const project = await prisma.project.findUnique({
              where: { id: projectId, clientId: client.id },
            });

            if (project) {
              projectContext = {
                naam: project.name,
                niche: project.niche || undefined,
                brandVoice: project.brandVoice || undefined,
                targetAudience: project.targetAudience || undefined,
                contentPillars: project.contentPillars || undefined,
              };
            }
          }

          const options: VideoIdeaGenerationOptions = {
            niche,
            onderwerp,
            taal,
            projectContext,
          };

          const ideas = await videoCreator.generateVideoIdeas(options);

          return NextResponse.json({
            success: true,
            ideas,
          });
        }

        case 'generate_script': {
          const { videoIdea, niche, taal, videoLengte, toon, projectId } = data;

          let projectContext;
          if (projectId) {
            const project = await prisma.project.findUnique({
              where: { id: projectId, clientId: client.id },
            });

            if (project) {
              projectContext = {
                brandVoice: project.brandVoice || undefined,
                targetAudience: project.targetAudience || undefined,
              };
            }
          }

          const options: VideoScriptOptions = {
            videoIdea,
            niche,
            taal,
            videoLengte,
            toon,
            projectContext,
          };

          const script = await videoCreator.generateScript(options);

          return NextResponse.json({
            success: true,
            script,
          });
        }

        case 'generate_image_prompts': {
          const { script, niche, beeldstijl } = data;

          const options: ImagePromptOptions = {
            script,
            niche,
            beeldstijl,
          };

          const prompts = await videoCreator.generateImagePrompts(options);

          return NextResponse.json({
            success: true,
            imagePrompts: prompts,
          });
        }

        case 'generate_images': {
          const { imagePrompts, imageModel, niche } = data;

          const options: GenerateImagesOptions = {
            imagePrompts,
            imageModel,
            niche,
          };

          const images = await videoCreator.generateImages(options);

          return NextResponse.json({
            success: true,
            images,
          });
        }

        case 'generate_voiceover': {
          const { script, taal } = data;

          // Get voice ID for language
          const langOption = LANGUAGE_OPTIONS.find(l => l.value === taal);
          const voiceId = langOption?.voice_id || LANGUAGE_OPTIONS[0].voice_id;

          const options: GenerateVoiceoverOptions = {
            script,
            voiceId,
            taal,
          };

          const voiceover = await videoCreator.generateVoiceover(options);

          return NextResponse.json({
            success: true,
            voiceover,
          });
        }

        case 'assemble_video': {
          const { images, voiceover, script, aspectRatio, backgroundMusic, musicVolume } = data;

          const options: AssembleVideoOptions = {
            images,
            voiceover,
            script,
            aspectRatio: aspectRatio || '9:16',
            backgroundMusic: backgroundMusic !== false,
            musicVolume: musicVolume || 30,
          };

          const video = await videoCreator.assembleVideo(options);

          // Generate YouTube metadata
          const nichePreset = getNichePreset(data.niche || 'lifestyle');
          const metadata = await generateYouTubeMetadata({
            script,
            niche: data.niche || 'lifestyle',
            keywords: nichePreset?.seo_keywords || [],
          });

          // Cleanup temp files
          await videoCreator.cleanup();

          return NextResponse.json({
            success: true,
            video: {
              ...video,
              youtubeMetadata: metadata,
            },
          });
        }

        case 'generate_complete': {
          // Complete workflow in one call
          const {
            niche,
            onderwerp,
            taal,
            videoLengte,
            toon,
            beeldstijl,
            aspectRatio,
            projectId,
            selectedIdeaIndex,
          } = data;

          console.log('🚀 Starting complete video generation workflow');

          // Get project context
          let projectContext;
          if (projectId) {
            const project = await prisma.project.findUnique({
              where: { id: projectId, clientId: client.id },
            });

            if (project) {
              projectContext = {
                naam: project.name,
                niche: project.niche || undefined,
                brandVoice: project.brandVoice || undefined,
                targetAudience: project.targetAudience || undefined,
                contentPillars: project.contentPillars || undefined,
              };
            }
          }

          // Step 1: Generate ideas
          const ideas = await videoCreator.generateVideoIdeas({
            niche,
            onderwerp,
            taal,
            projectContext,
          });

          const selectedIdea = ideas[selectedIdeaIndex || 0];

          // Step 2: Generate script
          const script = await videoCreator.generateScript({
            videoIdea: selectedIdea,
            niche,
            taal,
            videoLengte,
            toon,
            projectContext,
          });

          // Step 3: Generate image prompts
          const imagePrompts = await videoCreator.generateImagePrompts({
            script,
            niche,
            beeldstijl: beeldstijl || getNichePreset(niche)?.beeldstijl || 'realistic',
          });

          // Step 4: Generate images
          const nichePreset = getNichePreset(niche);
          const images = await videoCreator.generateImages({
            imagePrompts,
            imageModel: nichePreset?.image_model || 'SD_35',
            niche,
          });

          // Step 5: Generate voiceover
          const langOption = LANGUAGE_OPTIONS.find(l => l.value === taal);
          const voiceId = langOption?.voice_id || LANGUAGE_OPTIONS[0].voice_id;

          const voiceover = await videoCreator.generateVoiceover({
            script,
            voiceId,
            taal,
          });

          // Step 6-7: Assemble video
          const video = await videoCreator.assembleVideo({
            images,
            voiceover,
            script,
            aspectRatio: aspectRatio || '9:16',
            backgroundMusic: true,
            musicVolume: 30,
          });

          // Generate YouTube metadata
          const metadata = await generateYouTubeMetadata({
            script,
            niche,
            keywords: nichePreset?.seo_keywords || [],
          });

          // Cleanup
          await videoCreator.cleanup();

          console.log('✅ Complete video generation finished');

          return NextResponse.json({
            success: true,
            result: {
              selectedIdea,
              script,
              imagePrompts,
              images,
              voiceover,
              video: {
                ...video,
                youtubeMetadata: metadata,
              },
            },
          });
        }

        default:
          return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      }
    } finally {
      // Always cleanup
      await videoCreator.cleanup().catch(console.error);
    }
  } catch (error: any) {
    console.error('Video Creator Pro error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
