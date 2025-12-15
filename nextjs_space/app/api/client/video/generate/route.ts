/**
 * Unified Video Generation API
 * Consolidates all video generation routes into one robust endpoint
 * Supports: simple, custom, and pro video generation types
 */

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { generateVoiceover, VOICES } from '@/lib/elevenlabs-api';
import { generateCustomVideo } from '@/lib/custom-video-generator';

// Credit costs for different video types
const VIDEO_CREDIT_COSTS = {
  simple: 10,  // Fast AI video generation (Luma/Runway)
  custom: 80,  // Custom video with voiceover & music
  pro: 150,    // Full video creator pro workflow
};

interface VideoGenerationRequest {
  type: 'simple' | 'custom' | 'pro';
  topic: string;
  script?: string;
  voiceId?: string;
  language?: string;
  duration?: number; // seconds
  style?: 'professional' | 'casual' | 'energetic' | 'calm' | 'realistic' | 'cinematic';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  includeSubtitles?: boolean;
  backgroundMusic?: boolean;
  projectId?: string;
}

// Helper to send streaming updates
function createStreamUpdate(type: string, data: any) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

// Heartbeat to keep connection alive
function createHeartbeat() {
  return `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Heartbeat interval to prevent timeouts (needs to be in outer scope for cancel handler)
  let heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Ensure cleanup in all scenarios
  const cleanupHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Parse request
        const body: VideoGenerationRequest = await request.json();
        const { 
          type, 
          topic, 
          script, 
          voiceId,
          language = 'Dutch',
          duration = 30,
          style = 'professional',
          aspectRatio = '16:9',
          includeSubtitles = true,
          backgroundMusic = true,
          projectId
        } = body;

        // Authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
          controller.enqueue(encoder.encode(createStreamUpdate('error', {
            message: 'Niet geautoriseerd. Log in om video\'s te genereren.'
          })));
          controller.close();
          return;
        }

        // Get client
        const client = await prisma.client.findUnique({
          where: { email: session.user.email },
        });

        if (!client) {
          controller.enqueue(encoder.encode(createStreamUpdate('error', {
            message: 'Klant niet gevonden.'
          })));
          controller.close();
          return;
        }

        // Validate input
        if (!topic || topic.trim().length < 10) {
          controller.enqueue(encoder.encode(createStreamUpdate('error', {
            message: 'Onderwerp moet minimaal 10 karakters bevatten.'
          })));
          controller.close();
          return;
        }

        // Start heartbeat to keep connection alive
        heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(createHeartbeat()));
          } catch (error) {
            // Client disconnected, clear heartbeat
            cleanupHeartbeat();
          }
        }, 10000); // Every 10 seconds

        controller.enqueue(encoder.encode(createStreamUpdate('status', {
          message: '🎬 Video generatie wordt voorbereid...',
          step: 1,
          progress: 5
        })));

        // Credit check
        const creditCost = VIDEO_CREDIT_COSTS[type];
        const hasCredits = await hasEnoughCredits(client.id, creditCost);
        
        if (!hasCredits) {
          controller.enqueue(encoder.encode(createStreamUpdate('error', {
            message: `Niet genoeg credits. ${type} video generatie kost ${creditCost} credits.`
          })));
          controller.close();
          cleanupHeartbeat();
          return;
        }

        controller.enqueue(encoder.encode(createStreamUpdate('status', {
          message: '✅ Credits beschikbaar',
          step: 2,
          progress: 10
        })));

        let videoResult: any = null;
        let videoId: string | null = null;

        // Helper function to detect Dutch language
        const isDutchLanguage = (lang: string): boolean => {
          return lang.toLowerCase().includes('dutch') || lang.toLowerCase().includes('nl');
        };

        // Route based on type
        if (type === 'simple') {
          // Simple: Fast AI video generation using Luma or Runway
          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '🤖 AI genereert video met Luma AI...',
            step: 3,
            progress: 20
          })));

          const lumaApiKey = process.env.LUMA_API_KEY;
          
          if (!lumaApiKey) {
            throw new Error('Luma AI API key niet geconfigureerd');
          }

          // Create generation
          const lumaResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lumaApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: topic,
              aspect_ratio: aspectRatio,
              loop: false,
            }),
          });

          if (!lumaResponse.ok) {
            const errorData = await lumaResponse.text();
            console.error('Luma AI error:', errorData);
            throw new Error('Luma AI video generatie mislukt');
          }

          const generationData = await lumaResponse.json();
          const generationId = generationData.id;

          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '⏳ Video wordt gegenereerd... Dit duurt 1-2 minuten',
            step: 4,
            progress: 30
          })));

          // Poll for completion
          let attempts = 0;
          const maxAttempts = 60; // 5 minutes max
          let videoUrl: string | null = null;
          let thumbnailUrl: string | null = null;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

            const statusResponse = await fetch(
              `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
              {
                headers: {
                  'Authorization': `Bearer ${lumaApiKey}`,
                },
              }
            );

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              if (statusData.state === 'completed') {
                videoUrl = statusData.assets.video;
                thumbnailUrl = statusData.assets?.image || null;
                break;
              } else if (statusData.state === 'failed') {
                throw new Error('Luma AI video generatie mislukt');
              }
              
              // Send progress update
              const progress = 30 + Math.min((attempts / maxAttempts) * 60, 60);
              controller.enqueue(encoder.encode(createStreamUpdate('status', {
                message: `⏳ Nog bezig... (${attempts * 5}s)`,
                step: 4,
                progress: Math.floor(progress)
              })));
            }

            attempts++;
          }

          if (!videoUrl) {
            throw new Error('Video generatie duurde te lang');
          }

          videoResult = {
            videoUrl,
            thumbnailUrl,
            duration: duration,
          };

        } else if (type === 'custom') {
          // Custom: Video with custom script and voiceover
          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '📝 Script wordt verwerkt...',
            step: 3,
            progress: 20
          })));

          const finalScript = script || topic;

          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '🎤 Voiceover wordt gegenereerd...',
            step: 4,
            progress: 40
          })));

          // Generate voiceover if needed
          const selectedVoiceId = voiceId || (isDutchLanguage(language) ? VOICES.laura : VOICES.rachel);

          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '🎬 Video wordt geassembleerd...',
            step: 5,
            progress: 60
          })));

          // Generate custom video
          videoResult = await generateCustomVideo({
            script: finalScript,
            voiceId: selectedVoiceId,
            style: style as any,
            aspectRatio: aspectRatio as any,
            backgroundMusic,
            musicVolume: 30,
            imageCount: Math.ceil(duration / 6), // ~6 seconds per image
          });

          if (videoResult.error) {
            throw new Error(videoResult.error);
          }

          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '✅ Video gegenereerd!',
            step: 6,
            progress: 90
          })));

        } else if (type === 'pro') {
          // Pro: Full video creator pro workflow
          controller.enqueue(encoder.encode(createStreamUpdate('status', {
            message: '🚀 Pro video workflow gestart...',
            step: 3,
            progress: 15
          })));

          // Import and use AI Video Creator Pro
          const { AIVideoCreatorPro } = await import('@/lib/ai-video-creator-pro');
          const videoCreator = new AIVideoCreatorPro();

          try {
            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '💡 Genereren van video ideeën...',
              step: 4,
              progress: 20
            })));

            // Generate ideas
            const ideas = await videoCreator.generateVideoIdeas({
              niche: style || 'professional',
              onderwerp: topic,
              taal: language,
            });

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '📝 Script schrijven...',
              step: 5,
              progress: 35
            })));

            // Generate script
            const videoScript = await videoCreator.generateScript({
              videoIdea: ideas[0],
              niche: style || 'professional',
              taal: language,
              videoLengte: duration,
              toon: style || 'professional',
            });

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '🎨 Genereren van afbeeldingen...',
              step: 6,
              progress: 50
            })));

            // Generate image prompts
            const imagePrompts = await videoCreator.generateImagePrompts({
              script: videoScript,
              niche: style || 'professional',
              beeldstijl: 'realistic',
            });

            // Generate images
            const images = await videoCreator.generateImages({
              imagePrompts,
              imageModel: 'SD_35',
              niche: style || 'professional',
            });

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '🎤 Genereren van voiceover...',
              step: 7,
              progress: 70
            })));

            // Generate voiceover
            const selectedVoiceId = voiceId || (isDutchLanguage(language) ? VOICES.laura : VOICES.rachel);

            const voiceover = await videoCreator.generateVoiceover({
              script: videoScript,
              voiceId: selectedVoiceId,
              taal: language,
            });

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '🎬 Video samenstellen...',
              step: 8,
              progress: 85
            })));

            // Assemble video
            videoResult = await videoCreator.assembleVideo({
              images,
              voiceover,
              script: videoScript,
              aspectRatio: aspectRatio || '9:16',
              backgroundMusic,
              musicVolume: 30,
            });

            // Cleanup
            await videoCreator.cleanup();

          } catch (error: any) {
            throw new Error(`Pro video generatie mislukt: ${error.message}`);
          }
        }

        // Deduct credits
        await deductCredits(
          client.id,
          creditCost,
          `Video Generatie (${type}) - ${topic.substring(0, 50)}`,
          {
            tool: 'video-generation',
          }
        );

        controller.enqueue(encoder.encode(createStreamUpdate('status', {
          message: '💾 Video opslaan...',
          step: 9,
          progress: 95
        })));

        // Save to database
        videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await prisma.video.create({
          data: {
            vid: videoId,
            topic: topic.substring(0, 100),
            script: script || topic,
            language: language,
            voiceId: voiceId || 'AI Generated',
            style: style,
            duration: duration.toString(),
            status: 'completed',
            videoUrl: videoResult.videoUrl,
            thumbnailUrl: videoResult.thumbnailUrl || null,
            clientId: client.id,
            projectId: projectId || null,
          },
        });

        controller.enqueue(encoder.encode(createStreamUpdate('complete', {
          message: '✅ Video succesvol gegenereerd!',
          videoId: videoId,
          videoUrl: videoResult.videoUrl,
          thumbnailUrl: videoResult.thumbnailUrl,
          duration: duration,
          creditsUsed: creditCost,
          progress: 100
        })));

        // Clear heartbeat
        cleanupHeartbeat();
        controller.close();

      } catch (error: any) {
        console.error('Video generation error:', error);
        
        // Clear heartbeat on error
        cleanupHeartbeat();
        
        controller.enqueue(encoder.encode(createStreamUpdate('error', {
          message: `Video generatie mislukt: ${error.message}`
        })));
        controller.close();
      }
    },
    cancel() {
      // Cleanup when stream is cancelled (e.g., client disconnects)
      cleanupHeartbeat();
    }
  });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// GET endpoint for configuration
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'WritgoAI Unified Video Generation',
    types: {
      simple: {
        description: 'Fast AI video generation',
        cost: VIDEO_CREDIT_COSTS.simple,
        duration: '1-2 minutes',
        features: ['AI-generated visuals', 'Quick generation', 'Luma AI powered'],
      },
      custom: {
        description: 'Custom video with voiceover & music',
        cost: VIDEO_CREDIT_COSTS.custom,
        duration: '3-5 minutes',
        features: ['Custom script', 'ElevenLabs voiceover', 'Background music', 'Multiple styles'],
      },
      pro: {
        description: 'Full video creator pro workflow',
        cost: VIDEO_CREDIT_COSTS.pro,
        duration: '5-10 minutes',
        features: ['AI idea generation', 'Professional script', 'Custom images', 'Voiceover', 'Full editing'],
      },
    },
    options: {
      languages: ['Dutch', 'English', 'German', 'French', 'Spanish'],
      styles: ['professional', 'casual', 'energetic', 'calm', 'realistic', 'cinematic'],
      aspectRatios: ['16:9', '9:16', '1:1'],
      durations: [15, 30, 60, 90, 120],
    },
  });
}
