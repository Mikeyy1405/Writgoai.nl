import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';
import { deductCredits } from '@/lib/credits';

/**
 * POST /api/client/woocommerce/rewrite
 * Rewrite WooCommerce product descriptions with AI
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

    const { 
      productId, 
      projectId, 
      currentDescription, 
      tone = 'professional',
      focus = 'benefits',
      length = 'medium',
    } = await req.json();

    if (!productId || !projectId || !currentDescription) {
      return NextResponse.json(
        { error: 'Product ID, Project ID en huidige beschrijving zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Check credits (20 credits for product rewrite)
    const creditsRequired = 20;
    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    });

    if (!client || client.credits < creditsRequired) {
      return NextResponse.json(
        { error: 'Onvoldoende credits', required: creditsRequired },
        { status: 402 }
      );
    }

    // Generate rewritten description
    const lengthMap: Record<string, string> = {
      short: '100-150 woorden',
      medium: '200-300 woorden',
      long: '400-500 woorden',
    };

    const prompt = `Herschrijf de volgende productbeschrijving:

${currentDescription}

Vereisten:
- Toon: ${tone}
- Focus: ${focus === 'benefits' ? 'voordelen en waarde' : focus === 'features' ? 'functies en specificaties' : 'een balans tussen beide'}
- Lengte: ${lengthMap[length] || lengthMap.medium}
- Taal: Nederlands
- SEO-vriendelijk
- Overtuigend en professioneel
- Inclusief een sterke call-to-action

Format als JSON:
{
  "title": "aantrekkelijke product titel",
  "shortDescription": "korte samenvatting (50-100 woorden)",
  "fullDescription": "volledige beschrijving in HTML format",
  "highlights": ["highlight1", "highlight2", "highlight3"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
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

    let rewrittenProduct;
    try {
      rewrittenProduct = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Failed to parse rewrite response:', e);
      return NextResponse.json(
        { error: 'Fout bij verwerken van herschreven tekst' },
        { status: 500 }
      );
    }

    // Deduct credits
    await deductCredits(session.user.id, creditsRequired, 'WooCommerce product herschrijven');

    return NextResponse.json({
      success: true,
      product: rewrittenProduct,
      creditsUsed: creditsRequired,
      message: 'Product beschrijving succesvol herschreven',
    });
  } catch (error) {
    console.error('[API] Error rewriting product:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het herschrijven van de productbeschrijving' },
      { status: 500 }
    );
  }
}
