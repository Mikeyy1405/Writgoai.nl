import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openaiClient, BEST_MODELS } from '@/lib/ai-client';

interface NewsResearchRequest {
  type: 'website' | 'topic' | 'prompt';
  input: string;
  language?: 'nl' | 'en';
}

interface NewsArticle {
  title: string;
  summary: string;
  source: string;
  url?: string;
  publishedDate?: string;
  relevanceScore: number;
}

interface NewsResearchResponse {
  articles: NewsArticle[];
  analysis: string;
  suggestedTopics: string[];
  generatedAt: string;
}

/**
 * POST /api/admin/news-writer
 *
 * Research news using Perplexity Sonar Pro
 * Only accessible to admin users
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: subscriber, error: subscriberError } = await supabase
      .from('subscribers')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (subscriberError || !subscriber || !subscriber.is_admin) {
      return NextResponse.json({
        error: 'Alleen administrators hebben toegang tot deze functie'
      }, { status: 403 });
    }

    const body: NewsResearchRequest = await request.json();
    const { type, input, language = 'nl' } = body;

    if (!type || !input) {
      return NextResponse.json({
        error: 'Type en input zijn verplicht'
      }, { status: 400 });
    }

    // Build the research prompt based on input type
    let researchPrompt = '';
    const languageInstruction = language === 'nl'
      ? 'Antwoord in het Nederlands.'
      : 'Answer in English.';

    switch (type) {
      case 'website':
        researchPrompt = `
${languageInstruction}

Analyseer de website "${input}" en zoek naar het MEEST RECENTE en RELEVANTE nieuws dat gerelateerd is aan deze website, branche of niche.

Voer de volgende stappen uit:
1. Identificeer de niche/branche van de website
2. Zoek naar actueel nieuws (afgelopen 7 dagen) in deze niche
3. Vind trending topics en ontwikkelingen
4. Identificeer nieuwswaardige events of aankondigingen

Geef je antwoord in het volgende JSON formaat:
{
  "articles": [
    {
      "title": "Nieuwstitel",
      "summary": "Korte samenvatting (2-3 zinnen)",
      "source": "Bronwebsite",
      "url": "URL indien beschikbaar",
      "publishedDate": "Publicatiedatum",
      "relevanceScore": 95
    }
  ],
  "analysis": "Korte analyse van de nieuwstrends in deze niche (2-3 alinea's)",
  "suggestedTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}

Focus op nieuws dat relevant is voor content creators die over dit onderwerp schrijven.
Prioriteer actualiteit en relevantie. Geef minimaal 5 en maximaal 10 nieuwsartikelen.
`;
        break;

      case 'topic':
        researchPrompt = `
${languageInstruction}

Zoek naar het MEEST RECENTE en RELEVANTE nieuws over het onderwerp: "${input}"

Voer de volgende stappen uit:
1. Zoek actueel nieuws (afgelopen 7 dagen) over dit onderwerp
2. Identificeer de belangrijkste ontwikkelingen
3. Vind trending subtopics
4. Analyseer wat content creators hierover zouden moeten weten

Geef je antwoord in het volgende JSON formaat:
{
  "articles": [
    {
      "title": "Nieuwstitel",
      "summary": "Korte samenvatting (2-3 zinnen)",
      "source": "Bronwebsite",
      "url": "URL indien beschikbaar",
      "publishedDate": "Publicatiedatum",
      "relevanceScore": 95
    }
  ],
  "analysis": "Korte analyse van de nieuwstrends over dit onderwerp (2-3 alinea's)",
  "suggestedTopics": ["Gerelateerd topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}

Focus op nieuws dat waardevol is voor content creators.
Prioriteer actualiteit en relevantie. Geef minimaal 5 en maximaal 10 nieuwsartikelen.
`;
        break;

      case 'prompt':
        researchPrompt = `
${languageInstruction}

Voer de volgende nieuwsresearch opdracht uit: "${input}"

Zoek naar het meest recente en relevante nieuws gebaseerd op deze opdracht.

Geef je antwoord in het volgende JSON formaat:
{
  "articles": [
    {
      "title": "Nieuwstitel",
      "summary": "Korte samenvatting (2-3 zinnen)",
      "source": "Bronwebsite",
      "url": "URL indien beschikbaar",
      "publishedDate": "Publicatiedatum",
      "relevanceScore": 95
    }
  ],
  "analysis": "Korte analyse gebaseerd op de research (2-3 alinea's)",
  "suggestedTopics": ["Suggestie 1", "Suggestie 2", "Suggestie 3", "Suggestie 4", "Suggestie 5"]
}

Prioriteer actualiteit en relevantie. Geef minimaal 5 en maximaal 10 nieuwsartikelen.
`;
        break;

      default:
        return NextResponse.json({
          error: 'Ongeldig type. Gebruik: website, topic, of prompt'
        }, { status: 400 });
    }

    // Call Perplexity Sonar Pro for research
    const completion = await openaiClient.chat.completions.create({
      model: BEST_MODELS.PERPLEXITY,
      messages: [
        {
          role: 'system',
          content: `Je bent een expert nieuwsresearcher met toegang tot het internet. Je taak is om het meest recente en relevante nieuws te vinden en te analyseren. Je hebt real-time toegang tot het web en kunt actuele nieuwsbronnen raadplegen.

BELANGRIJK:
- Focus op nieuws van de afgelopen 7 dagen
- Prioriteer betrouwbare bronnen
- Geef alleen feitelijke informatie
- Vermeld altijd de bron
- Geef je antwoord ALTIJD in valid JSON formaat`,
        },
        {
          role: 'user',
          content: researchPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Parse the JSON response
    let parsedResponse: NewsResearchResponse;
    try {
      // Try multiple parsing strategies
      const strategies = [
        () => JSON.parse(responseContent.trim()),
        () => {
          const match = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (match) return JSON.parse(match[1].trim());
          throw new Error('No code block');
        },
        () => {
          const match = responseContent.match(/\{[\s\S]*\}/);
          if (match) return JSON.parse(match[0]);
          throw new Error('No object');
        },
        () => {
          let cleaned = responseContent
            .replace(/```(?:json)?/g, '')
            .replace(/```/g, '')
            .trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          return JSON.parse(cleaned);
        },
      ];

      for (const strategy of strategies) {
        try {
          parsedResponse = strategy();
          break;
        } catch {
          continue;
        }
      }

      if (!parsedResponse!) {
        throw new Error('Could not parse response');
      }
    } catch (parseError) {
      console.error('Failed to parse Perplexity response:', parseError);
      console.error('Raw response:', responseContent.substring(0, 1000));

      // Return raw response if parsing fails
      return NextResponse.json({
        articles: [],
        analysis: responseContent,
        suggestedTopics: [],
        generatedAt: new Date().toISOString(),
        parseError: true,
      });
    }

    // Add timestamp
    parsedResponse.generatedAt = new Date().toISOString();

    return NextResponse.json(parsedResponse);
  } catch (error: any) {
    console.error('Error in news-writer POST:', error);

    if (error.message?.includes('timed out')) {
      return NextResponse.json({
        error: 'De research duurde te lang. Probeer het opnieuw met een specifiekere zoekopdracht.'
      }, { status: 504 });
    }

    return NextResponse.json({
      error: `Er is een fout opgetreden: ${error.message}`
    }, { status: 500 });
  }
}
