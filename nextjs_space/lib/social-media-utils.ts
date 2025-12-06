/**
 * Social Media Utilities
 * Helper functions for social media content
 */

import { DEFAULT_FORBIDDEN_WORDS } from './advanced-seo-writer';

// Vervangingen voor verboden woorden
export const FORBIDDEN_WORD_REPLACEMENTS: Record<string, string> = {
  'essentieel': 'belangrijk',
  'cruciaal': 'belangrijk',
  'kortom': 'kortweg',
  'revolutionair': 'vernieuwend',
  'baanbrekend': 'vernieuwend',
  'ultiem': 'beste',
  'ultieme': 'beste',
  'definitief': 'duidelijk',
  'definitieve': 'duidelijke',
  'absoluut': 'zeer',
  'absolute': 'zeer',
  'perfect': 'uitstekend',
  'perfecte': 'uitstekende',
  'ideaal': 'geschikt',
  'ideale': 'geschikte',
  'onmisbaar': 'belangrijk',
  'onmisbare': 'belangrijke',
  'duik': 'kijk',
  'duiken': 'kijken',
  'induiken': 'bekijken',
  'superheld': 'expert',
  'superheldin': 'expert',
  'superkracht': 'kracht',
  'game changer': 'vernieuwing',
  'gamechanger': 'vernieuwing',
  'game-changer': 'vernieuwing',
  'toverwoord': 'oplossing',
  'tovermiddel': 'oplossing',
  'wondermiddel': 'oplossing',
  'heilige graal': 'oplossing',
  'magische oplossing': 'goede oplossing',
  'magisch middel': 'goed middel',
  'gids': 'handleiding',
  'veilige haven': 'veilige plek',
  'zonder gedoe': 'eenvoudig',
  'gedoe': 'problemen',
  'digitaal tijdperk': 'digitale tijd',
  'wereld van': 'gebied van',
  'in de wereld van': 'in het gebied van',
  'in een wereld van': 'in een tijd van',
};

/**
 * Filter verboden woorden uit content en vervang ze met betere alternatieven
 */
export function filterForbiddenWords(content: string): string {
  let filtered = content;
  
  // Vervang verboden woorden (case-insensitive)
  for (const [forbidden, replacement] of Object.entries(FORBIDDEN_WORD_REPLACEMENTS)) {
    const regex = new RegExp(forbidden, 'gi');
    filtered = filtered.replace(regex, (match) => {
      // Behoud de hoofdletter structuur van het origineel
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    });
  }
  
  return filtered;
}

/**
 * Check of content verboden woorden bevat
 */
export function containsForbiddenWords(content: string): { 
  hasForbidden: boolean; 
  found: string[] 
} {
  const found: string[] = [];
  const lowerContent = content.toLowerCase();
  
  for (const word of DEFAULT_FORBIDDEN_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      found.push(word);
    }
  }
  
  return {
    hasForbidden: found.length > 0,
    found,
  };
}

/**
 * Render markdown naar HTML
 * Ondersteunt: **bold**, *italic*, en line breaks
 */
export function renderMarkdown(content: string): string {
  return content
    // Bold: **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n/g, '<br />');
}

/**
 * Strip markdown formatting (voor plain text weergave)
 */
export function stripMarkdown(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/<[^>]*>/g, '');
}

/**
 * Platform kleuren en iconen
 */
export const PLATFORM_CONFIG = {
  linkedin: { 
    name: 'LinkedIn', 
    color: '#0A66C2',
    emoji: '🔵',
    maxLength: 3000 
  },
  facebook: { 
    name: 'Facebook', 
    color: '#1877F2',
    emoji: '📘',
    maxLength: 63206 
  },
  instagram: { 
    name: 'Instagram', 
    color: '#E4405F',
    emoji: '🟠',
    maxLength: 2200 
  },
  twitter: { 
    name: 'X', 
    color: '#000000',
    emoji: '🟣',
    maxLength: 280 
  },
  youtube: { 
    name: 'YouTube', 
    color: '#FF0000',
    emoji: '🔴',
    maxLength: 5000 
  },
  tiktok: { 
    name: 'TikTok', 
    color: '#000000',
    emoji: '⚫',
    maxLength: 2200 
  },
};

export type PlatformId = keyof typeof PLATFORM_CONFIG;

/**
 * Format datum voor weergave
 */
export function formatScheduleDate(date: Date): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Get aantal dagen in een maand
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get eerste dag van de maand (0 = zondag, 1 = maandag, etc.)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check of een datum vandaag is
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check of een datum in het verleden is
 */
export function isPast(date: Date): boolean {
  return date < new Date();
}

/**
 * Genereer kalender grid data
 */
export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isPast: boolean;
  isCurrentMonth: boolean;
}

export function generateCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  
  // Dagen van vorige maand (om grid te vullen)
  const startDay = firstDay === 0 ? 6 : firstDay - 1; // Maandag = 0
  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date,
      dayNumber: daysInPrevMonth - i,
      isToday: isToday(date),
      isPast: isPast(date),
      isCurrentMonth: false,
    });
  }
  
  // Dagen van huidige maand
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push({
      date,
      dayNumber: day,
      isToday: isToday(date),
      isPast: isPast(date),
      isCurrentMonth: true,
    });
  }
  
  // Dagen van volgende maand (om grid te vullen tot 42 dagen = 6 weken)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      dayNumber: day,
      isToday: isToday(date),
      isPast: isPast(date),
      isCurrentMonth: false,
    });
  }
  
  return days;
}
