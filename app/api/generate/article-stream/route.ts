import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';
import { CONTENT_PROMPT_RULES, cleanForbiddenWords } from '@/lib/writing-rules';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

// Helper to ensure proper HTML structure with headings
function ensureHtmlStructure(content: string): string {
  let html = content;
  
  // Remove markdown code blocks
  html = html.replace(/```html\s*/gi, '');
  html = html.replace(/```\s*/g, '');
  
  // If content doesn't have HTML tags, convert from plain text
  if (!html.includes('<h') && !html.includes('<p>')) {
    // Split by double newlines for paragraphs
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      
      // Check if it looks like a heading (short, no period at end)
      if (p.length < 100 && !p.endsWith('.') && !p.startsWith('-') && !p.startsWith('•')) {
        // Determine heading level
        if (p.match(/^#{1,2}\s/)) {
          return `<h2>${p.replace(/^#+\s*/, '')}</h2>`;
        } else if (p.match(/^#{3}\s/)) {
          return `<h3>${p.replace(/^#+\s*/, '')}</h3>`;
        } else if (p.length < 60) {
          return `<h2>${p}</h2>`;
        }
      }
      
      // Check for list items
      if (p.match(/^[-•*]\s/m)) {
        const items = p.split(/\n/).filter(line => line.trim());
        const listItems = items.map(item => `<li>${item.replace(/^[-•*]\s*/, '')}</li>`).join('\n');
        return `<ul>\n${listItems}\n</ul>`;
      }
      
      // Check for numbered list
      if (p.match(/^\d+\.\s/m)) {
        const items = p.split(/\n/).filter(line => line.trim());
        const listItems = items.map(item => `<li>${item.replace(/^\d+\.\s*/, '')}</li>`).join('\n');
        return `<ol>\n${listItems}\n</ol>`;
      }
      
      return `<p>${p}</p>`;
    }).join('\n\n');
  }
  
  // Ensure paragraphs are wrapped
  html = html.replace(/(<\/h[1-6]>)\s*([^<])/g, '$1\n\n<p>$2');
  html = html.replace(/([^>])\s*(<h[1-6])/g, '$1</p>\n\n$2');
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  
  // Add spacing between elements
  html = html.replace(/<\/h2>\s*<h3>/g, '</h2>\n\n<h3>');
  html = html.replace(/<\/h3>\s*<p>/g, '</h3>\n\n<p>');
  html = html.replace(/<\/p>\s*<h2>/g, '</p>\n\n<h2>');
  html = html.replace(/<\/p>\s*<h3>/g, '</p>\n\n<h3>');
  html = html.replace(/<\/ul>\s*<h/g, '</ul>\n\n<h');
  html = html.replace(/<\/ol>\s*<h/g, '</ol>\n\n<h');
  
  return html.trim();
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
  
  // Clean forbidden words
  cleaned = cleanForbiddenWords(cleaned);
  
  // Ensure proper HTML structure
  cleaned = ensureHtmlStructure(cleaned);
  
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
  "mainHeading": "H1 titel met keyword (alleen eerste letter hoofdletter)",
  "metaDescription": "SEO meta description (max 160 tekens)",
  "sections": [
    {
      "heading": "H2 heading (alleen eerste letter hoofdletter)",
      "subheadings": ["H3 subheading 1", "H3 subheading 2"],
      "keyPoints": ["punt 1", "punt 2", "punt 3"]
    }
  ],
  "estimatedWordCount": ${wordCount}
}

BELANGRIJK: Alle headings met alleen eerste letter hoofdletter (bijv. "Hoe werkt het" niet "Hoe Werkt Het")`;

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

${CONTENT_PROMPT_RULES}

Specifieke vereisten voor intro:
- Start direct met een hook die de lezer pakt
- Vermeld het keyword in de eerste 100 woorden
- Geef een preview van wat de lezer gaat leren
- Ongeveer 150-200 woorden
- Output als HTML met <p> tags voor elke alinea
- Elke alinea max 3-4 zinnen
- GEEN "In deze blog..." of "In dit artikel..." zinnen
- GEEN H1 of H2 tags in de intro

Voorbeeld output formaat:
<p>Eerste alinea met hook en keyword.</p>

<p>Tweede alinea met context.</p>

<p>Derde alinea met preview van wat komt.</p>`;

        let introContent = '';
        try {
          introContent = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een expert content writer. Schrijf in het Nederlands met "je/jij". Output alleen HTML content met <p> tags. Gebruik NOOIT verboden woorden. Elke alinea in eigen <p> tag.',
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

${CONTENT_PROMPT_RULES}

BELANGRIJKE OPMAAK REGELS:
1. Gebruik <h2> voor hoofdsecties (alleen eerste letter hoofdletter)
2. Gebruik <h3> voor subsecties (alleen eerste letter hoofdletter)
3. Elke alinea in eigen <p> tag
4. Korte alinea's van max 3-4 zinnen
5. Lege regel tussen elk element
6. Gebruik <ul> of <ol> voor lijsten met <li> items
7. Gebruik <strong> voor belangrijke woorden

Voorbeeld structuur:
<h2>Eerste sectie heading</h2>

<p>Eerste alinea van deze sectie. Kort en bondig.</p>

<p>Tweede alinea met meer details.</p>

<h3>Subsectie heading</h3>

<p>Content voor de subsectie.</p>

<ul>
<li>Eerste punt</li>
<li>Tweede punt</li>
<li>Derde punt</li>
</ul>

<h2>Tweede sectie heading</h2>

<p>Enzovoort...</p>

BELANGRIJK: Output ALLEEN de HTML content, geen markdown code blocks. Zorg voor goede witruimte tussen elementen.`;

        let mainContent = '';
        try {
          mainContent = await generateAICompletion({
            task: 'content',
            systemPrompt: `Je bent een expert SEO content writer. Schrijf uitgebreide, informatieve content in het Nederlands met "je/jij". 

OUTPUT REGELS:
- Output alleen HTML, geen markdown
- Gebruik <h2> en <h3> voor headings
- Elke alinea in eigen <p> tag
- Korte alinea's (max 3-4 zinnen)
- Lege regels tussen elementen voor leesbaarheid
- Gebruik NOOIT verboden woorden zoals: cruciaal, essentieel, kortom, conclusie, duiken, jungle, de sleutel, superheld, veilige haven, gids, voordelen, digitaal tijdperk, gedoe.`,
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
          message: '🎯 Afsluiting schrijven...',
          detail: 'Krachtige afsluiting maken',
        });

        const conclusionPrompt = `Schrijf een krachtige afsluiting voor een artikel over: "${title}"
Focus keyword: ${keyword}

${CONTENT_PROMPT_RULES}

Specifieke vereisten:
- Vat de belangrijkste punten samen
- Eindig met een call-to-action
- Ongeveer 150-200 woorden
- Output als HTML met <p> tags
- Elke alinea in eigen <p> tag
- NIET het woord "conclusie" gebruiken - de heading is al "Tot slot"

Voorbeeld output:
<p>Samenvattende alinea over het onderwerp.</p>

<p>Tweede alinea met key takeaways.</p>

<p>Afsluitende alinea met call-to-action.</p>`;

        let conclusionContent = '';
        try {
          conclusionContent = await generateAICompletion({
            task: 'content',
            systemPrompt: 'Je bent een expert content writer. Schrijf krachtige afsluitingen. Output alleen HTML met <p> tags. Gebruik NOOIT het woord "conclusie".',
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
          message: '✅ Afsluiting klaar',
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

        let featuredImage: string = '';
        try {
          const generatedImage = await generateFeaturedImage(title, keyword);
          featuredImage = generatedImage || '';
        } catch (e) {
          console.warn('Image generation failed:', e);
          featuredImage = '';
        }

        // Combine all content with proper spacing
        const fullContent = `<h1>${outline?.mainHeading || title}</h1>

${introContent}

${mainContent}

<h2>Tot slot</h2>

${conclusionContent}`.trim();

        const slug = generateSlugFromKeyword(keyword);
        const wordCountActual = fullContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

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
            metaDescription: outline?.metaDescription || `${title} - Uitgebreide handleiding over ${keyword}`,
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
          message: error.message || 'Er is een fout opgetreden',
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
