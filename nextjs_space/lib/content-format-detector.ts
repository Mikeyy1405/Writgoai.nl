/**
 * Content Format Detector
 * 
 * Automatisch detecteren van:
 * 1. Content format op basis van search intent en keywords
 * 2. Taal op basis van website URL en titel
 * 
 * Gebruikt door content generation APIs om de juiste templates te kiezen
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export type ContentFormat = 
  | 'informatief'           // Educatief artikel (informational intent)
  | 'beste-lijstje'         // Top 10, vergelijkingen (commercial intent)
  | 'product-review'        // Specifieke product review (transactional intent)
  | 'how-to'                // Stap-voor-stap handleiding (navigational intent)
  | 'vergelijking'          // Product A vs Product B
  | 'gids'                  // Complete gids
  | 'nieuws'                // Nieuws artikel
  | 'mening';               // Opinion piece

export type ContentLanguage = 
  | 'nl'   // Nederlands
  | 'en'   // Engels
  | 'de'   // Duits
  | 'fr'   // Frans
  | 'es';  // Spaans

export type SearchIntent = 
  | 'informational'  // Learn about something
  | 'commercial'     // Compare products/services
  | 'transactional'  // Buy something
  | 'navigational';  // Find specific page/brand

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detecteer content format op basis van search intent en keywords
 */
export function detectContentFormat(
  title: string,
  keywords: string[],
  searchIntent?: SearchIntent
): ContentFormat {
  const titleLower = title.toLowerCase();
  const keywordsLower = keywords.map(k => k.toLowerCase()).join(' ');
  const combined = `${titleLower} ${keywordsLower}`;

  // ==========================================
  // STAP 1: Check explicit format indicators in title/keywords
  // ==========================================

  // Top 10 / Best of lists
  const listPatterns = [
    /beste.*\d+/i,          // "Beste 10", "Beste 5"
    /top\s*\d+/i,           // "Top 10", "Top 5"
    /\d+.*beste/i,          // "10 Beste"
    /meest.*populaire/i,    // "Meest populaire"
    /\d+.*tips/i,           // "10 tips"
    /lijst/i,               // "Lijst"
  ];

  if (listPatterns.some(pattern => pattern.test(combined))) {
    return 'beste-lijstje';
  }

  // How-to guides
  const howToPatterns = [
    /hoe.*je/i,             // "Hoe maak je"
    /hoe.*moet/i,           // "Hoe moet je"
    /how\s*to/i,            // "How to"
    /stappenplan/i,         // "Stappenplan"
    /handleiding/i,         // "Handleiding"
    /uitleg/i,              // "Uitleg"
  ];

  if (howToPatterns.some(pattern => pattern.test(combined))) {
    return 'how-to';
  }

  // Product reviews
  const reviewPatterns = [
    /review/i,              // "Review"
    /test/i,                // "Test"
    /ervaringen/i,          // "Ervaringen"
    /beoordelingen/i,       // "Beoordelingen"
  ];

  if (reviewPatterns.some(pattern => pattern.test(combined))) {
    return 'product-review';
  }

  // Comparisons
  const comparisonPatterns = [
    /vs\.?/i,               // "A vs B"
    /versus/i,              // "A versus B"
    /vergelijking/i,        // "Vergelijking"
    /vergelijken/i,         // "Vergelijken"
    /verschil/i,            // "Verschil tussen"
  ];

  if (comparisonPatterns.some(pattern => pattern.test(combined))) {
    return 'vergelijking';
  }

  // Guides
  const guidePatterns = [
    /complete.*gids/i,      // "Complete gids"
    /ultieme.*gids/i,       // "Ultieme gids"
    /beginners.*gids/i,     // "Beginners gids"
    /guide/i,               // "Guide"
  ];

  if (guidePatterns.some(pattern => pattern.test(combined))) {
    return 'gids';
  }

  // ==========================================
  // STAP 2: Use search intent as fallback
  // ==========================================

  if (searchIntent) {
    switch (searchIntent) {
      case 'commercial':
        return 'beste-lijstje';
      case 'transactional':
        return 'product-review';
      case 'navigational':
        return 'how-to';
      case 'informational':
      default:
        return 'informatief';
    }
  }

  // ==========================================
  // STAP 3: Default to informational article
  // ==========================================

  return 'informatief';
}

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detecteer taal op basis van website URL en titel
 */
export function detectLanguage(
  websiteUrl: string,
  title?: string,
  keywords?: string[]
): ContentLanguage {
  const urlLower = websiteUrl.toLowerCase();

  // ==========================================
  // STAP 1: Check domain TLD
  // ==========================================

  if (urlLower.endsWith('.nl') || urlLower.includes('.nl/')) {
    return 'nl';
  }

  if (urlLower.endsWith('.be') || urlLower.includes('.be/')) {
    return 'nl'; // België = meestal Nederlands
  }

  if (urlLower.endsWith('.de') || urlLower.includes('.de/')) {
    return 'de';
  }

  if (urlLower.endsWith('.fr') || urlLower.includes('.fr/')) {
    return 'fr';
  }

  if (urlLower.endsWith('.es') || urlLower.includes('.es/')) {
    return 'es';
  }

  // ==========================================
  // STAP 2: Check title and keywords for Dutch words
  // ==========================================

  if (title || keywords) {
    const textToCheck = [
      title || '',
      ...(keywords || []),
    ].join(' ').toLowerCase();

    // Common Dutch words
    const dutchWords = [
      'beste', 'top', 'hoe', 'wat', 'waarom', 'voor', 'met', 'een', 'de', 'het',
      'naar', 'van', 'op', 'in', 'aan', 'bij', 'over', 'door', 'als', 'maar',
      'ook', 'meer', 'veel', 'goed', 'nieuwe', 'jaar', 'tijd', 'moet', 'kan',
      'zijn', 'hebben', 'maken', 'gaan', 'komen', 'zien', 'krijgen', 'worden',
    ];

    // Count Dutch word occurrences
    const dutchCount = dutchWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(textToCheck);
    }).length;

    // If 3+ Dutch words found, likely Dutch content
    if (dutchCount >= 3) {
      return 'nl';
    }

    // Common English words
    const englishWords = [
      'best', 'top', 'how', 'what', 'why', 'for', 'with', 'the', 'and', 'that',
      'this', 'from', 'which', 'about', 'more', 'when', 'where', 'should', 'can',
      'will', 'would', 'could', 'get', 'make', 'know', 'take', 'see', 'come', 'think',
    ];

    const englishCount = englishWords.filter(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(textToCheck);
    }).length;

    // If 3+ English words and more English than Dutch, likely English
    if (englishCount >= 3 && englishCount > dutchCount) {
      return 'en';
    }
  }

  // ==========================================
  // STAP 3: Default to English for .com, .org, etc.
  // ==========================================

  return 'en';
}

// ============================================================================
// Format Templates
// ============================================================================

/**
 * Get content prompt template based on format and language
 */
export function getContentTemplate(
  format: ContentFormat,
  language: ContentLanguage
): string {
  const templates = {
    nl: {
      'informatief': `
## Structuur voor Informatief Artikel:

1. **Inleiding** (100-150 woorden)
   - Waarom dit onderwerp belangrijk is
   - Wat de lezer gaat leren

2. **Wat is [onderwerp]?** (200-300 woorden)
   - Heldere definitie
   - Context en achtergrond

3. **Hoe werkt het?** (300-500 woorden)
   - Stapsgewijze uitleg
   - Praktische voorbeelden

4. **Voordelen en nadelen** (200-300 woorden)
   - Objectieve analyse
   - Voor- en nadelen tabel

5. **Praktische tips** (300-400 woorden)
   - Concrete handvatten
   - Veelgemaakte fouten

6. **Conclusie** (100-150 woorden)
   - Samenvatting
   - Call-to-action
`,
      'beste-lijstje': `
## Structuur voor Top 10 / Beste Lijstje:

1. **Inleiding** (100-150 woorden)
   - Waarom deze lijst relevant is
   - Wie heeft er baat bij

2. **Onze selectiecriteria** (100-150 woorden)
   - Hoe we hebben geselecteerd
   - Wat we hebben meegewogen

3. **Top 10 items** (elk 200-300 woorden)
   Voor elk item:
   - **[#] [Naam Product/Service]**
   - Korte beschrijving
   - ✅ Voordelen (3-5 bullets)
   - ❌ Nadelen (2-3 bullets)
   - 💰 Prijs/waarde
   - ⭐ Overall score

4. **Vergelijkingstabel** (overzicht alle items)

5. **Conclusie en aanbeveling** (150-200 woorden)
   - Beste keuze voor wie?
   - Alternatieve opties
`,
      'product-review': `
## Structuur voor Product Review:

1. **Inleiding** (100-150 woorden)
   - Eerste indruk
   - Voor wie is dit product?

2. **Specificaties** (tabel)
   - Belangrijkste specs
   - Technische details

3. **Design en bouwkwaliteit** (200-300 woorden)
   - Uiterlijk en materialen
   - Gebruikservaring

4. **Performance en features** (400-500 woorden)
   - Hoe presteert het in de praktijk?
   - Belangrijkste functies
   - Sterke punten

5. **Voor- en nadelen** (200-250 woorden)
   - ✅ Voordelen (5-7 bullets)
   - ❌ Nadelen (3-5 bullets)

6. **Prijs-kwaliteit verhouding** (150-200 woorden)
   - Is het zijn geld waard?
   - Vergelijking met alternatieven

7. **Conclusie** (150-200 woorden)
   - Eindoordeel
   - ⭐ Score (bijv. 8.5/10)
   - Aanbeveling
`,
      'how-to': `
## Structuur voor How-To Guide:

1. **Inleiding** (100-150 woorden)
   - Wat ga je leren?
   - Waarom is dit nuttig?

2. **Wat heb je nodig?** (100-150 woorden)
   - Benodigdheden
   - Voorkennis

3. **Stap-voor-stap instructies** (500-800 woorden)
   Voor elke stap:
   - **Stap [#]: [Actie]**
   - Duidelijke uitleg
   - Eventueel screenshot/afbeelding
   - ⚠️ Let op: belangrijke punten

4. **Tips en tricks** (200-300 woorden)
   - Handige tips
   - Shortcuts
   - Best practices

5. **Veelgemaakte fouten** (150-200 woorden)
   - Wat moet je vermijden?
   - Hoe herstel je fouten?

6. **Conclusie** (100-150 woorden)
   - Samenvatting
   - Volgende stappen
`,
      'vergelijking': `
## Structuur voor Vergelijking:

1. **Inleiding** (100-150 woorden)
   - Wat vergelijken we?
   - Voor wie is deze vergelijking?

2. **Overzicht beide opties** (200-300 woorden)
   - Optie A: korte intro
   - Optie B: korte intro

3. **Vergelijking per categorie** (600-800 woorden)
   Voor elke categorie:
   - **[Categorie naam]**
   - Optie A: prestatie
   - Optie B: prestatie
   - Conclusie

4. **Vergelijkingstabel** (overzicht)

5. **Voor- en nadelen** (200-300 woorden)
   - Optie A: voordelen en nadelen
   - Optie B: voordelen en nadelen

6. **Conclusie** (150-200 woorden)
   - Welke is beter?
   - Voor wie is welke optie geschikt?
`,
      'gids': `
## Structuur voor Complete Gids:

1. **Inleiding** (150-200 woorden)
   - Waarom deze gids?
   - Wat ga je leren?

2. **Basis concepten** (300-500 woorden)
   - Fundamentele kennis
   - Belangrijke terminologie

3. **Hoofdstuk 1: [Onderwerp]** (500-800 woorden)
   - Uitgebreide uitleg
   - Voorbeelden
   - Praktische tips

4. **Hoofdstuk 2: [Onderwerp]** (500-800 woorden)
   - Uitgebreide uitleg
   - Voorbeelden
   - Praktische tips

5. **Best practices** (300-400 woorden)
   - Professionele tips
   - Veelgemaakte fouten

6. **Conclusie en volgende stappen** (200-250 woorden)
   - Samenvatting
   - Vervolgacties
`,
      'nieuws': `
## Structuur voor Nieuws Artikel:

1. **Lead** (50-100 woorden)
   - Wie, wat, waar, wanneer, waarom?
   - Belangrijkste informatie voorop

2. **Context en achtergrond** (200-300 woorden)
   - Wat is er gebeurd?
   - Waarom is dit belangrijk?

3. **Details en ontwikkelingen** (300-400 woorden)
   - Verdere informatie
   - Citaten van betrokkenen

4. **Impact en consequenties** (200-300 woorden)
   - Wat betekent dit?
   - Wat zijn de gevolgen?

5. **Conclusie** (100-150 woorden)
   - Samenvatting
   - Vooruitblik
`,
      'mening': `
## Structuur voor Opinie Artikel:

1. **Inleiding** (100-150 woorden)
   - Controversiële stelling
   - Waarom dit onderwerp?

2. **Standpunt** (200-300 woorden)
   - Duidelijke mening
   - Waarom denk je dit?

3. **Argumenten** (400-600 woorden)
   - 3-5 sterke argumenten
   - Onderbouwing met voorbeelden
   - Tegenargumenten weerleggen

4. **Nuance** (200-300 woorden)
   - Andere perspectieven
   - Zwakke punten in eigen argumentatie

5. **Conclusie** (150-200 woorden)
   - Herhaling standpunt
   - Call-to-action
`,
    },
    en: {
      'informatief': `
## Structure for Informational Article:

1. **Introduction** (100-150 words)
   - Why this topic matters
   - What readers will learn

2. **What is [topic]?** (200-300 words)
   - Clear definition
   - Context and background

3. **How does it work?** (300-500 words)
   - Step-by-step explanation
   - Practical examples

4. **Pros and cons** (200-300 words)
   - Objective analysis
   - Comparison table

5. **Practical tips** (300-400 words)
   - Actionable advice
   - Common mistakes to avoid

6. **Conclusion** (100-150 words)
   - Summary
   - Call-to-action
`,
      'beste-lijstje': `
## Structure for Top 10 / Best List:

1. **Introduction** (100-150 words)
   - Why this list matters
   - Who benefits from it

2. **Our selection criteria** (100-150 words)
   - How we selected
   - What we considered

3. **Top 10 items** (each 200-300 words)
   For each item:
   - **[#] [Product/Service Name]**
   - Brief description
   - ✅ Pros (3-5 bullets)
   - ❌ Cons (2-3 bullets)
   - 💰 Price/value
   - ⭐ Overall rating

4. **Comparison table** (overview all items)

5. **Conclusion and recommendation** (150-200 words)
   - Best choice for who?
   - Alternative options
`,
      'product-review': `
## Structure for Product Review:

1. **Introduction** (100-150 words)
   - First impression
   - Who is this product for?

2. **Specifications** (table)
   - Key specs
   - Technical details

3. **Design and build quality** (200-300 words)
   - Appearance and materials
   - User experience

4. **Performance and features** (400-500 words)
   - Real-world performance
   - Key features
   - Standout points

5. **Pros and cons** (200-250 words)
   - ✅ Advantages (5-7 bullets)
   - ❌ Disadvantages (3-5 bullets)

6. **Value for money** (150-200 words)
   - Is it worth the price?
   - Comparison with alternatives

7. **Conclusion** (150-200 words)
   - Final verdict
   - ⭐ Score (e.g. 8.5/10)
   - Recommendation
`,
      'how-to': `
## Structure for How-To Guide:

1. **Introduction** (100-150 words)
   - What will you learn?
   - Why is this useful?

2. **What you need** (100-150 words)
   - Requirements
   - Prerequisites

3. **Step-by-step instructions** (500-800 words)
   For each step:
   - **Step [#]: [Action]**
   - Clear explanation
   - Screenshots/images if needed
   - ⚠️ Note: important points

4. **Tips and tricks** (200-300 words)
   - Helpful tips
   - Shortcuts
   - Best practices

5. **Common mistakes** (150-200 words)
   - What to avoid
   - How to fix errors

6. **Conclusion** (100-150 words)
   - Summary
   - Next steps
`,
      // Add more English templates as needed...
    },
  };

  return templates[language]?.[format] || templates.en['informatief'];
}

// ============================================================================
// Exports
// ============================================================================

export const ContentFormatDetector = {
  detectFormat: detectContentFormat,
  detectLanguage: detectLanguage,
  getTemplate: getContentTemplate,
};
