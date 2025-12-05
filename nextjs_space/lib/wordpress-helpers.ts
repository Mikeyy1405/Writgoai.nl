/**
 * WordPress Helper Functions
 * Utility functions for WordPress post management
 */

/**
 * Count words in HTML content
 * Removes HTML tags and counts words accurately
 */
export function countWords(htmlContent: string): number {
  if (!htmlContent) return 0;
  
  // Remove HTML tags
  const plainText = htmlContent.replace(/<[^>]*>/g, ' ').trim();
  
  // Split by whitespace and filter empty strings
  const words = plainText.split(/\s+/).filter(word => word.length > 0);
  
  return words.length;
}

/**
 * Build WordPress admin edit URL for a post
 * @param wordpressUrl - The base WordPress site URL
 * @param postId - The numeric post ID
 */
export function getWordPressEditUrl(wordpressUrl: string, postId: number): string {
  const baseUrl = wordpressUrl.replace(/\/$/, '');
  return `${baseUrl}/wp-admin/post.php?post=${postId}&action=edit`;
}

/**
 * Sanitize HTML to plain text
 * Removes HTML tags safely with multiple passes
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  let text = html;
  let prevText = '';
  
  // Remove HTML tags in multiple passes to handle nested tags
  while (text !== prevText && text.includes('<')) {
    prevText = text;
    text = text.replace(/<[^>]*>/g, '');
  }
  
  // Decode common HTML entities
  text = text.replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#039;/g, "'")
             .replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&');  // Do &amp; last to prevent double-decoding
  
  return text.trim();
}

/**
 * Truncate text to a specific length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
