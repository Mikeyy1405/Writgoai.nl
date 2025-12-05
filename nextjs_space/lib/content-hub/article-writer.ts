/**
 * Article Writer for Content Hub
 * Generates SEO-optimized articles with streaming support
 */

import { sendChatCompletion, sendStreamingChatCompletion } from '../aiml-chat-client';
import { TEXT_MODELS } from '../aiml-api';
import type { SERPAnalysis } from './serp-analyzer';

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
  
  // Remove markdown code blocks (various formats)
  cleaned = cleaned
    .replace(/^```json\s*/i, '')  // Remove opening ```json
    .replace(/^```\s*/i, '')       // Remove opening ```
    .replace(/\s*```$/i, '')       // Remove closing ```
    .trim();
  
  // Try to extract JSON object if still wrapped in other content
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  
  return cleaned;
}

/**
 * Generate a complete article with SEO optimization
 */
export async function writeArticle(
  options: ArticleWriteOptions
): Promise<ArticleResult> {
  try {
    console.log(`[Article Writer] Writing article: ${options.title}`);
    console.log(`[Article Writer] Using Claude 4.5 Sonnet for content generation`);
    
    const { title, keywords, targetWordCount, tone = 'professional', language = 'nl' } = options;
    
    // Build context from SERP analysis if available
    let contextInfo = '';
    if (options.serpAnalysis) {
      contextInfo = `
SERP Analysis Context:
- Average competitor word count: ${options.serpAnalysis.averageWordCount}
- Common topics: ${options.serpAnalysis.topicsCovered.join(', ')}
- Questions to address: ${options.serpAnalysis.questionsFound.join(', ')}
- Content gaps to fill: ${options.serpAnalysis.contentGaps.join(', ')}
`;
    }

    // Create comprehensive prompt
    const prompt = `Write a comprehensive, SEO-optimized article in ${language.toUpperCase()}.

Title: ${title}
Target Keywords: ${keywords.join(', ')}
Target Word Count: ${targetWordCount} words
Tone: ${tone}

${contextInfo}

Requirements:
1. Write engaging, high-quality content that provides real value
2. Use the target keywords naturally throughout the text
3. Include relevant subheadings (H2, H3)
4. Add practical examples and actionable advice
5. Ensure proper SEO structure
${options.includeFAQ ? '6. Include an FAQ section at the end with 5-8 common questions' : ''}
${options.includeYouTube ? '7. Suggest relevant YouTube video topics to embed' : ''}

${options.internalLinks && options.internalLinks.length > 0 ? `
Internal Links to Include:
${options.internalLinks.map(link => `- ${link.anchorText}: ${link.url}`).join('\n')}
` : ''}

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
      model: TEXT_MODELS.CLAUDE_45, // Use Claude 4.5 Sonnet for content writing
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer who creates engaging, well-researched articles in ${language.toUpperCase()}. Always respond with valid JSON only, never wrap in markdown code blocks.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(targetWordCount * 2, 8000),
      stream: false,
    });

    const rawContent = (response as any).choices[0]?.message?.content || '{}';
    
    // Parse JSON response - handle markdown code blocks
    let result;
    try {
      const cleanedContent = cleanJsonResponse(rawContent);
      console.log('[Article Writer] Cleaned JSON length:', cleanedContent.length);
      result = JSON.parse(cleanedContent);
    } catch (e) {
      console.error('[Article Writer] Failed to parse JSON:', e);
      console.error('[Article Writer] Raw content preview:', rawContent.substring(0, 500));
      throw new Error('Failed to parse article generation response');
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
    
    const { title, keywords, targetWordCount, tone = 'professional', language = 'nl' } = options;
    
    // First, generate outline
    yield { type: 'status', content: 'Generating article outline...' };
    
    const outlinePrompt = `Create a detailed outline for an article titled \