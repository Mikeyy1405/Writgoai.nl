

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { text, instruction, tone = 'professional', language = 'nl' } = await req.json();

    if (!text || !instruction) {
      return NextResponse.json(
        { error: 'Tekst en instructie zijn verplicht' },
        { status: 400 }
      );
    }

    // Call AIML API to rewrite text
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML API key niet geconfigureerd');
    }

    const systemPrompt = `Je bent een professionele content schrijver. Herschrijf de gegeven tekst volgens de instructies van de gebruiker.

Toon: ${tone}
Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}

BELANGRIJKE REGELS:
- Behoud alle HTML formatting (<strong>, <em>, <a>, etc.)
- Behoud de kernboodschap en belangrijkste informatie
- Verbeter waar nodig de leesbaarheid en structuur
- Gebruik correcte grammatica en spelling
- Retourneer ALLEEN de herschreven tekst, geen extra uitleg

Instructie: ${instruction}`;

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Stabiel werkend model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AIML API error:', errorData);
      throw new Error('Fout bij het herschrijven van tekst');
    }

    const data = await response.json();
    const rewrittenText = data.choices?.[0]?.message?.content || '';

    if (!rewrittenText) {
      throw new Error('Geen herschreven tekst ontvangen');
    }

    return NextResponse.json({
      success: true,
      text: rewrittenText.trim(),
      creditsUsed: 2, // 2 credits voor text rewriting
    });
  } catch (error: any) {
    console.error('Error rewriting text:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij het herschrijven van tekst' },
      { status: 500 }
    );
  }
}
