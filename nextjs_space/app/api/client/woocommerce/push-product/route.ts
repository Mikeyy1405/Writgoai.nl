
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

/**
 * Genereert unieke product beschrijvingen met AI
 * Alleen paragrafen, geen headings
 */
async function generateProductDescriptions(
  productTitle: string,
  originalDescription: string,
  language: string = 'nl'
) {
  try {
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML API key niet geconfigureerd');
    }

    const prompt = language === 'nl' 
      ? `Schrijf voor het product "${productTitle}" twee unieke productbeschrijvingen. BELANGRIJK: Gebruik ALLEEN paragrafen, GEEN headings of titels!

KORTE BESCHRIJVING (50-80 woorden):
Schrijf één paragraaf met een pakkende introductie, de belangrijkste voordelen en een subtiele call-to-action. Maak het overtuigend en natuurlijk.

LANGE BESCHRIJVING (250-350 woorden):
Schrijf 2-3 paragrafen die het product uitgebreid beschrijven. Vertel over de kenmerken, voordelen, gebruiksmogelijkheden en waarom iemand dit product zou moeten kopen. Maak het SEO-vriendelijk en natuurlijk Nederlandstalig.

Originele productinfo: ${originalDescription || 'Geen beschrijving beschikbaar'}

Geef het antwoord in dit exacte JSON formaat (zonder markdown formatting):
{
  "shortDescription": "...",
  "longDescription": "..."
}`
      : `Write two unique product descriptions for "${productTitle}". IMPORTANT: Use ONLY paragraphs, NO headings or titles!

SHORT DESCRIPTION (50-80 words):
Write one paragraph with an engaging introduction, key benefits, and a subtle call-to-action. Make it compelling and natural.

LONG DESCRIPTION (250-350 words):
Write 2-3 paragraphs that describe the product in detail. Cover features, benefits, use cases, and why someone should buy this product. Make it SEO-friendly and natural sounding.

Original product info: ${originalDescription || 'No description available'}

Provide the response in this exact JSON format (without markdown formatting):
{
  "shortDescription": "...",
  "longDescription": "..."
}`;

    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Geen AI response ontvangen');
    }

    // Parse JSON from response (handle both plain JSON and markdown-wrapped JSON)
    let jsonContent = content.trim();
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }
    
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const descriptions = JSON.parse(jsonMatch[0]);
      return {
        shortDescription: descriptions.shortDescription || descriptions.short_description || '',
        longDescription: descriptions.longDescription || descriptions.long_description || '',
      };
    }

    throw new Error('Kon geen geldige JSON parseren uit AI response');
  } catch (error) {
    console.error('Fout bij genereren product beschrijvingen:', error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { projectId, productData, productType = 'simple' } = body;

    if (!projectId || !productData) {
      return NextResponse.json(
        { error: 'Project ID en product data zijn verplicht' },
        { status: 400 }
      );
    }

    // Get project with WooCommerce settings
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check for WordPress credentials (WooCommerce gebruikt WordPress authenticatie)
    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials niet gevonden. WooCommerce gebruikt de WordPress instellingen.' },
        { status: 400 }
      );
    }

    // Create WooCommerce client (gebruikt WordPress credentials)
    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    // Genereer unieke AI beschrijvingen voordat het product wordt gepusht
    console.log('🤖 Genereer AI product beschrijvingen voor:', productData.name);
    let shortDescription = productData.shortDescription || '';
    let longDescription = productData.description || '';
    
    try {
      const aiDescriptions = await generateProductDescriptions(
        productData.name,
        productData.description || productData.shortDescription || '',
        project.language?.toLowerCase() || 'nl'
      );
      
      shortDescription = aiDescriptions.shortDescription;
      longDescription = aiDescriptions.longDescription;
      
      console.log('✅ AI beschrijvingen gegenereerd');
      console.log('   - Korte beschrijving:', shortDescription.substring(0, 50) + '...');
      console.log('   - Lange beschrijving:', longDescription.substring(0, 100) + '...');
    } catch (aiError: any) {
      console.error('⚠️ Fout bij genereren AI beschrijvingen:', aiError.message);
      console.log('📝 Gebruik originele beschrijvingen als fallback');
      // Als AI beschrijving mislukt, gebruik originele beschrijvingen
      shortDescription = productData.shortDescription || productData.description?.substring(0, 200) || '';
      longDescription = productData.description || '';
    }

    // Prepare product data for WooCommerce
    const wooProduct: any = {
      name: productData.name,
      type: productType, // 'simple' or 'external' (affiliate)
      status: 'publish',
      description: longDescription,
      short_description: shortDescription,
      regular_price: productData.regularPrice?.toString() || '',
      sale_price: productData.salePrice?.toString() || '',
      images: productData.images || [],
      categories: productData.categories || [],
      tags: productData.tags || [],
      stock_status: productData.stockStatus || 'instock',
    };

    // For affiliate/external products, add external URL
    if (productType === 'external') {
      wooProduct.external_url = productData.externalUrl || productData.affiliateLink || '';
      wooProduct.button_text = productData.buttonText || 'Koop bij Bol.com';
    } else {
      // For simple products, add stock management
      wooProduct.manage_stock = true;
      wooProduct.stock_quantity = productData.stockQuantity || 0;
    }

    // Add EAN as meta data if available
    if (productData.ean) {
      wooProduct.meta_data = [
        { key: '_ean', value: productData.ean },
        { key: 'ean', value: productData.ean },
      ];
    }

    // Altijd een nieuw product maken (geen overschrijven)
    // Dit voorkomt dat producten per ongeluk worden overschreven
    console.log('📦 Nieuw product toevoegen aan WooCommerce:', productData.name);
    const result = await wooClient.createProduct(wooProduct);

    // Track in database met AI-gegenereerde beschrijvingen en Bol.com info
    await prisma.wooCommerceProduct.upsert({
      where: {
        projectId_wooProductId: {
          projectId,
          wooProductId: result.id!,
        },
      },
      create: {
        projectId,
        wooProductId: result.id!,
        name: result.name,
        sku: result.sku || null,
        ean: productData.ean || null,
        description: longDescription,
        shortDescription: shortDescription,
        price: result.price || '0',
        regularPrice: result.regular_price || null,
        salePrice: result.sale_price || null,
        stockStatus: result.stock_status || 'instock',
        importSource: 'bol',
        status: result.status || 'publish',
        // Bol.com tracking
        bolProductId: null, // Will be set when we implement Bol.com API lookup by EAN
        bolAffiliateLink: productData.affiliateLink || null,
        lastBolSync: new Date(),
        bolPrice: productData.regularPrice?.toString() || null,
        aiOptimized: true,
        lastOptimized: new Date(),
        optimizationCount: 1,
      },
      update: {
        name: result.name,
        ean: productData.ean || null,
        description: longDescription,
        shortDescription: shortDescription,
        price: result.price || '0',
        regularPrice: result.regular_price || null,
        salePrice: result.sale_price || null,
        stockStatus: result.stock_status || 'instock',
        status: result.status || 'publish',
        // Update Bol.com tracking
        bolAffiliateLink: productData.affiliateLink || null,
        lastBolSync: new Date(),
        bolPrice: productData.regularPrice?.toString() || null,
        aiOptimized: true,
        lastOptimized: new Date(),
        optimizationCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      product: result,
      descriptions: {
        short: shortDescription,
        long: longDescription,
      },
      aiOptimized: true,
      message: 'Product succesvol toegevoegd aan WooCommerce met AI-gegenereerde beschrijvingen',
    });
  } catch (error: any) {
    console.error('Error pushing product to WooCommerce:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij pushen naar WooCommerce' },
      { status: 500 }
    );
  }
}
