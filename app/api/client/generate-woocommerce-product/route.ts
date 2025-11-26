

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deductCredits, hasEnoughCredits } from '@/lib/credits';
import { chatCompletion } from '@/lib/aiml-api';
import { MODEL_CATEGORIES } from '@/lib/smart-model-router';
import { autoSaveToLibrary } from '@/lib/content-library-helper';

const CREDIT_COST = 50; // Cost for generating a WooCommerce product description

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, productInfo, targetAudience, keywords } = await req.json();

    if (!productName?.trim()) {
      return NextResponse.json(
        { error: 'Productnaam is verplicht' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check credits
    const hasCredits = await hasEnoughCredits(client.id, CREDIT_COST);
    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Onvoldoende credits. Je hebt minimaal 50 credits nodig.' },
        { status: 402 }
      );
    }

    // Build prompt with brand voice and target audience
    const toneGuidelines = client.brandVoice || client.targetAudience
      ? `\n\nSchrijfstijl richtlijnen:
${client.brandVoice ? `- Schrijfstijl: ${client.brandVoice}` : ''}
${client.targetAudience ? `- Doelgroep: ${client.targetAudience}` : targetAudience ? `- Doelgroep: ${targetAudience}` : ''}`
      : '';

    const prompt = `Je bent een professionele copywriter gespecialiseerd in WooCommerce productbeschrijvingen.

Product: ${productName}
${productInfo ? `\nProduct Informatie:\n${productInfo}` : ''}
${targetAudience ? `\nDoelgroep: ${targetAudience}` : ''}
${keywords ? `\nZoekwoorden: ${keywords}` : ''}
${toneGuidelines}

Genereer een complete WooCommerce productbeschrijving in het Nederlands met:

1. **KORTE OMSCHRIJVING** (2-3 zinnen, max 160 karakters)
   - Pakkende samenvatting die klanten overtuigt
   - Focus op het belangrijkste voordeel
   - Geschikt voor boven de product pagina

2. **EIGENSCHAPPEN** (5-8 bullet points)
   - Concrete voordelen en kenmerken
   - Duidelijk en scanbaar
   - Overtuigend maar niet overdreven

3. **LANGE OMSCHRIJVING** (300-500 woorden in HTML format)
   - Uitgebreide beschrijving met details
   - Gebruik HTML tags: <h3>, <p>, <ul>, <li>, <strong>
   - Storytelling: probleem → oplossing → voordelen
   - SEO-geoptimaliseerd met keywords
   - Call-to-action aan het einde
   - Professionele structuur met koppen

Formaat EXACT als volgt:

=== KORTE OMSCHRIJVING ===
[Korte omschrijving hier]

=== EIGENSCHAPPEN ===
- [Eigenschap 1]
- [Eigenschap 2]
- [Eigenschap 3]
[etc.]

=== LANGE OMSCHRIJVING ===
[HTML geformatteerde lange beschrijving hier]

Belangrijk:
- Schrijf in het Nederlands
- Gebruik overtuigende taal
- Focus op voordelen, niet alleen features
- Houd rekening met SEO
- Maak het scanbaar en leesbaar`;

    // Generate using AI
    const aiResponse = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: MODEL_CATEGORIES.SEO_WRITING.primary,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const aiMessage = aiResponse.choices[0]?.message?.content;
    if (!aiMessage) {
      throw new Error('Geen respons van AI ontvangen');
    }

    // Parse the response
    const content = aiMessage;
    const parsed = parseProductDescription(content);

    if (!parsed.shortDescription || !parsed.features.length || !parsed.longDescription) {
      throw new Error('Ongeldige AI respons structuur');
    }

    // Deduct credits
    await deductCredits(client.id, CREDIT_COST, 'WooCommerce productbeschrijving');

    // Auto-save to content library
    try {
      const fullContent = `KORTE OMSCHRIJVING:\n${parsed.shortDescription}\n\nEIGENSCHAPPEN:\n${parsed.features.join('\n')}\n\nLANGE OMSCHRIJVING:\n${parsed.longDescription}`;
      
      await autoSaveToLibrary({
        clientId: client.id,
        title: `Product: ${productName}`,
        content: fullContent,
        type: 'other',
        category: 'WooCommerce Product',
        description: productInfo || `WooCommerce productbeschrijving voor ${productName}`,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        tags: ['WooCommerce', 'Product', 'E-commerce'],
      });
    } catch (saveError) {
      console.error('Error auto-saving to content library:', saveError);
      // Continue even if save fails
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error generating WooCommerce product:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseProductDescription(content: string): {
  shortDescription: string;
  features: string[];
  longDescription: string;
} {
  const result = {
    shortDescription: '',
    features: [] as string[],
    longDescription: '',
  };

  // Extract short description
  const shortMatch = content.match(/===\s*KORTE OMSCHRIJVING\s*===\s*([\s\S]*?)(?====|$)/i);
  if (shortMatch) {
    result.shortDescription = shortMatch[1].trim();
  }

  // Extract features
  const featuresMatch = content.match(/===\s*EIGENSCHAPPEN\s*===\s*([\s\S]*?)(?====|$)/i);
  if (featuresMatch) {
    const featuresText = featuresMatch[1];
    result.features = featuresText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•') || line.startsWith('*'))
      .map((line) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line) => line.length > 0);
  }

  // Extract long description
  const longMatch = content.match(/===\s*LANGE OMSCHRIJVING\s*===\s*([\s\S]*?)$/i);
  if (longMatch) {
    result.longDescription = longMatch[1].trim();
  }

  return result;
}
