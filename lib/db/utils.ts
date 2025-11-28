/**
 * Shared utility functions for the content planning system
 */

// Default language for content
export const DEFAULT_LANGUAGE = 'NL';

// Supported languages
export const SUPPORTED_LANGUAGES = ['NL', 'EN', 'DE', 'ES', 'FR', 'IT', 'PT', 'PL', 'SV', 'DA'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Language display names
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  NL: 'Nederlands',
  EN: 'English',
  DE: 'Deutsch',
  ES: 'Español',
  FR: 'Français',
  IT: 'Italiano',
  PT: 'Português',
  PL: 'Polski',
  SV: 'Svenska',
  DA: 'Dansk',
};

/**
 * Generate a unique ID (UUID v4)
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a URL-safe slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Count words in HTML content
 */
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}
