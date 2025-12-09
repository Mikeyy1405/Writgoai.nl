
/**
 * 🎬 VEREENVOUDIGDE VIDEO GENERATIE - Direct zonder agent loops
 * 
 * Deze route genereert video's direct zonder complexe AI agent loops:
 * 1. Gebruik LUMA AI Dream Machine voor AI-gegenereerde video's (text-to-video)
 * 2. Snelle generatie met 1 API call
 * 3. Geen FFmpeg, DALL-E of ElevenLabs complexity
 * 
 * Alternative: Runway ML Gen-3 Alpha voor nog betere quality
 */

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { prisma } from '@/lib/db';

// Helper to send streaming updates
function createStreamUpdate(type: string, data: any) {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

interface VideoGenerationRequest {
  prompt: string;
  clientId?: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5' | '21:9';
  duration?: number; // seconds
  style?: string;
  provider?: 'luma' | 'runway';
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const body: VideoGenerationRequest = await request.json();
        const { 
          prompt, 
          clientId, 
          aspectRatio = '9:16', 
          duration = 5,
          style = 'realistic',
          provider = 'luma' // Default to Luma AI (sneller en goedkoper)
        } = body;

        if (!prompt || prompt.length < 10) {
          controller.enqueue(encoder.encode(createStreamUpdate('error', {
            message: 'Prompt moet minimaal 10 karakters bevatten.'
          })));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(createStreamUpdate('status', {
          message: '🎬 Video generatie wordt voorbereid...',
          step: 1,
          progress: 10
        })));

        // Credit check
        const creditCost = provider === 'runway' ? 20 : 10; // Runway duurder maar betere quality
        if (clientId) {
          const hasCredits = await hasEnoughCredits(clientId, creditCost);
          
          if (!hasCredits) {
            controller.enqueue(encoder.encode(createStreamUpdate('error', {
              message: `Niet genoeg credits. Video generatie kost ${creditCost} credits.`
            })));
            controller.close();
            return;
          }
        }

        controller.enqueue(encoder.encode(createStreamUpdate('status', {
          message: '🤖 AI genereert je video...',
          step: 2,
          progress: 20
        })));

        let videoUrl: string | null = null;
        let thumbnailUrl: string | null = null;
        let generationId: string | null = null;

        // ============================================
        // LUMA AI DREAM MACHINE - Fast & affordable
        // ============================================
        if (provider === 'luma') {
          try {
            // Create generation
            const lumaResponse = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.LUMA_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: prompt,
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
            generationId = generationData.id;

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '⏳ Video wordt gegenereerd... Dit duurt 1-2 minuten',
              step: 3,
              progress: 30
            })));

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes max

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

              const statusResponse = await fetch(
                `https://api.lumalabs.ai/dream-machine/v1/generations/${generationId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.LUMA_API_KEY}`,
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
                  step: 3,
                  progress: progress
                })));
              }

              attempts++;
            }

            if (!videoUrl) {
              throw new Error('Video generatie duurde te lang');
            }
          } catch (error: any) {
            console.error('Luma AI error:', error);
            controller.enqueue(encoder.encode(createStreamUpdate('error', {
              message: `Video generatie mislukt: ${error.message}`
            })));
            controller.close();
            return;
          }
        }

        // ============================================
        // RUNWAY ML GEN-3 ALPHA - Best quality
        // ============================================
        else if (provider === 'runway') {
          try {
            // Create generation
            const runwayResponse = await fetch('https://api.runwayml.com/v1/text-to-video', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text_prompt: prompt,
                duration: duration,
                resolution: aspectRatio === '16:9' ? '1280x768' : aspectRatio === '9:16' ? '768x1280' : '1024x1024',
                model: 'gen3a_turbo', // Fastest Runway model
              }),
            });

            if (!runwayResponse.ok) {
              const errorData = await runwayResponse.text();
              console.error('Runway ML error:', errorData);
              throw new Error('Runway ML video generatie mislukt');
            }

            const generationData = await runwayResponse.json();
            generationId = generationData.id;

            controller.enqueue(encoder.encode(createStreamUpdate('status', {
              message: '⏳ Video wordt gegenereerd met Runway ML... Dit duurt 2-3 minuten',
              step: 3,
              progress: 30
            })));

            // Poll for completion
            let attempts = 0;
            const maxAttempts = 72; // 6 minutes max

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

              const statusResponse = await fetch(
                `https://api.runwayml.com/v1/tasks/${generationId}`,
                {
                  headers: {
                    'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
                  },
                }
              );

              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'SUCCEEDED') {
                  videoUrl = statusData.output?.[0] || statusData.output;
                  break;
                } else if (statusData.status === 'FAILED') {
                  throw new Error('Runway ML video generatie mislukt');
                }
                
                // Send progress update
                const progress = 30 + Math.min((attempts / maxAttempts) * 60, 60);
                controller.enqueue(encoder.encode(createStreamUpdate('status', {
                  message: `⏳ Nog bezig... (${attempts * 5}s)`,
                  step: 3,
                  progress: progress
                })));
              }

              attempts++;
            }

            if (!videoUrl) {
              throw new Error('Video generatie duurde te lang');
            }
          } catch (error: any) {
            console.error('Runway ML error:', error);
            controller.enqueue(encoder.encode(createStreamUpdate('error', {
              message: `Video generatie mislukt: ${error.message}`
            })));
            controller.close();
            return;
          }
        }

        // Deduct credits
        if (clientId) {
          await deductCredits(
            clientId,
            creditCost,
            `AI Video Generatie (${provider === 'runway' ? 'Runway ML' : 'Luma AI'}) - ${prompt.substring(0, 50)}`
          );
        }

        // Save to database
        const { supabaseAdmin: prisma } = await import('@/lib/supabase');
        
        try {
          await prisma.video.create({
            data: {
              vid: `${provider}_${generationId || Date.now()}`,
              topic: prompt.substring(0, 100),
              script: prompt,
              language: 'Dutch',
              voiceId: 'AI Generated',
              style: style,
              duration: duration.toString(),
              status: 'completed',
              videoUrl: videoUrl!,
              thumbnailUrl: thumbnailUrl,
              clientId: clientId || 'anonymous',
            },
          });
        } finally {
          await prisma.$disconnect();
        }

        controller.enqueue(encoder.encode(createStreamUpdate('complete', {
          message: '✅ Video succesvol gegenereerd!',
          videoUrl: videoUrl,
          thumbnailUrl: thumbnailUrl,
          prompt: prompt,
          provider: provider,
          duration: duration,
          aspectRatio: aspectRatio
        })));

        controller.close();
      } catch (error: any) {
        console.error('Video generation error:', error);
        controller.enqueue(encoder.encode(createStreamUpdate('error', {
          message: `Fout: ${error.message}`
        })));
        controller.close();
      }
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

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'WritgoAI Simple Video Generation',
    providers: [
      {
        name: 'luma',
        description: 'Luma AI Dream Machine - Fast & affordable',
        cost: 10,
        duration: '1-2 minutes',
      },
      {
        name: 'runway',
        description: 'Runway ML Gen-3 Alpha - Best quality',
        cost: 20,
        duration: '2-3 minutes',
      },
    ],
  });
}
