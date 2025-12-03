/**
 * Article Writer for Content Hub
 * Generates SEO-optimized articles with streaming support
 */

import { sendChatCompletion, streamChatCompletion } from '../aiml-chat-client';
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
 * Generate a complete article with SEO optimization
 */
export async function writeArticle(
  options: ArticleWriteOptions
): Promise<ArticleResult> {
  try {
    console.log(`[Article Writer] Writing article: ${options.title}`);
    
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

Respond in JSON format:
{
  "content": "Full article content in HTML",
  "metaTitle": "SEO-optimized meta title (max 60 chars)",
  "metaDescription": "SEO-optimized meta description (max 160 chars)",
  "excerpt": "Short excerpt (150 words)",
  ${options.includeFAQ ? '"faqSection": [{"question": "...", "answer": "..."}],' : ''}
  "suggestedImages": ["Image description 1", "Image description 2"]
}`;

    const response = await sendChatCompletion({
      model: TEXT_MODELS.SMART,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer who creates engaging, well-researched articles in ${language.toUpperCase()}.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(targetWordCount * 2, 8000),
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error('[Article Writer] Failed to parse JSON:', e);
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
    throw new Error(`Article writing failed: ${error.message}`);
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
    
    const outlinePrompt = `Create a detailed outline for an article titled "${title}" in ${language.toUpperCase()}.
Keywords: ${keywords.join(', ')}
Target: ${targetWordCount} words

Provide 6-10 main sections with H2 headings. Include subheadings (H3) where appropriate.

Respond with just the outline in markdown format.`;

    const outlineResponse = await sendChatCompletion({
      model: TEXT_MODELS.FAST,
      messages: [{ role: 'user', content: outlinePrompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const outline = outlineResponse.choices[0]?.message?.content || '';
    yield { type: 'outline', content: outline };

    // Generate full content
    yield { type: 'status', content: 'Writing article content...' };
    
    const contentPrompt = `Write a complete article based on this outline:

${outline}

Requirements:
- Write in ${language.toUpperCase()}
- Target ${targetWordCount} words
- Use ${tone} tone
- Include keywords: ${keywords.join(', ')}
- Write engaging, SEO-optimized content
- Use HTML formatting

Write the full article:`;

    // Stream the article content
    const stream = await streamChatCompletion({
      model: TEXT_MODELS.SMART,
      messages: [
        {
          role: 'system',
          content: `You are an expert SEO content writer in ${language.toUpperCase()}.`,
        },
        {
          role: 'user',
          content: contentPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.min(targetWordCount * 2, 8000),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { type: 'content', content: delta };
      }
    }

    yield { type: 'status', content: 'Article completed!' };
  } catch (error: any) {
    console.error('[Article Writer] Streaming error:', error);
    throw new Error(`Article streaming failed: ${error.message}`);
  }
}

/**
 * Generate FAQ section for an article
 */
export async function generateFAQ(
  topic: string,
  language: string = 'nl'
): Promise<Array<{ question: string; answer: string }>> {
  try {
    const prompt = `Generate 6-8 frequently asked questions and detailed answers for the topic: "${topic}" in ${language.toUpperCase()}.

Respond in JSON format:
{
  "faqs": [
    {"question": "...", "answer": "..."}
  ]
}`;

    const response = await sendChatCompletion({
      model: TEXT_MODELS.FAST,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                     content.match(/```\n([\s\S]*?)\n```/) ||
                     [null, content];
    const result = JSON.parse(jsonMatch[1] || content);
    
    return result.faqs || [];
  } catch (error) {
    console.error('[Article Writer] FAQ generation error:', error);
    return [];
  }
}
