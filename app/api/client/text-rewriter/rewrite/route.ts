
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { trackApiUsage } from '@/lib/api-usage-tracker';

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { content, style, preserveHtml } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Geen tekst opgegeven' }, { status: 400 });
    }

    // Client validation will be done by tracking API usage

    // Style-specific prompts
    const stylePrompts: Record<string, string> = {
      human: `Herschrijf de volgende tekst zodat deze 100% menselijk klinkt. Gebruik:
- Natuurlijke zinsbouw met variatie
- Persoonlijke toon en ervaringen
- Af en toe onvolmaakte zinnen (zoals mensen écht schrijven)
- Informele uitdrukkingen en context
- Geen AI-patronen of clichés
- Emotie en nuance
Belangrijkste doel: De tekst moet volledig ondetecteerbaar zijn als AI-content.`,
      
      professional: `Herschrijf de volgende tekst in een professionele, zakelijke stijl. Gebruik:
- Formele maar toegankelijke taal
- Duidelijke structuur
- Concrete feiten en voorbeelden
- Vertrouwenwekkende toon
- Geen marketing-taal
Behoud de kernboodschap maar maak het professioneler.`,
      
      friendly: `Herschrijf de volgende tekst in een vriendelijke, persoonlijke stijl. Gebruik:
- Warme, uitnodigende toon
- Directe aanspreking
- Persoonlijke voorbeelden
- Positieve energie
- Begrijpelijke taal
Maak de tekst toegankelijker en aangenamer om te lezen.`,
      
      simple: `Herschrijf de volgende tekst in eenvoudige, begrijpelijke taal. Gebruik:
- Korte zinnen
- Simpele woorden
- Duidelijke uitleg
- Concrete voorbeelden
- Geen jargon
Maak de tekst toegankelijk voor iedereen.`,
      
      engaging: `Herschrijf de volgende tekst zodat deze boeiender en aantrekkelijker is. Gebruik:
- Pakkende openingszinnen
- Storytelling elementen
- Vragen aan de lezer
- Actieve taal
- Concrete voorbeelden
- Emotionele connectie
Maak de tekst zo interessant dat mensen blijven lezen.`,
      
      academic: `Herschrijf de volgende tekst in een academische, wetenschappelijke stijl. Gebruik:
- Formele taal
- Objectieve toon
- Feiten en onderzoek
- Logische structuur
- Precieze formuleringen
Behoud de inhoud maar maak het wetenschappelijker.`
    };

    const systemPrompt = stylePrompts[style] || stylePrompts['human'];
    const userPrompt = preserveHtml 
      ? `${systemPrompt}\n\nBehoud alle HTML-opmaak (bold, headers, lijsten, etc.).\n\nTEKST:\n${content}`
      : `${systemPrompt}\n\nTEKST:\n${content}`;

    console.log('[Text Rewriter] Starting rewrite with style:', style);
    console.log('[Text Rewriter] Content length:', content.length);
    console.log('[Text Rewriter] Preserve HTML:', preserveHtml);

    // Call AIML API
    const response = await fetch(AIML_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert tekstschrijver die teksten herschrijft in verschillende stijlen. Je behoudt de kernboodschap maar past de toon en structuur aan.'
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Text Rewriter] AIML API error:', errorText);
      throw new Error('Fout bij herschrijven');
    }

    const data = await response.json();
    const rewrittenContent = data.choices?.[0]?.message?.content;

    if (!rewrittenContent) {
      throw new Error('Geen herschreven tekst ontvangen');
    }

    console.log('[Text Rewriter] Rewrite successful, length:', rewrittenContent.length);

    // Track API usage (GPT-5.1 costs: $0.03 input, $0.06 output per 1K tokens)
    const inputTokens = Math.ceil(content.length / 4);
    const outputTokens = Math.ceil(rewrittenContent.length / 4);
    const totalCost = (inputTokens / 1000 * 0.03) + (outputTokens / 1000 * 0.06);
    const creditsUsed = Math.ceil(totalCost);

    await trackApiUsage({
      clientId: session.user.id,
      feature: 'text-rewriter',
      model: 'gpt-5.1',
      inputTokens,
      outputTokens,
      success: true,
    });

    console.log('[Text Rewriter] Credits used:', creditsUsed);

    return NextResponse.json({
      rewrittenContent,
      creditsUsed,
      style
    });

  } catch (error: any) {
    console.error('[Text Rewriter] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij herschrijven' },
      { status: 500 }
    );
  }
}
