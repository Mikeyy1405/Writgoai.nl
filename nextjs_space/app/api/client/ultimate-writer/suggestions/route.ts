import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';

/**
 * 💡 ULTIMATE WRITER - TOPIC & TITLE SUGGESTIONS
 * Generate AI-powered topic and title suggestions
 */

export async function POST(request: NextRequest) {
  console.log('💡 [Ultimate Writer] Suggestions API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const { type, input, language = 'nl' } = body;

    if (!type || !input) {
      return NextResponse.json(
        { error: 'Type and input are required' },
        { status: 400 }
      );
    }

    let suggestions: string[] = [];

    if (type === 'topics') {
      // Generate topic ideas based on keyword or niche
      const prompt = `Genereer 10 relevante blog onderwerpen voor de keyword of niche: "${input}"

Geef ${language === 'nl' ? 'Nederlandse' : 'Engelse'} onderwerpen die:
- SEO-vriendelijk zijn
- Interessant zijn voor lezers
- Specifiek en concreet zijn
- Verschillende invalshoeken bieden

Formateer als genummerde lijst zonder extra uitleg.`;

      const response = await chatCompletion({
        model: TEXT_MODELS.FAST,
        messages: [
          {
            role: 'system',
            content: 'Je bent een content marketing expert die SEO-geoptimaliseerde onderwerpen genereert.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      // ✅ FIX: Extract content from correct response structure
      const content = response.choices?.[0]?.message?.content || '';
      
      // Parse numbered list
      suggestions = content
        .split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line) => line.length > 10);
    } else if (type === 'titles') {
      // Generate title variations for a topic
      const prompt = `Genereer 5 verschillende titels voor een artikel over: "${input}"

Geef ${language === 'nl' ? 'Nederlandse' : 'Engelse'} titels die:
- Aantrekkelijk en clickable zijn
- SEO-geoptimaliseerd zijn
- De primaire keyword bevatten
- Verschillende benaderingen gebruiken (how-to, lijst, vraag, etc.)

Formateer als genummerde lijst zonder extra uitleg.`;

      const response = await chatCompletion({
        model: TEXT_MODELS.FAST,
        messages: [
          { role: 'system', content: 'Je bent een expert copywriter die SEO titels schrijft.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      // ✅ FIX: Extract content from correct response structure
      const content = response.choices?.[0]?.message?.content || '';
      
      // Parse numbered list
      suggestions = content
        .split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter((line) => line.length > 10);
    } else if (type === 'keywords') {
      // Generate LSI keywords
      const prompt = `Genereer 10 LSI (Latent Semantic Indexing) keywords voor de primaire keyword: "${input}"

Geef ${language === 'nl' ? 'Nederlandse' : 'Engelse'} keywords die:
- Semantisch gerelateerd zijn
- Natuurlijk voorkomen in content
- SEO waarde hebben
- Verschillende variaties bieden

Formateer als komma-gescheiden lijst zonder nummers.`;

      const response = await chatCompletion({
        model: TEXT_MODELS.FAST,
        messages: [
          { role: 'system', content: 'Je bent een SEO keyword expert.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      // ✅ FIX: Extract content from correct response structure
      const content = response.choices?.[0]?.message?.content || '';
      
      // Parse comma-separated list
      suggestions = content
        .split(',')
        .map((kw) => kw.trim())
        .filter((kw) => kw.length > 2);
    }

    console.log(`✅ [Ultimate Writer] Generated ${suggestions.length} ${type} suggestions`);

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, type === 'keywords' ? 10 : 10),
    });
  } catch (error: any) {
    console.error('❌ [Ultimate Writer] Suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
