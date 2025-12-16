/**
 * Auto Content Generation API Route
 * 
 * POST: Generate content automatically from a topic/idea
 * Streams progress updates and generates content using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getLanguageNameForAI, isValidLanguage, getLanguageInfo } from '@/lib/language-helper';
import { generateSmartImage } from '@/lib/smart-image-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const GENERATOR_CREDIT_COST = CREDIT_COSTS.BLOG_POST;

interface HeartbeatState {
  interval: NodeJS.Timeout | null;
}

const startHeartbeat = (controller: ReadableStreamDefaultController, encoder: TextEncoder): HeartbeatState => {
  const state: HeartbeatState = { interval: null };
  
  state.interval = setInterval(async () => {
    try {
      controller.enqueue(encoder.encode(`: heartbeat\n\n`));
    } catch (e) {
      if (state.interval) {
        clearInterval(state.interval);
        state.interval = null;
      }
    }
  }, 15000);
  
  return state;
};

const stopHeartbeat = (state: HeartbeatState) => {
  if (state.interval) {
    clearInterval(state.interval);
    state.interval = null;
  }
};

/**
 * POST /api/client/auto-content/generate
 * Body: { topic: string, projectId: string, topicalTopicId?: string, language?: string }
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let streamClosed = false;
  
  const sendProgress = (progress: number, message: string, data?: any) => {
    if (streamClosed) return;
    return encoder.encode(
      `data: ${JSON.stringify({ progress, message, ...data })}\n\n`
    );
  };

  const stream = new ReadableStream({
    async start(controller) {
      const heartbeatState = startHeartbeat(controller, encoder);
      
      try {
        // Authentication
        controller.enqueue(sendProgress(5, 'Authenticeren...'));
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
          controller.enqueue(sendProgress(0, '❌ Niet geautoriseerd', { 
            error: 'Unauthorized',
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        const client = await prisma.client.findUnique({
          where: { email: session.user.email },
        });

        if (!client) {
          controller.enqueue(sendProgress(0, '❌ Client niet gevonden', { 
            error: 'Client not found',
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        // Parse request body
        const body = await request.json();
        const {
          topic,
          projectId,
          topicalTopicId,
          language = 'NL',
          wordCount = 1500,
          imageCount = 3,
        } = body;

        if (!topic || topic.trim().length === 0) {
          controller.enqueue(sendProgress(0, '❌ Geen onderwerp opgegeven', { 
            error: 'Topic is required',
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        if (!projectId) {
          controller.enqueue(sendProgress(0, '❌ Geen project geselecteerd', { 
            error: 'projectId is required',
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        console.log(`🚀 Auto-content generation:`, {
          topic,
          projectId,
          topicalTopicId: topicalTopicId || 'none',
          language,
        });

        // Load project context
        controller.enqueue(sendProgress(10, 'Project context laden...'));
        
        let projectContext = '';
        const project = await prisma.project.findUnique({
          where: { id: projectId, clientId: client.id },
          select: {
            name: true,
            websiteUrl: true,
            brandVoice: true,
            targetAudience: true,
            niche: true,
            keywords: true,
            writingStyle: true,
            customInstructions: true,
          }
        });
        
        if (!project) {
          controller.enqueue(sendProgress(0, '❌ Project niet gevonden', { 
            error: 'Project not found',
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        const contextParts = [];
        if (project.brandVoice) contextParts.push(`Brand voice: ${project.brandVoice}`);
        if (project.targetAudience) contextParts.push(`Target audience: ${project.targetAudience}`);
        if (project.niche) contextParts.push(`Niche: ${project.niche}`);
        if (project.writingStyle) contextParts.push(`Writing style: ${project.writingStyle}`);
        if (project.customInstructions) contextParts.push(`Additional instructions: ${project.customInstructions}`);
        if (project.keywords && project.keywords.length > 0) {
          contextParts.push(`Important keywords: ${project.keywords.join(', ')}`);
        }
        projectContext = contextParts.join('\n');

        // Credits check
        controller.enqueue(sendProgress(15, 'Credits controleren...'));
        
        const imageCost = imageCount * CREDIT_COSTS.IMAGE_BUDGET;
        const totalCost = GENERATOR_CREDIT_COST + imageCost;
        
        const hasCredits = await hasEnoughCredits(client.id, totalCost);
        if (!hasCredits) {
          controller.enqueue(sendProgress(0, '💳 Onvoldoende credits', { 
            error: `Deze actie kost ${totalCost} credits`,
            creditsNeeded: totalCost,
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        // Generate content
        controller.enqueue(sendProgress(25, 'Content genereren...'));
        
        const languageInfo = getLanguageInfo(language);
        const languageName = getLanguageNameForAI(language);

        const projectContextInstruction = projectContext ? `\n\nProject Context:\n${projectContext}` : '';
        
        const prompt = `You are a professional content writer. Write a comprehensive, SEO-optimized article about: "${topic}"

Requirements:
- Language: ${languageName}
- Word count: approximately ${wordCount} words
- Use proper HTML formatting with <h2>, <h3>, <p>, <ul>, <li> tags
- Start with an engaging introduction
- Include ${imageCount} image placeholders: {{IMAGE_PLACEHOLDER_1}}, {{IMAGE_PLACEHOLDER_2}}, etc.
- Add subheadings for better structure
- End with a conclusion
- Write naturally and engagingly
- Focus on providing value to readers${projectContextInstruction}

Format the output as valid HTML. Do NOT include <html>, <head>, or <body> tags, only the article content.`;

        let articleContent = '';
        let articleTitle = topic;
        
        try {
          const aiResponse = await chatCompletion({
            model: TEXT_MODELS.CLAUDE_45,
            messages: [{
              role: 'user',
              content: prompt,
            }],
            temperature: 0.7,
            max_tokens: wordCount * 2,
          });

          articleContent = aiResponse.choices[0]?.message?.content || '';
          
          // Extract title
          const titleMatch = articleContent.match(/<h[12]>(.*?)<\/h[12]>/i);
          if (titleMatch) {
            articleTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          }

          console.log(`✅ Content generated (${articleContent.length} chars)`);
          
        } catch (error: any) {
          console.error('❌ AI generation error:', error);
          
          let userMessage = 'AI kon de content niet genereren. Probeer het opnieuw.';
          if (error.message?.includes('timeout')) {
            userMessage = 'De generatie duurde te lang.';
          } else if (error.message?.includes('rate limit')) {
            userMessage = 'Te veel verzoeken. Wacht even.';
          }
          
          controller.enqueue(sendProgress(0, '❌ Content generatie mislukt', { 
            error: userMessage,
            done: true
          }));
          stopHeartbeat(heartbeatState);
          streamClosed = true;
          controller.close();
          return;
        }

        controller.enqueue(sendProgress(70, 'Afbeeldingen genereren...'));

        // Generate images
        const imageUrls: string[] = [];
        for (let i = 0; i < imageCount; i++) {
          try {
            const imagePrompt = `Professional image for article about: ${topic}. High quality, ${i === 0 ? 'main header image' : 'supporting visual'}`;
            
            controller.enqueue(sendProgress(
              70 + (i + 1) * (15 / imageCount),
              `Afbeelding ${i + 1}/${imageCount}...`
            ));
            
            const imageResult = await generateSmartImage({
              prompt: imagePrompt,
              type: i === 0 ? 'featured' : 'mid-text',
              width: 1536,
              height: 1024,
              projectId,
            });
            
            if (imageResult.success && imageResult.imageUrl) {
              imageUrls.push(imageResult.imageUrl);
              articleContent = articleContent.replace(
                `{{IMAGE_PLACEHOLDER_${i + 1}}}`,
                `<img src="${imageResult.imageUrl}" alt="${topic} - Image ${i + 1}" class="w-full rounded-lg my-4" />`
              );
            }
          } catch (error) {
            console.error(`Image ${i + 1} generation failed:`, error);
          }
        }

        // Remove remaining placeholders
        articleContent = articleContent.replace(/\{\{IMAGE_PLACEHOLDER_\d+\}\}/g, '');

        controller.enqueue(sendProgress(90, 'Content opslaan...'));

        // Save to content library
        let contentId: string | null = null;
        try {
          const savedContent = await prisma.savedContent.create({
            data: {
              clientId: client.id,
              projectId: projectId,
              type: 'blog',
              title: articleTitle,
              content: articleContent,
              language: language.toUpperCase(),
              status: 'draft',
            }
          });
          
          contentId = savedContent.id;
          console.log(`✅ Content saved: ${contentId}`);

          // Update topical topic if provided
          if (topicalTopicId) {
            try {
              await prisma.topicalTopic.update({
                where: { id: topicalTopicId },
                data: {
                  isCompleted: true,
                  contentId: contentId,
                }
              });
              console.log(`✅ Topical topic marked as completed`);
            } catch (error) {
              console.error('Warning: Could not update topical topic:', error);
            }
          }
          
        } catch (error) {
          console.error('Warning: Could not save content:', error);
        }

        // Deduct credits
        controller.enqueue(sendProgress(95, 'Credits verwerken...'));
        
        await deductCredits(
          client.id,
          totalCost,
          `Auto-content: ${articleTitle}`
        );

        // Send success response
        const redirectUrl = contentId ? `/client-portal/content-library/${contentId}/edit` : null;
        
        controller.enqueue(sendProgress(100, '✅ Content succesvol gegenereerd!', {
          success: true,
          contentId,
          title: articleTitle,
          imageUrls,
          redirectUrl,
          done: true
        }));

        console.log(`✅ Auto-content generation complete!`);
        
        stopHeartbeat(heartbeatState);
        
      } catch (error: any) {
        console.error('❌ Auto-content error:', error);
        stopHeartbeat(heartbeatState);
        
        if (!streamClosed) {
          controller.enqueue(sendProgress(0, '❌ Er ging iets mis', { 
            error: error.message || 'Unknown error',
            done: true
          }));
        }
      } finally {
        stopHeartbeat(heartbeatState);
        streamClosed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
