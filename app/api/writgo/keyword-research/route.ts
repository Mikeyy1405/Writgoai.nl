import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { generateAIContent } from '@/lib/aiml-client';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { niche, count = 10 } = body;

    if (!niche) {
      return NextResponse.json(
        { error: 'Niche is required' },
        { status: 400 }
      );
    }

    // Generate keyword ideas using AI
    const prompt = `Je bent een SEO keyword research expert. Genereer ${count} relevante, high-value keywords voor de volgende niche:

**Niche:** ${niche}

**Context:** WritGo.nl is een platform voor WordPress SEO automatisering met AI. We willen keywords die:
- Relevant zijn voor onze doelgroep (WordPress gebruikers, bloggers, online marketeers)
- Zoekvolume hebben in Nederland
- Niet te competitief zijn (long-tail keywords zijn welkom)
- Informatief of commercieel intent hebben

Geef voor elk keyword:
1. Het keyword zelf
2. Geschat zoekvolume (laag/medium/hoog)
3. Geschatte competitie (laag/medium/hoog)
4. Keyword difficulty score (0-100)
5. Waarom dit keyword waardevol is

Format je antwoord als JSON array:
[
  {
    "keyword": "wordpress seo automatiseren",
    "search_volume": "medium",
    "competition": "medium",
    "difficulty": 45,
    "reason": "Direct relevant voor onze dienst, commerciële intent"
  },
  ...
]

Geef ALLEEN de JSON array, geen extra tekst.`;

    const response = await generateAIContent(prompt, 'gemini-2.0-flash-exp');

    if (!response) {
      throw new Error('Failed to generate keywords');
    }

    // Parse JSON response
    let keywords;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      keywords = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      throw new Error('Failed to parse keyword data');
    }

    // Save keywords to database
    const keywordsToInsert = keywords.map((kw: any) => ({
      keyword: kw.keyword,
      search_volume: kw.search_volume === 'hoog' ? 1000 : kw.search_volume === 'medium' ? 500 : 100,
      competition: kw.competition,
      difficulty: kw.difficulty,
      status: 'pending',
    }));

    const { data: insertedKeywords, error: insertError } = await supabase
      .from('writgo_keywords')
      .insert(keywordsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'keyword_research',
      description: `${keywords.length} keywords gevonden voor niche: ${niche}`,
      status: 'success',
      metadata: { niche, count: keywords.length },
    });

    return NextResponse.json({
      success: true,
      keywords: insertedKeywords,
    });
  } catch (error: any) {
    console.error('Error in keyword research:', error);

    // Log error
    try {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.from('writgo_activity_logs').insert({
        action_type: 'keyword_research_failed',
        description: `Fout bij keyword research: ${error.message}`,
        status: 'error',
        metadata: { error: error.message },
      });
    } catch (logError) {
      console.error('Error logging activity:', logError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to perform keyword research' },
      { status: 500 }
    );
  }
}
