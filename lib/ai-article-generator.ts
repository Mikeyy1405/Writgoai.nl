/**
 * Enhanced AI Article Generator
 * Generates SEO-optimized articles with AI Overview optimization
 * Includes internal linking and schema markup
 */

import OpenAI from 'openai';

const aimlClient = new OpenAI({
  apiKey: process.env.AIML_API_KEY || '',
  baseURL: 'https://api.aimlapi.com/v1',
});

export interface ArticleGenerationParams {
  title: string;
  focusKeyword: string;
  topicId: string;
  topicName: string;
  contentType: 'pillar' | 'cluster' | 'supporting';
  clusterId?: string;
  keywords?: string[];
  relatedArticles?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

export interface GeneratedArticle {
  title: string;
  content: string; // HTML
  excerpt: string;
  focusKeyword: string;
  wordCount: number;
  internalLinks: Array<{
    targetArticleId: string;
    anchorText: string;
    position: number;
  }>;
  schemaMarkup: any;
  metaDescription: string;
  aiOverviewOptimized: boolean;
}

/**
 * Generate article with AI Overview optimization
 */
export async function generateArticle(
  params: ArticleGenerationParams
): Promise<GeneratedArticle> {
  const {
    title,
    focusKeyword,
    topicName,
    contentType,
    keywords = [],
    relatedArticles = []
  } = params;

  // Determine target word count
  const wordCounts = {
    pillar: 5000,
    cluster: 2500,
    supporting: 1500
  };
  const targetWordCount = wordCounts[contentType];

  // Build prompt
  const prompt = buildArticlePrompt(
    title,
    focusKeyword,
    topicName,
    contentType,
    targetWordCount,
    keywords,
    relatedArticles
  );

  try {
    const response = await aimlClient.chat.completions.create({
      model: 'perplexity/llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert SEO content writer voor WritGo.nl, een Nederlandse SEO blog. Je schrijft uitgebreide, goed gestructureerde artikelen die geoptimaliseerd zijn voor Google AI Overview.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response
    const article = parseArticleResponse(content, params);
    
    return article;
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

/**
 * Build comprehensive article generation prompt
 */
function buildArticlePrompt(
  title: string,
  focusKeyword: string,
  topicName: string,
  contentType: string,
  targetWordCount: number,
  keywords: string[],
  relatedArticles: Array<{ id: string; title: string; url: string }>
): string {
  const contentTypeDescriptions = {
    pillar: 'een uitgebreide pillar page die het hele onderwerp dekt',
    cluster: 'een diepgaand cluster artikel over een specifiek subtopic',
    supporting: 'een praktisch artikel dat een specifieke vraag beantwoordt'
  };

  const description = contentTypeDescriptions[contentType as keyof typeof contentTypeDescriptions];

  return `Schrijf ${description} voor WritGo.nl over: "${title}"

**Topic:** ${topicName}
**Focus Keyword:** ${focusKeyword}
**Target Lengte:** ${targetWordCount} woorden
**Content Type:** ${contentType}
${keywords.length > 0 ? `**Related Keywords:** ${keywords.join(', ')}` : ''}

**BELANGRIJKE VEREISTEN:**

1. **AI Overview Optimization:**
   - Begin met een directe, concrete answer (2-3 zinnen)
   - Gebruik bullet points en genummerde lijsten
   - Voeg FAQ sectie toe (5-10 vragen)
   - Gebruik duidelijke H2/H3 structuur
   - Voeg tabellen toe waar relevant

2. **SEO Structuur:**
   - H1: ${title}
   - Intro (150-200 woorden) met focus keyword
   - Minimaal 5 H2 secties
   - H3 subsecties waar nodig
   - Conclusie met call-to-action

3. **Content Kwaliteit:**
   - Actuele informatie (2024/2025)
   - Praktische voorbeelden
   - Concrete tips en stappen
   - Nederlandse markt focus
   - E-E-A-T principes (Expertise, Experience, Authoritativeness, Trustworthiness)

4. **Internal Linking:**
${relatedArticles.length > 0 ? `   - Link naar deze gerelateerde artikelen:
${relatedArticles.map(a => `     * "${a.title}" (${a.url})`).join('\n')}` : '   - Geen gerelateerde artikelen beschikbaar'}

5. **FAQ Sectie:**
   - Minimaal 5 veelgestelde vragen
   - Korte, directe antwoorden (50-100 woorden)
   - Gebruik <h3> voor vragen
   - Optimaliseer voor featured snippets

6. **Schema Markup:**
   - Genereer FAQ schema JSON-LD
   - Voeg HowTo schema toe indien relevant

**OUTPUT FORMAAT:**

Geef het artikel terug in dit JSON formaat:

\`\`\`json
{
  "title": "Artikel titel",
  "content": "Volledige HTML content met <h2>, <h3>, <p>, <ul>, <ol>, <table>, etc.",
  "excerpt": "Korte samenvatting (150-160 karakters)",
  "metaDescription": "SEO meta description (150-160 karakters)",
  "faqSchema": {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Vraag 1?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Antwoord 1"
        }
      }
    ]
  },
  "internalLinks": [
    {
      "anchorText": "anchor text",
      "targetUrl": "url van gerelateerd artikel",
      "position": 1
    }
  ]
}
\`\`\`

Schrijf nu het volledige artikel!`;
}

/**
 * Parse AI response into structured article
 */
function parseArticleResponse(
  content: string,
  params: ArticleGenerationParams
): GeneratedArticle {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    
    // Count words
    const plainText = parsed.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    const wordCount = plainText.split(' ').filter((w: string) => w.length > 0).length;
    
    // Extract internal links with article IDs
    const internalLinks = (parsed.internalLinks || []).map((link: any, index: number) => {
      // Find matching article from relatedArticles
      const relatedArticle = params.relatedArticles?.find(a => 
        link.targetUrl.includes(a.url) || link.targetUrl.includes(a.id)
      );
      
      return {
        targetArticleId: relatedArticle?.id || '',
        anchorText: link.anchorText,
        position: index + 1
      };
    }).filter((link: any) => link.targetArticleId);
    
    return {
      title: parsed.title || params.title,
      content: parsed.content,
      excerpt: parsed.excerpt,
      focusKeyword: params.focusKeyword,
      wordCount,
      internalLinks,
      schemaMarkup: parsed.faqSchema || {},
      metaDescription: parsed.metaDescription || parsed.excerpt,
      aiOverviewOptimized: true
    };
  } catch (error) {
    console.error('Error parsing article response:', error);
    
    // Fallback: treat entire content as HTML
    const wordCount = content.split(' ').filter(w => w.length > 0).length;
    
    return {
      title: params.title,
      content: `<h1>${params.title}</h1>\n\n${content}`,
      excerpt: content.substring(0, 160),
      focusKeyword: params.focusKeyword,
      wordCount,
      internalLinks: [],
      schemaMarkup: {},
      metaDescription: content.substring(0, 160),
      aiOverviewOptimized: false
    };
  }
}

/**
 * Generate FAQ schema markup
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.answer
      }
    }))
  };
}

/**
 * Generate HowTo schema markup
 */
export function generateHowToSchema(
  name: string,
  steps: Array<{ name: string; text: string }>
): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': name,
    'step': steps.map((step, index) => ({
      '@type': 'HowToStep',
      'position': index + 1,
      'name': step.name,
      'text': step.text
    }))
  };
}

/**
 * Optimize content for AI Overview
 */
export function optimizeForAIOverview(content: string): string {
  // Add direct answer at the top if not present
  if (!content.includes('<div class="direct-answer">')) {
    const firstParagraph = content.match(/<p>(.*?)<\/p>/)?.[1] || '';
    if (firstParagraph) {
      content = `<div class="direct-answer bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p class="font-semibold text-lg">${firstParagraph}</p>
      </div>\n\n${content}`;
    }
  }
  
  return content;
}
