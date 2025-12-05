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
 * Clean AI response by removing markdown code blocks
 * Handles various formats: ```json\n...\n``` or ```\n...\n``` or ```json ... ```
 */
function cleanJsonResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks with regex - handles various formats
  // Matches ```json...``` or ```...``` with optional whitespace and newlines
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
  
  // Remove any leading text before the first opening brace
  cleaned = cleaned.replace(/^[^{]*/, '');
  
  // Try to extract JSON object if still wrapped in other content
  // Use greedy match to get the outermost JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

/**
 * Attempt to repair incomplete JSON by closing unclosed structures
 * Handles truncated responses from AI models
 */
function repairIncompleteJson(content: string): string {
  let repaired = content.trim();
  
  // Count opening and closing braces/brackets/quotes
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let lastChar = '';
  let stringChar = '';
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    const prevChar = i > 0 ? repaired[i - 1] : '';
    
    // Track string state (ignore escaped quotes)
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    // Count braces and brackets when not in string
    if (!inString) {
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
    
    lastChar = char;
  }
  
  // If we're in an unclosed string, close it
  if (inString) {
    repaired += stringChar;
  }
  
  // Remove any trailing incomplete value after the last complete field
  // This handles cases like: {"field": "value", "incomplete": "trun
  if (repaired.trim().match(/,\s*"[^"]*":\s*"[^"]*$/)) {
    // Find the last complete field
    const lastCommaIndex = repaired.lastIndexOf(',');
    if (lastCommaIndex > 0) {
      repaired = repaired.substring(0, lastCommaIndex);
    }
  }
  
  // Close any unclosed arrays
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  
  // Close any unclosed objects
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }
  
  return repaired;
}

/**
 * Generate a complete article with SEO optimization
 * Implements comprehensive SEO masterprompt with E-E-A-T optimization
 */
export async function writeArticle(
  options: ArticleWriteOptions
): Promise<ArticleResult> {
  try {
    console.log(`[Article Writer] Writing article: ${options.title}`);
    console.log(`[Article Writer] Using Claude 4.5 Sonnet for content generation`);
    
    const { title, keywords, targetWordCount, tone = 'professional', language = 'nl' } = options;
    
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

    // Create comprehensive SEO masterprompt
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

═══════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks. The response must be a valid JSON object:
{
  "content": "Full article content in HTML",
  "metaTitle": "SEO-optimized meta title (max 60 chars)",
  "metaDescription": "SEO-optimized meta description (max 160 chars)",
  "excerpt": "Short excerpt (150 words)",
  ${options.includeFAQ ? '"faqSection": [{"question": "...", "answer": "..."}], ' : ''}
  "suggestedImages": ["Image description 1", "Image description 2"]
}`;

    const response = await sendChatCompletion({
      model: TEXT_MODELS.CLAUDE_45, // Use Claude 4.5 Sonnet for best content quality
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer who creates engaging, well-researched articles in ${language.toUpperCase()}. 

CRITICAL: Your response must be ONLY a valid JSON object. 
- Do NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include any text before or after the JSON
- Start your response with { and end with }
- Ensure all strings are properly escaped
- Keep the response within token limits by being concise in content while maintaining quality`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(targetWordCount * TOKEN_MULTIPLIER, MAX_TOKENS_LIMIT - 500), // Leave buffer for JSON structure
      stream: false,
    });

    const rawContent = (response as any).choices[0]?.message?.content || '{}';
    
    // Parse JSON response - handle markdown code blocks and incomplete responses
    let result;
    let parseAttempts = 0;
    const maxParseAttempts = 3;

    while (parseAttempts < maxParseAttempts) {
      parseAttempts++;
      try {
        let cleanedContent = cleanJsonResponse(rawContent);
        console.log('[Article Writer] Cleaned JSON length:', cleanedContent.length);
        
        try {
          result = JSON.parse(cleanedContent);
          break; // Success
        } catch (firstParseError) {
          // Try to repair incomplete JSON
          console.log('[Article Writer] First parse failed, attempting repair...');
          const repairedContent = repairIncompleteJson(cleanedContent);
          result = JSON.parse(repairedContent);
          console.log('[Article Writer] JSON repair successful');
          break;
        }
      } catch (e) {
        console.error(`[Article Writer] Parse attempt ${parseAttempts} failed:`, e);
        if (parseAttempts >= maxParseAttempts) {
          console.error('[Article Writer] Raw content preview:', rawContent.substring(0, 1000));
          
          // Create fallback response
          result = {
            content: `<p>Er is een fout opgetreden bij het genereren van dit artikel. Probeer het opnieuw.</p>`,
            metaTitle: title.substring(0, 60),
            metaDescription: `Lees meer over ${keywords[0] || title}`.substring(0, 160),
            excerpt: `Artikel over ${title}`,
            suggestedImages: [],
          };
          console.log('[Article Writer] Using fallback response');
        }
      }
    }

    // Count words in content
    const wordCount = result.content
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    return {
      ...result,
      wordCount,
    };
  } catch (error: any) {
    console.error('[Article Writer] Error:', error);
    
    // Create user-friendly Dutch error message
    let userMessage = 'Het schrijven van het artikel is mislukt';
    
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      userMessage = 'Het artikel schrijven duurde te lang. Probeer een kortere tekst of minder features.';
    } else if (error.message.includes('API') || error.message.includes('model')) {
      userMessage = 'De AI service is tijdelijk niet beschikbaar. Probeer het later opnieuw.';
    } else if (error.message.includes('parse') || error.message.includes('JSON')) {
      userMessage = 'De AI response kon niet worden verwerkt. Probeer het opnieuw.';
    }
    
    throw new Error(userMessage);
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

═══════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks. The response must be a valid JSON object:
{
  "content": "Full article content in HTML",
  "metaTitle": "SEO-optimized meta title (max 60 chars)",
  "metaDescription": "SEO-optimized meta description (max 160 chars)",
  "excerpt": "Short excerpt (150 words)",
  ${options.includeFAQ ? '"faqSection": [{"question": "...", "answer": "..."}], ' : ''}
  "suggestedImages": ["Image description 1", "Image description 2"]
}`;

    // Stream response from AIML API
    const stream = await sendStreamingChatCompletion({
      model: TEXT_MODELS.CLAUDE_45, // Use Claude 4.5 Sonnet for best content quality
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer who creates engaging, well-researched articles in ${language.toUpperCase()}. 

CRITICAL: Your response must be ONLY a valid JSON object. 
- Do NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include any text before or after the JSON
- Start your response with { and end with }
- Ensure all strings are properly escaped
- Keep the response within token limits by being concise in content while maintaining quality`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(targetWordCount * TOKEN_MULTIPLIER, MAX_TOKENS_LIMIT - 500), // Leave buffer for JSON structure
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
    
    let result;
    let parseAttempts = 0;
    const maxParseAttempts = 3;

    while (parseAttempts < maxParseAttempts) {
      parseAttempts++;
      try {
        let cleanedContent = cleanJsonResponse(fullResponse);
        console.log('[Article Writer Stream] Cleaned JSON length:', cleanedContent.length);
        
        try {
          result = JSON.parse(cleanedContent);
          break; // Success
        } catch (firstParseError) {
          // Try to repair incomplete JSON
          console.log('[Article Writer Stream] First parse failed, attempting repair...');
          const repairedContent = repairIncompleteJson(cleanedContent);
          result = JSON.parse(repairedContent);
          console.log('[Article Writer Stream] JSON repair successful');
          break;
        }
      } catch (e) {
        console.error(`[Article Writer Stream] Parse attempt ${parseAttempts} failed:`, e);
        if (parseAttempts >= maxParseAttempts) {
          console.error('[Article Writer Stream] Raw content preview:', fullResponse.substring(0, 1000));
          
          // Create fallback response
          result = {
            content: `<p>Er is een fout opgetreden bij het genereren van dit artikel. Probeer het opnieuw.</p>`,
            metaTitle: title.substring(0, 60),
            metaDescription: `Lees meer over ${keywords[0] || title}`.substring(0, 160),
            excerpt: `Artikel over ${title}`,
            suggestedImages: [],
          };
          console.log('[Article Writer Stream] Using fallback response');
        }
      }
    }

    // Count words in content
    const wordCount = result.content
      .replace(/<[^>]*>/g, ' ')
      .split(/\s+/)
      .filter((word: string) => word.length > 0).length;

    // Yield final result
    yield { 
      type: 'complete', 
      content: JSON.stringify({
        ...result,
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
        {
          role: 'system',
          content: `You are an expert at creating helpful FAQ sections in ${language.toUpperCase()}. 

CRITICAL: Your response must be ONLY a valid JSON object. 
- Do NOT wrap the JSON in markdown code blocks (no \`\`\`json or \`\`\`)
- Do NOT include any text before or after the JSON
- Start your response with { and end with }
- Ensure all strings are properly escaped`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    });

    const rawContent = (response as any).choices[0]?.message?.content || '{}';
    
    // Parse JSON response with retry and repair logic
    let result;
    let parseAttempts = 0;
    const maxParseAttempts = 3;

    while (parseAttempts < maxParseAttempts) {
      parseAttempts++;
      try {
        let cleanedContent = cleanJsonResponse(rawContent);
        
        try {
          result = JSON.parse(cleanedContent);
          break; // Success
        } catch (firstParseError) {
          // Try to repair incomplete JSON
          console.log('[Article Writer] FAQ first parse failed, attempting repair...');
          const repairedContent = repairIncompleteJson(cleanedContent);
          result = JSON.parse(repairedContent);
          console.log('[Article Writer] FAQ JSON repair successful');
          break;
        }
      } catch (e) {
        console.error(`[Article Writer] FAQ parse attempt ${parseAttempts} failed:`, e);
        if (parseAttempts >= maxParseAttempts) {
          console.error('[Article Writer] FAQ raw content preview:', rawContent.substring(0, 500));
          
          // Return default FAQ if parsing fails
          return [
            {
              question: `Wat is ${title}?`,
              answer: `${title} is een belangrijk onderwerp dat verschillende aspecten behandelt. Voor meer informatie, lees het volledige artikel hierboven.`,
            },
          ];
        }
      }
    }

    return result.faqs || [];
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