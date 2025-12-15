
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateImageToVideo, batchGenerateVideos } from '@/lib/runway-ml-api';
import { generateVideoSEO } from '@/lib/video-seo-generator';
import { searchPixabayImages } from '@/lib/pixabay-api';
import { translateToEnglish } from '@/lib/prompt-translator';

export const dynamic = 'force-dynamic';

/**
 * AI Video Package Generator Workflow Orchestrator
 * Generates complete video packages with streaming progress updates
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await request.json();
    const { idea, platform, duration, language, projectId } = body;

    if (!idea?.trim()) {
      return NextResponse.json({ error: 'Video idee is verplicht' }, { status: 400 });
    }

    // Create a TransformStream for Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendUpdate = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };

    // Start the generation process in the background
    (async () => {
      try {
        let progress = 0;
        const apiKey = process.env.AIML_API_KEY;

        // Step 1: Generate Script (10%)
        await sendUpdate({
          step: 'script',
          progress: 10,
          message: 'AI schrijft video script...',
        });

        const scriptResponse = await fetch('https://api.aimlapi.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              {
                role: 'system',
                content: `Je bent een expert video script schrijver. Schrijf boeiende, korte scripts voor ${platform} in ${language === 'nl' ? 'Nederlands' : 'Engels'}.`,
              },
              {
                role: 'user',
                content: `Schrijf een ${duration} seconden video script over: "${idea}". 

Structuur:
- Hook (eerste 3 seconden)
- 3-5 key points
- Call-to-action

Splits het script in 3-5 delen van ~${Math.floor(duration / 4)} seconden elk. Geef per deel een visuele beschrijving.

Formatteer als JSON:
{
  "title": "...",
  "language": "${language}",
  "segments": [
    {"text": "...", "visualDescription": "...", "duration": ${Math.floor(duration / 4)}}
  ]
}`,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        const scriptData = await scriptResponse.json();
        const script = JSON.parse(scriptData.choices[0].message.content);

        progress = 20;
        await sendUpdate({
          step: 'images',
          progress,
          message: `Script compleet! Genereren van ${script.segments.length} AI afbeeldingen...`,
        });

        // Step 2: Generate AI Images (30%)
        const imagePromises = script.segments.map(async (seg: any, i: number) => {
          const translatedPrompt = await translateToEnglish(seg.visualDescription);
          
          const imageResponse = await fetch('https://api.aimlapi.com/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'flux-pro',
              prompt: `${translatedPrompt}, professional photography, 16:9 aspect ratio, high quality`,
              n: 1,
              size: '1024x1024',
            }),
          });

          const imageData = await imageResponse.json();
          const imageUrl = imageData.data[0].url;

          progress += 10 / script.segments.length;
          await sendUpdate({
            step: 'images',
            progress: Math.min(progress, 30),
            message: `Afbeelding ${i + 1}/${script.segments.length} gegenereerd...`,
          });

          return {
            url: imageUrl,
            prompt: seg.visualDescription,
          };
        });

        const aiImages = await Promise.all(imagePromises);

        progress = 40;
        await sendUpdate({
          step: 'motion',
          progress,
          message: `Runway ML voegt motion toe aan ${aiImages.length} afbeeldingen...`,
        });

        // Step 3: Add Motion with Runway ML (50%)
        const motionVideos = await batchGenerateVideos(aiImages, 5);

        progress = 50;
        await sendUpdate({
          step: 'stock',
          progress,
          message: 'Zoeken naar stock video\'s als backup...',
        });

        // Step 4: Search Stock Videos (60%)
        const translatedIdea = await translateToEnglish(idea);
        const stockResults = await searchPixabayImages(translatedIdea, {
          perPage: 3,
          orientation: 'horizontal',
        });

        const stockVideos = stockResults.hits.slice(0, 2).map((hit: any) => ({
          url: hit.largeImageURL,
          duration: 10,
          title: hit.tags,
        }));

        progress = 60;
        await sendUpdate({
          step: 'voiceover',
          progress,
          message: 'ElevenLabs genereert voiceover...',
        });

        // Step 5: Generate Voiceover (70%)
        const fullScript = script.segments.map((s: any) => s.text).join(' ');
        
        const voiceoverResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text: fullScript,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });

        const voiceoverBuffer = await voiceoverResponse.arrayBuffer();
        const voiceoverBase64 = Buffer.from(voiceoverBuffer).toString('base64');
        const voiceoverUrl = `data:audio/mpeg;base64,${voiceoverBase64}`;

        progress = 70;
        await sendUpdate({
          step: 'music',
          progress,
          message: 'Selecteren van royalty-free muziek...',
        });

        // Step 6: Select Music (80%)
        const musicTrack = {
          url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
          title: 'Upbeat Background Music',
          duration: duration,
        };

        progress = 80;
        await sendUpdate({
          step: 'seo',
          progress,
          message: 'Genereren van SEO content voor YouTube en TikTok...',
        });

        // Step 7: Generate SEO Content (90%)
        const seoContent = await generateVideoSEO({
          topic: idea,
          script: fullScript,
          language: language as 'nl' | 'en',
          platform: platform as 'youtube' | 'tiktok' | 'instagram',
          duration,
        });

        progress = 85;
        await sendUpdate({
          step: 'compose',
          progress,
          message: 'Complete video samenstellen (Runway ML + Audio Mixing)...',
        });

        console.log('[AI Video Maker] ====== COMPOSITION STEP STARTING ======');
        console.log('[AI Video Maker] Motion videos count:', motionVideos.length);
        console.log('[AI Video Maker] Stock videos count:', stockVideos.length);

        // Step 8: Compose complete video with all elements
        let finalVideoUrl = '';
        let compositionMethod = 'none';

        try {
          // Import compositie libraries
          console.log('[AI Video Maker] Importing composition libraries...');
          const { generateVideoFromScript, createCompositionData } = await import('@/lib/video-composer');
          const { isFFmpegAvailable, composeVideo } = await import('@/lib/ffmpeg-compositor');

          console.log('[AI Video Maker] Checking FFmpeg availability...');
          const ffmpegAvailable = await isFFmpegAvailable();
          console.log('[AI Video Maker] FFmpeg available:', ffmpegAvailable);

          if (ffmpegAvailable && motionVideos.length > 0) {
            // Option 1: Use FFmpeg to compose everything
            console.log('[AI Video Maker] Using FFmpeg composition...');
            compositionMethod = 'ffmpeg';

            const allVideoClips = [
              ...motionVideos.map(v => ({ url: v.videoUrl, duration: 5 })),
              ...stockVideos.map(v => ({ url: v.url, duration: v.duration })),
            ];

            finalVideoUrl = await composeVideo({
              videoClips: allVideoClips,
              voiceover: {
                url: voiceoverUrl,
                volume: 1.0,
              },
              music: {
                url: musicTrack.url,
                volume: 0.25,
              },
              outputWidth: platform === 'tiktok' ? 1080 : 1920,
              outputHeight: platform === 'tiktok' ? 1920 : 1080,
              fps: 30,
            });

            console.log('[AI Video Maker] FFmpeg composition complete:', finalVideoUrl);
          } else {
            // Option 2: Generate one coherent video with Runway ML text-to-video
            console.log('[AI Video Maker] Using Runway ML text-to-video for coherent video...');
            console.log('[AI Video Maker] This may take 5-10 minutes per video segment...');
            compositionMethod = 'runway-texttovideo';

            // Update progress to show we're working on it
            progress = 87;
            await sendUpdate({
              step: 'compose',
              progress,
              message: 'Runway ML genereert complete video (5-10 min)...',
            });

            const videoSegments = await generateVideoFromScript(
              {
                text: fullScript,
                segments: script.segments?.map((s: any) => ({
                  text: s,
                  duration: 10,
                })) || [{ text: fullScript, duration: Math.min(duration, 10) }],
              },
              platform
            );

            console.log('[AI Video Maker] ✅ Generated', videoSegments.length, 'video segments');
            
            // Update progress after generation
            progress = 90;
            await sendUpdate({
              step: 'compose',
              progress,
              message: 'Video segmenten klaar, bezig met samenvoegen...',
            });
            
            if (videoSegments.length > 0) {
              finalVideoUrl = videoSegments[0].videoUrl; // Use first segment for now
              
              // If multiple segments, try FFmpeg to concatenate
              if (ffmpegAvailable && videoSegments.length > 1) {
                console.log('[AI Video Maker] Concatenating segments with FFmpeg...');
                finalVideoUrl = await composeVideo({
                  videoClips: videoSegments.map(s => ({ url: s.videoUrl, duration: s.duration })),
                  voiceover: {
                    url: voiceoverUrl,
                    volume: 1.0,
                  },
                  music: {
                    url: musicTrack.url,
                    volume: 0.25,
                  },
                  outputWidth: platform === 'tiktok' ? 1080 : 1920,
                  outputHeight: platform === 'tiktok' ? 1920 : 1080,
                });
              }
            }
          }
        } catch (compositionError: any) {
          console.error('[AI Video Maker] ❌ Composition failed:', compositionError);
          console.error('[AI Video Maker] Error details:', compositionError.message);
          console.error('[AI Video Maker] Falling back to motion video clips...');
          compositionMethod = 'fallback';
          finalVideoUrl = motionVideos[0]?.videoUrl || stockVideos[0]?.url || '';
          
          // Send error update to user
          await sendUpdate({
            step: 'compose',
            progress: 90,
            message: '⚠️ Video compositie mislukt, gebruik losse clips...',
          });
        }
        
        // Ensure we have at least some video URL
        if (!finalVideoUrl && motionVideos.length > 0) {
          console.log('[AI Video Maker] No finalVideoUrl, using first motion video as fallback');
          finalVideoUrl = motionVideos[0].videoUrl;
          compositionMethod = 'fallback';
        } else if (!finalVideoUrl && stockVideos.length > 0) {
          console.log('[AI Video Maker] No finalVideoUrl, using first stock video as fallback');
          finalVideoUrl = stockVideos[0].url;
          compositionMethod = 'fallback';
        }
        
        console.log('[AI Video Maker] Final video URL determined:', finalVideoUrl ? 'YES' : 'NO');
        console.log('[AI Video Maker] Composition method:', compositionMethod);

        progress = 92;
        await sendUpdate({
          step: 'save',
          progress,
          message: 'Video opslaan in Content Library...',
        });

        // Step 9: Save to Content Library
        const videoUrl = finalVideoUrl;

        console.log('[AI Video Maker] ====== SAVE STEP STARTING ======');
        console.log('[AI Video Maker] Final video URL:', videoUrl);
        console.log('[AI Video Maker] Composition method:', compositionMethod);
        console.log('[AI Video Maker] Motion videos count:', motionVideos.length);
        console.log('[AI Video Maker] Stock videos count:', stockVideos.length);
        console.log('[AI Video Maker] Client ID:', client.id);
        console.log('[AI Video Maker] Project ID:', projectId || 'none');

        // Save to content library with timeout
        let savedSuccessfully = false;
        if (videoUrl) {
          const contentLibraryData = {
            title: script.title,
            content: fullScript,
            language: language.toUpperCase(),
            type: 'video' as const,
            projectId: projectId || null,
            seoTitle: seoContent.youtube?.title || script.title,
            seoDescription: seoContent.youtube?.description || fullScript.substring(0, 160),
            videoUrl: videoUrl,
            metadata: {
              platform,
              duration,
              videoClips: motionVideos.map(v => v.videoUrl),
              voiceoverUrl,
              musicUrl: musicTrack.url,
              seo: seoContent,
            },
          };

          try {
            console.log('[AI Video Maker] Preparing to save to database...');
            
            // Prepare video metadata for storage
            const videoMetadata = {
              script: contentLibraryData.content,
              videoUrl,
              platform,
              duration,
              seo: seoContent,
              allVideos: motionVideos.map(v => v.videoUrl),
              voiceoverUrl,
              musicUrl: musicTrack.url,
            };

            // Create save operation with timeout
            console.log('[AI Video Maker] Creating database record...');
            const savePromise = prisma.savedContent.create({
              data: {
                clientId: client.id,
                type: 'video',
                title: contentLibraryData.title,
                content: contentLibraryData.content,
                contentHtml: `<div class="video-content">
                  <video src="${videoUrl}" controls style="width: 100%; max-width: 800px;"></video>
                  <h3>${contentLibraryData.seoTitle}</h3>
                  <p>${contentLibraryData.seoDescription}</p>
                </div>`,
                description: contentLibraryData.seoDescription,
                thumbnailUrl: videoUrl,
                imageUrls: motionVideos.map(v => v.videoUrl),
                tags: [platform, 'ai-video', 'runway-ml'],
                keywords: [platform, 'video', contentLibraryData.title],
                metaDesc: contentLibraryData.seoDescription,
                projectId: contentLibraryData.projectId,
                language: language.toUpperCase() as any,
                generatorType: 'ai-video-maker',
                wordCount: Math.ceil(contentLibraryData.content.length / 6),
                characterCount: contentLibraryData.content.length,
              },
            });

            // Add 30 second timeout to database operation
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database save timeout after 30 seconds')), 30000)
            );

            console.log('[AI Video Maker] Waiting for database save (with 30s timeout)...');
            const savedContent = await Promise.race([savePromise, timeoutPromise]) as any;
            
            console.log('[AI Video Maker] ✅ Successfully saved to Content Library with ID:', savedContent.id);
            savedSuccessfully = true;
          } catch (error: any) {
            console.error('[AI Video Maker] ❌ Failed to save to Content Library:', error);
            console.error('[AI Video Maker] Error details:', error.message);
            console.error('[AI Video Maker] Error stack:', error.stack);
            
            // Send warning but continue to completion
            await sendUpdate({
              step: 'save',
              progress: 95,
              message: `⚠️ Opslaan in Content Library mislukt. Video kan wel gedownload worden.`,
            });
            
            // Don't let save failure block completion
            savedSuccessfully = false;
          }
        } else {
          console.warn('[AI Video Maker] ⚠️ No video URL available to save');
          await sendUpdate({
            step: 'save',
            progress: 95,
            message: '⚠️ Geen video URL beschikbaar om op te slaan.',
          });
        }

        // Always continue to completion - this is critical!
        console.log('[AI Video Maker] ====== PROCEEDING TO COMPLETION (100%) ======');

        // Step 9: Create package with video clips
        const videoPackage = {
          id: `video-${Date.now()}`,
          script: {
            title: script.title,
            text: fullScript,
            language: script.language,
            duration,
          },
          media: {
            aiVideos: motionVideos.map((v, i) => ({
              url: v.videoUrl,
              duration: 5,
              prompt: v.prompt,
            })),
            stockVideos,
          },
          audio: {
            voiceover: {
              url: voiceoverUrl,
              duration: Math.ceil(fullScript.length / 15),
            },
            music: musicTrack,
          },
          seo: seoContent,
          downloadUrl: videoUrl, // Primary video clip
          totalDuration: duration,
        };

        progress = 100;
        console.log('[AI Video Maker] Building completion message...');
        console.log('[AI Video Maker] - Composition method:', compositionMethod);
        console.log('[AI Video Maker] - Saved successfully:', savedSuccessfully);
        
        let completionMessage = 'Video gegenereerd!';
        
        if (compositionMethod === 'ffmpeg') {
          completionMessage = '🎉 Complete MP4 video gemaakt met FFmpeg! Alle clips, voiceover en muziek zijn samengevoegd. Klaar om te uploaden!';
        } else if (compositionMethod === 'runway-texttovideo') {
          completionMessage = '🎥 Video gemaakt met Runway ML text-to-video! Download en bekijk in Content Library.';
        } else if (compositionMethod === 'fallback') {
          completionMessage = '✅ Video clips gegenereerd! Runway ML clips zijn klaar om te downloaden.';
        } else {
          completionMessage = '⚠️ Losse video clips gemaakt. FFmpeg niet beschikbaar voor automatisch samenvoegen.';
        }
        
        if (savedSuccessfully) {
          completionMessage += ' ✅ Opgeslagen in Content Library!';
        } else if (videoUrl) {
          completionMessage += ' ⚠️ Niet opgeslagen in Content Library, maar wel beschikbaar om te downloaden.';
        }
        
        console.log('[AI Video Maker] Sending final completion update...');
        await sendUpdate({
          step: 'complete',
          progress,
          message: completionMessage,
          complete: true,
          package: videoPackage,
        });
        
        console.log('[AI Video Maker] ====== GENERATION COMPLETED SUCCESSFULLY ======');

      } catch (error: any) {
        console.error('[AI Video Maker] ❌❌❌ CRITICAL GENERATION ERROR:', error);
        console.error('[AI Video Maker] Error message:', error.message);
        console.error('[AI Video Maker] Error stack:', error.stack);
        
        try {
          await sendUpdate({
            step: 'idle',
            progress: 0,
            message: `Generatie mislukt: ${error.message}`,
            error: error.message,
          });
        } catch (updateError) {
          console.error('[AI Video Maker] Failed to send error update:', updateError);
        }
      } finally {
        console.log('[AI Video Maker] ====== CLOSING STREAM ======');
        try {
          await writer.close();
        } catch (closeError) {
          console.error('[AI Video Maker] Failed to close writer:', closeError);
        }
      }
    })();

    // Return the stream
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('[AI Video Maker] Request error:', error);
    return NextResponse.json(
      { error: error.message || 'Generatie mislukt' },
      { status: 500 }
    );
  }
}
