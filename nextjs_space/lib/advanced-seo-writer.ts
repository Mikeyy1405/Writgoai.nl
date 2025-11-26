
/**
 * 🚀 Advanced SEO Writer
 * Professionele SEO tekst generator met volledige configuratie
 * - Web research voor actuele info
 * - Configureerbare parameters (lengte, toon, keywords)
 * - Verboden woorden check
 * - Structured output met statistieken
 */

import { chatCompletion } from './aiml-api';
import { quickWebSearch } from './web-research-v2';
import { findRelevantInternalLinks } from './sitemap-loader';

// 🚫 Verboden woorden en zinnen
export const DEFAULT_FORBIDDEN_WORDS = [
  'wereld van', 'in de wereld van', 'in een wereld van',
  'cruciaal', 'essentieel', 'kortom',
  'superheld', 'superheldin', 'superkracht',
  'game changer', 'gamechanger', 'game-changer',
  'toverwoord', 'tovermiddel', 'wondermiddel',
  'heilige graal',
  'magische oplossing', 'magisch middel',
  'revolutionair', 'baanbrekend',
  'ultiem', 'ultieme',
  'definitief', 'definitieve',
  'absoluut', 'absolute',
  'perfect', 'perfecte',
  'ideaal', 'ideale',
  'onmisbaar', 'onmisbare',
];

// 🚫 Verboden headings (worden apart gecontroleerd)
export const FORBIDDEN_HEADINGS = [
  'conclusie',
  'afsluiting',
  'call to action',
  'samenvatting',
  'afsluitend',
  'slot',
  'tot slot',
];

export interface SEOWriterConfig {
  // Basis parameters
  topic: string;                         // Het onderwerp
  wordCount?: number;                    // Gewenst aantal woorden (default: 1000)
  tone?: 'professional' | 'casual' | 'friendly' | 'formal'; // Tone of voice
  language?: 'nl' | 'en';               // Taal
  
  // SEO parameters
  keywords?: string[];                   // Focus keywords
  includeSEO?: boolean;                  // SEO optimalisatie (default: true)
  includeImages?: boolean;               // Afbeelding suggesties (default: true)
  includeTOC?: boolean;                  // Table of contents (default: true)
  
  // Content parameters
  websiteUrl?: string;                   // Website voor interne links
  sitemap?: any;                         // Sitemap data voor interne links
  targetAudience?: string;               // Doelgroep
  brandVoice?: string;                   // Brand voice
  
  // Filtering
  forbiddenWords?: string[];             // Extra verboden woorden
  
  // Research
  webResearch?: boolean;                 // Gebruik web research (default: true)
  numSources?: number;                   // Aantal bronnen (default: 3)
}

export interface SEOWriterResult {
  success: boolean;
  
  // Content
  title: string;
  content: string;                       // Volledige HTML/Markdown content
  metaDescription: string;
  
  // Statistieken
  stats: {
    wordCount: number;
    characterCount: number;
    readingTime: number;                 // In minuten
    headingCount: number;
    paragraphCount: number;
    imageCount: number;
    internalLinkCount: number;
    externalLinkCount: number;
  };
  
  // SEO
  seoScore: number;                      // 0-100
  keywords: string[];
  keywordDensity: { [keyword: string]: number };
  
  // Quality checks
  qualityChecks: {
    noForbiddenWords: boolean;
    goodLength: boolean;
    goodStructure: boolean;
    goodReadability: boolean;
  };
  
  // Suggestions
  suggestions: string[];
  warnings: string[];
  
  // Debug info
  sources?: string[];                    // Gebruikte bronnen
  generationTime?: number;               // Tijd in ms
  
  // Error
  error?: string;
}

/**
 * 🎯 Hoofdfunctie: Genereer SEO-geoptimaliseerde content
 */
export async function generateSEOContent(
  config: SEOWriterConfig,
  onProgress?: (step: string, progress: number) => void
): Promise<SEOWriterResult> {
  const startTime = Date.now();
  
  try {
    onProgress?.('🚀 Blog generatie gestart...', 5);
    
    // ═══════════════════════════════════════════════════════════
    // 1️⃣ VALIDATIE & DEFAULTS
    // ═══════════════════════════════════════════════════════════
    
    const {
      topic,
      wordCount = 1000,
      tone = 'professional',
      language = 'nl',
      keywords = [],
      includeSEO = true,
      includeImages = true,
      includeTOC = true,
      websiteUrl,
      sitemap,
      targetAudience,
      brandVoice,
      forbiddenWords = [],
      webResearch = true,
      numSources = 3,
    } = config;
    
    // Validatie
    if (!topic || topic.trim().length < 3) {
      return {
        success: false,
        title: '',
        content: '',
        metaDescription: '',
        stats: getEmptyStats(),
        seoScore: 0,
        keywords: [],
        keywordDensity: {},
        qualityChecks: getEmptyQualityChecks(),
        suggestions: [],
        warnings: [],
        error: 'Onderwerp is te kort (minimaal 3 karakters)',
      };
    }
    
    // Combineer verboden woorden
    const allForbiddenWords = [...DEFAULT_FORBIDDEN_WORDS, ...forbiddenWords];
    
    onProgress?.('✅ Configuratie gevalideerd', 10);
    
    // ═══════════════════════════════════════════════════════════
    // 2️⃣ WEB RESEARCH (optioneel)
    // ═══════════════════════════════════════════════════════════
    
    let researchResults = '';
    let sources: string[] = [];
    
    if (webResearch) {
      onProgress?.('🔍 Web research uitvoeren...', 20);
      console.log(`🔍 Starting web research for: ${topic}`);
      try {
        researchResults = await quickWebSearch(topic);
        sources = ['Web search results'];
        console.log(`✅ Web research completed`);
        onProgress?.('✅ Research voltooid', 35);
      } catch (error) {
        console.warn('⚠️ Web research failed, continuing without:', error);
        onProgress?.('⚠️ Research overgeslagen', 35);
        // Continue zonder research
      }
    } else {
      onProgress?.('⏭️ Research overgeslagen', 35);
    }
    
    // ═══════════════════════════════════════════════════════════
    // 3️⃣ INTERNE LINKS (optioneel)
    // ═══════════════════════════════════════════════════════════
    
    let internalLinksText = '';
    
    if (websiteUrl && sitemap) {
      onProgress?.('🔗 Interne links zoeken...', 40);
      try {
        const relevantLinks = findRelevantInternalLinks(sitemap, topic, 5);
        
        if (relevantLinks && relevantLinks.length > 0) {
          internalLinksText = `\n\n🔗 INTERNE LINKS (gebruik deze in de blog waar relevant):\n${relevantLinks.map((link: any) => `- [${link.title}](${link.url})`).join('\n')}\n\nVoeg deze links toe in relevante secties. Gebruik natuurlijke anchor teksten.\n\n🚫 BELANGRIJK: Plaats NOOIT links in headings (H1, H2, H3, etc.) of FAQ vragen. Links mogen ALLEEN in normale tekst paragrafen.\n`;
          console.log(`✅ Found ${relevantLinks.length} relevant internal links`);
          onProgress?.(`✅ ${relevantLinks.length} interne links gevonden`, 45);
        } else {
          onProgress?.('⚠️ Geen interne links gevonden', 45);
        }
      } catch (error) {
        console.warn('⚠️ Failed to find internal links:', error);
        onProgress?.('⚠️ Interne links overgeslagen', 45);
        // Continue zonder interne links
      }
    } else {
      onProgress?.('⏭️ Interne links overgeslagen', 45);
    }
    
    // ═══════════════════════════════════════════════════════════
    // 4️⃣ BLOG GENERATIE
    // ═══════════════════════════════════════════════════════════
    
    onProgress?.('✍️ Blog schrijven...', 50);
    console.log(`✍️ Generating blog: ${topic} (${wordCount} words, ${tone} tone)`);
    
    // Bouw de prompt
    const systemPrompt = language === 'nl' 
      ? buildDutchSystemPrompt(tone)
      : buildEnglishSystemPrompt(tone);
    
    const userPrompt = buildUserPrompt({
      topic,
      wordCount,
      keywords,
      includeSEO,
      includeImages,
      includeTOC,
      websiteUrl,
      targetAudience,
      brandVoice,
      allForbiddenWords,
      researchResults,
      internalLinksText,
      language,
    });
    
    // Genereer content met AIML API
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5-20250929', // Beste model voor content writing
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: wordCount * 3, // Ruim genoeg voor markdown + formatting
    });
    
    const generatedContent = response.choices[0]?.message?.content || '';
    
    if (!generatedContent) {
      throw new Error('No content generated by AI');
    }
    
    onProgress?.('✅ Blog geschreven', 70);
    
    // ═══════════════════════════════════════════════════════════
    // 5️⃣ CONTENT PROCESSING & ANALYSE
    // ═══════════════════════════════════════════════════════════
    
    onProgress?.('🔍 Content analyse...', 75);
    
    // STAP 1: Post-processing - verwijder verboden woorden
    let processedContent = generatedContent;
    const foundForbiddenWords: string[] = [];
    
    // Check voor verboden woorden (case-insensitive)
    allForbiddenWords.forEach((forbiddenWord) => {
      const regex = new RegExp(forbiddenWord, 'gi');
      const matches = processedContent.match(regex);
      if (matches && matches.length > 0) {
        foundForbiddenWords.push(forbiddenWord);
        // Verwijder of vervang het verboden woord
        // Voor nu loggen we alleen, maar we kunnen ook auto-correct doen
        console.warn(`⚠️ Verboden woord gevonden: "${forbiddenWord}" (${matches.length}x)`);
      }
    });
    
    // STAP 2: Detecteer dubbele headings
    const lines = processedContent.split('\n');
    const doubleHeadings: string[] = [];
    let previousLineWasHeading = false;
    let currentHeading = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const isHeading = /^#{1,6}\s+.+$/.test(line);
      
      if (isHeading) {
        if (previousLineWasHeading) {
          doubleHeadings.push(`Lijn ${i}: "${currentHeading}" → "${line}"`);
        }
        currentHeading = line;
        previousLineWasHeading = true;
      } else if (line.length > 0) {
        // Een niet-lege regel die geen heading is
        previousLineWasHeading = false;
      }
      // Lege regels tellen niet mee
    }
    
    // STAP 3: Detecteer verboden headings
    const forbiddenHeadingPatterns = FORBIDDEN_HEADINGS;
    const foundForbiddenHeadings: string[] = [];
    
    const headingMatches = processedContent.matchAll(/^#{1,6}\s+(.+)$/gm);
    for (const match of headingMatches) {
      const headingText = match[1].toLowerCase().trim();
      for (const forbidden of forbiddenHeadingPatterns) {
        if (headingText === forbidden.toLowerCase() || headingText.includes(forbidden.toLowerCase())) {
          foundForbiddenHeadings.push(match[1]);
        }
      }
    }
    
    onProgress?.('✅ Analyse voltooid', 80);
    
    // Extract title (eerste H1 of H2)
    let title = topic;
    const titleMatch = processedContent.match(/^#\s+(.+)$/m) || processedContent.match(/^##\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Extract meta description (eerste paragraaf zonder heading, max 125 karakters)
    let metaDescription = '';
    const paragraphs = processedContent.split('\n\n').filter((p: string) => !p.startsWith('#') && p.trim().length > 0);
    if (paragraphs.length > 0) {
      metaDescription = paragraphs[0].substring(0, 125).trim();
      // Zorg dat het begint met een hoofdletter
      if (metaDescription.length > 0) {
        metaDescription = metaDescription.charAt(0).toUpperCase() + metaDescription.slice(1);
      }
      if (paragraphs[0].length > 125) {
        metaDescription += '...';
      }
    }
    
    onProgress?.('📊 Statistieken berekenen...', 85);
    
    // Calculate stats
    const stats = calculateStats(processedContent);
    
    // Calculate SEO score
    const seoScore = calculateSEOScore(processedContent, {
      wordCount,
      keywords,
      includeSEO,
    });
    
    // Check keyword density
    const keywordDensity = calculateKeywordDensity(processedContent, keywords);
    
    // Quality checks
    const qualityChecks = performQualityChecks(processedContent, {
      wordCount,
      forbiddenWords: allForbiddenWords,
    });
    
    onProgress?.('✅ Kwaliteit controle', 90);
    
    // Generate suggestions and warnings
    const suggestions: string[] = [];
    const warnings: string[] = [];
    
    // Word count check
    if (stats.wordCount < wordCount * 0.8) {
      warnings.push(`Content is korter dan verwacht (${stats.wordCount}/${wordCount} woorden)`);
    } else if (stats.wordCount >= wordCount) {
      suggestions.push(`Uitstekende lengte: ${stats.wordCount} woorden`);
    }
    
    // Heading count check
    if (stats.headingCount < 3) {
      warnings.push('Weinig koppen - voeg meer structuur toe');
    } else if (stats.headingCount >= 5) {
      suggestions.push(`Goede structuur met ${stats.headingCount} koppen`);
    }
    
    // SEO score check
    if (seoScore < 70) {
      suggestions.push('SEO kan verbeterd worden door meer keywords toe te voegen');
    } else if (seoScore >= 85) {
      suggestions.push(`Uitstekende SEO score: ${seoScore}/100`);
    }
    
    // Forbidden words warnings
    if (foundForbiddenWords.length > 0) {
      warnings.push(`⚠️ VERBODEN WOORDEN GEVONDEN: ${foundForbiddenWords.join(', ')}`);
      warnings.push('🔧 Deze woorden moeten handmatig worden verwijderd/vervangen');
    }
    
    // Double headings warnings
    if (doubleHeadings.length > 0) {
      warnings.push(`⚠️ DUBBELE HEADINGS GEVONDEN (${doubleHeadings.length}x)`);
      warnings.push('🔧 Voeg tekst toe tussen deze headings:');
      doubleHeadings.forEach(dh => warnings.push(`   - ${dh}`));
    }
    
    // Forbidden headings warnings
    if (foundForbiddenHeadings.length > 0) {
      warnings.push(`⚠️ VERBODEN HEADINGS GEVONDEN: ${foundForbiddenHeadings.join(', ')}`);
      warnings.push('🔧 Vervang deze headings door specifiekere alternatieven');
    }
    
    // Quality checks
    if (!qualityChecks.noForbiddenWords) {
      warnings.push('⚠️ Content bevat verboden woorden - herzien nodig!');
    }
    
    if (!qualityChecks.goodStructure) {
      suggestions.push('Verbeter de structuur met meer koppen en subsecties');
    }
    
    onProgress?.('🎉 Blog voltooid!', 95);
    
    // ═══════════════════════════════════════════════════════════
    // 6️⃣ RETURN RESULT
    // ═══════════════════════════════════════════════════════════
    
    const generationTime = Date.now() - startTime;
    
    onProgress?.('✅ Voltooid!', 100);
    
    console.log(`✅ Blog generated successfully in ${generationTime}ms`);
    console.log(`   📝 Title: ${title}`);
    console.log(`   📊 Words: ${stats.wordCount}/${wordCount}`);
    console.log(`   🎯 SEO Score: ${seoScore}/100`);
    if (foundForbiddenWords.length > 0) {
      console.warn(`   ⚠️ Forbidden words found: ${foundForbiddenWords.join(', ')}`);
    }
    if (doubleHeadings.length > 0) {
      console.warn(`   ⚠️ Double headings found: ${doubleHeadings.length}`);
    }
    if (foundForbiddenHeadings.length > 0) {
      console.warn(`   ⚠️ Forbidden headings found: ${foundForbiddenHeadings.join(', ')}`);
    }
    
    return {
      success: true,
      title,
      content: processedContent, // ✅ Use processed content instead of generated content
      metaDescription,
      stats,
      seoScore,
      keywords,
      keywordDensity,
      qualityChecks,
      suggestions,
      warnings,
      sources: sources.length > 0 ? sources : undefined,
      generationTime,
    };
    
  } catch (error: any) {
    console.error('❌ SEO content generation failed:', error);
    
    return {
      success: false,
      title: '',
      content: '',
      metaDescription: '',
      stats: getEmptyStats(),
      seoScore: 0,
      keywords: [],
      keywordDensity: {},
      qualityChecks: getEmptyQualityChecks(),
      suggestions: [],
      warnings: [],
      error: error.message || 'Unknown error',
      generationTime: Date.now() - startTime,
    };
  }
}

// ═══════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function buildDutchSystemPrompt(tone: string): string {
  const toneDescriptions = {
    professional: 'professioneel en zakelijk',
    casual: 'casual en toegankelijk',
    friendly: 'vriendelijk en persoonlijk',
    formal: 'formeel en gepolijst',
  };
  
  return `Je bent een expert SEO content schrijver die hoogwaardige Nederlandse content creëert.

═══════════════════════════════════════════════════════════
🚫 KRITIEKE REGELS - OVERTREDING = ONACCEPTABEL
═══════════════════════════════════════════════════════════

**1. VERBODEN WOORDEN/ZINNEN (NOOIT GEBRUIKEN):**
❌ "wereld van", "in de wereld van", "in een wereld van"
❌ "cruciaal", "essentieel", "kortom"
❌ "superheld", "superheldin", "superkracht"
❌ "game changer", "gamechanger"
❌ "toverwoord", "tovermiddel", "wondermiddel", "heilige graal"
❌ "magische oplossing", "magisch middel"
❌ "revolutionair", "baanbrekend"
❌ "ultiem", "ultieme", "definitief", "definitieve"
❌ "absoluut", "absolute", "totaal", "totale", "volledig", "volledige"
❌ "perfect", "perfecte", "ideaal", "ideale", "onmisbaar", "onmisbare"

**2. VERBODEN HEADINGS (NOOIT GEBRUIKEN ALS H2/H3):**
❌ "Conclusie"
❌ "Afsluiting"
❌ "Call to Action"
❌ "Samenvatting"
❌ "Slot"
❌ "Tot Slot"
❌ "Afsluitend"

**3. STRUCTUUR REGELS (VERPLICHT):**
❌ NOOIT twee headings direct na elkaar
❌ NOOIT een heading zonder minimaal 2-3 zinnen tekst erna
✅ ALTIJD minimaal 2-3 zinnen tussen elke heading
✅ Gebruik specifieke, contextuele headings die bij het onderwerp passen

═══════════════════════════════════════════════════════════
✍️ SCHRIJFSTIJL
═══════════════════════════════════════════════════════════

**Toon:** ${toneDescriptions[tone as keyof typeof toneDescriptions] || 'professioneel'}

**Kenmerken:**
- Helder en goed gestructureerd
- SEO-geoptimaliseerd maar natuurlijk lezend
- Boeiend, informatief en waardevol
- Korte, scanbare paragrafen (2-4 zinnen max)
- Concrete voorbeelden en praktische tips
- Natuurlijke, vloeiende taal

**Formatting:**
- Gebruik ## voor hoofdkoppen (H2)
- Gebruik ### voor subkoppen (H3)
- Gebruik opsommingen (bullets) voor lijstjes
- Gebruik genummerde lijsten voor stappen
- Voeg tabellen toe voor vergelijkingen
- Gebruik **bold** voor belangrijke punten
- Gebruik *cursief* voor emphasis (spaar zaam)

**SEO Optimalisatie:**
- Gebruik keywords natuurlijk verspreid
- Optimaliseer headings voor zoek intent
- Voeg semantisch gerelateerde woorden toe
- Plaats belangrijke keywords in eerste paragraaf
- Gebruik LSI keywords (gerelateerde termen)

**Bedrijfspromotie:**
❌ NIET zomaar bedrijf/merk promoten
✅ Focus op waarde voor de lezer
✅ Alleen URL vermelden als relevant voor context

═══════════════════════════════════════════════════════════
📋 CHECKLIST VOOR INLEVERING
═══════════════════════════════════════════════════════════

Voor je de blog inlevert, controleer:
✅ GEEN verboden woorden gebruikt
✅ GEEN verboden headings gebruikt
✅ GEEN twee headings na elkaar (altijd tekst tussen)
✅ Minimaal 5 H2 headings
✅ Duidelijke structuur met logische opbouw
✅ Keywords natuurlijk verwerkt
✅ Korte, scanbare paragrafen
✅ Relevante, contextuele afsluiting (geen generieke conclusie)

Schrijf volledige, publicatie-ready content die DIRECT gebruikt kan worden!`;
}

function buildEnglishSystemPrompt(tone: string): string {
  const toneDescriptions = {
    professional: 'professional and business-like',
    casual: 'casual and accessible',
    friendly: 'friendly and personal',
    formal: 'formal and polished',
  };
  
  return `You are an expert SEO content writer creating high-quality English content.

**Writing Style:**
- ${toneDescriptions[tone as keyof typeof toneDescriptions] || 'professional'}
- Clear and well-structured
- SEO-optimized but natural
- Engaging and informative

**Formatting:**
- Use ## for main headings (H2)
- Use ### for subheadings (H3)
- Use bullet points and lists
- Add tables where useful
- Keep paragraphs short and readable (max 3-4 sentences)

**SEO:**
- Use keywords naturally throughout
- Optimize headings for search intent
- Write a compelling meta description
- Add internal links where relevant

Always write complete, publication-ready content.`;
}

interface PromptConfig {
  topic: string;
  wordCount: number;
  keywords: string[];
  includeSEO: boolean;
  includeImages: boolean;
  includeTOC: boolean;
  websiteUrl?: string;
  targetAudience?: string;
  brandVoice?: string;
  allForbiddenWords: string[];
  researchResults: string;
  internalLinksText: string;
  language: string;
}

function buildUserPrompt(config: PromptConfig): string {
  const {
    topic,
    wordCount,
    keywords,
    includeSEO,
    includeImages,
    includeTOC,
    websiteUrl,
    targetAudience,
    brandVoice,
    allForbiddenWords,
    researchResults,
    internalLinksText,
    language,
  } = config;
  
  let prompt = `═══════════════════════════════════════════════════════════
🎯 SCHRIJFOPDRACHT
═══════════════════════════════════════════════════════════

Schrijf een ${includeSEO ? 'SEO-geoptimaliseerde ' : ''}blog over: **"${topic}"**

═══════════════════════════════════════════════════════════
📊 SPECIFICATIES
═══════════════════════════════════════════════════════════

**Lengte:** ${wordCount} woorden (minimaal ${Math.floor(wordCount * 0.9)} woorden)
**Taal:** ${language === 'nl' ? 'Nederlands' : 'English'}
${keywords.length > 0 ? `**Keywords:** ${keywords.join(', ')}\n` : ''}
${websiteUrl ? `**Website:** ${websiteUrl}\n` : ''}
${targetAudience ? `**Doelgroep:** ${targetAudience}\n` : ''}
${brandVoice ? `**Brand voice:** ${brandVoice}\n` : ''}

═══════════════════════════════════════════════════════════
📝 STRUCTUUR VEREISTEN
═══════════════════════════════════════════════════════════

**Opbouw:**
1. Pakkende inleiding (2-3 paragrafen)
   - Hook de lezer met relevante vraag of statement
   - Introduceer het onderwerp
   - Vooruitblik op wat de lezer gaat leren

${includeTOC ? '2. Inhoudsopgave (automatisch gegenereerd)\n' : ''}

2. Hoofdgedeelte met 5-8 H2 secties
   - Elke sectie minimaal 2-3 paragrafen
   - Gebruik ### voor subsecties waar nodig
   - Voeg concrete voorbeelden toe
   - Gebruik bullet points voor overzichtelijkheid
   - Voeg tabellen toe voor vergelijkingen
   
3. Relevante afsluiting
   - Vat kort de kernpunten samen
   - Geef actionable next steps
   - ❌ GEEN heading "Conclusie" of "Afsluiting"
   - ✅ Gebruik specifieke heading zoals "Hoe start je met [onderwerp]" of "Jouw volgende stappen"

${includeImages ? '\n**Afbeeldingen:**\n- Suggereer relevante afbeeldingen met [AFBEELDING: beschrijving]\n- Minimaal 3-5 afbeeldingen verspreid door de blog\n' : ''}

═══════════════════════════════════════════════════════════
🚫 KRITIEKE REGELS (VERPLICHT)
═══════════════════════════════════════════════════════════

**1. STRUCTUUR:**
❌ NOOIT twee headings direct na elkaar
❌ NOOIT een heading zonder minimaal 2-3 zinnen tekst
✅ ALTIJD minimaal 2-3 zinnen tussen elke heading
✅ Elke paragraaf 2-4 zinnen maximaal

**2. VERBODEN HEADINGS:**
❌ "Conclusie", "Afsluiting", "Call to Action", "Samenvatting", "Slot", "Tot Slot"
✅ Gebruik specifieke, contextuele headings

**3. VERBODEN WOORDEN (GEBRUIK DEZE NOOIT!):**
${allForbiddenWords.map(w => `❌ "${w}"`).join('\n')}

**4. SCHRIJFSTIJL:**
❌ GEEN overdreven marketing taal
❌ GEEN ongegronde claims ("beste", "perfect", etc.)
❌ GEEN bedrijfspromotie (tenzij specifiek gevraagd)
✅ Feitelijk, informatief en waardevol
✅ Concrete voorbeelden en praktische tips
✅ Natuurlijke, vloeiende taal

═══════════════════════════════════════════════════════════
${researchResults ? `🌐 WEB RESEARCH RESULTATEN
═══════════════════════════════════════════════════════════

Gebruik deze actuele informatie in je blog:

${researchResults}

═══════════════════════════════════════════════════════════
` : ''}${internalLinksText ? `${internalLinksText}
═══════════════════════════════════════════════════════════
` : ''}${includeSEO ? `🎯 SEO OPTIMALISATIE
═══════════════════════════════════════════════════════════

**Keywords verwerken:**
- Gebruik hoofdkeyword in eerste paragraaf
- Verwerk keywords natuurlijk door de tekst (niet geforceerd!)
- Gebruik variaties en synoniemen
- Keyword density: 0.5-1.5% (natuurlijk gebruik)

**Headings optimaliseren:**
- Gebruik keywords in H2/H3 waar natuurlijk
- Focus op zoek intent (vragen beantwoorden)
- Maak headings specifiek en informatief

**Leesbaarheid:**
- Korte zinnen en paragrafen
- Bullet points voor lijstjes
- Duidelijke structuur met witruimte
- Scanbare content

═══════════════════════════════════════════════════════════
` : ''}✍️ SCHRIJF NU DE VOLLEDIGE BLOG
═══════════════════════════════════════════════════════════

BEGIN METEEN MET DE EERSTE H2 HEADING (geen inleidende tekst zoals "Hier is de blog...").

Voorbeeld structuur:

## [Eerste H2 heading]

[2-3 paragrafen tekst met concrete informatie]

### [H3 subheading indien nodig]

[Paragraaf met details]

- Bullet point 1
- Bullet point 2
- Bullet point 3

[Nog een paragraaf]

## [Tweede H2 heading]

[Continue met deze structuur...]

**LET OP:** Controleer voor inlevering:
✅ Geen verboden woorden
✅ Geen verboden headings
✅ Geen dubbele headings (altijd tekst tussen)
✅ Minimaal ${Math.floor(wordCount * 0.9)} woorden
✅ 5-8 H2 secties
✅ Relevante, specifieke afsluiting`;
  
  return prompt;
}

function calculateStats(content: string) {
  // Count words
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Count characters
  const characterCount = content.length;
  
  // Calculate reading time (200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);
  
  // Count headings
  const headingMatches = content.match(/^#{1,6}\s+.+$/gm) || [];
  const headingCount = headingMatches.length;
  
  // Count paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0 && !p.startsWith('#'));
  const paragraphCount = paragraphs.length;
  
  // Count images
  const imageMatches = content.match(/\[AFBEELDING:.*?\]/g) || [];
  const imageCount = imageMatches.length;
  
  // Count internal links
  const internalLinkMatches = content.match(/\[.*?\]\((?!http).*?\)/g) || [];
  const internalLinkCount = internalLinkMatches.length;
  
  // Count external links
  const externalLinkMatches = content.match(/\[.*?\]\(https?:\/\/.*?\)/g) || [];
  const externalLinkCount = externalLinkMatches.length;
  
  return {
    wordCount,
    characterCount,
    readingTime,
    headingCount,
    paragraphCount,
    imageCount,
    internalLinkCount,
    externalLinkCount,
  };
}

function calculateSEOScore(content: string, options: {
  wordCount: number;
  keywords: string[];
  includeSEO: boolean;
}): number {
  let score = 0;
  const contentLower = content.toLowerCase();
  
  // Length check (0-20 points)
  const actualWords = content.split(/\s+/).filter(w => w.length > 0).length;
  if (actualWords >= options.wordCount * 0.8) score += 20;
  else score += Math.floor((actualWords / options.wordCount) * 20);
  
  // Heading structure (0-20 points)
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  if (headings.length >= 5) score += 20;
  else score += headings.length * 4;
  
  // Keywords usage (0-30 points)
  if (options.keywords.length > 0) {
    let keywordScore = 0;
    options.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
      if (occurrences > 0 && occurrences < 10) {
        keywordScore += 30 / options.keywords.length;
      }
    });
    score += keywordScore;
  } else {
    score += 15; // Partial points if no keywords specified
  }
  
  // Paragraph structure (0-15 points)
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0 && !p.startsWith('#'));
  if (paragraphs.length >= 5) score += 15;
  else score += paragraphs.length * 3;
  
  // Lists and formatting (0-15 points)
  const lists = content.match(/^[\-\*]\s/gm) || [];
  if (lists.length >= 5) score += 15;
  else score += lists.length * 3;
  
  return Math.min(Math.round(score), 100);
}

function calculateKeywordDensity(content: string, keywords: string[]): { [keyword: string]: number } {
  const density: { [keyword: string]: number } = {};
  const words = content.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const occurrences = words.filter(w => w.includes(keywordLower)).length;
    density[keyword] = totalWords > 0 ? Math.round((occurrences / totalWords) * 10000) / 100 : 0;
  });
  
  return density;
}

function performQualityChecks(content: string, options: {
  wordCount: number;
  forbiddenWords: string[];
}) {
  const contentLower = content.toLowerCase();
  
  // Check forbidden words
  let hasForbiddenWords = false;
  for (const word of options.forbiddenWords) {
    if (contentLower.includes(word.toLowerCase())) {
      hasForbiddenWords = true;
      console.warn(`⚠️ Forbidden word found: "${word}"`);
      break;
    }
  }
  
  // Check length
  const actualWords = content.split(/\s+/).filter(w => w.length > 0).length;
  const goodLength = actualWords >= options.wordCount * 0.8 && actualWords <= options.wordCount * 1.3;
  
  // Check structure
  const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0 && !p.startsWith('#'));
  const goodStructure = headings.length >= 3 && paragraphs.length >= 5;
  
  // Check readability
  const avgParagraphLength = paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / (paragraphs.length || 1);
  const goodReadability = avgParagraphLength >= 30 && avgParagraphLength <= 100;
  
  return {
    noForbiddenWords: !hasForbiddenWords,
    goodLength,
    goodStructure,
    goodReadability,
  };
}

function getEmptyStats() {
  return {
    wordCount: 0,
    characterCount: 0,
    readingTime: 0,
    headingCount: 0,
    paragraphCount: 0,
    imageCount: 0,
    internalLinkCount: 0,
    externalLinkCount: 0,
  };
}

function getEmptyQualityChecks() {
  return {
    noForbiddenWords: false,
    goodLength: false,
    goodStructure: false,
    goodReadability: false,
  };
}

