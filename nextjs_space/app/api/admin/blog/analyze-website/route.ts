import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scrapeWebsite } from '@/lib/website-scraper';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/blog/analyze-website
 * Analyzes a website to understand its niche, content, and structure
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

    console.log('[Website Analyse] Starting analysis for:', websiteUrl);

    // Scrape the website
    const websiteData = await scrapeWebsite(websiteUrl);

    if (!websiteData.success) {
      return NextResponse.json(
        { error: websiteData.error || 'Website scraping mislukt' },
        { status: 500 }
      );
    }

    // Analyze with AI to detect niche and extract meaningful info
    const aiAnalysis = await analyzeWebsiteContent(
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
      existingTopics: aiAnalysis.existingTopics,
      categories: aiAnalysis.categories,
      targetAudience: aiAnalysis.targetAudience,
      tone: aiAnalysis.tone,
      totalPages: websiteData.links?.length || 0,
    };

    console.log('[Website Analyse] Analysis complete:', {
      niche: result.niche,
      existingTopics: result.existingTopics.length,
      categories: result.categories.length,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Website Analyse] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Website analyse mislukt' },
      { status: 500 }
    );
  }
}

/**
 * Analyze website content using AI
 */
async function analyzeWebsiteContent(
  url: string,
  title: string,
  description: string,
  content: string
): Promise<{
  niche: string;
  existingTopics: string[];
  categories: string[];
  targetAudience: string;
  tone: string;
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
            content: 'Je bent een expert website analist. Analyseer websites en geef structured output in JSON formaat.',
          },
          {
            role: 'user',
            content: `Analyseer deze website en bepaal:

WEBSITE: ${url}
TITEL: ${title}
BESCHRIJVING: ${description}
CONTENT (eerste 1000 chars): ${content.substring(0, 1000)}

Geef terug als JSON:
{
  "niche": "De hoofd niche/onderwerp van de website (1-3 woorden)",
  "existingTopics": ["Topic 1", "Topic 2", ...] (5-10 onderwerpen die de website behandelt),
  "categories": ["Categorie 1", "Categorie 2", ...] (3-5 content categorieën),
  "targetAudience": "De doelgroep in 3-5 woorden",
  "tone": "professioneel | vriendelijk | educatief | inspirerend"
}

Wees specifiek en accuraat. Baseer alles op de gegeven content.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
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
      existingTopics: analysis.existingTopics || [],
      categories: analysis.categories || [],
      targetAudience: analysis.targetAudience || 'Algemeen publiek',
      tone: analysis.tone || 'professioneel',
    };
  } catch (error) {
    console.error('[AI Analysis] Error:', error);
    
    // Fallback to basic analysis
    return {
      niche: title || 'Algemeen',
      existingTopics: [],
      categories: [],
      targetAudience: 'Algemeen publiek',
      tone: 'professioneel',
    };
  }
}
