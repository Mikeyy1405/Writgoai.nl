
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';
import { getBannedWordsInstructions } from '@/lib/banned-words';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, keywords, language, tone, projectId, sitemapUrl } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    console.log('📋 Generating outline for:', {
      topic,
      keywords: keywords?.length || 0,
      language,
    });

    // Build context
    let context = `Je bent een SEO content strategist. Genereer een gedetailleerde outline voor een ${language === 'nl' ? 'Nederlandstalig' : 'Engels'} artikel over: "${topic}".`;
    
    if (keywords && keywords.length > 0) {
      context += `\n\nFocus keywords: ${keywords.join(', ')}`;
    }
    
    if (tone) {
      context += `\n\nSchrijfstijl: ${tone}`;
    }

    const prompt = `Maak een gestructureerde outline voor dit artikel. 

Analyseer het onderwerp en bepaal automatisch het beste content type:
- Blog artikel (algemeen, informatief)
- Product review (enkele of vergelijking)
- Top lijst / rangschikking
- How-to guide
- Vergelijkingsartikel
- Nieuwsartikel

De outline moet bestaan uit:
1. Een inleiding sectie
2. 4-7 hoofd secties (H2) met relevante onderwerpen
3. Per hoofd sectie: 2-4 sub-secties (H3) met specifieke punten
4. Een conclusie sectie

Voor product reviews:
- Voeg secties toe voor specificaties, voor-/nadelen, prijs-kwaliteit
- Voeg vergelijkingscriteria toe indien van toepassing

Voor top lijsten:
- Structureer elke positie als een sectie
- Voeg waarom-secties toe per item

Voor how-to guides:
- Maak duidelijke stap-voor-stap secties
- Voeg vereisten en materialen toe

${getBannedWordsInstructions()}

Geef de outline terug in dit EXACTE JSON formaat:
{
  "contentType": "blog|product-review|top-list|how-to|comparison|news",
  "outline": [
    {
      "heading": "Inleiding",
      "subheadings": ["Context punt 1", "Context punt 2"]
    },
    {
      "heading": "Hoofd Sectie 1",
      "subheadings": ["Sub-onderwerp A", "Sub-onderwerp B", "Sub-onderwerp C"]
    }
  ]
}

Zorg dat de outline:
- SEO-geoptimaliseerd is
- Natuurlijk leest
- De zoekintentie begrijpt
- Relevante keywords integreert
${keywords && keywords.length > 0 ? `- Deze keywords gebruikt: ${keywords.join(', ')}` : ''}
- Logisch gestructureerd is
- GEEN verboden woorden bevat`;

    // Generate outline using Claude 4.5
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: context,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const outlineText = response.choices[0]?.message?.content || '';
    
    console.log('🔍 Raw AI response:', outlineText.substring(0, 200));

    // Parse JSON response
    let outlineData: any;
    
    // Try to extract JSON from code blocks
    const jsonMatch = outlineText.match(/```json\n?([\s\S]*?)\n?```/) || 
                      outlineText.match(/```\n?([\s\S]*?)\n?```/) ||
                      outlineText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      outlineData = JSON.parse(jsonStr);
    } else {
      // Try to parse the entire response
      outlineData = JSON.parse(outlineText);
    }

    if (!outlineData.outline || !Array.isArray(outlineData.outline)) {
      throw new Error('Invalid outline format');
    }

    console.log('✅ Outline generated:', {
      contentType: outlineData.contentType,
      sections: outlineData.outline.length,
    });

    return NextResponse.json({
      success: true,
      outline: outlineData.outline,
      contentType: outlineData.contentType,
    });

  } catch (error: any) {
    console.error('❌ Error generating outline:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outline' },
      { status: 500 }
    );
  }
}
