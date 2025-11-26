

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

interface Anchor {
  text: string;
  url: string;
}

interface GenerateRequest {
  targetWebsite: string;
  anchors: Anchor[];
  wordCount: number;
  topic?: string;
  tone?: string;
  focusAspects?: string;
}

/**
 * Scrape website to understand tone and target audience
 */
async function scrapeWebsite(url: string): Promise<{
  content: string;
  tone: string;
  targetAudience: string;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WritgoAI/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch website');
    }

    const html = await response.text();
    
    // Extract text content (simple approach)
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000); // First 3000 chars

    return {
      content: textContent,
      tone: 'informeel en toegankelijk',
      targetAudience: 'mensen die geïnteresseerd zijn in duurzame mobiliteit',
    };
  } catch (error) {
    console.error('Error scraping website:', error);
    return {
      content: '',
      tone: 'informeel en toegankelijk',
      targetAudience: 'algemeen publiek',
    };
  }
}

/**
 * Generate linkbuilding article using AI/ML API (GPT-4o)
 */
async function generateLinkbuildingArticle(
  request: GenerateRequest,
  websiteInfo: { content: string; tone: string; targetAudience: string }
): Promise<string> {
  const aimlApiKey = process.env.AIML_API_KEY;

  if (!aimlApiKey) {
    throw new Error('AI/ML API key not configured');
  }

  const anchorsText = request.anchors
    .map((a, i) => `${i + 1}. Anchor: "${a.text}" → ${a.url}`)
    .join('\n');

  const prompt = `Je bent een professionele SEO contentschrijver gespecialiseerd in linkbuilding artikelen.

**Opdracht**: Schrijf een hoogwaardig linkbuilding artikel van EXACT ${request.wordCount} woorden.

**Website om over te schrijven**: ${request.targetWebsite}

**Website informatie**:
- Tone: ${request.tone || websiteInfo.tone}
- Doelgroep: ${websiteInfo.targetAudience}
${websiteInfo.content ? `- Website content preview: ${websiteInfo.content.substring(0, 500)}...` : ''}

**Anchors die NATUURLIJK verwerkt moeten worden**:
${anchorsText}

**Onderwerp**: ${request.topic || 'Bepaal zelf een relevant onderwerp op basis van de website en anchors'}

**Focus aspecten**: ${request.focusAspects || 'Duurzaamheid, innovatie, praktisch nut'}

**Belangrijke eisen**:
1. **Exacte woordenaantal**: Het artikel moet EXACT ${request.wordCount} woorden bevatten
2. **Natuurlijke anchor integratie**: Verwerk alle anchors op een natuurlijke, contextrijke manier in de tekst
3. **SEO-geoptimaliseerd**: Gebruik relevante keywords en schrijf voor zoekmachines én lezers
4. **Informatief en waardevol**: Bied échte waarde aan de lezer, geen fluff
5. **Nederlandse taal**: Perfect Nederlands met correcte grammatica en spelling
6. **Pakkende intro**: Begin met een hook die de lezer trekt
7. **Logische structuur**: Gebruik headers (H2, H3) en paragrafen
8. **Call-to-action**: Eindig met een zachte CTA

**Output format**: 
- Lever ALLEEN de artikel HTML op (met <h2>, <h3>, <p>, <a> tags)
- GEEN markdown formatting
- GEEN extra uitleg of meta-informatie
- Gebruik <a href="URL">anchor tekst</a> voor alle links
- Begin direct met de inhoud

Begin nu met het schrijven van het artikel:`;

  const response = await fetch('https://api.aimlapi.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aimlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert SEO contentschrijver die hoogwaardige linkbuilding artikelen schrijft met natuurlijk geïntegreerde anchors.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI/ML API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  let article = data.choices[0].message.content.trim();

  // Clean up any markdown that might have slipped through
  article = article
    .replace(/```html\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  return article;
}

/**
 * Count words in HTML content
 */
function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(word => word.length > 0).length;
}

/**
 * Adjust article length if needed
 */
async function adjustArticleLength(
  article: string,
  targetWords: number,
  request: GenerateRequest
): Promise<string> {
  const currentWords = countWords(article);
  const difference = targetWords - currentWords;

  // If within 5% of target, it's good enough
  if (Math.abs(difference) <= targetWords * 0.05) {
    return article;
  }

  const aimlApiKey = process.env.AIML_API_KEY;
  if (!aimlApiKey) {
    return article;
  }

  const instruction = difference > 0
    ? `Breid dit artikel uit met ongeveer ${difference} woorden. Voeg waardevolle informatie toe die past bij het onderwerp. Behoud alle bestaande links en de structuur.`
    : `Verkort dit artikel met ongeveer ${Math.abs(difference)} woorden. Verwijder alleen minder belangrijke details. Behoud alle links en de kernboodschap.`;

  const response = await fetch('https://api.aimlapi.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${aimlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Je bent een editor die artikelen aanpast aan een specifiek woordenaantal.',
        },
        {
          role: 'user',
          content: `${instruction}\n\nArtikel:\n${article}\n\nLever alleen de aangepaste HTML op.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    return article;
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'info@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();

    // Validate input
    if (!body.targetWebsite || !body.anchors || body.anchors.length === 0) {
      return NextResponse.json(
        { error: 'Target website and anchors are required' },
        { status: 400 }
      );
    }

    // Step 1: Scrape target website
    console.log('📡 Scraping website:', body.targetWebsite);
    const websiteInfo = await scrapeWebsite(body.targetWebsite);

    // Step 2: Generate article
    console.log('✍️ Generating linkbuilding article...');
    let article = await generateLinkbuildingArticle(body, websiteInfo);

    // Step 3: Check word count and adjust if needed
    const initialWordCount = countWords(article);
    console.log(`📊 Initial word count: ${initialWordCount} (target: ${body.wordCount})`);

    if (Math.abs(initialWordCount - body.wordCount) > body.wordCount * 0.05) {
      console.log('🔧 Adjusting article length...');
      article = await adjustArticleLength(article, body.wordCount, body);
      const finalWordCount = countWords(article);
      console.log(`📊 Final word count: ${finalWordCount}`);
    }

    return NextResponse.json({
      article,
      wordCount: countWords(article),
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating linkbuilding article:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate article' },
      { status: 500 }
    );
  }
}
