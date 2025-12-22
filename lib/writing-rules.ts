// WritGo Schrijfregels en Verboden Woorden
// Deze regels worden toegepast op alle gegenereerde content

export const FORBIDDEN_WORDS = [
  'wereld van',
  'cruciaal',
  'essentieel',
  'kortom',
  'conclusie',
  'duik',
  'duiken',
  'induiken',
  'vriend',
  'jungle',
  'de sleutel',
  'key',
  'superheld',
  'spul',
  'veilige haven',
  'gids',
  'voordelen',
  'voordelen van',
  'digitaal tijdperk',
  'zonder gedoe',
  'gedoe',
  'of je',
  'of je nu',
  'in a nutshell',
  'dive in',
  'hassle',
  'guide',
];

export const WRITING_RULES = `
## Schrijfregels voor Content

### Taal en Stijl
- Nederlands, informeel (je/jij)
- Korte alinea's (max 3-4 zinnen)
- Praktische tips en voorbeelden
- Vette tekst voor belangrijke woorden
- Headings: alleen eerste letter hoofdletter
- Unieke headings (geen duplicaten)
- Lokale focus indien relevant

### Structuur
- SEO Title: 50-60 tekens met zoekwoord
- Meta Description: 120-155 tekens met CTA
- H1 hoofdtitel
- Intro: 2-3 zinnen
- H2 secties met praktische content
- Afsluiting met call-to-action

### Links en Media
- 3-5 interne links NATUURLIJK verwerkt
- 6-8 afbeeldingen met alt-tekst
- Afbeeldingen alleen van Pexels/Unsplash of AI gegenereerd

### Verboden
- Geen "In deze blog..." zinnen
- Geen lange paragrafen
- Geen bestaande onderwerpen herhalen
- Geen verboden woorden gebruiken (zie FORBIDDEN_WORDS)
`;

export const CONTENT_PROMPT_RULES = `
BELANGRIJKE SCHRIJFREGELS:
1. Schrijf in het Nederlands met "je" en "jij" (informeel)
2. Korte alinea's van maximaal 3-4 zinnen
3. Gebruik vette tekst voor belangrijke woorden
4. Headings: alleen eerste letter hoofdletter (bijv. "Hoe werkt het" niet "Hoe Werkt Het")
5. Elke heading moet uniek zijn
6. Geef praktische tips en concrete voorbeelden
7. Geen "In deze blog..." of "In dit artikel..." zinnen
8. Geen lange lappen tekst

VERBODEN WOORDEN (gebruik deze NOOIT):
- wereld van, cruciaal, essentieel, kortom, conclusie
- duik, duiken, induiken
- jungle, de sleutel, key
- superheld, spul, veilige haven, gids
- voordelen, voordelen van
- digitaal tijdperk, zonder gedoe, gedoe
- of je, of je nu

STRUCTUUR:
- Start met een pakkende intro (2-3 zinnen)
- Gebruik H2 voor hoofdsecties
- Gebruik H3 voor subsecties
- Eindig met een duidelijke call-to-action
`;

// Function to check content for forbidden words
export function checkForbiddenWords(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const foundWords: string[] = [];
  
  for (const word of FORBIDDEN_WORDS) {
    if (lowerContent.includes(word.toLowerCase())) {
      foundWords.push(word);
    }
  }
  
  return foundWords;
}

// Function to clean content from forbidden words
export function cleanForbiddenWords(content: string): string {
  let cleaned = content;
  
  // Replace common forbidden phrases with alternatives
  const replacements: Record<string, string> = {
    'cruciaal': 'belangrijk',
    'essentieel': 'nodig',
    'kortom': 'samengevat',
    'conclusie': 'tot slot',
    'de sleutel': 'het belangrijkste',
    'veilige haven': 'betrouwbare plek',
    'digitaal tijdperk': 'online wereld',
    'zonder gedoe': 'eenvoudig',
    'gedoe': 'moeite',
    'voordelen van': 'wat je krijgt met',
    'voordelen': 'pluspunten',
    'gids': 'handleiding',
    'superheld': 'expert',
  };
  
  for (const [forbidden, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(forbidden, 'gi');
    cleaned = cleaned.replace(regex, replacement);
  }
  
  return cleaned;
}
