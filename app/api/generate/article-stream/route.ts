import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Helper to clean HTML content
function cleanHtmlContent(content: string): string {
  let cleaned = content;
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```html\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // Remove any "Here is" preambles
  cleaned = cleaned.replace(/^(Here is|Here's|Below is|The following|Hier is|Hieronder)[^<]*</i, '<');
  
  // Remove trailing AI comments
  const dashIndex = cleaned.lastIndexOf('\n---');
  if (dashIndex > cleaned.length * 0.8) {
    cleaned = cleaned.substring(0, dashIndex);
  }
  
  return cleaned.trim();
}

// Helper to generate slug from keyword
function generateSlugFromKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}

export async function POST(request: Request) {
  const { title, keyword, description, contentType, wordCount = 2000 } = await request.json();

  if (!title || !keyword) {
    return NextResponse.json({ error: 'Title and keyword are required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const now = new Date();
        const currentMonth = now.toLocaleString('nl-NL', { month: 'long' });
        const currentYear = now.getFullYear();

        // ============================================
        // STEP 1: Research & Planning (0-15%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 5,
          progress: 5,
          message: '🔍 Onderzoek starten...',
          detail: `Analyseren van "${keyword}" voor optimale content`,
        });

        // Generate outline
        const outlinePrompt = `Maak een gedetailleerde outline voor een ${contentType || 'artikel'} over: "${title}"
Focus keyword: ${keyword}
${description ? `Context: ${description}` : ''}
Doellengte: ${wordCount} woorden
Datum: ${currentMonth} ${currentYear}

Geef een JSON outline:
{
  "mainHeading": "H1 titel met keyword",
  "metaDescription": "SEO meta description (max 160 tekens)",
  "sections": [
    {
      "heading": "H2 heading",
      "subheadings": ["H3 subheading 1", "H3 subheading 2"],
      "keyPoints": ["punt 1", "punt 2", "punt 3"]
    }
  ],
  "estimatedWordCount": ${wordCount}
}`;

        let outline: any = null;
        try {
          const outlineResponse = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een SEO content strategist. Maak gedetailleerde outlines voor artikelen. Output alleen JSON.',
            userPrompt: outlinePrompt,
            maxTokens: 2000,
            temperature: 0.6,
          });

          const jsonMatch = outlineResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            outline = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.warn('Outline generation failed:', e);
        }

        sendSSE(controller, {
          type: 'progress',
          step: 1,
          totalSteps: 5,
          progress: 15,
          message: '✅ Outline klaar',
          detail: outline ? `${outline.sections?.length || 0} secties gepland` : 'Basis structuur bepaald',
          outline,
        });

        // ============================================
        // STEP 2: Write Introduction (15-30%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 2,
          totalSteps: 5,
          progress: 20,
          message: '✍️ Introductie schrijven...',
          detail: 'Pakkende opening creëren',
        });

        const introPrompt = `Schrijf een pakkende introductie voor een artikel over: "${title}"
Focus keyword: ${keyword}
${outline ? `Outline: ${JSON.stringify(outline.sections?.slice(0, 2))}` : ''}

Vereisten:
- Start direct met een hook die de lezer pakt
- Vermeld het keyword in de eerste 100 woorden
- Geef een preview van wat de lezer gaat leren
- Gebruik "je" en "jij" (informeel)
- Ongeveer 150-200 woorden
- Output als HTML (alleen de content, geen wrapper tags)`;

        let introContent = '';
        try {
          introContent = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een expert content writer. Schrijf in het Nederlands met "je/jij". Output alleen HTML content.',
            userPrompt: introPrompt,
            maxTokens: 1000,
            temperature: 0.7,
          });
          introContent = cleanHtmlContent(introContent);
        } catch (e) {
          console.warn('Intro generation failed:', e);
        }

        sendSSE(controller, {
          type: 'progress',
          step: 2,
          totalSteps: 5,
          progress: 30,
          message: '✅ Introductie klaar',
          detail: `${introContent.split(' ').length} woorden geschreven`,
        });

        // ============================================
        // STEP 3: Write Main Content (30-70%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 3,
          totalSteps: 5,
          progress: 35,
          message: '📝 Hoofdcontent schrijven...',
          detail: 'Dit is de langste stap (~1-2 minuten)',
        });

        const mainPrompt = `Schrijf de hoofdcontent voor een artikel over: "${title}"
Focus keyword: ${keyword}
Doellengte: ${wordCount - 400} woorden (excl. intro en conclusie)
${outline ? `Volg deze outline:\n${JSON.stringify(outline.sections, null, 2)}` : ''}

Vereisten:
- Gebruik H2 en H3 headings
- Vermeld het keyword natuurlijk door de tekst
- Voeg praktische tips en voorbeelden toe
- Gebruik bullet points en genummerde lijsten waar relevant
- Schrijf in het Nederlands met "je/jij"
- Maak het informatief en actionable
- Output als HTML (alleen content, geen wrapper)

BELANGRIJK: Output ALLEEN de HTML content, geen markdown code blocks.`;

        let mainContent = '';
        try {
          mainContent = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een expert SEO content writer. Schrijf uitgebreide, informatieve content in het Nederlands. Output alleen HTML, geen markdown.',
            userPrompt: mainPrompt,
            maxTokens: 8000,
            temperature: 0.7,
          });
          mainContent = cleanHtmlContent(mainContent);
        } catch (e) {
          console.warn('Main content generation failed:', e);
        }

        sendSSE(controller, {
          type: 'progress',
          step: 3,
          totalSteps: 5,
          progress: 70,
          message: '✅ Hoofdcontent klaar',
          detail: `${mainContent.split(' ').length} woorden geschreven`,
        });

        // ============================================
        // STEP 4: Write Conclusion (70-85%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 4,
          totalSteps: 5,
          progress: 75,
          message: '🎯 Conclusie schrijven...',
          detail: 'Krachtige afsluiting maken',
        });

        const conclusionPrompt = `Schrijf een krachtige conclusie voor een artikel over: "${title}"
Focus keyword: ${keyword}

Vereisten:
- Vat de belangrijkste punten samen
- Eindig met een call-to-action
- Gebruik "je/jij"
- Ongeveer 150-200 woorden
- Output als HTML`;

        let conclusionContent = '';
        try {
          conclusionContent = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een expert content writer. Schrijf krachtige conclusies. Output alleen HTML.',
            userPrompt: conclusionPrompt,
            maxTokens: 800,
            temperature: 0.7,
          });
          conclusionContent = cleanHtmlContent(conclusionContent);
        } catch (e) {
          console.warn('Conclusion generation failed:', e);
        }

        sendSSE(controller, {
          type: 'progress',
          step: 4,
          totalSteps: 5,
          progress: 85,
          message: '✅ Conclusie klaar',
          detail: 'Artikel bijna compleet',
        });

        // ============================================
        // STEP 5: Generate Image & Finalize (85-100%)
        // ============================================
        sendSSE(controller, {
          type: 'progress',
          step: 5,
          totalSteps: 5,
          progress: 90,
          message: '🖼️ Featured image genereren...',
          detail: 'AI afbeelding maken met Flux Pro',
        });

        let featuredImage = '';
        try {
          featuredImage = await generateFeaturedImage(title, keyword);
        } catch (e) {
          console.warn('Image generation failed:', e);
        }

        // Combine all content
        const fullContent = `
<h1>${outline?.mainHeading || title}</h1>

${introContent}

${mainContent}

<h2>Conclusie</h2>
${conclusionContent}
`.trim();

        const slug = generateSlugFromKeyword(keyword);
        const wordCountActual = fullContent.split(/\s+/).length;

        sendSSE(controller, {
          type: 'progress',
          step: 5,
          totalSteps: 5,
          progress: 100,
          message: '✅ Artikel voltooid!',
          detail: `${wordCountActual} woorden • Klaar om te publiceren`,
        });

        // Send final result
        sendSSE(controller, {
          type: 'complete',
          success: true,
          article: {
            title: outline?.mainHeading || title,
            content: fullContent,
            metaDescription: outline?.metaDescription || `${title} - Uitgebreide gids over ${keyword}`,
            slug,
            keyword,
            wordCount: wordCountActual,
            featuredImage,
            outline,
          },
        });

      } catch (error: any) {
        console.error('Article generation error:', error);
        sendSSE(controller, {
          type: 'error',
          message: error.message || 'Er is een fout opgetreden bij het genereren',
        });
      } finally {
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
