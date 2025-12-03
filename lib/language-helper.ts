
/**
 * 🌍 Language System - Complete Multi-Language Support
 * Ondersteunt 10 talen voor content generatie
 */

export type LanguageCode = 'NL' | 'EN' | 'DE' | 'ES' | 'FR' | 'IT' | 'PT' | 'PL' | 'SV' | 'DA';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  locale: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Complete language configuration voor alle ondersteunde talen
 */
export const LANGUAGES: Record<LanguageCode, LanguageInfo> = {
  NL: {
    code: 'NL',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    locale: 'nl-NL',
    direction: 'ltr',
  },
  EN: {
    code: 'EN',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    locale: 'en-GB',
    direction: 'ltr',
  },
  DE: {
    code: 'DE',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    locale: 'de-DE',
    direction: 'ltr',
  },
  ES: {
    code: 'ES',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    locale: 'es-ES',
    direction: 'ltr',
  },
  FR: {
    code: 'FR',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    locale: 'fr-FR',
    direction: 'ltr',
  },
  IT: {
    code: 'IT',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    locale: 'it-IT',
    direction: 'ltr',
  },
  PT: {
    code: 'PT',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    locale: 'pt-PT',
    direction: 'ltr',
  },
  PL: {
    code: 'PL',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    locale: 'pl-PL',
    direction: 'ltr',
  },
  SV: {
    code: 'SV',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    locale: 'sv-SE',
    direction: 'ltr',
  },
  DA: {
    code: 'DA',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '🇩🇰',
    locale: 'da-DK',
    direction: 'ltr',
  },
};

/**
 * Array van alle ondersteunde talen (voor dropdowns etc)
 */
export const SUPPORTED_LANGUAGES: LanguageCode[] = Object.keys(LANGUAGES) as LanguageCode[];

/**
 * Get language info by code
 */
export function getLanguageInfo(code: string): LanguageInfo | null {
  const upperCode = code.toUpperCase() as LanguageCode;
  return LANGUAGES[upperCode] || null;
}

/**
 * Get language name for prompts (in English for AI)
 */
export function getLanguageNameForAI(code: string): string {
  const info = getLanguageInfo(code);
  return info ? info.name : 'English';
}

/**
 * Get native language name (for UI display)
 */
export function getLanguageNativeName(code: string): string {
  const info = getLanguageInfo(code);
  return info ? info.nativeName : 'Unknown';
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(code: string): string {
  const info = getLanguageInfo(code);
  return info ? info.flag : '🌐';
}

/**
 * Validate if language code is supported
 */
export function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.includes(code.toUpperCase() as LanguageCode);
}

/**
 * Get default language (Dutch)
 */
export function getDefaultLanguage(): LanguageCode {
  return 'NL';
}

/**
 * Format language for display (with flag and name)
 */
export function formatLanguageDisplay(code: string): string {
  const info = getLanguageInfo(code);
  if (!info) return code;
  return `${info.flag} ${info.nativeName}`;
}

/**
 * UI Translations voor veelgebruikte strings
 */
export const UI_TRANSLATIONS: Record<LanguageCode, {
  contentGenerator: string;
  generateContent: string;
  contentLibrary: string;
  settings: string;
  credits: string;
  loading: string;
  error: string;
  success: string;
  insufficientCredits: string;
  contentGenerated: string;
}> = {
  NL: {
    contentGenerator: 'Content Generator',
    generateContent: 'Genereer Content',
    contentLibrary: 'Content Bibliotheek',
    settings: 'Instellingen',
    credits: 'Credits',
    loading: 'Laden...',
    error: 'Er ging iets mis',
    success: 'Succesvol!',
    insufficientCredits: 'Onvoldoende credits',
    contentGenerated: 'Content gegenereerd',
  },
  EN: {
    contentGenerator: 'Content Generator',
    generateContent: 'Generate Content',
    contentLibrary: 'Content Library',
    settings: 'Settings',
    credits: 'Credits',
    loading: 'Loading...',
    error: 'Something went wrong',
    success: 'Success!',
    insufficientCredits: 'Insufficient credits',
    contentGenerated: 'Content generated',
  },
  DE: {
    contentGenerator: 'Content Generator',
    generateContent: 'Content Generieren',
    contentLibrary: 'Content-Bibliothek',
    settings: 'Einstellungen',
    credits: 'Credits',
    loading: 'Laden...',
    error: 'Etwas ist schief gelaufen',
    success: 'Erfolgreich!',
    insufficientCredits: 'Unzureichende Credits',
    contentGenerated: 'Content generiert',
  },
  ES: {
    contentGenerator: 'Generador de Contenido',
    generateContent: 'Generar Contenido',
    contentLibrary: 'Biblioteca de Contenido',
    settings: 'Configuración',
    credits: 'Créditos',
    loading: 'Cargando...',
    error: 'Algo salió mal',
    success: '¡Éxito!',
    insufficientCredits: 'Créditos insuficientes',
    contentGenerated: 'Contenido generado',
  },
  FR: {
    contentGenerator: 'Générateur de Contenu',
    generateContent: 'Générer du Contenu',
    contentLibrary: 'Bibliothèque de Contenu',
    settings: 'Paramètres',
    credits: 'Crédits',
    loading: 'Chargement...',
    error: 'Quelque chose a mal tourné',
    success: 'Succès!',
    insufficientCredits: 'Crédits insuffisants',
    contentGenerated: 'Contenu généré',
  },
  IT: {
    contentGenerator: 'Generatore di Contenuti',
    generateContent: 'Genera Contenuto',
    contentLibrary: 'Libreria dei Contenuti',
    settings: 'Impostazioni',
    credits: 'Crediti',
    loading: 'Caricamento...',
    error: 'Qualcosa è andato storto',
    success: 'Successo!',
    insufficientCredits: 'Crediti insufficienti',
    contentGenerated: 'Contenuto generato',
  },
  PT: {
    contentGenerator: 'Gerador de Conteúdo',
    generateContent: 'Gerar Conteúdo',
    contentLibrary: 'Biblioteca de Conteúdo',
    settings: 'Configurações',
    credits: 'Créditos',
    loading: 'Carregando...',
    error: 'Algo deu errado',
    success: 'Sucesso!',
    insufficientCredits: 'Créditos insuficientes',
    contentGenerated: 'Conteúdo gerado',
  },
  PL: {
    contentGenerator: 'Generator Treści',
    generateContent: 'Generuj Treść',
    contentLibrary: 'Biblioteka Treści',
    settings: 'Ustawienia',
    credits: 'Kredyty',
    loading: 'Ładowanie...',
    error: 'Coś poszło nie tak',
    success: 'Sukces!',
    insufficientCredits: 'Niewystarczające kredyty',
    contentGenerated: 'Treść wygenerowana',
  },
  SV: {
    contentGenerator: 'Innehållsgenerator',
    generateContent: 'Generera Innehåll',
    contentLibrary: 'Innehållsbibliotek',
    settings: 'Inställningar',
    credits: 'Krediter',
    loading: 'Laddar...',
    error: 'Något gick fel',
    success: 'Framgång!',
    insufficientCredits: 'Otillräckliga krediter',
    contentGenerated: 'Innehåll genererat',
  },
  DA: {
    contentGenerator: 'Indhold Generator',
    generateContent: 'Generer Indhold',
    contentLibrary: 'Indholdsbibliotek',
    settings: 'Indstillinger',
    credits: 'Kreditter',
    loading: 'Indlæser...',
    error: 'Noget gik galt',
    success: 'Succes!',
    insufficientCredits: 'Utilstrækkelige kreditter',
    contentGenerated: 'Indhold genereret',
  },
};

/**
 * Get UI translation
 */
export function getUITranslation(
  languageCode: string,
  key: keyof typeof UI_TRANSLATIONS['NL']
): string {
  const upperCode = languageCode.toUpperCase() as LanguageCode;
  const translations = UI_TRANSLATIONS[upperCode];
  return translations ? translations[key] : UI_TRANSLATIONS.NL[key];
}
