
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

export const dynamic = 'force-dynamic';

/**
 * Genereert unieke product beschrijvingen met AI
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
      ? `Schrijf voor het product "${productTitle}" twee unieke productbeschrijvingen EN een SEO-geoptimaliseerde titel.

BELANGRIJK VOOR BESCHRIJVINGEN:
- Gebruik ALLEEN normale lopende tekst in paragrafen
- GEEN titels, koppen, subkoppen (geen H1, H2, H3, etc.)
- GEEN bold/sterretjes (**), geen italic, geen onderstreping
- GEEN opsommingstekens of genummerde lijsten
- Schrijf vloeiende verhalen met natuurlijke taal

KORTE BESCHRIJVING (50-80 woorden):
Één vloeiende paragraaf met introductie en voordelen.

LANGE BESCHRIJVING (200-300 woorden):
2-3 vloeiende paragrafen die het product beschrijven. Bijvoorbeeld: "De hoofdhuid normaliseert door de speciale ingrediënten. Roos wordt verwijderd en gereguleerd."

GEOPTIMALISEERDE TITEL (max 60 karakters):
Korte, krachtige SEO-titel met keyword + USP.
Voorbeeld: "Anti-Roos Shampoo - Selenium DS - 390ml"

Originele productinfo: ${originalDescription || 'Geen beschrijving beschikbaar'}

JSON formaat:
{
  "optimizedTitle": "...",
  "shortDescription": "...",
  "longDescription": "..."
}`
      : `Write two unique product descriptions AND SEO title for "${productTitle}".

IMPORTANT:
- Use ONLY normal flowing text in paragraphs
- NO headings, bold (**), italic, lists
- Write flowing stories with natural language

SHORT DESCRIPTION (50-80 words):
One flowing paragraph with intro and benefits.

LONG DESCRIPTION (200-300 words):
2-3 flowing paragraphs describing the product.

OPTIMIZED TITLE (max 60 chars):
Short, powerful SEO title with keyword + USP.

Original info: ${originalDescription || 'No description available'}

JSON format:
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
        messages: [{ role: 'user', content: prompt }],
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

    let jsonContent = content.trim();
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

    throw new Error('Kon geen geldige JSON parseren');
  } catch (error) {
    console.error('Fout bij genereren beschrijvingen:', error);
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
    const { projectId, products, productType = 'simple' } = body;

    if (!projectId || !products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Project ID en products array zijn verplicht' },
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

    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials niet gevonden' },
        { status: 400 }
      );
    }

    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    console.log(`📦 Bulk import gestart: ${products.length} producten`);

    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    // Process producten één voor één (voor AI beschrijvingen)
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      
      try {
        console.log(`\n[${i + 1}/${products.length}] Verwerk product: ${productData.name}`);

        // Genereer AI beschrijvingen en geoptimaliseerde titel
        let optimizedTitle = '';
        let shortDescription = productData.shortDescription || '';
        let longDescription = productData.description || '';
        
        try {
          const aiDescriptions = await generateProductDescriptions(
            productData.name,
            productData.description || productData.shortDescription || '',
            project.language?.toLowerCase() || 'nl'
          );
          
          optimizedTitle = aiDescriptions.optimizedTitle;
          shortDescription = aiDescriptions.shortDescription;
          longDescription = aiDescriptions.longDescription;
          
          console.log(`   ✅ AI beschrijvingen en titel gegenereerd`);
        } catch (aiError: any) {
          console.log(`   ⚠️ AI beschrijving mislukt, gebruik origineel`);
          optimizedTitle = productData.name;
          shortDescription = productData.shortDescription || productData.description?.substring(0, 200) || '';
          longDescription = productData.description || '';
        }

        // Use optimized title or fallback to original
        const productTitle = optimizedTitle || productData.name;

        // Prepare WooCommerce product
        const wooProduct: any = {
          name: productTitle,
          type: productType,
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

        if (productType === 'external') {
          wooProduct.external_url = productData.externalUrl || productData.affiliateLink || '';
          wooProduct.button_text = productData.buttonText || 'Koop bij Bol.com';
        } else {
          wooProduct.manage_stock = true;
          wooProduct.stock_quantity = productData.stockQuantity || 0;
        }

        if (productData.ean) {
          wooProduct.meta_data = [
            { key: '_ean', value: productData.ean },
            { key: 'ean', value: productData.ean },
          ];
        }

        // Create product in WooCommerce
        const result = await wooClient.createProduct(wooProduct);
        console.log(`   ✅ Product toegevoegd aan WooCommerce (ID: ${result.id})`);

        // Track in database
        await prisma.wooCommerceProduct.create({
          data: {
            projectId,
            wooProductId: result.id!,
            name: productTitle,
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
            bolProductId: null,
            bolAffiliateLink: productData.affiliateLink || null,
            lastBolSync: new Date(),
            bolPrice: productData.regularPrice?.toString() || null,
            aiOptimized: true,
            lastOptimized: new Date(),
            optimizationCount: 1,
          },
        });

        results.success.push({
          name: productData.name,
          wooProductId: result.id,
          aiOptimized: true,
        });

      } catch (error: any) {
        console.error(`   ❌ Fout bij product: ${productData.name}`, error.message);
        results.failed.push({
          name: productData.name,
          error: error.message,
        });
      }

      // Kleine delay tussen producten om API niet te overbelasten
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n✅ Bulk import voltooid:`);
    console.log(`   - Succesvol: ${results.success.length}`);
    console.log(`   - Mislukt: ${results.failed.length}`);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: products.length,
        succeeded: results.success.length,
        failed: results.failed.length,
      },
      message: `Bulk import voltooid: ${results.success.length} van ${products.length} producten toegevoegd`,
    });

  } catch (error: any) {
    console.error('Error in bulk push:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij bulk push' },
      { status: 500 }
    );
  }
}
