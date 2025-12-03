
/**
 * Universele AI-tekst Humanisatie Engine
 * Maakt AI-gegenereerde teksten natuurlijker en menselijker
 */

// 1. Formele woorden vervangen (max 10 regels)
const FORMAL_WORD_REPLACEMENTS: Record<string, string[]> = {
  'uiteraard': ['natuurlijk', 'zeker', 'logisch'],
  'optimaal': ['goed', 'fijn', 'prima', 'ideaal'],
  'diverse': ['verschillende', 'een aantal', 'meerdere'],
  'tevens': ['ook', 'daarnaast', 'bovendien'],
  'dient te': ['moet', 'kan', 'zou moeten'],
  'teneinde': ['om', 'zodat'],
  'alsmede': ['en', 'plus'],
  'ten behoeve van': ['voor', 'om te helpen'],
  'gedurende': ['tijdens', 'in'],
  'ontdekken': ['zien', 'vinden', 'bekijken'],
};

// 2. AI-patronen herkennen (max 5 patronen)
const AI_PATTERNS = [
  {
    name: 'Opsommingen met "en...en...en"',
    regex: /(\w+),\s+(\w+)\s+en\s+(\w+)/g,
    description: 'Varieer met punten of splits zinnen',
  },
  {
    name: 'Perfecte lijstjes van 3',
    regex: /(\w+),\s+(\w+)\s+en\s+(\w+)\./g,
    description: 'Maak lijsten van 2, 4 of onregelmatig',
  },
  {
    name: '"Of het nu...is" constructies',
    regex: /Of het nu .+ is,/gi,
    description: 'Begin direct met onderwerp',
  },
  {
    name: 'Vraag gevolgd door eigen antwoord',
    regex: /\?\s+[A-Z]\w+\s+(biedt|heeft|is|zijn|geeft)/g,
    description: 'Alleen vraag óf alleen statement',
  },
  {
    name: '"Perfect voor" patronen',
    regex: /Perfect voor \w+/gi,
    description: 'Fijn voor / Geschikt voor / weglaten',
  },
];

// 3. Toevoegen voor natuurlijkheid
const IMPERFECTION_WORDS = ['hoewel', 'soms', 'meestal', 'vaak', 'eigenlijk'];
const PERSONAL_PRONOUNS = ['je', 'we', 'ons', 'jouw', 'onze'];
const MILD_DOUBT_WORDS = ['misschien', 'waarschijnlijk', 'vaak', 'doorgaans'];

/**
 * Hoofdfunctie: Humaniseert een tekst volgens alle regels
 */
export async function humanizeText(text: string, language: string = 'nl'): Promise<{
  humanizedText: string;
  metrics: HumanizationMetrics;
  warnings: string[];
}> {
  let result = text;
  const warnings: string[] = [];

  // Stap 1: Vervang formele woorden (70% van gevonden woorden)
  result = replaceFormalWords(result, 0.7);

  // Stap 2: Detecteer AI-patronen
  const detectedPatterns = detectAIPatterns(result);
  if (detectedPatterns.length > 0) {
    warnings.push(...detectedPatterns.map(p => `AI-patroon gedetecteerd: ${p}`));
  }

  // Stap 3: Bereken en pas zinslengte aan
  result = adjustSentenceLength(result);

  // Stap 4: Controleer beginwoorden opeenvolgende zinnen
  result = varyStartingWords(result);

  // Stap 5: Voeg imperfecties toe (1-2 per alinea)
  result = addImperfections(result);

  // Stap 6: Inject persoonlijke voornaamwoorden (min 2 per alinea)
  result = injectPersonalPronouns(result);

  // Stap 7: Vervang absolute statements door milde twijfel
  result = softenAbsoluteStatements(result);

  // Bereken metrics
  const metrics = calculateMetrics(result);

  return { humanizedText: result, metrics, warnings };
}

/**
 * Stap 1: Vervang formele woorden
 */
function replaceFormalWords(text: string, replaceRatio: number = 0.7): string {
  let result = text;
  
  for (const [formal, replacements] of Object.entries(FORMAL_WORD_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    const matches = text.match(regex);
    
    if (matches) {
      const numToReplace = Math.floor(matches.length * replaceRatio);
      let replaced = 0;
      
      result = result.replace(regex, (match) => {
        if (replaced < numToReplace && Math.random() > 0.3) {
          replaced++;
          const replacement = replacements[Math.floor(Math.random() * replacements.length)];
          return match[0] === match[0].toUpperCase() 
            ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
            : replacement;
        }
        return match;
      });
    }
  }
  
  return result;
}

/**
 * Stap 2: Detecteer AI-patronen
 */
function detectAIPatterns(text: string): string[] {
  const detected: string[] = [];
  
  for (const pattern of AI_PATTERNS) {
    if (pattern.regex.test(text)) {
      detected.push(`${pattern.name}: ${pattern.description}`);
    }
  }
  
  return detected;
}

/**
 * Stap 3: Pas zinslengte aan (40% kort, 40% middel, 20% lang)
 */
function adjustSentenceLength(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length === 0) return text;

  const sentenceData = sentences.map(s => ({
    text: s.trim(),
    wordCount: s.trim().split(/\s+/).length,
  }));

  // Check huidige distributie
  const short = sentenceData.filter(s => s.wordCount >= 5 && s.wordCount <= 12).length;
  const medium = sentenceData.filter(s => s.wordCount >= 13 && s.wordCount <= 20).length;
  const long = sentenceData.filter(s => s.wordCount >= 21 && s.wordCount <= 30).length;

  const total = sentences.length;
  const shortRatio = short / total;
  const mediumRatio = medium / total;
  const longRatio = long / total;

  // Als verdeling niet klopt (>20% afwijking), return origineel met waarschuwing
  // Voor nu accepteren we alle verdelingen
  return text;
}

/**
 * Stap 4: Varieer beginwoorden (max 2 opeenvolgende met zelfde beginwoord)
 */
function varyStartingWords(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length < 3) return text;

  const startWords = sentences.map(s => {
    const trimmed = s.trim();
    const firstWord = trimmed.split(/\s+/)[0];
    return firstWord.toLowerCase();
  });

  // Check voor >2 opeenvolgende met zelfde beginwoord
  let consecutiveCount = 1;
  for (let i = 1; i < startWords.length; i++) {
    if (startWords[i] === startWords[i - 1]) {
      consecutiveCount++;
      if (consecutiveCount > 2) {
        // Probleem gedetecteerd maar we passen niet automatisch aan
        // omdat dit complexe zinsherstructurering vereist
        break;
      }
    } else {
      consecutiveCount = 1;
    }
  }

  return text;
}

/**
 * Stap 5: Voeg imperfecties toe (1-2 per alinea)
 */
function addImperfections(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(para => {
    const sentences = para.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length < 2) return para;

    // Voeg 1-2 imperfecties toe
    const numImperfections = Math.random() > 0.5 ? 2 : 1;
    let result = para;

    for (let i = 0; i < numImperfections; i++) {
      const imperfection = IMPERFECTION_WORDS[Math.floor(Math.random() * IMPERFECTION_WORDS.length)];
      const sentenceIndex = Math.floor(Math.random() * sentences.length);
      const targetSentence = sentences[sentenceIndex];
      
      // Voeg imperfection toe aan begin van zin (na hoofdletter)
      const modifiedSentence = targetSentence.replace(/^(\s*)([A-Z]\w+)/, `$1$2, ${imperfection},`);
      result = result.replace(targetSentence, modifiedSentence);
    }

    return result;
  }).join('\n\n');
}

/**
 * Stap 6: Inject persoonlijke voornaamwoorden (min 2 per alinea)
 */
function injectPersonalPronouns(text: string): string {
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(para => {
    // Tel huidige persoonlijke voornaamwoorden
    const currentCount = (para.match(/\b(je|we|ons|jouw|onze)\b/gi) || []).length;
    const wordCount = para.split(/\s+/).length;
    
    // Target: >2 per 100 woorden
    const targetCount = Math.max(2, Math.floor(wordCount / 50));
    
    if (currentCount >= targetCount) return para;

    // Voeg extra voornaamwoorden toe door aanpassingen
    let result = para;
    
    // Vervang "de gebruiker" → "je"
    result = result.replace(/\bde gebruiker\b/gi, 'je');
    result = result.replace(/\bgebruikers\b/gi, 'je');
    
    // Vervang "men" → "je"
    result = result.replace(/\bmen\b/gi, 'je');
    
    // Voeg "we" toe bij algemene statements
    result = result.replace(/\bHet is belangrijk\b/gi, 'Het is voor ons belangrijk');
    
    return result;
  }).join('\n\n');
}

/**
 * Stap 7: Vervang absolute statements door milde twijfel
 */
function softenAbsoluteStatements(text: string): string {
  let result = text;
  
  // Vervang "altijd" → "meestal"
  result = result.replace(/\baltijd\b/gi, 'meestal');
  
  // Vervang "nooit" → "zelden"
  result = result.replace(/\bnooit\b/gi, 'zelden');
  
  // Vervang "iedereen" → "de meeste mensen"
  result = result.replace(/\biedereen\b/gi, 'de meeste mensen');
  
  // Voeg "waarschijnlijk" toe aan stellige claims
  result = result.replace(/\bDit is de beste\b/gi, 'Dit is waarschijnlijk de beste');
  result = result.replace(/\bDit werkt perfect\b/gi, 'Dit werkt meestal goed');
  
  return result;
}

/**
 * Bereken metrics voor validatie
 */
function calculateMetrics(text: string): HumanizationMetrics {
  const words = text.split(/\s+/);
  const totalWords = words.length;
  
  // Tel formele woorden
  let formalWordCount = 0;
  for (const formal of Object.keys(FORMAL_WORD_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) formalWordCount += matches.length;
  }
  const formalWordPercentage = (formalWordCount / totalWords) * 100;
  
  // Tel persoonlijke voornaamwoorden
  const pronounMatches = text.match(/\b(je|we|ons|jouw|onze)\b/gi) || [];
  const pronounsPer100Words = (pronounMatches.length / totalWords) * 100;
  
  // Bereken zinslengte variatie
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length || 0;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Check opeenvolgende beginwoorden
  const startWords = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase());
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  for (let i = 1; i < startWords.length; i++) {
    if (startWords[i] === startWords[i - 1]) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }
  
  // Detecteer AI-patronen
  const aiPatternCount = detectAIPatterns(text).length;
  
  return {
    formalWordPercentage,
    sentenceLengthStdDev: stdDev,
    pronounsPer100Words,
    maxConsecutiveStartWords: maxConsecutive,
    aiPatternCount,
    totalWords,
    totalSentences: sentences.length,
  };
}

/**
 * Valideer of tekst voldoet aan menselijke criteria
 */
export function validateHumanization(metrics: HumanizationMetrics): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Criterium 1: Formele woorden <5%
  if (metrics.formalWordPercentage > 5) {
    issues.push(`Te veel formele woorden: ${metrics.formalWordPercentage.toFixed(1)}% (target: <5%)`);
  }
  
  // Criterium 2: Zinslengte variatie StdDev >5
  if (metrics.sentenceLengthStdDev < 5) {
    issues.push(`Te weinig zinslengte variatie: ${metrics.sentenceLengthStdDev.toFixed(1)} (target: >5)`);
  }
  
  // Criterium 3: Persoonlijke voornaamwoorden >2 per 100 woorden
  if (metrics.pronounsPer100Words < 2) {
    issues.push(`Te weinig persoonlijke voornaamwoorden: ${metrics.pronounsPer100Words.toFixed(1)} per 100 woorden (target: >2)`);
  }
  
  // Criterium 4: Max 2 opeenvolgende zinnen met zelfde beginwoord
  if (metrics.maxConsecutiveStartWords > 2) {
    issues.push(`Te veel opeenvolgende zinnen met zelfde beginwoord: ${metrics.maxConsecutiveStartWords} (target: <3)`);
  }
  
  // Criterium 5: Geen AI-patronen
  if (metrics.aiPatternCount > 0) {
    issues.push(`AI-patronen gedetecteerd: ${metrics.aiPatternCount} (target: 0)`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
  };
}

export interface HumanizationMetrics {
  formalWordPercentage: number;
  sentenceLengthStdDev: number;
  pronounsPer100Words: number;
  maxConsecutiveStartWords: number;
  aiPatternCount: number;
  totalWords: number;
  totalSentences: number;
}
