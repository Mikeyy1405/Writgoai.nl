// Admin API voor Content Generatie met AIML en Bol.com integratie

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { searchBolProducts, embedProductsInContent, BolProduct } from '@/lib/bol-com-api';

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';

/**
 * POST /api/admin/content-generator
 * Genereer SEO-geoptimaliseerde content met AIML en embed Bol.com producten
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      topic,
      keywords = [],
      wordCount = 1500,
      includeBolProducts = false,
      bolProductQuery = '',
      tone = 'professional',
      includeHeadings = true
    } = body;
    
    // Validatie
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }
    
    if (!AIML_API_KEY) {
      return NextResponse.json({ error: 'AIML API key not configured' }, { status: 500 });
    }
    
    // Stap 1: Genereer content met AIML
    const contentPrompt = buildContentPrompt(topic, keywords, wordCount, tone, includeHeadings);
    
    console.log('Generating content with AIML...');
    const aimlResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert SEO contentwriter die hoogwaardige, goed gestructureerde artikelen schrijft in het Nederlands.'
          },
          {
            role: 'user',
            content: contentPrompt
          }
        ],
        max_tokens: Math.floor(wordCount * 1.5),
        temperature: 0.7
      })
    });
    
    if (!aimlResponse.ok) {
      const errorData = await aimlResponse.text();
      console.error('AIML API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate content with AIML' },
        { status: 500 }
      );
    }
    
    const aimlData = await aimlResponse.json();
    let generatedContent = aimlData.choices[0]?.message?.content || '';
    
    if (!generatedContent) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }
    
    // Stap 2: Zoek en embed Bol.com producten (indien gevraagd)
    let bolProducts: BolProduct[] = [];
    if (includeBolProducts && bolProductQuery) {
      console.log('Searching Bol.com products...');
      bolProducts = await searchBolProducts(bolProductQuery, 3);
      
      if (bolProducts.length > 0) {
        generatedContent = embedProductsInContent(
          generatedContent,
          bolProducts,
          'distributed'
        );
      }
    }
    
    // Stap 3: Genereer meta description
    const metaDescription = await generateMetaDescription(topic, keywords);
    
    // Stap 4: Extraheer H2 headings voor outline
    const headings = extractHeadings(generatedContent);
    
    return NextResponse.json({
      success: true,
      content: {
        title: topic,
        html: generatedContent,
        plainText: stripHtml(generatedContent),
        metaDescription,
        keywords,
        headings,
        wordCount: countWords(generatedContent),
        bolProducts: bolProducts.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price,
          url: p.url
        }))
      }
    });
  } catch (error: any) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}

/**
 * Bouw de content prompt voor AIML
 */
function buildContentPrompt(
  topic: string,
  keywords: string[],
  wordCount: number,
  tone: string,
  includeHeadings: boolean
): string {
  const keywordsText = keywords.length > 0
    ? `\n\nZorg ervoor dat je de volgende keywords op natuurlijke wijze gebruikt: ${keywords.join(', ')}`
    : '';
  
  const headingsInstruction = includeHeadings
    ? '\n\nStructureer het artikel met duidelijke H2 en H3 koppen voor betere leesbaarheid en SEO.'
    : '';
  
  return `Schrijf een uitgebreid, SEO-geoptimaliseerd artikel over: "${topic}"

Vereisten:
- Woordenaantal: ongeveer ${wordCount} woorden
- Tone of voice: ${tone}
- Taal: Nederlands
- Format: HTML (gebruik <h2>, <h3>, <p>, <ul>, <li>, <strong> tags)
${keywordsText}${headingsInstruction}

Zorg voor:
1. Een pakkende introductie
2. Goed gestructureerde hoofdstukken
3. Praktische tips en voorbeelden
4. Een sterke conclusie
5. Natuurlijke keyword integratie
6. Leesbare paragrafen (niet te lang)

Schrijf het volledige artikel nu in HTML format:`;
}

/**
 * Genereer een meta description
 */
async function generateMetaDescription(
  topic: string,
  keywords: string[]
): Promise<string> {
  // Eenvoudige meta description generatie
  const keywordsText = keywords.length > 0 ? keywords.slice(0, 3).join(', ') : topic;
  return `Ontdek alles over ${topic}. ${keywordsText}. Lees meer in dit uitgebreide artikel.`.substring(0, 160);
}

/**
 * Extraheer H2 en H3 headings uit HTML
 */
function extractHeadings(html: string): Array<{ level: number; text: string }> {
  const headings: Array<{ level: number; text: string }> = [];
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gi;
  
  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    headings.push({ level: 2, text: stripHtml(match[1]) });
  }
  
  while ((match = h3Regex.exec(html)) !== null) {
    headings.push({ level: 3, text: stripHtml(match[1]) });
  }
  
  return headings;
}

/**
 * Strip HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Tel woorden in content
 */
function countWords(text: string): number {
  const plainText = stripHtml(text);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}
