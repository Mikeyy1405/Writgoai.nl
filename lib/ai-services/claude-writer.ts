/**
 * Claude Sonnet 4.5 Content Writer via AIML API
 * - SEO-optimized articles
 * - Different tones of voice
 * - Markdown output with headings
 * - FAQ sections for featured snippets
 */

import { chatCompletion, TEXT_MODELS } from '../aiml-api';

export interface ClaudeWriterOptions {
  topic: string;
  keywords: string[];
  wordCount: number;
  tone: 'professional' | 'casual' | 'friendly' | 'expert' | 'conversational';
  includeHeadings: boolean;
  includeFAQ: boolean;
  researchData?: PerplexityResearchResult;
  existingContent?: string; // For rewrites
  improvements?: string; // Specific improvements
  language?: string; // Default to 'nl' (Dutch)
}

export interface ClaudeArticle {
  title: string;
  content: string; // HTML
  markdown: string;
  metaDescription: string;
  focusKeyword: string;
  headings: Array<{ level: number; text: string }>;
  faqSection?: Array<{ question: string; answer: string }>;
  wordCount: number;
}

export interface PerplexityResearchResult {
  summary: string;
  keyPoints: string[];
  statistics: Array<{ fact: string; source: string }>;
  trendingTopics: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  relatedQueries: string[];
  timestamp: Date;
}

/**
 * Write a complete article using Claude Sonnet 4.5
 */
export async function writeArticleWithClaude(
  options: ClaudeWriterOptions
): Promise<ClaudeArticle> {
  const {
    topic,
    keywords,
    wordCount,
    tone,
    includeHeadings,
    includeFAQ,
    researchData,
    language = 'nl',
  } = options;

  console.log(`📝 Writing article with Claude: "${topic}"`);
  console.log(`🎯 Target: ${wordCount} words, tone: ${tone}`);

  // Build research context if available
  let researchContext = '';
  if (researchData) {
    researchContext = `
RESEARCH DATA:
${researchData.summary}

Key Points:
${researchData.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

Statistics:
${researchData.statistics.map((stat) => `- ${stat.fact} (Source: ${stat.source})`).join('\n')}

Trending Topics:
${researchData.trendingTopics.join(', ')}

Sources:
${researchData.sources.map((source) => `- ${source.title}: ${source.url}`).join('\n')}
`;
  }

  // Build the system prompt for SEO-optimized writing
  const systemPrompt = `Je bent een expert SEO content writer die hoogwaardige, zoekmachine-geoptimaliseerde artikelen schrijft.

SCHRIJFSTIJL:
- Tone of voice: ${tone}
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}
- Professioneel maar toegankelijk
- Gebruik korte zinnen en alinea's voor leesbaarheid
- Voeg waarde toe voor de lezer

SEO BEST PRACTICES:
- Focus keyword: ${keywords[0]}
- Gebruik focus keyword in: titel, eerste alinea, tussenkoppen, meta beschrijving
- Gebruik secundaire keywords natuurlijk door de tekst: ${keywords.slice(1).join(', ')}
- Zorg voor een duidelijke structuur met H2 en H3 koppen
- Schrijf in de actieve vorm
- Gebruik opsommingen waar mogelijk
- Voeg interne linking mogelijkheden toe

OUTPUT FORMAT:
Geef je antwoord in het volgende JSON formaat:
{
  "title": "SEO-geoptimaliseerde titel (55-60 tekens)",
  "metaDescription": "Meta beschrijving (150-160 tekens)",
  "content": "Volledige HTML content met <h2>, <h3>, <p>, <ul>, <li> tags",
  "markdown": "Markdown versie van de content",
  "headings": [{"level": 2, "text": "Heading text"}],
  "faqSection": [{"question": "Vraag?", "answer": "Antwoord"}] // Als includeFAQ true is
}`;

  const userPrompt = `Schrijf een uitgebreid, SEO-geoptimaliseerd artikel over het volgende onderwerp:

ONDERWERP: ${topic}

FOCUS KEYWORD: ${keywords[0]}
SECUNDAIRE KEYWORDS: ${keywords.slice(1).join(', ')}

TARGET WORDCOUNT: ${wordCount} woorden

${researchContext}

${includeHeadings ? 'Voeg een duidelijke structuur toe met meerdere H2 en H3 koppen.' : ''}
${includeFAQ ? 'Voeg aan het einde een FAQ sectie toe met 5-7 relevante vragen en antwoorden voor featured snippets.' : ''}

Belangrijke eisen:
1. Begin met een sterke introductie die de focus keyword bevat
2. Gebruik de focus keyword en variaties natuurlijk door de tekst
3. Voeg praktische tips en voorbeelden toe
4. Gebruik korte alinea's (max 3-4 zinnen)
5. Sluit af met een krachtige conclusie
6. Zorg dat de content actueel en waardevol is voor 2025`;

  try {
    // Call Claude via AIML API
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET, // Claude Sonnet 4.5
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7, // Creative but focused
      max_tokens: Math.ceil(wordCount * 2), // Rough estimate
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Claude');
    }

    // Parse JSON response
    let article;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/) ||
        [null, content];
      article = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback: try to extract parts manually
      article = extractArticleFromText(content, options);
    }

    // Calculate actual word count
    const actualWordCount = countWords(article.content);

    console.log(`✅ Article written: ${actualWordCount} words`);

    return {
      title: article.title,
      content: article.content,
      markdown: article.markdown || convertHtmlToMarkdown(article.content),
      metaDescription: article.metaDescription,
      focusKeyword: keywords[0],
      headings: article.headings || extractHeadings(article.content),
      faqSection: includeFAQ ? article.faqSection : undefined,
      wordCount: actualWordCount,
    };
  } catch (error) {
    console.error('❌ Error writing article with Claude:', error);
    throw error;
  }
}

/**
 * Rewrite existing content with improvements
 */
export async function rewriteContentWithClaude(
  originalContent: string,
  improvements: string,
  options: Partial<ClaudeWriterOptions>
): Promise<ClaudeArticle> {
  const {
    keywords = [],
    wordCount = 1500,
    tone = 'professional',
    language = 'nl',
  } = options;

  console.log(`📝 Rewriting content with Claude`);
  console.log(`🎯 Improvements: ${improvements}`);

  const systemPrompt = `Je bent een expert content editor die bestaande artikelen verbetert en herschrijft.

SCHRIJFSTIJL:
- Tone of voice: ${tone}
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}
- Professioneel maar toegankelijk
- Behoud de waardevolle informatie uit de originele content
- Voeg nieuwe inzichten toe waar nodig

SEO IMPROVEMENTS:
${keywords.length > 0 ? `- Focus keyword: ${keywords[0]}` : ''}
${keywords.length > 1 ? `- Secundaire keywords: ${keywords.slice(1).join(', ')}` : ''}
- Verbeter de leesbaarheid
- Optimaliseer voor featured snippets
- Voeg structuur toe met koppen

OUTPUT FORMAT:
Geef je antwoord in het volgende JSON formaat:
{
  "title": "Verbeterde titel",
  "metaDescription": "Verbeterde meta beschrijving",
  "content": "Verbeterde HTML content",
  "markdown": "Markdown versie",
  "headings": [{"level": 2, "text": "Heading"}],
  "improvements": ["Improvement 1", "Improvement 2"]
}`;

  const userPrompt = `Herschrijf en verbeter de volgende content:

ORIGINELE CONTENT:
${originalContent}

SPECIFIEKE VERBETERINGEN:
${improvements}

${keywords.length > 0 ? `KEYWORDS: ${keywords.join(', ')}` : ''}

TARGET WORDCOUNT: Ongeveer ${wordCount} woorden

Belangrijke eisen:
1. Behoud de kernboodschap en waardevolle informatie
2. Verbeter de leesbaarheid en structuur
3. Optimaliseer voor SEO
4. Voeg actuele informatie toe waar relevant
5. Maak de content aantrekkelijker voor lezers`;

  try {
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: Math.ceil(wordCount * 2),
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from Claude');
    }

    // Parse JSON response
    let article;
    try {
      const jsonMatch =
        content.match(/```json\n([\s\S]*?)\n```/) ||
        content.match(/```\n([\s\S]*?)\n```/) ||
        [null, content];
      article = JSON.parse(jsonMatch[1] || content);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      article = extractArticleFromText(content, { keywords, wordCount, tone, topic: '', includeHeadings: true, includeFAQ: false });
    }

    const actualWordCount = countWords(article.content);

    console.log(`✅ Content rewritten: ${actualWordCount} words`);

    return {
      title: article.title,
      content: article.content,
      markdown: article.markdown || convertHtmlToMarkdown(article.content),
      metaDescription: article.metaDescription,
      focusKeyword: keywords[0] || '',
      headings: article.headings || extractHeadings(article.content),
      faqSection: article.faqSection,
      wordCount: actualWordCount,
    };
  } catch (error) {
    console.error('❌ Error rewriting content with Claude:', error);
    throw error;
  }
}

/**
 * Helper function to extract article structure from plain text
 */
function extractArticleFromText(
  text: string,
  options: ClaudeWriterOptions
): any {
  // Fallback parser for when JSON parsing fails
  const lines = text.split('\n').filter((line) => line.trim());
  const title = lines[0]?.replace(/^#+ /, '') || options.topic;
  const content = text;

  return {
    title,
    metaDescription: `Lees alles over ${options.topic}. ${options.keywords.join(', ')}.`.substring(0, 160),
    content: `<div>${content.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>')}</div>`,
    markdown: text,
    headings: extractHeadings(content),
  };
}

/**
 * Extract headings from HTML content
 */
function extractHeadings(
  html: string
): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const headingRegex = /<h([2-6])>(.*?)<\/h\1>/gi;
  let match;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, ''), // Strip HTML tags
    });
  }

  return headings;
}

/**
 * Convert HTML to Markdown (simple implementation)
 */
function convertHtmlToMarkdown(html: string): string {
  let markdown = html;

  // Convert headings
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '\n## $1\n');
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '\n### $1\n');
  markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '\n#### $1\n');

  // Convert lists
  markdown = markdown.replace(/<ul>/gi, '\n');
  markdown = markdown.replace(/<\/ul>/gi, '\n');
  markdown = markdown.replace(/<li>(.*?)<\/li>/gi, '- $1\n');

  // Convert paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');

  // Convert bold and italic
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, '');

  // Clean up extra whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}

/**
 * Count words in HTML content
 */
function countWords(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Count words
  const words = text.trim().split(/\s+/);
  return words.filter((word) => word.length > 0).length;
}
