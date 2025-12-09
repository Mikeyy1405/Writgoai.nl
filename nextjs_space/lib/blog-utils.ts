/**
 * Blog utility functions for common operations
 */

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Extract YouTube video ID from various URL formats
 * Returns null if URL is not a valid YouTube URL
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Validate it's exactly 11 characters (YouTube video ID format)
      if (match[1].length === 11 && /^[a-zA-Z0-9_-]+$/.test(match[1])) {
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Extract Vimeo video ID from URL
 * Returns null if URL is not a valid Vimeo URL
 */
export function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match && match[1]) {
    // Validate it's numeric
    if (/^\d+$/.test(match[1])) {
      return match[1];
    }
  }
  return null;
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip HTML tags from content (basic, for short descriptions)
 * 
 * SECURITY NOTE: This function is NOT for sanitizing user-generated content.
 * It's only used for extracting text from admin-created blog content for:
 * 1. SEO analysis (word counting, readability)
 * 2. RSS feed descriptions
 * 
 * The blog content is created by authenticated admins only, not by untrusted users.
 * For sanitizing untrusted user input, use a proper HTML sanitizer library like DOMPurify.
 */
export function stripHtmlTags(html: string, maxLength: number = 500): string {
  // Remove script and style tags completely (including content)
  // Using a more complete regex that handles various whitespace patterns
  let text = html.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  text = text.replace(/<style[\s\S]*?<\/style\s*>/gi, '');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode common HTML entities in a safe order (decode & last to avoid double-decoding)
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&amp;/g, '&'); // Decode & last to prevent double-decoding
  
  // Collapse multiple spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  return text.substring(0, maxLength);
}

/**
 * Calculate Flesch Reading Ease score
 * Note: This is calibrated for English. Results may vary for other languages.
 */
export function calculateFleschScore(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  if (words.length === 0 || sentences.length === 0) {
    return 0;
  }

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const syllableCount = words.reduce((count, word) => count + countSyllables(word), 0);
  
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Count syllables in a word (English approximation)
 * Note: This is an approximation and may not be accurate for all languages
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  
  // Short words
  if (word.length <= 3) return 1;
  
  // Remove silent e at the end
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  
  // Remove y at the beginning
  word = word.replace(/^y/, '');
  
  // Count vowel groups
  const syllables = word.match(/[aeiouy]{1,2}/g);
  
  return syllables ? syllables.length : 1;
}

/**
 * Count occurrences of a keyword in text (case-insensitive, whole words)
 */
export function countKeywordOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  
  const escapedKeyword = escapeRegex(keyword);
  const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'gi');
  const matches = text.match(regex);
  
  return matches ? matches.length : 0;
}
