/**
 * Article Writer for Content Hub
 * Generates SEO-optimized articles with streaming support
 */

import { sendChatCompletion, sendStreamingChatCompletion } from '../aiml-chat-client';
import { TEXT_MODELS } from '../aiml-api';
import type { SERPAnalysis } from './serp-analyzer';

// Constants for article generation
const TOKEN_MULTIPLIER = 3; // Multiplier for target word count to max tokens
const MAX_TOKENS_LIMIT = 16000; // Maximum tokens to prevent exceeding model limits
const JSON_STRUCTURE_BUFFER = 500; // Buffer tokens to ensure JSON structure can be completed
const MIN_CONTENT_LENGTH = 200; // Minimum content length in characters to consider valid
const RETRY_TOKEN_MULTIPLIER = 2.5; // Reduced multiplier for retry attempts
const RETRY_MAX_TOKENS = 12000; // Maximum tokens for retry attempts

export interface ArticleWriteOptions {
  title: string;
  keywords: string[];
  targetWordCount: number;
  tone?: string;
  language?: string;
  serpAnalysis?: SERPAnalysis;
  internalLinks?: Array<{ url: string; anchorText: string }>;  
  includeImages?: boolean;
  includeFAQ?: boolean;
  includeYouTube?: boolean;
}

export interface ArticleResult {
  content: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  wordCount: number;
  faqSection?: Array<{ question: string; answer: string }>;  
  suggestedImages?: string[];
}

/**
 * Clean HTML response by removing markdown artifacts
 */
function cleanHtmlResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned
    .replace(/^```html?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '')
    .replace(/^```\s*\n?/gi, '')
    .trim();
  
  // Find first HTML tag if there's preamble text
  if (!cleaned.startsWith('<')) {
    const firstTag = cleaned.match(/<[a-z]/i);
    if (firstTag && firstTag.index !== undefined) {
      console.log(`[Article Writer] Stripping ${firstTag.index} chars of preamble`);
      cleaned = cleaned.substring(firstTag.index);
    }
  }
  
  return cleaned;
}

/**
 * Count words in HTML content
 */
function countWords(html: string): number {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(word => word.length > 0)
    .length;
}

/**
 * Build system prompt for article generation (pure HTML output)
 */
function buildSystemPrompt(language: string): string {
  return `Je bent een expert SEO content writer die in het ${language.toUpperCase()} schrijft.

KRITISCH - OUTPUT REGELS:
1. Retourneer ALLEEN pure HTML content
2. GEEN JSON wrapper
3. GEEN markdown code blocks  
4. GEEN \`\`\` backticks
5. Begin direct met <p> en eindig met </p>

HTML FORMAT & CONTENT VARIATIE:
- Gebruik deze tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <a>, <strong>, <em>, <blockquote>, <table>, <tr>, <th>, <td>
- Begin altijd met een <p> tag
- Gebruik H2 voor hoofdsecties
- Gebruik H3 voor subsecties
- Eindig altijd met </p>

VERPLICHTE CONTENT VARIATIE:
- Gebruik bullet points (<ul><li>) voor opsommingen van voordelen, tips, of lijsten
- Gebruik genummerde lijsten (<ol><li>) voor stappen of procedures
- Voeg minimaal 1 tabel toe (<table>) met relevante vergelijkingen of data
- Gebruik blockquotes (<blockquote>) voor belangrijke tips, quotes of highlights
- Houd paragrafen KORT (max 3-4 zinnen per <p>)
- Varieer tussen tekst, lijsten, tabellen en quotes voor betere leesbaarheid

VOORBEELD STRUCTUUR:
<p>Korte intro paragraaf...</p>
<h2>Sectie titel</h2>
<p>Korte tekst...</p>
<ul>
  <li>Belangrijk punt 1</li>
  <li>Belangrijk punt 2</li>
  <li>Belangrijk punt 3</li>
</ul>
<blockquote>💡 <strong>Pro tip:</strong> Belangrijke informatie of expert advies hier</blockquote>
<h3>Subsectie</h3>
<p>Meer details...</p>
<table>
  <tr><th>Aspect</th><th>Optie A</th><th>Optie B</th></tr>
  <tr><td>Prijs</td><td>€99</td><td>€149</td></tr>
  <tr><td>Rating</td><td>⭐⭐⭐⭐</td><td>⭐⭐⭐⭐⭐</td></tr>
</table>`;
}

/**
 * Generate meta title from article title
 */
function generateMetaTitle(title: string, keywords: string[]): string {
  let metaTitle = title;
  if (metaTitle.length > 60) {
    metaTitle = metaTitle.substring(0, 57) + '...';
  }
  return metaTitle;
}

/**
 * Generate meta description from HTML content
 */
function generateMetaDescription(html: string, keywords: string[]): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 160) {
    return text.substring(0, 157) + '...';
  }
  return text;
}

/**
 * Generate excerpt from HTML content
 */
function generateExcerpt(html: string): string {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 300) {
    return text.substring(0, 297) + '...';
  }
  return text;
}



/**
 * Generate a complete article with SEO optimization
 * Now returns pure HTML instead of JSON to avoid truncation issues
 */
export async function writeArticle(
  options: ArticleWriteOptions
): Promise<ArticleResult> {
  const { title, keywords, targetWordCount, tone = 'professional', language = 'nl' } = options;
  
  console.log(`[Article Writer] Writing article: ${title}`);
  
  // Build comprehensive context from SERP analysis
  let serpContext = '';
  let lsiKeywords: string[] = [];
  let paaQuestions: string[] = [];
  
  if (options.serpAnalysis) {
    lsiKeywords = options.serpAnalysis.lsiKeywords || [];
    paaQuestions = options.serpAnalysis.paaQuestions || [];
    
    serpContext = `
═══════════════════════════════════════════════════════
📊 SERP ANALYSE RESULTATEN
═══════════════════════════════════════════════════════

📈 Target Woordenaantal: ${targetWordCount} woorden (gebaseerd op top 10 concurrentie analyse)
   - Concurrenten gemiddeld: ${options.serpAnalysis.averageWordCount || 1500} woorden
   - Jouw target: +20% = ${targetWordCount} woorden

🎯 Top H2/H3 Headings van Concurrenten:
${(options.serpAnalysis.commonHeadings || []).map(h => `   • ${h}`).join('\n')}

📝 Topics die Concurrenten Behandelen:
${(options.serpAnalysis.topicsCovered || []).map(t => `   • ${t}`).join('\n')}

🔍 LSI Keywords (integreer NATUURLIJK):
${lsiKeywords.slice(0, 20).map(k => `   • ${k}`).join('\n')}

❓ People Also Ask Vragen (voor FAQ sectie):
${paaQuestions.slice(0, 8).map(q => `   • ${q}`).join('\n')}

💡 Content Gaps (kansen om beter te zijn):
${(options.serpAnalysis.contentGaps || []).map(g => `   • ${g}`).join('\n')}
`;
  }

  const userPrompt = `Schrijf een uitgebreid SEO-geoptimaliseerd artikel over: "${title}"

═══════════════════════════════════════════════════════
🎯 ARTIKEL OPDRACHT
═══════════════════════════════════════════════════════

TITEL (H1): ${title}
FOCUS KEYWORD: ${keywords[0] || title}
EXTRA KEYWORDS: ${keywords.slice(1).join(', ')}
TARGET: ${targetWordCount} woorden
TAAL: ${language.toUpperCase()}
TOON: ${tone}

${serpContext}

═══════════════════════════════════════════════════════
📋 SEO CONTENT MASTERPROMPT - VOLG DEZE WORKFLOW EXACT
═══════════════════════════════════════════════════════

⚠️ KRITIEKE REGEL: De H1 titel "${title}" mag NIET herhaald worden in de body content!

STAP 1: INTRO (100-150 woorden)
✅ Begin met een hook (vraag, statistiek, of pijnpunt)
✅ Benoem het probleem dat de lezer heeft
✅ Geef een voorproefje van de oplossing
✅ Gebruik focus keyword in eerste 100 woorden
❌ NIET: H1 titel herhalen als eerste zin of kop!
✅ Start direct met tekst (geen H2 in intro)

STAP 2: E-E-A-T OPTIMALISATIE (in elke sectie!)
Integreer deze elementen natuurlijk door het artikel:
• **Experience**: "In onze testen...", "Uit ervaring blijkt...", praktijkvoorbeelden
• **Expertise**: Technische details, insider tips, diepgaande uitleg
• **Authoritativeness**: Recente studies (2024-2025), statistieken, bronvermelding
• **Trustworthiness**: Feiten, balanced perspectief, actuele informatie

STAP 3: CONTENT STRUCTUUR
Gebruik deze H2/H3 structuur (gebaseerd op SERP analyse):

${options.serpAnalysis?.commonHeadings?.slice(0, 6).map((heading, idx) => `
<h2>${heading}</h2>
<p>[150-250 woorden met:]
- Beantwoord een PAA vraag relevant voor deze sectie
- Integreer 2-3 LSI keywords natuurlijk
- Voeg E-E-A-T element toe (ervaring/expertise)
- Voeg praktisch voorbeeld of tip toe
${options.internalLinks && idx < options.internalLinks.length && options.internalLinks[idx] ? `- Voeg interne link toe: <a href="${options.internalLinks[idx].url}">${options.internalLinks[idx].anchorText}</a>` : ''}
</p>

${idx < 3 ? `<h3>[Relevante subsectie]</h3>
<p>[100-150 woorden met concrete informatie]</p>` : ''}
`).join('\n') || ''}

STAP 4: LSI KEYWORDS INTEGRATIE
Verwerk deze LSI keywords NATUURLIJK door de tekst (1-2% keyword density):
${lsiKeywords.slice(0, 20).map(k => `• ${k}`).join('\n')}

⚠️ Integreer keywords organisch - geen keyword stuffing!

STAP 5: FAQ SECTIE (VERPLICHT)
<h2>Veelgestelde Vragen</h2>

${paaQuestions.slice(0, 6).map(q => `
<h3>${q}</h3>
<p>[40-60 woorden, geoptimaliseerd voor featured snippet. Begin direct met het antwoord.]</p>
`).join('\n')}

STAP 6: CONCLUSIE (100-150 woorden)
<h2>Conclusie</h2>
<p>[Samenvatting met:]
- Herhaal hoofdpunten in 3-5 bullet points
- Gebruik focus keyword nog een keer
- Eindig met CTA (call-to-action)
- Benadruk de waarde voor de lezer
</p>

═══════════════════════════════════════════════════════
✅ TECHNISCHE SEO CHECKLIST (VERIFIEER)
═══════════════════════════════════════════════════════

✅ Focus keyword in: H1, eerste 100 woorden, minimaal 1 H2, conclusie
✅ Keyword density: 1-2% (niet te veel!)
✅ 15-20 LSI keywords verspreid door tekst
${options.internalLinks ? '✅ 4-6 interne links met natuurlijke ankerteksten' : ''}
✅ Korte zinnen (max 20 woorden gemiddeld)
✅ Korte alinea's (3-4 regels)
✅ Minimaal ${Math.max(targetWordCount - 200, 1000)} woorden
✅ H1 NIET herhaald in body
✅ FAQ sectie met ${paaQuestions.length} PAA vragen

Schrijf nu het complete artikel in HTML formaat:`;

  try {
    const response = await sendChatCompletion({
      model: TEXT_MODELS.CLAUDE_45,
      messages: [
        { role: 'system', content: buildSystemPrompt(language) },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 12000, // Verhoogde limiet voor lange artikelen
      stream: false,
    });

    let html = (response as any).choices[0]?.message?.content || '';
    
    if (!html || html.length < 100) {
      throw new Error('Empty response from AI');
    }

    console.log(`[Article Writer] Received ${html.length} characters`);

    // Clean up any markdown artifacts
    html = cleanHtmlResponse(html);

    // Validate we have actual HTML
    if (!html.includes('<p>') && !html.includes('<h')) {
      throw new Error('Response does not contain valid HTML');
    }

    // Count words
    const wordCount = countWords(html);

    console.log(`[Article Writer] Success! Generated ${wordCount} words`);

    return {
      content: html,
      metaTitle: generateMetaTitle(title, keywords),
      metaDescription: generateMetaDescription(html, keywords),
      excerpt: generateExcerpt(html),
      suggestedImages: [],
      wordCount,
    };

  } catch (error: any) {
    console.error('[Article Writer] Error:', error.message);
    throw error; // Don't use fallback - let caller handle retry
  }
}

/**
 * Generate article with streaming support
 * Returns an async generator that yields content chunks
 */
export async function* writeArticleStream(
  options: ArticleWriteOptions
): AsyncGenerator<{ type: string; content: string }, void, unknown> {
  try {
    console.log(`[Article Writer] Writing article with streaming: ${options.title}`);
    console.log(`[Article Writer] Using Claude 4.5 Sonnet for streaming content generation`);
    
    const { title, keywords, targetWordCount, tone = 'professional', language = 'nl' } = options;
    
    // Build comprehensive context from SERP analysis
    yield { type: 'status', content: 'Analyzing SERP data...' };
    
    let serpContext = '';
    let lsiKeywords: string[] = [];
    let paaQuestions: string[] = [];
    
    if (options.serpAnalysis) {
      lsiKeywords = options.serpAnalysis.lsiKeywords || [];
      paaQuestions = options.serpAnalysis.paaQuestions || [];
      
      serpContext = `
═══════════════════════════════════════════════════════
📊 SERP ANALYSE RESULTATEN
═══════════════════════════════════════════════════════

📈 Target Woordenaantal: ${targetWordCount} woorden (gebaseerd op top 10 concurrentie analyse)
   - Concurrenten gemiddeld: ${options.serpAnalysis.averageWordCount || 1500} woorden
   - Jouw target: +20% = ${targetWordCount} woorden

🎯 Top H2/H3 Headings van Concurrenten:
${(options.serpAnalysis.commonHeadings || []).map(h => `   • ${h}`).join('\n')}

📝 Topics die Concurrenten Behandelen:
${(options.serpAnalysis.topicsCovered || []).map(t => `   • ${t}`).join('\n')}

🔍 LSI Keywords (integreer NATUURLIJK):
${lsiKeywords.slice(0, 20).map(k => `   • ${k}`).join('\n')}

❓ People Also Ask Vragen (voor FAQ sectie):
${paaQuestions.slice(0, 8).map(q => `   • ${q}`).join('\n')}

💡 Content Gaps (kansen om beter te zijn):
${(options.serpAnalysis.contentGaps || []).map(g => `   • ${g}`).join('\n')}
`;
    }

    // Create comprehensive SEO masterprompt for streaming
    yield { type: 'status', content: 'Generating article content...' };
    
    const prompt = `Je bent een expert SEO content writer die artikelen schrijft die HOOG ranken in Google.

═══════════════════════════════════════════════════════
🎯 ARTIKEL OPDRACHT
═══════════════════════════════════════════════════════

TITEL (H1): ${title}
FOCUS KEYWORD: ${keywords[0] || title}
EXTRA KEYWORDS: ${keywords.slice(1).join(', ')}
TARGET: ${targetWordCount} woorden
TAAL: ${language.toUpperCase()}
TOON: ${tone}

${serpContext}

═══════════════════════════════════════════════════════
📋 SEO CONTENT MASTERPROMPT - VOLG DEZE WORKFLOW EXACT
═══════════════════════════════════════════════════════

⚠️ KRITIEKE REGEL: De H1 titel "${title}" mag NIET herhaald worden in de body content!

STAP 1: INTRO (100-150 woorden)
✅ Begin met een hook (vraag, statistiek, of pijnpunt)
✅ Benoem het probleem dat de lezer heeft
✅ Geef een voorproefje van de oplossing
✅ Gebruik focus keyword in eerste 100 woorden
❌ NIET: H1 titel herhalen als eerste zin of kop!
✅ Start direct met tekst (geen H2 in intro)

STAP 2: E-E-A-T OPTIMALISATIE (in elke sectie!)
Integreer deze elementen natuurlijk door het artikel:
• **Experience**: "In onze testen...", "Uit ervaring blijkt...", praktijkvoorbeelden
• **Expertise**: Technische details, insider tips, diepgaande uitleg
• **Authoritativeness**: Recente studies (2024-2025), statistieken, bronvermelding
• **Trustworthiness**: Feiten, balanced perspectief, actuele informatie

STAP 3: CONTENT STRUCTUUR
Gebruik deze H2/H3 structuur (gebaseerd op SERP analyse):

${options.serpAnalysis?.commonHeadings?.slice(0, 6).map((heading, idx) => `
<h2>${heading}</h2>
<p>[150-250 woorden met:]
- Beantwoord een PAA vraag relevant voor deze sectie
- Integreer 2-3 LSI keywords natuurlijk
- Voeg E-E-A-T element toe (ervaring/expertise)
- Voeg praktisch voorbeeld of tip toe
${options.internalLinks && idx < options.internalLinks.length && options.internalLinks[idx] ? `- Voeg interne link toe: <a href="${options.internalLinks[idx].url}">${options.internalLinks[idx].anchorText}</a>` : ''}
</p>

${idx < 3 ? `<h3>[Relevante subsectie]</h3>
<p>[100-150 woorden met concrete informatie]</p>` : ''}
`).join('\n') || ''}

STAP 4: LSI KEYWORDS INTEGRATIE
Verwerk deze LSI keywords NATUURLIJK door de tekst (1-2% keyword density):
${lsiKeywords.slice(0, 20).map(k => `• ${k}`).join('\n')}

⚠️ Integreer keywords organisch - geen keyword stuffing!

STAP 5: FAQ SECTIE (VERPLICHT)
<h2>Veelgestelde Vragen</h2>

${paaQuestions.slice(0, 6).map(q => `
<h3>${q}</h3>
<p>[40-60 woorden, geoptimaliseerd voor featured snippet. Begin direct met het antwoord.]</p>
`).join('\n')}

STAP 6: CONCLUSIE (100-150 woorden)
<h2>Conclusie</h2>
<p>[Samenvatting met:]
- Herhaal hoofdpunten in 3-5 bullet points
- Gebruik focus keyword nog een keer
- Eindig met CTA (call-to-action)
- Benadruk de waarde voor de lezer
</p>

═══════════════════════════════════════════════════════
✅ TECHNISCHE SEO CHECKLIST (VERIFIEER)
═══════════════════════════════════════════════════════

✅ Focus keyword in: H1, eerste 100 woorden, minimaal 1 H2, conclusie
✅ Keyword density: 1-2% (niet te veel!)
✅ 15-20 LSI keywords verspreid door tekst
${options.internalLinks ? '✅ 4-6 interne links met natuurlijke ankerteksten' : ''}
✅ Korte zinnen (max 20 woorden gemiddeld)
✅ Korte alinea's (3-4 regels)
✅ Minimaal ${Math.max(targetWordCount - 200, 1000)} woorden
✅ H1 NIET herhaald in body
✅ FAQ sectie met ${paaQuestions.length} PAA vragen

Schrijf nu het complete artikel in HTML formaat:`;

    // Stream response from AIML API
    const stream = await sendStreamingChatCompletion({
      model: TEXT_MODELS.CLAUDE_45, // Use Claude 4.5 Sonnet for best content quality
      messages: [
        { role: 'system', content: buildSystemPrompt(language) },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 12000, // Verhoogde limiet voor lange artikelen
      stream: true,
    });

    // Stream chunks to client
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        yield { type: 'content', content };
      }
    }

    // Parse the complete response
    yield { type: 'status', content: 'Processing article...' };
    
    // Clean HTML response
    let html = cleanHtmlResponse(fullResponse);
    
    // Validate we have actual HTML
    if (!html.includes('<p>') && !html.includes('<h')) {
      throw new Error('Response does not contain valid HTML');
    }
    
    // Count words in content
    const wordCount = countWords(html);

    // Yield final result
    yield { 
      type: 'complete', 
      content: JSON.stringify({
        content: html,
        metaTitle: generateMetaTitle(title, keywords),
        metaDescription: generateMetaDescription(html, keywords),
        excerpt: generateExcerpt(html),
        suggestedImages: [],
        wordCount,
      })
    };

  } catch (error: any) {
    console.error('[Article Writer Stream] Error:', error);
    
    // Create user-friendly Dutch error message
    let userMessage = 'Het schrijven van het artikel is mislukt';
    
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      userMessage = 'Het artikel schrijven duurde te lang. Probeer een kortere tekst of minder features.';
    } else if (error.message.includes('API') || error.message.includes('model')) {
      userMessage = 'De AI service is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
    } else if (error.message.includes('parse') || error.message.includes('JSON')) {
      userMessage = 'De AI response kon niet worden verwerkt. Probeer het opnieuw.';
    }
    
    yield { type: 'error', content: userMessage };
    throw new Error(userMessage);
  }
}

/**
 * Clean simple JSON responses (for FAQ generation)
 */
function cleanSimpleJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned
    .replace(/^```json?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '')
    .trim();
  
  // Find first { and last } - extract JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

/**
 * Generate FAQ section for an article
 * Used as fallback when article writer doesn't generate FAQ
 */
export async function generateFAQ(
  title: string,
  language: string = 'nl'
): Promise<Array<{ question: string; answer: string }>> {
  try {
    console.log(`[Article Writer] Generating FAQ section for: ${title}`);
    
    const prompt = `Generate a FAQ section with 5-6 commonly asked questions about "${title}".

Return ONLY valid JSON in this exact format (no markdown code blocks):
{
  "faqs": [
    {
      "question": "Question text here",
      "answer": "Detailed answer here (40-60 words, optimized for featured snippets)"
    }
  ]
}

Language: ${language.toUpperCase()}
Make the questions natural and conversational, as if users are actually asking them.
Answers should be concise, informative, and start directly with the answer (no "yes/no" first).`;

    const response = await sendChatCompletion({
      model: TEXT_MODELS.CLAUDE_45,
      messages: [
        { role: 'system', content: `You are an expert FAQ generator. Return ONLY valid JSON with no markdown code blocks.` },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    });

    const rawContent = (response as any).choices[0]?.message?.content || '{}';
    
    // Clean and parse JSON response
    const cleanedContent = cleanSimpleJsonResponse(rawContent);
    
    try {
      const result = JSON.parse(cleanedContent);
      return result.faqs || [];
    } catch (parseError) {
      console.error('[Article Writer] FAQ JSON parsing failed:', parseError);
      console.error('[Article Writer] FAQ raw content preview:', rawContent.substring(0, 500));
      
      // Return default FAQ if parsing fails
      return [
        {
          question: `Wat is ${title}?`,
          answer: `${title} is een belangrijk onderwerp dat verschillende aspecten behandelt. Voor meer informatie, lees het volledige artikel hierboven.`,
        },
      ];
    }
  } catch (error: any) {
    console.error('[Article Writer] FAQ generation error:', error);
    
    // Return default FAQ on error
    return [
      {
        question: `Wat is ${title}?`,
        answer: `${title} is een belangrijk onderwerp. Voor meer informatie, lees het volledige artikel hierboven.`,
      },
    ];
  }
}