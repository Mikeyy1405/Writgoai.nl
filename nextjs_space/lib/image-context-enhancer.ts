/**
 * Image Context Enhancer
 * Extracts rich contextual information from blog content to generate highly relevant image prompts
 */

import { chatCompletion, selectOptimalModelForTask } from './aiml-api';

/**
 * Safely extract text from HTML for use in AI prompts only
 * This is NOT for rendering HTML - it's for semantic text extraction
 * Multiple sanitization steps ensure no HTML/script content remains
 * 
 * SECURITY NOTE: This function is used ONLY to extract plain text for AI prompt generation.
 * The output is never rendered as HTML or inserted into the DOM.
 * It is sent directly to AI image generation APIs which expect plain text descriptions.
 */
function safeExtractTextForPrompt(htmlString: string): string {
  let text = htmlString;
  
  // Step 1: Remove script-like content patterns FIRST (before tag removal)
  // This prevents any script content from being preserved
  text = text.replace(/script|onclick|onerror|onload|javascript:/gi, '');
  
  // Step 2: Remove all HTML tags (including any that contain the above patterns)
  text = text.replace(/<[^>]*>/g, '');
  
  // Step 3: Remove any remaining angle brackets, quotes, and ampersands
  // This ensures no HTML entity or tag fragments remain
  text = text.replace(/[<>'"&]/g, '');
  
  // Step 4: Normalize whitespace for clean AI prompt text
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
}

export interface ImageContextExtractionResult {
  heading: string | null;
  paragraphs: string[];
  fullContext: string;
  contextualPrompt: string;
}

/**
 * Extract enhanced context around an image placeholder
 * This provides richer semantic understanding of what the image should depict
 */
export function extractEnhancedImageContext(
  content: string,
  placeholderIndex: number,
  options: {
    contextWindowBefore?: number;
    contextWindowAfter?: number;
    maxParagraphs?: number;
  } = {}
): ImageContextExtractionResult {
  const {
    contextWindowBefore = 1200, // Increased from 500 to capture more context
    contextWindowAfter = 800,   // Increased from 300 to capture more content
    maxParagraphs = 3,          // Extract up to 3 paragraphs for better understanding
  } = options;

  // Extract context windows
  const contextBefore = content.substring(
    Math.max(0, placeholderIndex - contextWindowBefore),
    placeholderIndex
  );
  const contextAfter = content.substring(
    placeholderIndex,
    Math.min(content.length, placeholderIndex + contextWindowAfter)
  );

  // Extract the most recent heading (h1, h2, or h3) from BEFORE the image
  // NOTE: This extraction is ONLY used to generate AI image prompts, never rendered as HTML
  // The text is extracted for semantic understanding, not for display
  const headingMatches = contextBefore.match(/<h[1-3][^>]*>([^<]+)<\/h[1-3]>/gi);
  const heading = headingMatches && headingMatches.length > 0
    ? safeExtractTextForPrompt(headingMatches[headingMatches.length - 1])
    : null;

  // Extract multiple paragraphs from BEFORE the image (the content leading up to it)
  // This gives us the context about what the image should illustrate
  // NOTE: This extraction is ONLY used to generate AI image prompts, never rendered as HTML
  const paragraphMatchesBefore = contextBefore.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  
  // Take the LAST few paragraphs before the image (most relevant context)
  const paragraphsBefore = paragraphMatchesBefore
    .slice(-maxParagraphs) // Get last N paragraphs
    .map(p => safeExtractTextForPrompt(p))
    .filter(p => p.length > 20); // Filter out very short paragraphs

  // Also extract paragraphs AFTER the image as additional context
  const paragraphMatchesAfter = contextAfter.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const paragraphsAfter = paragraphMatchesAfter
    .slice(0, 1) // Get first paragraph after
    .map(p => safeExtractTextForPrompt(p))
    .filter(p => p.length > 20);

  // Combine: prioritize paragraphs before (the context), optionally add one after
  const paragraphs = [...paragraphsBefore, ...paragraphsAfter].slice(0, maxParagraphs);

  // Build full context string
  const fullContext = [
    heading ? `Section: ${heading}` : '',
    paragraphs.length > 0 ? `Content: ${paragraphs.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  // Create a contextual prompt by combining heading and first paragraph
  let contextualPrompt = '';
  if (heading && paragraphs.length > 0) {
    // Best case: heading + paragraph content (limited to 250 chars for prompt efficiency)
    const firstParagraph = paragraphs[0].substring(0, 250);
    contextualPrompt = `${heading}. ${firstParagraph}`;
  } else if (heading) {
    contextualPrompt = heading;
  } else if (paragraphs.length > 0) {
    contextualPrompt = paragraphs[0].substring(0, 250);
  }

  return {
    heading,
    paragraphs,
    fullContext,
    contextualPrompt,
  };
}

/**
 * Use AI to generate a highly specific image prompt based on the extracted context
 * This creates prompts that are semantically relevant to the content section
 */
export async function generateContextualImagePrompt(
  context: ImageContextExtractionResult,
  stylePrompt: string,
  mainTopic: string
): Promise<string> {
  // If context is too minimal, return a simple prompt
  if (!context.heading && context.paragraphs.length === 0) {
    return `${mainTopic}, ${stylePrompt}`;
  }

  try {
    // Use AI to understand the context and create a specific image prompt
    const model = selectOptimalModelForTask('content_analysis', 'simple', 'speed');
    
    const systemPrompt = `You are an expert at creating specific, relevant image prompts for blog articles.
Analyze the content section and create a detailed image prompt that visually represents the key concepts discussed.
Focus on concrete, visual elements that would help illustrate the text.
Return ONLY the image prompt text, no explanations.`;

    const userPrompt = `Main article topic: ${mainTopic}

Section heading: ${context.heading || 'N/A'}

Section content:
${context.paragraphs.slice(0, 2).join('\n\n')}

Create a specific image prompt (max 100 words) that would perfectly illustrate this section.
Include:
- The main visual subject that represents this content
- Specific details mentioned in the text
- The setting or environment
Style requirement: ${stylePrompt}

Image prompt:`;

    const response = await chatCompletion({
      model: model.primary.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const aiGeneratedPrompt = response.choices?.[0]?.message?.content?.trim() || '';
    
    if (aiGeneratedPrompt && aiGeneratedPrompt.length > 10) {
      return aiGeneratedPrompt;
    }

    // Fallback to contextual prompt if AI fails
    return `${context.contextualPrompt}, ${stylePrompt}`;
  } catch (error) {
    console.error('[Image Context Enhancer] Error generating AI prompt:', error);
    // Fallback to contextual prompt
    return `${context.contextualPrompt}, ${stylePrompt}`;
  }
}

/**
 * Quick version: Extract context and generate prompt in one call (without AI enhancement)
 * This is faster and more cost-effective for high-volume scenarios
 */
export function generateSimpleContextualPrompt(
  content: string,
  placeholderIndex: number,
  stylePrompt: string,
  mainTopic: string
): string {
  const context = extractEnhancedImageContext(content, placeholderIndex);
  
  if (!context.heading && context.paragraphs.length === 0) {
    return `${mainTopic}, ${stylePrompt}`;
  }

  return `${context.contextualPrompt}, ${stylePrompt}. Detailed, specific image matching the exact content context.`;
}
