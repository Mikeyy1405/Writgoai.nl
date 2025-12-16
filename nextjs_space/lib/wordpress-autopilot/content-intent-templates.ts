/**
 * Content Intent Templates
 * Templates voor verschillende soorten content (informatief, best-of-list, review)
 */

import type { ContentCalendarItem, AutopilotSettings } from './types';

export interface ContentTemplate {
  intent: string;
  structure: string[];
  promptGuidelines: string;
  minWordCount: number;
  maxWordCount: number;
  includeComparison?: boolean;
  includeRatings?: boolean;
  includeProsAndCons?: boolean;
}

/**
 * Informational Content Template
 * Voor educatieve, uitgebreide artikelen
 */
export const INFORMATIONAL_TEMPLATE: ContentTemplate = {
  intent: 'informational',
  structure: [
    'Inleiding met duidelijke context',
    'Wat is [onderwerp]? - Definitie en uitleg',
    'Waarom is [onderwerp] belangrijk?',
    '3-5 hoofdsecties met H2 headers',
    'Praktische tips en voorbeelden',
    'Veelgestelde vragen (FAQ)',
    'Conclusie met samenvatting',
  ],
  promptGuidelines: `
Creëer een uitgebreid, informatief artikel dat educatief is en waarde biedt aan de lezer.

STRUCTUUR VEREISTEN:
- Start met een duidelijke inleiding die de context schetst
- Gebruik H2 en H3 headers voor overzichtelijke structuur
- Leg complexe concepten uit in begrijpelijke taal
- Voeg concrete voorbeelden en praktische tips toe
- Onderbouw met feiten en data waar relevant
- Gebruik bullet points en genummerde lijsten voor leesbaarheid

TONE:
- Informatief en betrouwbaar
- Toegankelijk maar professioneel
- Focus op kennisoverdracht
`,
  minWordCount: 1500,
  maxWordCount: 2500,
};

/**
 * Best Of List Template
 * Voor "Top 10 beste..." of "5 beste manieren om..." artikelen
 */
export const BEST_OF_LIST_TEMPLATE: ContentTemplate = {
  intent: 'best-of-list',
  structure: [
    'Inleiding: Waarom deze lijst belangrijk is',
    'Selectiecriteria: Hoe zijn deze gekozen?',
    'Items 1-10 (of 5-15) elk met:',
    '  - Titel en korte beschrijving',
    '  - Belangrijkste kenmerken',
    '  - Pros en Cons',
    '  - Geschiktheid (voor wie is dit?)',
    '  - Prijs/waarde verhouding',
    'Vergelijkingstabel',
    'Koopadvies en conclusie',
  ],
  promptGuidelines: `
Creëer een gestructureerde "beste van" lijst die lezers helpt bij het maken van een keuze.

STRUCTUUR VEREISTEN:
- Start met waarom deze lijst relevant is
- Leg selectiecriteria uit (transparantie)
- Elk item moet een duidelijke positie hebben (#1, #2, etc.)
- Geef voor elk item:
  * Duidelijke titel
  * Korte beschrijving (2-3 zinnen)
  * Belangrijkste kenmerken (3-5 bullet points)
  * Pros (3-4 punten)
  * Cons (2-3 punten)
  * Voor wie is dit geschikt?
  * Prijs/waarde indicatie
- Voeg een vergelijkingstabel toe (HTML table)
- Sluit af met koopadvies

TONE:
- Behulpzaam en adviserend
- Objectief maar met duidelijke aanbevelingen
- Focus op praktische waarde
`,
  minWordCount: 2000,
  maxWordCount: 3500,
  includeComparison: true,
  includeProsAndCons: true,
};

/**
 * Review Template
 * Voor product/service reviews
 */
export const REVIEW_TEMPLATE: ContentTemplate = {
  intent: 'review',
  structure: [
    'Inleiding: Eerste indruk',
    'Wat is [product/service]?',
    'Belangrijkste kenmerken en specificaties',
    'Uitgebreide test/ervaring:',
    '  - Gebruiksgemak',
    '  - Prestaties',
    '  - Kwaliteit',
    '  - Prijs-kwaliteit verhouding',
    'Pros en Cons',
    'Vergelijking met alternatieven',
    'Voor wie is dit geschikt?',
    'Overall rating en koopadvies',
  ],
  promptGuidelines: `
Creëer een eerlijke, uitgebreide review die lezers helpt een weloverwogen beslissing te nemen.

STRUCTUUR VEREISTEN:
- Start met eerste indruk en context
- Beschrijf het product/service in detail
- Test op verschillende aspecten:
  * Gebruiksgemak/User Experience
  * Prestaties/Functionaliteit
  * Kwaliteit/Betrouwbaarheid
  * Prijs-kwaliteit verhouding
- Geef duidelijke Pros (4-6 punten)
- Geef eerlijke Cons (3-4 punten)
- Vergelijk met 2-3 alternatieven
- Geef overall rating (bijvoorbeeld: 4.5/5 sterren)
- Koopadvies: Voor wie is dit wel/niet geschikt?

TONE:
- Eerlijk en transparant
- Gebalanceerd (niet alleen positief)
- Persoonlijke ervaring waar relevant
- Focus op praktische bruikbaarheid
`,
  minWordCount: 1800,
  maxWordCount: 3000,
  includeComparison: true,
  includeRatings: true,
  includeProsAndCons: true,
};

/**
 * How-To Guide Template
 */
export const HOW_TO_TEMPLATE: ContentTemplate = {
  intent: 'how-to',
  structure: [
    'Inleiding: Wat ga je leren?',
    'Wat heb je nodig? (materialen/voorkennis)',
    'Stap-voor-stap instructies:',
    '  - Stap 1: [Actie]',
    '  - Stap 2: [Actie]',
    '  - etc.',
    'Tips en best practices',
    'Veelgemaakte fouten en hoe te vermijden',
    'FAQ',
    'Conclusie en next steps',
  ],
  promptGuidelines: `
Creëer een duidelijke stap-voor-stap handleiding die lezers praktisch helpt.

STRUCTUUR VEREISTEN:
- Start met wat de lezer gaat leren/bereiken
- Lijst benodigdheden op
- Geef duidelijke, genummerde stappen
- Elke stap moet actionable zijn
- Voeg visuele beschrijvingen toe waar nuttig
- Geef tips en best practices
- Waarschuw voor veelgemaakte fouten
- FAQ sectie met 5-8 vragen

TONE:
- Instructief en duidelijk
- Stap-voor-stap opbouw
- Geen aannames over voorkennis
- Focus op praktische uitvoerbaarheid
`,
  minWordCount: 1200,
  maxWordCount: 2000,
};

/**
 * Get template based on content intent
 */
export function getContentTemplate(
  intent: string | undefined,
  contentType?: string
): ContentTemplate {
  // If no intent specified, derive from contentType
  if (!intent && contentType) {
    if (contentType === 'listicle') intent = 'best-of-list';
    else if (contentType === 'review') intent = 'review';
    else if (contentType === 'how-to') intent = 'how-to';
    else intent = 'informational';
  }

  switch (intent) {
    case 'best-of-list':
    case 'listicle':
      return BEST_OF_LIST_TEMPLATE;
    case 'review':
      return REVIEW_TEMPLATE;
    case 'how-to':
    case 'guide':
      return HOW_TO_TEMPLATE;
    case 'informational':
    default:
      return INFORMATIONAL_TEMPLATE;
  }
}

/**
 * Detect content intent from title/keywords
 */
export function detectContentIntent(
  title: string,
  keywords: string[]
): string {
  const text = `${title} ${keywords.join(' ')}`.toLowerCase();

  // Best-of-list indicators
  if (
    /\b(beste|top\s+\d+|top\s+\w+|\d+\s+beste|lijst|ranking)\b/i.test(text)
  ) {
    return 'best-of-list';
  }

  // Review indicators
  if (/\b(review|test|ervaring|ervaringen|beoordelingen?)\b/i.test(text)) {
    return 'review';
  }

  // How-to indicators
  if (
    /\b(hoe|how\s+to|handleiding|gids|guide|stappen|tutorial)\b/i.test(text)
  ) {
    return 'how-to';
  }

  // Default to informational
  return 'informational';
}

/**
 * Build AI prompt with content rules and template
 */
export function buildContentPrompt(
  item: ContentCalendarItem,
  template: ContentTemplate,
  settings?: AutopilotSettings,
  language: string = 'nl'
): string {
  const contentRules = settings?.contentRules || {};
  const toneOfVoice = settings?.toneOfVoice || 'professioneel';
  const brandGuidelines = settings?.brandGuidelines || '';
  const targetAudience = settings?.targetAudience || '';
  const dosAndDonts = settings?.dosAndDonts || { dos: [], donts: [] };

  let prompt = `Je bent een professionele content schrijver. Creëer een ${template.intent} artikel in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.

ARTIKEL INFORMATIE:
Titel: ${item.title}
Focus Keyword: ${item.focusKeyword}
Secundaire Keywords: ${item.secondaryKeywords.join(', ')}
Topic: ${item.topic}

${template.promptGuidelines}

GEWENSTE STRUCTUUR:
${template.structure.map((s, i) => `${i + 1}. ${s}`).join('\n')}

LENGTE:
- Minimaal ${template.minWordCount} woorden
- Maximaal ${template.maxWordCount} woorden

`;

  // Add content rules if available
  if (toneOfVoice) {
    prompt += `\nTONE OF VOICE: ${toneOfVoice}\n`;
  }

  if (brandGuidelines) {
    prompt += `\nBRAND GUIDELINES:\n${brandGuidelines}\n`;
  }

  if (targetAudience) {
    prompt += `\nDOELGROEP: ${targetAudience}\n`;
  }

  if (dosAndDonts.dos.length > 0) {
    prompt += `\nDO's (MOET WEL):\n${dosAndDonts.dos.map(d => `- ${d}`).join('\n')}\n`;
  }

  if (dosAndDonts.donts.length > 0) {
    prompt += `\nDON'Ts (NIET DOEN):\n${dosAndDonts.donts.map(d => `- ${d}`).join('\n')}\n`;
  }

  // Add specific instructions based on template
  if (template.includeComparison) {
    prompt += `\nVOEG TOE: Een vergelijkingstabel (HTML <table>) met alle items naast elkaar.\n`;
  }

  if (template.includeProsAndCons) {
    prompt += `\nVOEG TOE: Duidelijke Pros en Cons secties voor elk item/product.\n`;
  }

  if (template.includeRatings) {
    prompt += `\nVOEG TOE: Overall rating (bijvoorbeeld: 4.5/5 sterren) en ratings per aspect.\n`;
  }

  prompt += `\nOUTPUT FORMAT:
- Gebruik HTML formatting (H2, H3, p, ul, ol, strong, em)
- Maak het SEO-vriendelijk
- Zorg voor goede leesbaarheid
- Voeg natuurlijk de keywords toe (niet geforceerd)
- Gebruik white space en alinea's voor leesbaarheid

Return alleen de HTML content, geen extra tekst ervoor of erna.
`;

  return prompt;
}
