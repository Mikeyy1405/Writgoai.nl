/**
 * 🚀 Ultimate Writer Engine
 * Combines all content generation features in one powerful engine
 * - Advanced SEO writing
 * - Web research integration
 * - SERP analysis
 * - Internal linking
 * - Bol.com products
 * - FAQ generation
 * - Image suggestions
 */

import { chatCompletion, TEXT_MODELS } from './aiml-api';
import { quickWebSearch } from './web-research-v2';
import { findRelevantInternalLinks } from './sitemap-loader';
import { searchBolcomProducts } from './bolcom-api';
import { DEFAULT_FORBIDDEN_WORDS, FORBIDDEN_HEADINGS } from './advanced-seo-writer';

export interface UltimateWriterConfig {
  // Basic
  contentType: string;
  topic: string;
  language: 'nl' | 'en';
  tone: string;
  wordCount: number;
  
  // SEO
  primaryKeyword: string;
  secondaryKeywords: string;
  generateLSI: boolean;
  generateMetaDescription: boolean;
  
  // Project
  projectId?: string;
  project?: any;
  
  // Research
  webResearch: boolean;
  serpAnalysis: boolean;
  
  // Content Features
  includeTableOfContents: boolean;
  includeFAQ: boolean;
  
  // Media
  includeImages: boolean;
  imageCount: number;
  
  // Bol.com
  includeBolProducts: boolean;
  bolProductCount: number;
  bolProducts?: any[];
  
  // Links
  includeInternalLinks: boolean;
  internalLinksCount: number;
  internalLinks?: Array<{ title: string; url: string }>;
}

export interface WriterProgress {
  phase: 'research' | 'outline' | 'writing' | 'optimization' | 'complete';
  progress: number;
  message: string;
  currentStep: string;
}

export interface WriterResult {
  content: string;
  metaDescription: string;
  stats: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    internalLinksAdded: number;
    externalLinksAdded: number;
    imagesAdded: number;
    bolProductsAdded: number;
    headingCount: number;
  };
}

/**
 * Stream-based content generation
 */
export async function* generateContentStream(
  config: UltimateWriterConfig,
  onProgress?: (progress: WriterProgress) => void
): AsyncGenerator<{ type: string; data: any }> {
  try {
    // Phase 1: Research
    yield { type: 'progress', data: {
      phase: 'research',
      progress: 10,
      message: 'Research verzamelen...',
      currentStep: 'Web research starten',
    }};

    let researchData = '';
    if (config.webResearch) {
      const searchResults = await quickWebSearch(
        `${config.primaryKeyword} ${config.topic}`,
        3
      );
      researchData = searchResults
        .map(r => `${r.title}\n${r.snippet}\nBron: ${r.url}`)
        .join('\n\n');
    }

    yield { type: 'progress', data: {
      phase: 'research',
      progress: 20,
      message: 'Research verzameld',
      currentStep: 'Data verwerken',
    }};

    // Phase 2: Outline
    yield { type: 'progress', data: {
      phase: 'outline',
      progress: 30,
      message: 'Outline maken...',
      currentStep: 'Structuur bepalen',
    }};

    const outline = await generateOutline(config, researchData);

    yield { type: 'progress', data: {
      phase: 'outline',
      progress: 40,
      message: 'Outline gereed',
      currentStep: 'Content gaan schrijven',
    }};

    // Phase 3: Writing
    yield { type: 'progress', data: {
      phase: 'writing',
      progress: 50,
      message: 'Content schrijven...',
      currentStep: 'AI aan het genereren',
    }};

    const content = await generateContent(config, outline, researchData);

    yield { type: 'progress', data: {
      phase: 'writing',
      progress: 70,
      message: 'Content gegenereerd',
      currentStep: 'Content optimaliseren',
    }};

    // Phase 4: Optimization
    yield { type: 'progress', data: {
      phase: 'optimization',
      progress: 80,
      message: 'Content optimaliseren...',
      currentStep: 'Links en media toevoegen',
    }};

    const optimizedContent = await optimizeContent(content, config);

    yield { type: 'progress', data: {
      phase: 'optimization',
      progress: 90,
      message: 'Bijna klaar...',
      currentStep: 'Laatste aanpassingen',
    }};

    // Generate meta description
    let metaDescription = '';
    if (config.generateMetaDescription) {
      metaDescription = await generateMetaDescription(config.topic, config.primaryKeyword);
    }

    // Calculate stats
    const stats = calculateStats(optimizedContent, config);

    yield { type: 'progress', data: {
      phase: 'complete',
      progress: 100,
      message: 'Voltooid!',
      currentStep: 'Content is klaar',
    }};

    // Stream content in chunks first
    const chunks = optimizedContent.match(/.{1,500}/gs) || [];
    for (const chunk of chunks) {
      yield { type: 'content', data: chunk };
    }

    // Send completion data
    yield {
      type: 'complete',
      data: {
        metaDescription,
        stats,
      },
    };

  } catch (error) {
    console.error('Ultimate Writer Error:', error);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate content outline
 */
async function generateOutline(config: UltimateWriterConfig, research: string): Promise<string> {
  const prompt = `Maak een gedetailleerde outline voor een ${config.contentType} over "${config.topic}".

Primaire keyword: ${config.primaryKeyword}
Doelgroep: ${config.language === 'nl' ? 'Nederlands' : 'English'}
Lengte: ongeveer ${config.wordCount} woorden
Tone: ${config.tone}

${research ? `Research data:\n${research}\n\n` : ''}

Geef een overzicht met:
1. Introductie
2. Hoofdsecties (H2)
3. Subsecties (H3)
${config.includeFAQ ? '4. FAQ sectie' : ''}
5. Conclusie

Formateer als genummerde lijst.`;

  const response = await chatCompletion({
    model: TEXT_MODELS.FAST,
    messages: [
      { role: 'system', content: 'Je bent een expert content strategist.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.content;
}

/**
 * Generate main content
 */
async function generateContent(
  config: UltimateWriterConfig,
  outline: string,
  research: string
): Promise<string> {
  const forbiddenWords = DEFAULT_FORBIDDEN_WORDS.join(', ');
  
  const prompt = `Schrijf een professioneel ${config.contentType} in het ${config.language === 'nl' ? 'Nederlands' : 'Engels'}.

ONDERWERP: ${config.topic}

PRIMAIRE KEYWORD: ${config.primaryKeyword}
${config.secondaryKeywords ? `SECUNDAIRE KEYWORDS: ${config.secondaryKeywords}` : ''}

LENGTE: ${config.wordCount} woorden
TONE: ${config.tone}

OUTLINE:
${outline}

${research ? `RESEARCH DATA:\n${research}\n\n` : ''}

VERBODEN WOORDEN (gebruik deze NIET):
${forbiddenWords}

VERBODEN HEADINGS (gebruik deze NIET):
${FORBIDDEN_HEADINGS.join(', ')}

INSTRUCTIES:
1. Schrijf in PURE HTML (geen markdown, geen code blocks)
2. Begin met <p> en gebruik <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>
3. Gebruik de primaire keyword natuurlijk door de tekst
4. Maak de content informatief en waardevol
5. Voeg subheadings toe voor betere leesbaarheid
6. Gebruik opsommingen waar relevant
7. Schrijf engaging en leesbare content
${config.includeTableOfContents ? '8. Begin met een inhoudsopgave in <div class="toc">...</div>' : ''}
${config.includeFAQ ? '9. Eindig met een FAQ sectie met <h2>Veelgestelde Vragen</h2> en minimaal 5 vragen in <div class="faq-item">...</div>' : ''}

OUTPUT FORMAT: Pure HTML content, geen wrappers, geen markdown.`;

  const response = await chatCompletion({
    model: TEXT_MODELS.CLAUDE_45,
    messages: [
      {
        role: 'system',
        content: 'Je bent een expert SEO content writer. Je schrijft alleen in pure HTML zonder markdown code blocks.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: Math.min(config.wordCount * 3, 16000),
  });

  return cleanHtmlResponse(response.content);
}

/**
 * Optimize content with links, products, etc.
 */
async function optimizeContent(content: string, config: UltimateWriterConfig): Promise<string> {
  let optimized = content;

  // Add internal links
  if (config.includeInternalLinks && config.internalLinks && config.internalLinks.length > 0) {
    for (const link of config.internalLinks) {
      // Skip if link already exists
      if (optimized.includes(`href="${link.url}"`)) continue;
      
      // Try to find exact title match first (case insensitive)
      const titleEscaped = link.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactMatch = new RegExp(`\\b${titleEscaped}\\b`, 'i');
      
      if (exactMatch.test(optimized)) {
        // Replace first occurrence only
        optimized = optimized.replace(exactMatch, (match) => 
          `<a href="${link.url}" class="internal-link">${match}</a>`
        );
      } else {
        // Try to match first 2-3 significant words from title
        const titleWords = link.title.toLowerCase().split(' ').filter(w => w.length > 3);
        if (titleWords.length > 0) {
          const searchPhrase = titleWords.slice(0, Math.min(3, titleWords.length)).join('\\s+');
          const phraseRegex = new RegExp(`\\b${searchPhrase}\\b`, 'i');
          
          if (phraseRegex.test(optimized)) {
            optimized = optimized.replace(phraseRegex, (match) =>
              `<a href="${link.url}" class="internal-link">${match}</a>`
            );
          }
        }
      }
    }
  }

  // Add Bol.com products
  if (config.includeBolProducts && config.bolProducts && config.bolProducts.length > 0) {
    const productBoxes = config.bolProducts
      .map(
        (product: any) => `
<div class="bol-product-box" style="border: 2px solid #0000a4; border-radius: 8px; padding: 16px; margin: 20px 0; background: #f8f9fa;">
  <h4 style="color: #0000a4; margin-top: 0;">${product.title || product.name}</h4>
  ${product.images?.[0] ? `<img src="${product.images[0]}" alt="${product.title}" style="max-width: 200px; height: auto; margin: 10px 0;">` : ''}
  ${product.summary ? `<p>${product.summary}</p>` : ''}
  ${product.rating ? `<p>⭐ Rating: ${product.rating}/5</p>` : ''}
  ${product.offerData?.offers?.[0]?.price ? `<p style="font-size: 1.2em; font-weight: bold; color: #0000a4;">€${product.offerData.offers[0].price}</p>` : ''}
  <a href="${product.url || `https://partner.bol.com/click/click?p=2&t=url&s=${product.id}`}" 
     target="_blank" 
     rel="nofollow noopener"
     style="display: inline-block; background: #0000a4; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">
    Bekijk op Bol.com →
  </a>
</div>
`
      )
      .join('\n');

    // Insert product boxes after second H2 or in the middle
    const h2Match = optimized.match(/<h2[^>]*>.*?<\/h2>/gi);
    if (h2Match && h2Match.length >= 2) {
      const secondH2Index = optimized.indexOf(h2Match[1]) + h2Match[1].length;
      optimized =
        optimized.slice(0, secondH2Index) +
        '\n' +
        productBoxes +
        '\n' +
        optimized.slice(secondH2Index);
    } else {
      // Add at the end before conclusion
      optimized += '\n' + productBoxes;
    }
  }

  // Add FAQ if configured
  if (config.includeFAQ) {
    // FAQ will be part of the main content generation
    // This is a placeholder for additional FAQ optimization
  }

  return optimized;
}

/**
 * Generate meta description
 */
async function generateMetaDescription(topic: string, keyword: string): Promise<string> {
  const prompt = `Schrijf een SEO-geoptimaliseerde meta description voor een artikel over "${topic}".

Primaire keyword: ${keyword}
Lengte: 150-160 karakters
Tone: Informatief en aantrekkelijk

Geef ALLEEN de meta description, geen uitleg.`;

  const response = await chatCompletion({
    model: TEXT_MODELS.FAST,
    messages: [
      { role: 'system', content: 'Je bent een SEO expert.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 100,
  });

  return response.content.trim().replace(/^["']|["']$/g, '');
}

/**
 * Calculate content statistics
 */
function calculateStats(
  content: string,
  config: UltimateWriterConfig
): WriterResult['stats'] {
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText.split(' ').filter(w => w.length > 0).length;
  const characterCount = plainText.length;
  const readingTime = Math.ceil(wordCount / 200);

  const internalLinksAdded = (content.match(/class="internal-link"/g) || []).length;
  const externalLinksAdded = (content.match(/<a[^>]*href="http/g) || []).length - internalLinksAdded;
  const imagesAdded = (content.match(/<img[^>]*>/g) || []).length;
  const bolProductsAdded = (content.match(/class="bol-product-box"/g) || []).length;
  
  const h2Count = (content.match(/<h2[^>]*>/g) || []).length;
  const h3Count = (content.match(/<h3[^>]*>/g) || []).length;
  const headingCount = h2Count + h3Count;

  return {
    wordCount,
    characterCount,
    readingTime,
    internalLinksAdded,
    externalLinksAdded,
    imagesAdded,
    bolProductsAdded,
    headingCount,
  };
}

/**
 * Clean HTML response from markdown artifacts
 */
function cleanHtmlResponse(content: string): string {
  let cleaned = content.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned
    .replace(/^```html?\s*\n?/gi, '')
    .replace(/\n?```\s*$/gi, '')
    .replace(/^```\s*\n?/gi, '')
    .trim();
  
  // Find first HTML tag if there's preamble text
  if (!cleaned.startsWith('<')) {
    const firstTag = cleaned.match(/<[a-z]/i);
    if (firstTag && firstTag.index !== undefined) {
      cleaned = cleaned.substring(firstTag.index);
    }
  }
  
  return cleaned;
}
