/**
 * Language utilities for content generation
 */

export const LANGUAGE_NAMES: Record<string, string> = {
  'NL': 'perfect Nederlands',
  'EN': 'fluent English',
  'DE': 'perfektes Deutsch',
  'ES': 'español perfecto',
  'FR': 'français parfait',
  'IT': 'italiano perfetto',
  'PT': 'português perfeito',
};

export const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  'NL': 'Nederlands',
  'EN': 'English',
  'DE': 'Deutsch',
  'ES': 'Español',
  'FR': 'Français',
  'IT': 'Italiano',
  'PT': 'Português',
};

/**
 * Get the language name for AI prompts
 */
export function getLanguageName(language: string): string {
  return LANGUAGE_NAMES[language.toUpperCase()] || LANGUAGE_NAMES['NL'];
}

/**
 * Get the display name for a language
 */
export function getLanguageDisplayName(language: string): string {
  return LANGUAGE_DISPLAY_NAMES[language.toUpperCase()] || 'Nederlands';
}

/**
 * Get the language code in lowercase format for banned words
 */
export function getLanguageCodeForBannedWords(language: string): 'nl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt' {
  const code = language.toLowerCase() as 'nl' | 'en' | 'de' | 'es' | 'fr' | 'it' | 'pt';
  if (['nl', 'en', 'de', 'es', 'fr', 'it', 'pt'].includes(code)) {
    return code;
  }
  return 'nl'; // Default to Dutch
}
