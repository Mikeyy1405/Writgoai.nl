
/**
 * API endpoint voor het herschrijven van WooCommerce producten met AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';
import OpenAI from 'openai';
import { deductCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  return new OpenAI({
    baseURL: 'https://api.aimlapi.com/v1',
    apiKey: process.env.AIML_API_KEY || 'dummy-key-for-build',
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { projectId, productId } = await req.json();

    if (!projectId || !productId) {
      return NextResponse.json(
        { error: 'Project ID en Product ID zijn verplicht' },
        { status: 400 }
      );
    }

    // Get project with credentials
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check credits - get current balance
    const clientWithCredits = await prisma.client.findUnique({
      where: { id: client.id },
      select: { 
        subscriptionCredits: true, 
        topUpCredits: true, 
        isUnlimited: true 
      }
    });

    if (!clientWithCredits) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const currentBalance = clientWithCredits.subscriptionCredits + clientWithCredits.topUpCredits;
    
    if (!clientWithCredits.isUnlimited && currentBalance < 25) {
      return NextResponse.json(
        { error: 'Onvoldoende credits. Je hebt minimaal 25 credits nodig.' },
        { status: 402 }
      );
    }

    // Check WordPress credentials (WooCommerce gebruikt WordPress authenticatie)
    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials niet geconfigureerd. WooCommerce gebruikt de WordPress instellingen.' },
        { status: 400 }
      );
    }

    // Create WooCommerce client (gebruikt WordPress credentials)
    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    // Get the product from WooCommerce
    const product = await wooClient.getProduct(parseInt(productId));

    if (!product) {
      return NextResponse.json({ error: 'Product niet gevonden' }, { status: 404 });
    }

    // Generate new descriptions with AI
    const language = project.language === 'EN' ? 'fluent English' : 'perfect Nederlands';
    
    const systemPrompt = `Je bent een professionele productbeschrijver voor e-commerce.
Schrijf in ${language}.
Maak SEO-geoptimaliseerde, overtuigende productbeschrijvingen die conversie stimuleren.
Gebruik geen AI-achtige termen of clichés.
Schrijf natuurlijk en toegankelijk.`;

    const userPrompt = `Genereer nieuwe productbeschrijvingen voor dit WooCommerce product:

Product Naam: ${product.name}
Huidige Beschrijving: ${product.description || 'Geen beschrijving beschikbaar'}
Huidige Korte Beschrijving: ${product.short_description || 'Geen korte beschrijving beschikbaar'}

Genereer:
1. Een nieuwe **korte beschrijving** (1-2 zinnen, perfect voor in productlijsten, 150 karakters max)
2. Een nieuwe **lange beschrijving** (3-5 paragrafen met kooppunten en USP's, SEO-geoptimaliseerd)

**BELANGRIJK**: 
- Begin NIET met de productnaam/titel in de beschrijving
- Start direct met de inhoud/voordelen van het product
- De titel is al zichtbaar boven de beschrijving

Format je antwoord als JSON:
{
  "shortDescription": "korte beschrijving hier (ZONDER titel)",
  "longDescription": "lange beschrijving hier (ZONDER titel)"
}`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    if (!result.shortDescription || !result.longDescription) {
      throw new Error('AI genereerde geen geldige beschrijvingen');
    }

    // Update product in WooCommerce
    await wooClient.updateProduct(parseInt(productId), {
      description: result.longDescription,
      short_description: result.shortDescription,
    });

    // Deduct credits
    await deductCredits(
      client.id, 
      25, 
      `Product herschreven: ${product.name} (ID: ${productId})`
    );

    return NextResponse.json({
      success: true,
      shortDescription: result.shortDescription,
      longDescription: result.longDescription,
      message: 'Product succesvol herschreven met AI! 🎉',
    });
  } catch (error: any) {
    console.error('Fout bij herschrijven product:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
