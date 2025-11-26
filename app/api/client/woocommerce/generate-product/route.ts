
/**
 * API endpoint voor het genereren van WooCommerce producten
 * met AI-gegenereerde beschrijvingen en Bol.com afbeeldingen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getBolcomProduct, generateBolcomAffiliateLink, type BolcomProduct } from '@/lib/bolcom-api';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

// Use AIML API for AI descriptions
async function generateProductDescriptions(
  productTitle: string,
  productDescription: string,
  language: string = 'nl'
) {
  try {
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML API key niet geconfigureerd');
    }

    const prompt = language === 'nl' 
      ? `Schrijf voor het product "${productTitle}" twee unieke productbeschrijvingen EN een SEO-geoptimaliseerde titel.

BELANGRIJK VOOR BESCHRIJVINGEN:
- Gebruik ALLEEN normale lopende tekst in paragrafen
- GEEN titels, koppen, subkoppen (geen H1, H2, H3, etc.)
- GEEN bold/sterretjes (**), geen italic, geen onderstreping
- GEEN opsommingstekens of genummerde lijsten in de beschrijvingen
- Schrijf alsof je een vloeiend verhaal vertelt
- Gebruik natuurlijke taal zoals in een boek of artikel

KORTE BESCHRIJVING (50-80 woorden):
Schrijf één vloeiende paragraaf met een pakkende introductie en de belangrijkste voordelen. Gebruik normale zinnen zoals: "Dit product helpt je om..." of "De unieke formule zorgt ervoor dat..."

LANGE BESCHRIJVING (200-300 woorden):
Schrijf 2-3 vloeiende paragrafen die het product uitgebreid beschrijven. Vertel een verhaal over de kenmerken en voordelen. Bijvoorbeeld: "De hoofdhuid normaliseert door de speciale ingrediënten. Roos wordt verwijderd en gereguleerd. In slechts twee weken zie je 100% van de zichtbare roos verdwijnen."

GEOPTIMALISEERDE TITEL (max 60 karakters):
Maak een korte, krachtige en SEO-vriendelijke titel. Gebruik het belangrijkste keyword + USP.
Voorbeelden:
- "Anti-Roos Shampoo - Selenium DS - 390ml"
- "Vitamine C Serum - Huidverbetering - 30ml"
NIET: "Vichy Dercos Technique Anti-Roos DS Shampoo - Normaal tot Vet haar - 390ml" (te lang!)

Originele productinfo: ${productDescription || 'Geen beschrijving beschikbaar'}

Geef het antwoord in dit exacte JSON formaat:
{
  "optimizedTitle": "...",
  "shortDescription": "...",
  "longDescription": "..."
}`
      : `Write two unique product descriptions AND an SEO-optimized title for "${productTitle}".

IMPORTANT FOR DESCRIPTIONS:
- Use ONLY normal flowing text in paragraphs
- NO titles, headings, subheadings (no H1, H2, H3, etc.)
- NO bold/asterisks (**), no italic, no underline
- NO bullet points or numbered lists in descriptions
- Write as if telling a flowing story
- Use natural language like in a book or article

SHORT DESCRIPTION (50-80 words):
Write one flowing paragraph with an engaging introduction and key benefits. Use natural sentences like: "This product helps you..." or "The unique formula ensures that..."

LONG DESCRIPTION (200-300 words):
Write 2-3 flowing paragraphs describing the product extensively. Tell a story about features and benefits. Example: "The scalp normalizes through special ingredients. Dandruff is removed and regulated. In just two weeks, you see 100% of visible dandruff disappear."

OPTIMIZED TITLE (max 60 characters):
Create a short, powerful and SEO-friendly title. Use main keyword + USP.
Examples:
- "Anti-Dandruff Shampoo - Selenium DS - 390ml"
- "Vitamin C Serum - Skin Improvement - 30ml"
NOT: "Vichy Dercos Technique Anti-Dandruff DS Shampoo - Normal to Oily Hair - 390ml" (too long!)

Original product info: ${productDescription || 'No description available'}

Provide response in this exact JSON format:
{
  "optimizedTitle": "...",
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
      
      // Clean any markdown artifacts from descriptions
      const cleanMarkdown = (text: string) => {
        if (!text) return '';
        return text
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/^#+\s+/gm, '') // Remove headings
          .replace(/^[-*+]\s+/gm, '') // Remove bullet points
          .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
          .trim();
      };
      
      return {
        optimizedTitle: descriptions.optimizedTitle || descriptions.optimized_title || '',
        shortDescription: cleanMarkdown(descriptions.shortDescription || descriptions.short_description || ''),
        longDescription: cleanMarkdown(descriptions.longDescription || descriptions.long_description || ''),
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

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { 
      projectId, 
      ean, 
      selectedImages = [],
      customPrice,
      customSalePrice,
      categories = [],
      tags = [],
    } = await req.json();

    if (!projectId || !ean) {
      return NextResponse.json(
        { error: 'Project ID en EAN zijn verplicht' },
        { status: 400 }
      );
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check Bol.com configuration
    if (!project.bolcomEnabled || !project.bolcomClientId || !project.bolcomClientSecret) {
      return NextResponse.json(
        { error: 'Bol.com is niet geconfigureerd voor dit project' },
        { status: 400 }
      );
    }

    // Check WordPress configuration (WooCommerce gebruikt WordPress authenticatie)
    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;
    
    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials zijn vereist. WooCommerce gebruikt de WordPress instellingen.' },
        { status: 400 }
      );
    }

    // Get Bol.com product details
    const bolCredentials = {
      clientId: project.bolcomClientId,
      clientSecret: project.bolcomClientSecret,
      affiliateId: project.bolcomAffiliateId || undefined,
    };

    const bolProduct = await getBolcomProduct(ean, bolCredentials, {
      includeOffer: true,
      includeRating: true,
      includeMedia: true,
    });

    // Generate AI descriptions and optimized title
    const { optimizedTitle, shortDescription, longDescription } = await generateProductDescriptions(
      bolProduct.title,
      bolProduct.description || '',
      project.language.toLowerCase()
    );

    // Use optimized title or fallback to original
    const productTitle = optimizedTitle || bolProduct.title;

    // Generate affiliate link
    const affiliateLink = generateBolcomAffiliateLink(
      bolProduct.url,
      project.bolcomAffiliateId,
      productTitle
    );

    // Prepare WooCommerce product
    const wooProduct = {
      name: productTitle,
      type: 'external' as const,
      status: 'publish' as const,
      description: longDescription,
      short_description: shortDescription,
      sku: ean,
      regular_price: customPrice || bolProduct.offer?.price?.toString() || '',
      sale_price: customSalePrice || '',
      external_url: affiliateLink,
      button_text: project.language === 'NL' ? 'Bekijk op Bol.com' : 'View on Bol.com',
      images: selectedImages.map((url: string, index: number) => ({
        src: url,
        alt: `${bolProduct.title} - Afbeelding ${index + 1}`,
      })),
      categories: categories.map((cat: string) => ({ name: cat })),
      tags: tags.map((tag: string) => ({ name: tag })),
      meta_data: [
        { key: '_bolcom_ean', value: ean },
        { key: '_bolcom_product_id', value: bolProduct.bolProductId.toString() },
        { key: '_affiliate_link', value: affiliateLink },
        { key: '_ai_generated', value: 'true' },
      ],
    };

    // Create WooCommerce client (gebruikt WordPress credentials)
    const wooClient = createWooCommerceClient({
      url: wpUrl!,
      username: wpUsername!,
      password: wpPassword!,
    });

    // Create product in WooCommerce
    const createdProduct = await wooClient.createProduct(wooProduct);

    // Save to database
    await prisma.wooCommerceProduct.create({
      data: {
        projectId: project.id,
        wooProductId: createdProduct.id!,
        sku: ean,
        name: productTitle,
        description: longDescription,
        shortDescription: shortDescription,
        price: customPrice || bolProduct.offer?.price?.toString(),
        regularPrice: customPrice || bolProduct.offer?.price?.toString(),
        salePrice: customSalePrice,
        stockStatus: 'instock',
        categories: categories,
        tags: tags,
        images: selectedImages,
        importSource: 'bol',
        sourceUrl: bolProduct.url,
        sourceData: {
          ean: ean,
          bolProductId: bolProduct.bolProductId,
          affiliateLink: affiliateLink,
        },
        aiOptimized: true,
        lastOptimized: new Date(),
        optimizationCount: 1,
        status: 'publish',
        permalink: (createdProduct as any).permalink || null,
      },
    });

    return NextResponse.json({
      success: true,
      product: createdProduct,
      descriptions: {
        short: shortDescription,
        long: longDescription,
      },
      affiliateLink: affiliateLink,
    });
  } catch (error: any) {
    console.error('Fout bij genereren WooCommerce product:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
