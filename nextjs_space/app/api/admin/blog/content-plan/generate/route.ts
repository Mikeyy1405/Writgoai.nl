import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';

interface ContentPlanConfig {
  numberOfPosts: number;
  period: string;
  niche: string;
  targetAudience: string;
  language: string;
  keywords?: string;
  tone: string;
}

interface BlogPlanItem {
  title: string;
  description: string;
  contentType: string;
  keywords: string[];
  estimatedWords: number;
  scheduledDate: string;
}

/**
 * POST /api/admin/blog/content-plan/generate
 * 
 * Generates an AI-powered content plan with blog post suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      numberOfPosts,
      period,
      niche,
      targetAudience,
      language,
      keywords,
      tone,
    }: ContentPlanConfig = body;

    // Validation
    if (!numberOfPosts || !period || !niche || !targetAudience || !language) {
      return NextResponse.json(
        { error: 'Aantal blogs, periode, niche, doelgroep en taal zijn verplicht' },
        { status: 400 }
      );
    }

    if (numberOfPosts < 1 || numberOfPosts > 50) {
      return NextResponse.json(
        { error: 'Aantal blogs moet tussen 1 en 50 zijn' },
        { status: 400 }
      );
    }

    // Calculate date distribution
    const now = new Date();
    const periodDays = parsePeriodToDays(period);
    const daysBetweenPosts = Math.floor(periodDays / numberOfPosts);

    // Generate AI prompt for content plan
    const prompt = `Genereer een compleet contentplan voor een blog over "${niche}" gericht op "${targetAudience}".

CONTENTPLAN SPECIFICATIES:
- Aantal blog posts: ${numberOfPosts}
- Periode: ${period}
- Taal: ${language}
- Tone: ${tone}
${keywords ? `- Focus keywords: ${keywords}` : ''}

Voor elke blog post, geef:
1. SEO-geoptimaliseerde titel (max 60 karakters, keyword-rijk, pakkend)
2. Korte beschrijving (2-3 zinnen wat de blog behandelt)
3. Content type (kies uit: How-to, Listicle, Guide, Case Study, Review, Tutorial, Interview, Analysis, Comparison)
4. 3-5 relevante keywords (specifiek en SEO-vriendelijk)
5. Geschat woordenaantal (tussen 800-2500 woorden)

VEREISTEN:
- De onderwerpen moeten:
  * Divers zijn maar wel gerelateerd aan de niche "${niche}"
  * Opbouwen in complexiteit (start met basis onderwerpen)
  * SEO-vriendelijk en zoekbaar zijn
  * Aansluiten bij de doelgroep "${targetAudience}"
  * Actueel en relevant zijn voor ${new Date().getFullYear()}
  
- Varieer de content types voor een dynamisch contentplan
- Zorg voor een logische volgorde en flow tussen de onderwerpen
- Focus op praktische, waardevolle content die de doelgroep helpt

BELANGRIJK:
- Retourneer ALLEEN een geldig JSON array, geen extra tekst
- Gebruik precies deze structuur voor elke blog post:
{
  "title": "SEO-geoptimaliseerde titel hier",
  "description": "Korte beschrijving van 2-3 zinnen wat deze blog behandelt en waarom het waardevol is voor de doelgroep.",
  "contentType": "How-to",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "estimatedWords": 1500
}

Genereer nu een array van ${numberOfPosts} blog posts in deze structuur.`;

    console.log('[Content Plan API] Generating content plan with AI...');
    
    // Call AI API
    const response = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-4',
      temperature: 0.8,
      max_tokens: 8000,
    });

    let aiContent = response.choices[0]?.message?.content || '';
    
    // Clean up the response
    aiContent = aiContent.trim();
    
    // Remove markdown code blocks if present
    if (aiContent.startsWith('```json')) {
      aiContent = aiContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    } else if (aiContent.startsWith('```')) {
      aiContent = aiContent.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
    }
    
    // Try to find JSON array in the response
    const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      aiContent = jsonMatch[0];
    }

    console.log('[Content Plan API] AI response cleaned:', aiContent.substring(0, 500) + '...');

    // Parse the AI response
    let planItems: BlogPlanItem[];
    try {
      planItems = JSON.parse(aiContent);
      
      if (!Array.isArray(planItems)) {
        throw new Error('AI response is not an array');
      }

      if (planItems.length === 0) {
        throw new Error('AI returned empty array');
      }

      console.log(`[Content Plan API] Parsed ${planItems.length} blog posts from AI`);

    } catch (parseError: any) {
      console.error('[Content Plan API] Failed to parse AI response:', parseError);
      console.error('[Content Plan API] Raw AI content:', aiContent);
      
      return NextResponse.json({
        error: 'Failed to parse AI response',
        details: parseError.message,
        rawResponse: aiContent.substring(0, 1000),
      }, { status: 500 });
    }

    // Add scheduled dates to each item
    const itemsWithDates = planItems.map((item, index) => {
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + (daysBetweenPosts * (index + 1)));
      
      return {
        ...item,
        scheduledDate: scheduledDate.toISOString(),
        order: index + 1,
      };
    });

    console.log(`[Content Plan API] Successfully generated plan with ${itemsWithDates.length} items`);

    return NextResponse.json({
      success: true,
      plan: {
        niche,
        targetAudience,
        language,
        tone,
        keywords: keywords?.split(',').map((k: string) => k.trim()).filter(Boolean) || [],
        totalPosts: itemsWithDates.length,
        period,
        items: itemsWithDates,
      },
    });

  } catch (error: any) {
    console.error('[Content Plan API] Error generating content plan:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * Helper function to parse period string to days
 */
function parsePeriodToDays(period: string): number {
  const periodMap: Record<string, number> = {
    '1 week': 7,
    '2 weken': 14,
    '1 maand': 30,
    '2 maanden': 60,
    '3 maanden': 90,
  };
  
  return periodMap[period] || 30; // Default to 1 month
}
