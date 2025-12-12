import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scrapeWebsite } from '@/lib/website-scraper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social-media/analyze-website
 * Analyzes a website for social media content planning
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { websiteUrl } = await request.json();

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is verplicht' },
        { status: 400 }
      );
    }

    console.log('[Social Media Analyse] Starting analysis for:', websiteUrl);

    // Scrape the website
    const websiteData = await scrapeWebsite(websiteUrl);

    if (!websiteData.success) {
      return NextResponse.json(
        { error: websiteData.error || 'Website scraping mislukt' },
        { status: 500 }
      );
    }

    // Analyze with AI to understand business for social media
    const aiAnalysis = await analyzeSocialMediaContent(
      websiteData.url,
      websiteData.title || '',
      websiteData.description || '',
      websiteData.content || ''
    );

    const result = {
      url: websiteData.url,
      title: websiteData.title,
      description: websiteData.description,
      niche: aiAnalysis.niche,
      targetAudience: aiAnalysis.targetAudience,
      tone: aiAnalysis.tone,
      products: aiAnalysis.products,
      services: aiAnalysis.services,
      uniqueSellingPoints: aiAnalysis.uniqueSellingPoints,
    };

    console.log('[Social Media Analyse] Analysis complete:', {
      niche: result.niche,
      products: result.products.length,
      services: result.services.length,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Social Media Analyse] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Website analyse mislukt' },
      { status: 500 }
    );
  }
}

/**
 * Analyze website content for social media with AI
 */
async function analyzeSocialMediaContent(
  url: string,
  title: string,
  description: string,
  content: string
): Promise<{
  niche: string;
  targetAudience: string;
  tone: string;
  products: string[];
  services: string[];
  uniqueSellingPoints: string[];
}> {
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet geconfigureerd');
  }

  try {
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert social media strateeg. Analyseer websites en begrijp wat het bedrijf doet voor social media content planning.',
          },
          {
            role: 'user',
            content: `Analyseer deze website voor social media content planning:

WEBSITE: ${url}
TITEL: ${title}
BESCHRIJVING: ${description}
CONTENT (eerste 1500 chars): ${content.substring(0, 1500)}

Geef terug als JSON:
{
  "niche": "De hoofd niche/industrie (1-3 woorden)",
  "targetAudience": "De doelgroep in 3-7 woorden",
  "tone": "professioneel | vriendelijk | inspirerend | educatief",
  "products": ["Product 1", "Product 2", ...] (3-5 producten indien van toepassing),
  "services": ["Service 1", "Service 2", ...] (3-5 diensten indien van toepassing),
  "uniqueSellingPoints": ["USP 1", "USP 2", ...] (3-5 unique selling points)
}

Focus op:
- WAT verkoopt/biedt het bedrijf?
- Wie zijn de klanten?
- Wat maakt hen uniek?

Wees specifiek en accuraat. Dit wordt gebruikt voor social media content ideeën.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content || '{}';
    
    // Parse JSON from AI response
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return {
      niche: analysis.niche || 'Algemeen',
      targetAudience: analysis.targetAudience || 'Algemeen publiek',
      tone: analysis.tone || 'professioneel',
      products: analysis.products || [],
      services: analysis.services || [],
      uniqueSellingPoints: analysis.uniqueSellingPoints || [],
    };
  } catch (error) {
    console.error('[AI Analysis] Error:', error);
    
    // Fallback to basic analysis
    return {
      niche: title || 'Algemeen',
      targetAudience: 'Algemeen publiek',
      tone: 'professioneel',
      products: [],
      services: [],
      uniqueSellingPoints: [],
    };
  }
}
