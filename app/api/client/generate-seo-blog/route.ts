

export const dynamic = "force-dynamic";
/**
 * SIMPLIFIED SEO Blog Generation API with SOP Integration
 * Direct en simpel - geen complexe features
 * Gebruikt altijd de SOP (Standard Operating Procedure) op de achtergrond
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { hasEnoughCredits, deductCredits, calculateCreditCost } from '@/lib/credits';

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      topic,
      websiteUrl,
      length = 1000,
      tone = 'professional',
      model = 'gpt-4o',
      projectId,
    } = body;

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const clientId = session.user.id;

    // Credit check
    const creditCost = calculateCreditCost('blog', model);
    const hasCredits = await hasEnoughCredits(clientId, creditCost);
    
    if (!hasCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          message: `Je hebt niet genoeg credits. Dit kost ${creditCost} credits.`,
          requiredCredits: creditCost
        },
        { status: 402 }
      );
    }

    console.log('🚀 Starting SIMPLE SEO blog generation:', { topic, length, tone, model, websiteUrl });

    // 📋 STAP 1: Haal de SOP op (Standard Operating Procedure)
    let sopInstructions = '';
    try {
      const settings = await prisma.clientAISettings.findUnique({
        where: { clientId: clientId }
      });
      
      if (settings?.customInstructions) {
        sopInstructions = settings.customInstructions;
        console.log('✅ SOP loaded from database');
      } else {
        console.log('⚠️ No custom SOP found, using default instructions');
      }
    } catch (error) {
      console.error('Failed to load SOP:', error);
      // Continue without SOP
    }

    // 📝 STAP 2: Build de system prompt met SOP
    let systemPrompt = `Je bent een professionele SEO tekstschrijver. Schrijf teksten in het Nederlands.
Tone: ${tone}
Lengte: ongeveer ${length} woorden
Gebruik relevante keywords en optimaliseer voor leesbaarheid.`;

    if (sopInstructions) {
      systemPrompt += `\n\n📋 BELANGRIJKE INSTRUCTIES (SOP):\n${sopInstructions}`;
    }

    if (websiteUrl) {
      systemPrompt += `\n\n🌐 Website context: ${websiteUrl}`;
    }

    // 🤖 STAP 3: Genereer de blog met AI
    const aimlResponse = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Schrijf een SEO-geoptimaliseerde blog over: ${topic}

Geef de tekst in deze structuur:
- Een pakkende H1 titel
- Een inleiding
- Meerdere paragrafen met H2/H3 tussenkopjes
- Een conclusie

✅ GEBRUIK MARKDOWN FORMATTING:
- # voor H1 titel
- ## voor H2 kopjes
- ### voor H3 kopjes
- **tekst** voor bold
- *tekst* voor italic
- [link tekst](url) voor links
- - of * voor bullet lists
- 1. voor genummerde lists

Verwerk natuurlijk 3-5 relevante keywords.
Maak een professionele, rijke tekst met goede structuur en leesbaarheid.

${sopInstructions ? '⚠️ VOLG STRIKT DE SOP INSTRUCTIES HIERBOVEN!' : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: length * 2,
      }),
    });

    if (!aimlResponse.ok) {
      const errorText = await aimlResponse.text();
      console.error('AIML API error:', errorText);
      throw new Error(`AI API error: ${aimlResponse.status}`);
    }

    const aimlData = await aimlResponse.json();
    const content = aimlData.choices?.[0]?.message?.content || '';

    if (!content) {
      throw new Error('Geen content ontvangen van AI');
    }

    console.log('✅ SEO blog generated successfully with SOP');

    // Deduct credits
    await deductCredits(
      clientId,
      creditCost,
      `SEO Blog: ${topic.substring(0, 50)}`,
      { model }
    );

    console.log(`💳 Deducted ${creditCost} credits`);
    
    return NextResponse.json({
      success: true,
      result: {
        content: content,
        creditsUsed: creditCost,
        model: model,
        usedSOP: !!sopInstructions
      }
    });

  } catch (error: any) {
    console.error('SEO Blog generation error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate SEO blog',
        message: 'Er ging iets mis. Probeer het opnieuw.',
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'generate-seo-blog',
    version: '2.0',
    description: 'Isolated SEO blog generation - uses latest models and web search'
  });
}
