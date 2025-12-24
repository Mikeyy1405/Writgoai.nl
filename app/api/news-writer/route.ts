import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openaiClient, BEST_MODELS, generateAICompletion } from '@/lib/ai-client';

interface NewsResearchRequest {
  type: 'website' | 'topic' | 'prompt';
  input: string;
  language?: 'nl' | 'en';
  generateArticle?: boolean;
}

interface NewsSource {
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedDate?: string;
}

interface NewsResearchResponse {
  sources: NewsSource[];
  article?: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
  };
  featuredImage?: {
    url: string;
    alt: string;
    photographer?: string;
    photographerUrl?: string;
    source?: string;
  };
  suggestedTopics: string[];
  generatedAt: string;
}

/**
 * Common Dutch to English translations for image search
 */
const dutchToEnglish: Record<string, string> = {
  // Technology
  'technologie': 'technology',
  'computer': 'computer',
  'telefoon': 'phone',
  'smartphone': 'smartphone',
  'internet': 'internet',
  'software': 'software',
  'kunstmatige': 'artificial',
  'intelligentie': 'intelligence',
  // Business
  'bedrijf': 'business',
  'economie': 'economy',
  'geld': 'money',
  'beurs': 'stock market',
  'investering': 'investment',
  'ondernemer': 'entrepreneur',
  // News topics
  'nieuws': 'news',
  'politiek': 'politics',
  'overheid': 'government',
  'verkiezingen': 'elections',
  'klimaat': 'climate',
  'energie': 'energy',
  'gezondheid': 'health',
  'wetenschap': 'science',
  // Common words
  'nieuwe': 'new',
  'groot': 'big',
  'klein': 'small',
  'wereld': 'world',
  'nederland': 'netherlands',
  'europa': 'europe',
  'amerikaans': 'american',
  'auto': 'car',
  'elektrisch': 'electric',
  'duurzaam': 'sustainable',
};

/**
 * Translate Dutch keywords to English for better image search results
 */
function translateToEnglish(query: string): string {
  let translated = query.toLowerCase();

  for (const [dutch, english] of Object.entries(dutchToEnglish)) {
    translated = translated.replace(new RegExp(dutch, 'gi'), english);
  }

  return translated;
}

/**
 * Search Pixabay for a relevant image (primary source)
 */
async function searchPixabayImage(query: string): Promise<{
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  source: string;
} | null> {
  const apiKey = process.env.PIXABAY_API_KEY;

  if (!apiKey) {
    // Try Pexels as fallback
    return searchPexelsImage(query);
  }

  // Translate Dutch to English for better results
  const englishQuery = translateToEnglish(query);
  console.log(`Pixabay search: "${query}" -> "${englishQuery}"`);

  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(englishQuery)}&image_type=photo&orientation=horizontal&per_page=10&safesearch=true&lang=en`,
    );

    if (!response.ok) {
      console.error('Pixabay API error:', response.status);
      return searchPexelsImage(query);
    }

    const data = await response.json();

    if (data.hits && data.hits.length > 0) {
      // Pick a random image from top results for variety
      const photo = data.hits[Math.floor(Math.random() * Math.min(5, data.hits.length))];
      return {
        url: photo.largeImageURL || photo.webformatURL,
        alt: photo.tags || englishQuery,
        photographer: photo.user,
        photographerUrl: `https://pixabay.com/users/${photo.user}-${photo.user_id}/`,
        source: 'Pixabay',
      };
    }

    // If no results, try Pexels
    return searchPexelsImage(query);
  } catch (error) {
    console.error('Pixabay search error:', error);
    return searchPexelsImage(query);
  }
}

/**
 * Search Pexels for a relevant image (fallback)
 */
async function searchPexelsImage(query: string): Promise<{
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  source: string;
} | null> {
  const apiKey = process.env.PEXELS_API_KEY;

  // Translate Dutch to English
  const englishQuery = translateToEnglish(query);

  if (!apiKey) {
    // Try Unsplash as fallback
    return searchUnsplashImage(query);
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(englishQuery)}&per_page=5&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return searchUnsplashImage(query);
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Pick a random image from top 5 for variety
      const photo = data.photos[Math.floor(Math.random() * Math.min(5, data.photos.length))];
      return {
        url: photo.src.large2x || photo.src.large,
        alt: photo.alt || englishQuery,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        source: 'Pexels',
      };
    }

    return searchUnsplashImage(query);
  } catch (error) {
    console.error('Pexels search error:', error);
    return searchUnsplashImage(query);
  }
}

/**
 * Search Unsplash as final fallback
 */
async function searchUnsplashImage(query: string): Promise<{
  url: string;
  alt: string;
  photographer?: string;
  photographerUrl?: string;
  source: string;
} | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;

  // Translate Dutch to English
  const englishQuery = translateToEnglish(query);

  if (!accessKey) {
    // Return a generic placeholder
    return {
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop',
      alt: englishQuery,
      source: 'Unsplash',
    };
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(englishQuery)}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${accessKey}`,
        },
      }
    );

    if (!response.ok) {
      return {
        url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop',
        alt: englishQuery,
        source: 'Unsplash',
      };
    }

    const data = await response.json();
    return {
      url: data.urls.regular,
      alt: data.alt_description || englishQuery,
      photographer: data.user?.name,
      photographerUrl: data.user?.links?.html,
      source: 'Unsplash',
    };
  } catch (error) {
    console.error('Unsplash search error:', error);
    return {
      url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=630&fit=crop',
      alt: englishQuery,
      source: 'Unsplash',
    };
  }
}

/**
 * Extract keywords for image search
 */
function extractImageKeywords(title: string, content: string): string {
  // Common Dutch/English stop words
  const stopWords = ['de', 'het', 'een', 'voor', 'in', 'op', 'van', 'met', 'en', 'is', 'wat', 'hoe', 'waarom', 'the', 'a', 'an', 'for', 'in', 'on', 'of', 'with', 'and', 'is', 'what', 'how', 'why', 'naar', 'over', 'door', 'bij', 'uit', 'aan', 'om', 'als', 'maar', 'dan', 'nog', 'wel', 'niet', 'worden', 'wordt', 'werd', 'zijn', 'was', 'heeft', 'hebben', 'kan', 'kunnen', 'moet', 'moeten', 'zal', 'zullen', 'zou', 'zouden'];

  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.includes(word));

  // Return first 3 meaningful words
  return words.slice(0, 3).join(' ') || 'news';
}

/**
 * POST /api/news-writer
 *
 * Research news using Perplexity Sonar Pro and generate article
 * Available for all authenticated users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: NewsResearchRequest = await request.json();
    const { type, input, language = 'nl', generateArticle = true } = body;

    if (!type || !input) {
      return NextResponse.json({
        error: 'Type en input zijn verplicht'
      }, { status: 400 });
    }

    // Build the research prompt based on input type
    let researchPrompt = '';
    const langInstruction = language === 'nl'
      ? 'Antwoord in het Nederlands.'
      : 'Answer in English.';

    switch (type) {
      case 'website':
        researchPrompt = `
${langInstruction}

Analyseer de website "${input}" en zoek naar het MEEST RECENTE en BELANGRIJKSTE nieuws dat gerelateerd is aan deze website, branche of niche.

Zoek naar:
1. Breaking news in deze niche (laatste 48 uur)
2. Belangrijke aankondigingen of ontwikkelingen
3. Trending topics en virale verhalen
4. Relevante statistieken of onderzoeken

Geef je antwoord in het volgende JSON formaat:
{
  "sources": [
    {
      "title": "Nieuwstitel",
      "summary": "Uitgebreide samenvatting met alle belangrijke feiten (4-5 zinnen)",
      "source": "Bronwebsite",
      "url": "URL",
      "publishedDate": "Publicatiedatum"
    }
  ],
  "mainTopic": "Het belangrijkste nieuwsonderwerp om over te schrijven",
  "keyFacts": ["Feit 1", "Feit 2", "Feit 3", "Feit 4", "Feit 5"],
  "suggestedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Geef 3-5 bronnen met de meest nieuwswaardige informatie.
`;
        break;

      case 'topic':
        researchPrompt = `
${langInstruction}

Zoek naar het MEEST RECENTE en BELANGRIJKSTE nieuws over: "${input}"

Zoek naar:
1. Breaking news (laatste 48 uur)
2. Belangrijke ontwikkelingen en updates
3. Expert meningen en analyses
4. Relevante cijfers en statistieken

Geef je antwoord in het volgende JSON formaat:
{
  "sources": [
    {
      "title": "Nieuwstitel",
      "summary": "Uitgebreide samenvatting met alle belangrijke feiten (4-5 zinnen)",
      "source": "Bronwebsite",
      "url": "URL",
      "publishedDate": "Publicatiedatum"
    }
  ],
  "mainTopic": "Het belangrijkste nieuwsonderwerp om over te schrijven",
  "keyFacts": ["Feit 1", "Feit 2", "Feit 3", "Feit 4", "Feit 5"],
  "suggestedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Geef 3-5 bronnen met de meest nieuwswaardige informatie.
`;
        break;

      case 'prompt':
        researchPrompt = `
${langInstruction}

Voer de volgende nieuwsresearch opdracht uit: "${input}"

Zoek naar het meest recente en relevante nieuws gebaseerd op deze opdracht.

Geef je antwoord in het volgende JSON formaat:
{
  "sources": [
    {
      "title": "Nieuwstitel",
      "summary": "Uitgebreide samenvatting met alle belangrijke feiten (4-5 zinnen)",
      "source": "Bronwebsite",
      "url": "URL",
      "publishedDate": "Publicatiedatum"
    }
  ],
  "mainTopic": "Het belangrijkste nieuwsonderwerp om over te schrijven",
  "keyFacts": ["Feit 1", "Feit 2", "Feit 3", "Feit 4", "Feit 5"],
  "suggestedTopics": ["Topic 1", "Topic 2", "Topic 3"]
}

Geef 3-5 bronnen met de meest nieuwswaardige informatie.
`;
        break;

      default:
        return NextResponse.json({
          error: 'Ongeldig type. Gebruik: website, topic, of prompt'
        }, { status: 400 });
    }

    // Step 1: Research with Perplexity Sonar Pro
    console.log('Starting Perplexity research...');
    const researchCompletion = await openaiClient.chat.completions.create({
      model: BEST_MODELS.PERPLEXITY,
      messages: [
        {
          role: 'system',
          content: `Je bent een nieuwsresearcher met real-time toegang tot het internet. Je taak is om het allerlaatste nieuws te vinden en te analyseren.

BELANGRIJK:
- Focus op nieuws van de afgelopen 48 uur
- Prioriteer betrouwbare bronnen (grote nieuwssites)
- Geef feitelijke, verifieerbare informatie
- Vermeld altijd de bron en URL
- Geef je antwoord ALTIJD in valid JSON formaat`,
        },
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const researchContent = researchCompletion.choices[0]?.message?.content || '';

    // Parse research response
    let researchData: any;
    try {
      const strategies = [
        () => JSON.parse(researchContent.trim()),
        () => {
          const match = researchContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) return JSON.parse(match[1].trim());
          throw new Error('No code block');
        },
        () => {
          const match = researchContent.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('No object');
        },
      ];

      for (const strategy of strategies) {
        try {
          researchData = strategy();
          break;
        } catch {
          continue;
        }
      }

      if (!researchData) {
        throw new Error('Could not parse research response');
      }
    } catch (parseError) {
      console.error('Failed to parse research:', parseError);
      return NextResponse.json({
        sources: [],
        rawResearch: researchContent,
        suggestedTopics: [],
        generatedAt: new Date().toISOString(),
        error: 'Research parsing failed',
      });
    }

    // If not generating article, return just research
    if (!generateArticle) {
      return NextResponse.json({
        sources: researchData.sources || [],
        suggestedTopics: researchData.suggestedTopics || [],
        generatedAt: new Date().toISOString(),
      });
    }

    // Step 2: Generate news article with Claude
    console.log('Generating news article...');
    const sourceSummaries = (researchData.sources || [])
      .map((s: NewsSource) => `- ${s.title}: ${s.summary} (Bron: ${s.source})`)
      .join('\n');

    const keyFacts = (researchData.keyFacts || []).join('\n- ');
    const mainTopic = researchData.mainTopic || input;

    const articlePrompt = language === 'nl'
      ? `Je bent een professionele nieuwsjournalist voor een grote Nederlandse nieuwswebsite zoals NU.nl of RTL Nieuws. Schrijf een objectief, feitelijk nieuwsartikel.

ONDERWERP: ${mainTopic}

BRONNEN EN FEITEN:
${sourceSummaries}

KERNFEITEN:
- ${keyFacts}

SCHRIJF een professioneel nieuwsartikel met:
1. Een pakkende, informatieve kop (geen clickbait)
2. Een sterke lead paragraph die de 5 W's beantwoordt (wie, wat, waar, wanneer, waarom)
3. De belangrijkste informatie eerst (omgekeerde piramide)
4. Citaten of referenties naar bronnen
5. Achtergrondinformatie en context
6. Een afsluitende paragraph met toekomstperspectief

STIJL:
- Objectief en neutraal
- Geen meningen, alleen feiten
- Korte, duidelijke zinnen
- Actieve schrijfstijl
- Professionele journalistieke toon

Geef je antwoord in JSON formaat:
{
  "title": "Nieuwskop",
  "content": "Het volledige artikel in HTML met <p>, <h2>, <h3>, <blockquote> tags",
  "excerpt": "Korte samenvatting van 1-2 zinnen voor social media",
  "category": "Technologie/Economie/Sport/Entertainment/Wetenschap/Politiek/etc"
}`
      : `You are a professional news journalist for a major news website like BBC or CNN. Write an objective, factual news article.

TOPIC: ${mainTopic}

SOURCES AND FACTS:
${sourceSummaries}

KEY FACTS:
- ${keyFacts}

WRITE a professional news article with:
1. A compelling, informative headline (no clickbait)
2. A strong lead paragraph answering the 5 W's (who, what, where, when, why)
3. Most important information first (inverted pyramid)
4. Quotes or references to sources
5. Background information and context
6. A closing paragraph with future perspective

STYLE:
- Objective and neutral
- No opinions, only facts
- Short, clear sentences
- Active writing style
- Professional journalistic tone

Provide your response in JSON format:
{
  "title": "News headline",
  "content": "The full article in HTML with <p>, <h2>, <h3>, <blockquote> tags",
  "excerpt": "Short 1-2 sentence summary for social media",
  "category": "Technology/Business/Sports/Entertainment/Science/Politics/etc"
}`;

    const articleContent = await generateAICompletion({
      task: 'content',
      systemPrompt: language === 'nl'
        ? 'Je bent een ervaren nieuwsjournalist. Schrijf alleen feitelijke, goed gestructureerde nieuwsartikelen. Geef je antwoord altijd in valid JSON formaat.'
        : 'You are an experienced news journalist. Write only factual, well-structured news articles. Always provide your response in valid JSON format.',
      userPrompt: articlePrompt,
      temperature: 0.4,
      maxTokens: 3000,
    });

    // Parse article response
    let articleData: any;
    try {
      const strategies = [
        () => JSON.parse(articleContent.trim()),
        () => {
          const match = articleContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) return JSON.parse(match[1].trim());
          throw new Error('No code block');
        },
        () => {
          const match = articleContent.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('No object');
        },
      ];

      for (const strategy of strategies) {
        try {
          articleData = strategy();
          break;
        } catch {
          continue;
        }
      }

      if (!articleData) {
        throw new Error('Could not parse article response');
      }
    } catch (parseError) {
      console.error('Failed to parse article:', parseError);
      articleData = {
        title: mainTopic,
        content: `<p>${articleContent}</p>`,
        excerpt: articleContent.substring(0, 160),
        category: 'Nieuws',
      };
    }

    // Step 3: Find featured image
    console.log('Searching for featured image...');
    const imageKeywords = extractImageKeywords(articleData.title, articleData.content);
    const featuredImage = await searchPixabayImage(imageKeywords);

    // Build response
    const response: NewsResearchResponse = {
      sources: researchData.sources || [],
      article: {
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt,
        category: articleData.category,
      },
      featuredImage: featuredImage || undefined,
      suggestedTopics: researchData.suggestedTopics || [],
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error in news-writer POST:', error);

    if (error.message?.includes('timed out')) {
      return NextResponse.json({
        error: 'De request duurde te lang. Probeer het opnieuw.'
      }, { status: 504 });
    }

    return NextResponse.json({
      error: `Er is een fout opgetreden: ${error.message}`
    }, { status: 500 });
  }
}
