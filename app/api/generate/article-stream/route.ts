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

// Convert markdown to HTML
function markdownToHtml(content: string): string {
  let html = content;
  
  // Remove code blocks
  html = html.replace(/```html\s*/gi, '');
  html = html.replace(/```\s*/g, '');
  
  // Convert markdown bold **text** to <strong>text</strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Convert markdown italic *text* to <em>text</em>
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert markdown headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert markdown links [text](url) to <a href="url">text</a>
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  return html;
}

// Ensure proper HTML structure with headings
function ensureHtmlStructure(content: string): string {
  let html = markdownToHtml(content);
  
  // If content doesn't have HTML tags, convert from plain text
  if (!html.includes('<h') && !html.includes('<p>')) {
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      p = p.trim();
      if (!p) return '';
      
      // Check if it looks like a heading
      if (p.length < 100 && !p.endsWith('.') && !p.startsWith('-') && !p.startsWith('•')) {
        if (p.length < 60 && !p.includes('<')) {
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
      
      // Wrap in paragraph if not already wrapped
      if (!p.startsWith('<')) {
        return `<p>${p}</p>`;
      }
      
      return p;
    }).join('\n\n');
  }
  
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

// Clean HTML content
function cleanHtmlContent(content: string): string {
  let cleaned = content;
  
  // Convert markdown to HTML first
  cleaned = markdownToHtml(cleaned);
  
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
  
  // Ensure structure
  cleaned = ensureHtmlStructure(cleaned);
  
  return cleaned;
}

// Language-specific instructions
const LANGUAGE_INSTRUCTIONS: Record<string, {
  systemPrompt: string;
  conclusionHeading: string;
  writingStyle: string;
}> = {
  nl: {
    systemPrompt: 'Je bent een Nederlandse SEO content schrijver. Schrijf in het Nederlands met "je" en "jij" (informeel).',
    conclusionHeading: 'Tot slot',
    writingStyle: 'Schrijf in het Nederlands. Gebruik "je" en "jij" (informeel). Alle content moet in het Nederlands zijn.',
  },
  en: {
    systemPrompt: 'You are an English SEO content writer. Write in English.',
    conclusionHeading: 'Final thoughts',
    writingStyle: 'Write in English. All content must be in English.',
  },
  de: {
    systemPrompt: 'Du bist ein deutscher SEO Content Writer. Schreibe auf Deutsch mit "du" (informell).',
    conclusionHeading: 'Fazit',
    writingStyle: 'Schreibe auf Deutsch. Verwende "du" (informell). Alle Inhalte müssen auf Deutsch sein.',
  },
  fr: {
    systemPrompt: 'Tu es un rédacteur SEO français. Écris en français avec "tu" (informel).',
    conclusionHeading: 'Pour conclure',
    writingStyle: 'Écris en français. Utilise "tu" (informel). Tout le contenu doit être en français.',
  },
  es: {
    systemPrompt: 'Eres un redactor SEO español. Escribe en español con "tú" (informal).',
    conclusionHeading: 'Para terminar',
    writingStyle: 'Escribe en español. Usa "tú" (informal). Todo el contenido debe estar en español.',
  },
};

export async function POST(request: Request) {
  const { title, keyword, description, contentType, wordCount = 2000, language = 'nl', websiteUrl } = await request.json();

  if (!title || !keyword) {
    return NextResponse.json({ error: 'Title and keyword are required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const now = new Date();
        const langConfig = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['nl'];
        const localeMap: Record<string, string> = { nl: 'nl-NL', en: 'en-US', de: 'de-DE', fr: 'fr-FR', es: 'es-ES' };
        const currentMonth = now.toLocaleString(localeMap[language] || 'nl-NL', { month: 'long' });
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

${langConfig.writingStyle}

Geef een JSON outline:
{
  "mainHeading": "H1 titel met keyword (alleen eerste letter hoofdletter)",
  "metaDescription": "SEO meta description (max 160 tekens)",
  "sections": [
    {
      "heading": "H2 heading (alleen eerste letter hoofdletter)",
      "subheadings": ["H3 subheading 1", "H3 subheading 2"],
      "keyPoints": ["punt 1", "punt 2", "punt 3"],
      "imagePrompt": "Beschrijving voor AI afbeelding bij deze sectie"
    }
  ],
  "estimatedWordCount": ${wordCount}
}

BELANGRIJK: Alle headings met alleen eerste letter hoofdletter. ${langConfig.writingStyle}`;

        let outline: any = null;
        try {
          const outlineResponse = await generateAICompletion({
            task: 'content',
            systemPrompt: `${langConfig.systemPrompt} Maak gedetailleerde outlines voor artikelen. Output alleen JSON.`,
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

${langConfig.writingStyle}

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
- Gebruik <strong> voor belangrijke woorden (NIET ** sterretjes)

Output ALLEEN HTML, geen markdown.`;

        let introContent = '';
        try {
          introContent = await generateAICompletion({
            task: 'content',
            systemPrompt: `${langConfig.systemPrompt} Output alleen HTML content. Gebruik <strong> voor bold, NIET ** markdown. Elke alinea in eigen <p> tag.`,
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

${langConfig.writingStyle}

${CONTENT_PROMPT_RULES}

BELANGRIJKE OPMAAK REGELS:
1. Gebruik <h2> voor hoofdsecties (alleen eerste letter hoofdletter)
2. Gebruik <h3> voor subsecties (alleen eerste letter hoofdletter)
3. Elke alinea in eigen <p> tag
4. Korte alinea's van max 3-4 zinnen
5. Lege regel tussen elk element
6. Gebruik <ul> of <ol> voor lijsten met <li> items
7. Gebruik <strong> voor belangrijke woorden (NIET ** sterretjes!)
8. Gebruik <em> voor nadruk (NIET * sterretjes!)

VERBODEN:
- Geen markdown ** of * voor bold/italic
- Geen code blocks met \`\`\`
- Geen "conclusie" als heading

Voorbeeld structuur:
<h2>Eerste sectie heading</h2>

<p>Eerste alinea met <strong>belangrijke woorden</strong> gemarkeerd.</p>

<p>Tweede alinea met meer details.</p>

<h3>Subsectie heading</h3>

<p>Content voor de subsectie.</p>

<ul>
<li>Eerste punt</li>
<li>Tweede punt</li>
</ul>

Output ALLEEN HTML, geen markdown.`;

        let mainContent = '';
        try {
          mainContent = await generateAICompletion({
            task: 'content',
            systemPrompt: `${langConfig.systemPrompt}

OUTPUT REGELS:
- Output alleen HTML, geen markdown
- Gebruik <h2> en <h3> voor headings
- Gebruik <strong> voor bold, NIET **
- Gebruik <em> voor italic, NIET *
- Elke alinea in eigen <p> tag
- Korte alinea's (max 3-4 zinnen)
- NOOIT markdown syntax gebruiken`,
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

${langConfig.writingStyle}

${CONTENT_PROMPT_RULES}

Specifieke vereisten:
- Vat de belangrijkste punten samen
- Eindig met een call-to-action
- Ongeveer 150-200 woorden
- Output als HTML met <p> tags
- Gebruik <strong> voor belangrijke woorden (NIET ** sterretjes!)
- NIET het woord "conclusie" gebruiken - de heading is al "${langConfig.conclusionHeading}"

Output ALLEEN HTML, geen markdown.`;

        let conclusionContent = '';
        try {
          conclusionContent = await generateAICompletion({
            task: 'content',
            systemPrompt: `${langConfig.systemPrompt} Schrijf krachtige afsluitingen. Output alleen HTML. Gebruik <strong> voor bold, NIET **. Gebruik NOOIT het woord "conclusie".`,
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
        }

        sendSSE(controller, {
          type: 'progress',
          step: 5,
          totalSteps: 5,
          progress: 95,
          message: featuredImage ? '✅ Afbeelding gegenereerd' : '⚠️ Geen afbeelding (doorgaan)',
          detail: 'Artikel afronden...',
        });

        // Generate inline images for sections
        let inlineImages: string[] = [];
        if (outline?.sections && outline.sections.length > 0) {
          sendSSE(controller, {
            type: 'progress',
            step: 5,
            totalSteps: 5,
            progress: 92,
            message: '🖼️ Sectie afbeeldingen genereren...',
            detail: 'Extra afbeeldingen voor de content',
          });

          // Generate 1-2 inline images for longer articles
          const sectionsWithImages = outline.sections.filter((s: any) => s.imagePrompt).slice(0, 2);
          for (const section of sectionsWithImages) {
            try {
              const inlineImage = await generateFeaturedImage(section.heading, section.imagePrompt || keyword);
              if (inlineImage) {
                inlineImages.push(inlineImage);
              }
            } catch (e) {
              console.warn('Inline image generation failed:', e);
            }
          }
        }

        // Combine all content
        const h1Title = outline?.mainHeading || title;
        const metaDescription = outline?.metaDescription || `${title} - Lees alles over ${keyword}`;
        
        // Create slug from keyword
        const slug = keyword
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 60);

        // Build final content
        let finalContent = `<h1>${h1Title}</h1>\n\n`;
        
        // Add featured image after H1 if available
        if (featuredImage) {
          finalContent += `<figure class="featured-image">\n<img src="${featuredImage}" alt="${h1Title}" />\n</figure>\n\n`;
        }
        
        finalContent += introContent + '\n\n';
        
        // Insert inline images into main content
        if (inlineImages.length > 0 && mainContent) {
          const h2Matches = mainContent.match(/<h2>/g) || [];
          if (h2Matches.length >= 2 && inlineImages[0]) {
            // Insert first image after second H2
            let h2Count = 0;
            mainContent = mainContent.replace(/<\/h2>/g, (match) => {
              h2Count++;
              if (h2Count === 2) {
                return `${match}\n\n<figure class="content-image">\n<img src="${inlineImages[0]}" alt="${keyword}" />\n</figure>\n`;
              }
              return match;
            });
          }
          if (h2Matches.length >= 4 && inlineImages[1]) {
            // Insert second image after fourth H2
            let h2Count = 0;
            mainContent = mainContent.replace(/<\/h2>/g, (match) => {
              h2Count++;
              if (h2Count === 4) {
                return `${match}\n\n<figure class="content-image">\n<img src="${inlineImages[1]}" alt="${keyword}" />\n</figure>\n`;
              }
              return match;
            });
          }
        }
        
        finalContent += mainContent + '\n\n';
        finalContent += `<h2>${langConfig.conclusionHeading}</h2>\n\n`;
        finalContent += conclusionContent;
        
        // Add internal links naturally in the content if websiteUrl is provided
        if (websiteUrl) {
          const baseUrl = websiteUrl.replace(/\/$/, '');
          const siteName = baseUrl.replace(/https?:\/\//, '').replace(/^www\./, '').split('/')[0];
          
          // Find good anchor phrases to link
          const linkPhrases: Record<string, string[]> = {
            nl: ['meer informatie', 'lees meer', 'ontdek meer', 'bekijk onze', 'op onze website', 'neem contact op', 'vraag vrijblijvend'],
            en: ['more information', 'learn more', 'discover more', 'check out our', 'on our website', 'contact us', 'get in touch'],
            de: ['mehr erfahren', 'weitere Informationen', 'entdecken Sie', 'auf unserer Website', 'kontaktieren Sie uns'],
            fr: ['en savoir plus', 'découvrez', 'sur notre site', 'contactez-nous'],
            es: ['más información', 'descubre más', 'en nuestro sitio', 'contáctenos'],
          };
          
          const phrases = linkPhrases[language] || linkPhrases['nl'];
          
          // Try to find and link one of these phrases in the conclusion
          let linkedConclusion = false;
          for (const phrase of phrases) {
            const regex = new RegExp(`(${phrase})`, 'gi');
            if (conclusionContent.match(regex)) {
              conclusionContent = conclusionContent.replace(regex, `<a href="${baseUrl}">$1</a>`);
              linkedConclusion = true;
              break;
            }
          }
          
          // If no phrase found, add a natural sentence at the end of conclusion
          if (!linkedConclusion) {
            const naturalLinks: Record<string, string> = {
              nl: `<p>Wil je meer weten? Bekijk dan <a href="${baseUrl}">${siteName}</a> voor uitgebreide informatie en persoonlijk advies.</p>`,
              en: `<p>Want to learn more? Visit <a href="${baseUrl}">${siteName}</a> for detailed information and personalized advice.</p>`,
              de: `<p>Möchten Sie mehr erfahren? Besuchen Sie <a href="${baseUrl}">${siteName}</a> für ausführliche Informationen.</p>`,
              fr: `<p>Vous voulez en savoir plus? Visitez <a href="${baseUrl}">${siteName}</a> pour plus d'informations.</p>`,
              es: `<p>¿Quieres saber más? Visita <a href="${baseUrl}">${siteName}</a> para más información.</p>`,
            };
            finalContent += '\n\n' + (naturalLinks[language] || naturalLinks['nl']);
          }
        }

        // Final cleanup - ensure no markdown artifacts remain
        finalContent = finalContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        finalContent = finalContent.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
        finalContent = finalContent.replace(/```[a-z]*\s*/gi, '');
        finalContent = finalContent.replace(/```\s*/g, '');

        // Count words
        const wordCountFinal = finalContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

        // Send complete
        sendSSE(controller, {
          type: 'complete',
          article: {
            title: h1Title,
            content: finalContent,
            word_count: wordCountFinal,
            featured_image: featuredImage,
            slug,
            metaDescription,
          },
        });

        controller.close();
      } catch (error: any) {
        console.error('Article generation error:', error);
        sendSSE(controller, {
          type: 'error',
          message: error.message || 'Er is een fout opgetreden',
        });
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
