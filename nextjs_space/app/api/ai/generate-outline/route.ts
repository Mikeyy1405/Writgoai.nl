import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { CREDIT_COSTS, deductCredits } from '@/lib/credits';
import { getBannedWordsInstructions } from '@/lib/banned-words';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { topic, keywords, language, tone, contentType } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Onderwerp is verplicht' },
        { status: 400 }
      );
    }

    // 💰 Check and deduct credits (5 credits voor outline generatie)
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionCredits: true, 
        topUpCredits: true,
        isUnlimited: true,
        email: true 
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const OUTLINE_COST = 5; // 5 credits voor outline generatie

    // Check credits (skip for unlimited clients)
    if (!client.isUnlimited) {
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      if (totalCredits < OUTLINE_COST) {
        return NextResponse.json(
          { 
            error: 'Niet genoeg credits',
            required: OUTLINE_COST,
            available: totalCredits,
          },
          { status: 402 }
        );
      }
    }

    console.log('📝 Generating outline for topic:', topic);
    console.log(`💰 Client has ${client.subscriptionCredits + client.topUpCredits} credits, deducting ${OUTLINE_COST}`);

    // Build prompt for a single, high-quality outline
    const keywordsText = keywords && keywords.length > 0 
      ? `\nFocus keywords: ${keywords.join(', ')}`
      : '';

    const toneText = tone ? `\nSchrijfstijl: ${tone}` : '';
    
    const contentTypeText = contentType ? `\nContent type: ${contentType}` : '';

    const prompt = `Je bent een professionele SEO content strategist. Genereer een gedetailleerde, SEO-geoptimaliseerde outline voor een artikel over het volgende onderwerp:

Onderwerp: ${topic}${keywordsText}${toneText}${contentTypeText}
Taal: ${language === 'nl' ? 'Nederlands' : 'English'}

Maak een uitgebreide outline met 6-8 hoofdsecties die:
1. Een duidelijke en logische structuur heeft
2. 2-5 subsecties per hoofdsectie bevat
3. SEO-vriendelijke koppen gebruikt (H2 en H3 niveau)
4. Zoekwoorden natuurlijk verwerkt
5. Logisch opgebouwd is van introductie naar conclusie
6. Voldoende diepgang heeft om een compleet artikel te schrijven

Voeg altijd deze standaard secties toe:
- Introductie (zonder subsecties)
- FAQ sectie (met 3-5 relevante vragen als subsecties)
- Conclusie (zonder subsecties)

${getBannedWordsInstructions()}

Geef de outline terug in dit EXACTE JSON formaat:
{
  "outline": [
    {
      "heading": "Hoofdsectie titel (H2)",
      "subheadings": ["Subsectie 1 (H3)", "Subsectie 2 (H3)", "Subsectie 3 (H3)"]
    }
  ]
}

BELANGRIJK: 
- Geef ALLEEN de JSON terug, geen extra tekst of uitleg
- Gebruik GEEN verboden woorden in de headings of subheadings`;

    // Generate outline using Claude 4.5
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele content strategist die gestructureerde outlines maakt voor artikelen. Je antwoordt ALTIJD in geldig JSON formaat.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const aiResponse = response.choices?.[0]?.message?.content || '';

    if (!aiResponse) {
      throw new Error('Geen response van AI');
    }

    console.log('🔍 Raw AI response:', aiResponse.substring(0, 200));

    // Parse the JSON response
    let outlineData: any;
    
    // Try to extract JSON from code blocks
    const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                      aiResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                      aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      outlineData = JSON.parse(jsonStr);
    } else {
      // Try to parse the entire response
      outlineData = JSON.parse(aiResponse);
    }

    if (!outlineData.outline || !Array.isArray(outlineData.outline)) {
      throw new Error('Ongeldig outline formaat');
    }

    // ✅ Deduct credits AFTER successful generation (skip for unlimited)
    let remainingCredits = client.subscriptionCredits + client.topUpCredits;
    
    if (!client.isUnlimited) {
      const deductResult = await deductCredits(client.id, OUTLINE_COST, 'Outline generatie');
      remainingCredits = deductResult.newBalance;
      console.log(`💰 Credits deducted: ${OUTLINE_COST}, remaining: ${remainingCredits}`);
    } else {
      console.log(`💰 Client has unlimited credits, no deduction needed`);
    }
    
    console.log('✅ Generated outline successfully');

    return NextResponse.json({
      success: true,
      outline: outlineData.outline,
      creditsUsed: client.isUnlimited ? 0 : OUTLINE_COST,
      remainingCredits,
    });

  } catch (error: any) {
    console.error('❌ Error generating outline:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Outline generatie mislukt',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
