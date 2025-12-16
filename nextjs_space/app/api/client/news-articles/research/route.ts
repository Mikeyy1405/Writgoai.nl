import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/ai-utils';

/**
 * POST /api/client/news-articles/research
 * Research news sources and find relevant articles for a topic
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { topic, language = 'nl' } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Onderwerp is verplicht' },
        { status: 400 }
      );
    }

    // Use AI to suggest relevant news sources and topics
    const prompt = `Doe research naar het volgende nieuwsonderwerp:

Onderwerp: ${topic}
Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}

Genereer:
1. Relevante nieuwsbronnen (5-10 betrouwbare bronnen)
2. Gerelateerde onderwerpen en keywords
3. Belangrijke vragen om te beantwoorden in het artikel
4. Suggesties voor quotes of experts om te citeren
5. Trending aspecten van dit onderwerp

Format als JSON:
{
  "sources": [
    { "name": "bron naam", "url": "url", "description": "waarom relevant" }
  ],
  "relatedTopics": ["topic1", "topic2", ...],
  "keyQuestions": ["vraag1", "vraag2", ...],
  "expertSuggestions": ["expert1", "expert2", ...],
  "trendingAspects": ["aspect1", "aspect2", ...]
}`;

    const aiResponse = await chatCompletion([
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'claude-sonnet-4',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    let research;
    try {
      research = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse research response:', e);
      return NextResponse.json(
        { error: 'Fout bij verwerken van onderzoeksresultaten' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      research,
      topic,
      message: 'Research succesvol uitgevoerd',
    });
  } catch (error) {
    console.error('[API] Error researching news:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het uitvoeren van research' },
      { status: 500 }
    );
  }
}
