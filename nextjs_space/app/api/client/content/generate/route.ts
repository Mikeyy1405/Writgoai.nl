
/**
 * 🚀 UNIFIED CONTENT GENERATOR - MVP Version
 * 
 * Simpele, betrouwbare content generatie in 10 talen
 * - Max 400 regels code
 * - Proper error handling
 * - Credits check vooraf
 * - Progress tracking
 * - Auto-save naar content library
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getLanguageNameForAI, isValidLanguage, getLanguageInfo } from '@/lib/language-helper';
import { generateSmartImage } from '@/lib/smart-image-generator';
import { autoSaveToLibrary } from '@/lib/content-library-helper';

// Credit costs voor unified generator
const GENERATOR_CREDIT_COST = CREDIT_COSTS.BLOG_POST; // 70 credits

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
      try {
        // ═══════════════════════════════════════════════════════
        // 1. AUTHENTICATION & INPUT VALIDATION
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(5, 'Bezig met authenticatie...'));
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
          controller.enqueue(sendProgress(0, '❌ Niet geautoriseerd', { 
            error: 'Niet geautoriseerd' 
          }));
          streamClosed = true;
          controller.close();
          return;
        }

        const clientId = session.user.id;
        
        // Parse request body
        const body = await request.json();
        const {
          topic,
          language = 'NL',
          wordCount = 1500,
          imageCount = 3,
          projectId,
          includeImages = true,
        } = body;

        // Validate input
        if (!topic || topic.trim().length === 0) {
          controller.enqueue(sendProgress(0, '❌ Geen onderwerp opgegeven', { 
            error: 'Onderwerp is verplicht' 
          }));
          streamClosed = true;
          controller.close();
          return;
        }

        // Validate language
        if (!isValidLanguage(language)) {
          controller.enqueue(sendProgress(0, '❌ Ongeldige taal', { 
            error: `Taal ${language} wordt niet ondersteund` 
          }));
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
          clientId,
        });

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
          }));
          streamClosed = true;
          controller.close();
          return;
        }

        // ═══════════════════════════════════════════════════════
        // 3. CONTENT GENERATION
        // ═══════════════════════════════════════════════════════
        
        controller.enqueue(sendProgress(20, `Content genereren in ${languageInfo?.nativeName}...`));
        
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
- Focus on providing value to readers

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
          controller.enqueue(sendProgress(0, '❌ Content generatie mislukt', { 
            error: 'AI kon de content niet genereren. Probeer het opnieuw.',
          }));
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
        }));

        console.log(`✅ Unified content generation complete!`);
        
      } catch (error: any) {
        console.error('❌ Unified generator error:', error);
        
        if (!streamClosed) {
          controller.enqueue(sendProgress(0, '❌ Er ging iets mis', { 
            error: error.message || 'Onbekende fout',
          }));
        }
      } finally {
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
