/**
 * Utility functions for content processing and cleaning
 */

/**
 * Strip markdown code blocks from content
 * Handles both opening and closing markers like ```html, ```javascript, etc.
 * 
 * @param text - The text containing markdown code blocks
 * @returns Cleaned text without markdown code block markers
 */
export function stripMarkdownCodeBlocks(text: string): string {
  // Remove markdown code block markers (both opening and closing)
  // First remove full code blocks with content, then any remaining markers
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')
    .replace(/```[\w]*\n?/g, '')
    .trim();
}

/**
 * Convert HTML to plain text using DOMParser
 * Safe for AI-generated content
 * 
 * @param html - HTML string to convert
 * @returns Plain text without HTML tags
 */
export function htmlToPlainText(html: string): string {
  // Use DOMParser for safer HTML parsing
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}
