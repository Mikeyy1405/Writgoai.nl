
/**
 * 🚀 UNIFIED CONTENT GENERATOR - Upgraded Version
 * 
 * Robuuste content generatie in 10 talen met heartbeat
 * - Heartbeat mechanism voor lange generaties
 * - Uitgebreide error handling
 * - Credits check vooraf
 * - Progress tracking
 * - Auto-save naar content library
 * - Project context integratie
 * - FAQ & YouTube support
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getLanguageNameForAI, isValidLanguage, getLanguageInfo } from '@/lib/language-helper';
import { generateSmartImage } from '@/lib/smart-image-generator';
import { autoSaveToLibrary } from '@/lib/content-library-helper';

// Runtime configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minuten
export const dynamic = 'force-dynamic';

// Credit costs voor unified generator
const GENERATOR_CREDIT_COST = CREDIT_COSTS.BLOG_POST; // 70 credits

// Global heartbeat interval
let heartbeatInterval: NodeJS.Timeout | null = null;

// Start heartbeat om verbinding open te houden
const startHeartbeat = (writer: WritableStreamDefaultWriter, encoder: TextEncoder) => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  heartbeatInterval = setInterval(async () => {
    try {
      await writer.write(encoder.encode(`: heartbeat\n\n`));
    } catch (e) {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    }
  }, 15000); // Elke 15 seconden
};

// Stop heartbeat
const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  // Track of stream is afgesloten
  let streamClosed = false;
  
  // Helper functie voor streaming response
  const sendProgress = (progress: number, message: string, data?: any) => {
    if (streamClosed) return;
    return encoder.encode(
      `data: ${JSON.stringify({ progress, message, ...data })}\n\n`
    );
  };

  const stream = new ReadableStream({
    async start(controller) {
      let writer: WritableStreamDefaultWriter | null = null;
      
      try {
        // Get writer for heartbeat
        writer = controller as any;
        
        // Start heartbeat
        startHeartbeat(writer, encoder);
        
        // ═══════════════════════════════════════════════════════
        // 1. AUTHENTICATION & INPUT VALIDATION
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(5, 'Bezig met authenticatie...'));
        
        const auth = await getAuthenticatedClient();
        if (isAuthError(auth)) {
          controller.enqueue(sendProgress(0, '❌ Niet geautoriseerd', { 
            error: auth.error,
            done: true
          }));
          stopHeartbeat();
          streamClosed = true;
          controller.close();
          return;
        }

        // Use client.id (from Client table), NOT session.user.id
        const clientId = auth.client.id;
        
        // Parse request body
        const body = await request.json();
        const {
          topic,
          language = 'NL',
          wordCount = 1500,
          imageCount = 3,
          projectId,
          includeImages = true,
          includeFAQ = false,
          includeYouTube = false,
          tone = 'professional',
          keywords,
        } = body;

        // Validate input
        if (!topic || topic.trim().length === 0) {
          controller.enqueue(sendProgress(0, '❌ Geen onderwerp opgegeven', { 
            error: 'Onderwerp is verplicht',
            done: true
          }));
          stopHeartbeat();
          streamClosed = true;
          controller.close();
          return;
        }

        // Validate language
        if (!isValidLanguage(language)) {
          controller.enqueue(sendProgress(0, '❌ Ongeldige taal', { 
            error: `Taal ${language} wordt niet ondersteund`,
            done: true
          }));
          stopHeartbeat();
          streamClosed = true;
          controller.close();
          return;
        }

        const languageInfo = getLanguageInfo(language);
        const languageName = getLanguageNameForAI(language);

        console.log(`📝 Starting unified content generation:`, {
          topic,
          language: `${language} (${languageName})`,
          wordCount,
          imageCount: includeImages ? imageCount : 0,
          tone,
          includeFAQ,
          includeYouTube,
          projectId: projectId || 'none',
          clientId,
        });

        // ═══════════════════════════════════════════════════════
        // 1.5. LOAD PROJECT CONTEXT (if provided)
        // ═══════════════════════════════════════════════════════
        
        let projectContext = '';
        if (projectId) {
          try {
            const project = await prisma.project.findUnique({
              where: { id: projectId, clientId },
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
            
            if (project) {
              const contextParts = [];
              if (project.brandVoice) contextParts.push(`Brand voice: ${project.brandVoice}`);
              if (project.targetAudience) contextParts.push(`Target audience: ${project.targetAudience}`);
              if (project.niche) contextParts.push(`Niche: ${project.niche}`);
              if (project.writingStyle) contextParts.push(`Writing style: ${project.writingStyle}`);
              if (project.customInstructions) contextParts.push(`Additional instructions: ${project.customInstructions}`);
              if (project.keywords && project.keywords.length > 0) {
                contextParts.push(`Important keywords to include: ${project.keywords.join(', ')}`);
              }
              
              projectContext = contextParts.join('\n');
              console.log(`📁 Loaded project context for: ${project.name}`);
            }
          } catch (error) {
            console.error('Warning: Could not load project context:', error);
            // Continue without project context
          }
        }

        // ═══════════════════════════════════════════════════════
        // 2. CREDITS CHECK
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(10, 'Credits controleren...'));
        
        // Bereken totale kosten
        const imageCost = includeImages ? imageCount * CREDIT_COSTS.IMAGE_BUDGET : 0;
        const totalCost = GENERATOR_CREDIT_COST + imageCost;
        
        const hasCredits = await hasEnoughCredits(clientId, totalCost);
        if (!hasCredits) {
          controller.enqueue(sendProgress(0, '💳 Onvoldoende credits', { 
            error: `Deze actie kost ${totalCost} credits. Vul je credits aan.`,
            creditsNeeded: totalCost,
            done: true
          }));
          stopHeartbeat();
          streamClosed = true;
          controller.close();
          return;
        }

        // ═══════════════════════════════════════════════════════
        // 3. CONTENT GENERATION
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(20, `Content genereren in ${languageInfo?.nativeName}...`));
        
        // Build enhanced prompt with all options
        const keywordsInstruction = keywords ? `\n- Include these SEO keywords naturally: ${keywords}` : '';
        const toneInstruction = `\n- Tone: ${tone}`;
        const faqInstruction = includeFAQ ? `\n- Add a comprehensive FAQ section at the end with at least 5 relevant questions and answers` : '';
        const youtubeInstruction = includeYouTube ? `\n- Suggest 2-3 relevant YouTube video topics that would complement this content (format: "YouTube: [topic]")` : '';
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
- Focus on providing value to readers${toneInstruction}${keywordsInstruction}${faqInstruction}${youtubeInstruction}${projectContextInstruction}

Format the output as valid HTML. Do NOT include <html>, <head>, or <body> tags, only the article content.`;

        let articleContent = '';
        let articleTitle = topic;
        
        try {
          // Generate content with Claude 4.5
          const aiResponse = await chatCompletion({
            model: TEXT_MODELS.CLAUDE_45,
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: wordCount * 2, // Ruime marge
          });

          articleContent = aiResponse.choices[0]?.message?.content || '';
          
          // Extract title from first H1 or H2
          const titleMatch = articleContent.match(/<h[12]>(.*?)<\/h[12]>/i);
          if (titleMatch) {
            articleTitle = titleMatch[1].replace(/<[^>]*>/g, '').trim();
          }

          console.log(`✅ Content generated (${articleContent.length} chars)`);
          
        } catch (error: any) {
          console.error('❌ AI generation error:', error);
          
          // Determine user-friendly error message
          let userMessage = 'AI kon de content niet genereren. Probeer het opnieuw.';
          if (error.message?.includes('timeout')) {
            userMessage = 'De generatie duurde te lang. Probeer met minder woorden.';
          } else if (error.message?.includes('rate limit') || error.status === 429) {
            userMessage = 'Te veel verzoeken. Wacht even en probeer opnieuw.';
          } else if (error.message?.includes('credits')) {
            userMessage = 'Onvoldoende credits. Vul je credits aan.';
          }
          
          controller.enqueue(sendProgress(0, '❌ Content generatie mislukt', { 
            error: userMessage,
            done: true
          }));
          stopHeartbeat();
          streamClosed = true;
          controller.close();
          return;
        }

        controller.enqueue(sendProgress(60, 'Content gegenereerd, afbeeldingen maken...'));

        // ═══════════════════════════════════════════════════════
        // 4. IMAGE GENERATION (optional)
        // ═══════════════════════════════════════════════════════
        
        const imageUrls: string[] = [];
        
        if (includeImages && imageCount > 0) {
          for (let i = 0; i < imageCount; i++) {
            try {
              const imagePrompt = `Professional image for article about: ${topic}. High quality, ${i === 0 ? 'main header image' : 'supporting visual'}`;
              
              controller.enqueue(sendProgress(
                60 + (i + 1) * (20 / imageCount),
                `Afbeelding ${i + 1}/${imageCount} genereren...`
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
                
                // Replace placeholder in content
                articleContent = articleContent.replace(
                  `{{IMAGE_PLACEHOLDER_${i + 1}}}`,
                  `<img src="${imageResult.imageUrl}" alt="${topic} - Image ${i + 1}" class="w-full rounded-lg my-4" />`
                );
              }
            } catch (error) {
              console.error(`Warning: Image ${i + 1} generation failed:`, error);
              // Continue without this image
            }
          }
        }

        // Remove any remaining placeholders
        articleContent = articleContent.replace(/\{\{IMAGE_PLACEHOLDER_\d+\}\}/g, '');

        controller.enqueue(sendProgress(85, 'Content opslaan...'));

        // ═══════════════════════════════════════════════════════
        // 5. SAVE TO CONTENT LIBRARY
        // ═══════════════════════════════════════════════════════
        
        let contentId: string | null = null;
        
        try {
          const result = await autoSaveToLibrary({
            clientId,
            projectId: projectId || null,
            type: 'blog',
            title: articleTitle,
            content: articleContent,
            language: language.toUpperCase(),
          });
          
          contentId = result.contentId || null;
          console.log(`✅ Content saved to library: ${contentId}`);
          
        } catch (error) {
          console.error('Warning: Could not save to library:', error);
          // Continue anyway, we still have the content
        }

        // ═══════════════════════════════════════════════════════
        // 6. DEDUCT CREDITS
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(95, 'Credits verwerken...'));
        
        const creditResult = await deductCredits(
          clientId,
          totalCost,
          `Content generatie: ${articleTitle}`
        );
        
        if (!creditResult.success) {
          console.error('Warning: Credit deduction failed:', creditResult.error);
        }

        // ═══════════════════════════════════════════════════════
        // 7. SEND SUCCESS RESPONSE
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(100, '✅ Content succesvol gegenereerd!', {
          success: true,
          contentId,
          title: articleTitle,
          content: articleContent,
          imageUrls,
          wordCount: articleContent.split(/\s+/).length,
          creditsUsed: totalCost,
          language,
          done: true
        }));

        console.log(`✅ Unified content generation complete!`);
        
        // Stop heartbeat on success
        stopHeartbeat();
        
      } catch (error: any) {
        console.error('❌ Unified generator error:', error);
        
        // Stop heartbeat on error
        stopHeartbeat();
        
        if (!streamClosed) {
          // Determine user-friendly error message
          let userMessage = 'Er ging iets mis. Probeer het opnieuw.';
          if (error.message?.includes('timeout')) {
            userMessage = 'De generatie duurde te lang. Probeer met minder woorden.';
          } else if (error.message?.includes('rate limit') || error.status === 429) {
            userMessage = 'Te veel verzoeken. Wacht even en probeer opnieuw.';
          } else if (error.message?.includes('credits')) {
            userMessage = 'Onvoldoende credits. Vul je credits aan.';
          } else if (error.message?.includes('fetch')) {
            userMessage = 'Verbinding verloren. Probeer het opnieuw.';
          }
          
          controller.enqueue(sendProgress(0, '❌ Er ging iets mis', { 
            error: userMessage,
            done: true
          }));
        }
      } finally {
        stopHeartbeat();
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
