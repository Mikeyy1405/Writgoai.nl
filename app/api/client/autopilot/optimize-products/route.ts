
/**
 * Autopilot Product Optimizer API
 * Automatiseert het ophalen, analyseren en herschrijven van WooCommerce producten
 */

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

// Helper function to strip markdown code blocks
function stripMarkdownJson(text: string): string {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, productsCount = 5, autoPublish = false } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get project with WordPress settings
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project || !project.wordpressUrl) {
      return NextResponse.json(
        { error: 'Project not found or WordPress not configured' },
        { status: 404 }
      );
    }

    const wpUrl = project.wordpressUrl.replace(/\/$/, '');
    const username = project.wordpressUsername || '';
    const appPassword = project.wordpressPassword || '';

    if (!username || !appPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials not configured for this project' },
        { status: 400 }
      );
    }

    const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

    // Fetch products from WooCommerce
    const productsResponse = await fetch(
      `${wpUrl}/wp-json/wc/v3/products?per_page=${productsCount}&orderby=date&order=desc`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!productsResponse.ok) {
      throw new Error('Failed to fetch products from WordPress');
    }

    const products = await productsResponse.json();

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No products found in WooCommerce' },
        { status: 404 }
      );
    }

    const brandVoice = project.brandVoice || client.brandVoice || 'professioneel en vriendelijk';
    const targetAudience = project.targetAudience || client.targetAudience || 'algemeen publiek';

    // Process each product
    const results = [];
    for (const product of products) {
      try {
        // Analyze product
        const analysisPrompt = `Analyseer dit WooCommerce product en geef concrete verbeteringen:

**PRODUCT:**
Naam: ${product.name}
Korte Omschrijving: ${product.short_description || 'Geen'}
Lange Omschrijving: ${product.description || 'Geen'}
Prijs: €${product.price}

**ANALYSE:**
Geef een SEO score (0-100) en 3-5 concrete verbeteringen.

Retourneer ALLEEN JSON:
{
  "seoScore": 75,
  "improvements": ["Verbetering 1", "Verbetering 2", "Verbetering 3"]
}`;

        const analysisCompletion = await chatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 500,
          temperature: 0.3,
        });

        const analysisText = analysisCompletion.choices[0]?.message?.content || '{}';
        const analysisData = JSON.parse(stripMarkdownJson(analysisText));

        // Rewrite product if needed
        const rewritePrompt = `Herschrijf dit WooCommerce product volgens deze verbeteringen:

**PRODUCT:**
Naam: ${product.name}
Korte Omschrijving: ${product.short_description || 'Geen'}
Lange Omschrijving: ${product.description || 'Geen'}

**SCHRIJFSTIJL:**
- Tone: ${brandVoice}
- Doelgroep: ${targetAudience}

**VERBETERINGEN:**
${analysisData.improvements?.join('\n') || ''}

**REGELS:**
1. Korte omschrijving: ALLEEN TEKST, geen HTML (120-160 karakters)
2. Lange omschrijving: ALLEEN TEKST, geen HTML headings (300-500 woorden)
3. Natuurlijke taal, geen marketing fluff
4. Focus op voordelen en specificaties

Retourneer ALLEEN JSON:
{
  "optimizedTitle": "Verbeterde naam",
  "shortDescription": "Korte omschrijving",
  "longDescription": "Lange omschrijving"
}`;

        const rewriteCompletion = await chatCompletion({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: rewritePrompt }],
          max_tokens: 2000,
          temperature: 0.7,
        });

        const rewriteText = rewriteCompletion.choices[0]?.message?.content || '{}';
        const rewriteData = JSON.parse(stripMarkdownJson(rewriteText));

        // Publish if autoPublish is enabled
        if (autoPublish) {
          const updateData: any = {};
          if (rewriteData.optimizedTitle) updateData.name = rewriteData.optimizedTitle;
          if (rewriteData.shortDescription) updateData.short_description = rewriteData.shortDescription;
          if (rewriteData.longDescription) updateData.description = rewriteData.longDescription;

          const updateResponse = await fetch(`${wpUrl}/wp-json/wc/v3/products/${product.id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });

          if (updateResponse.ok) {
            results.push({
              productId: product.id,
              productName: product.name,
              status: 'published',
              seoScore: analysisData.seoScore,
              improvements: analysisData.improvements,
            });
          } else {
            results.push({
              productId: product.id,
              productName: product.name,
              status: 'failed',
              error: 'Failed to publish updates',
            });
          }
        } else {
          results.push({
            productId: product.id,
            productName: product.name,
            status: 'analyzed',
            seoScore: analysisData.seoScore,
            improvements: analysisData.improvements,
            optimizedContent: rewriteData,
          });
        }
      } catch (error) {
        console.error(`Error processing product ${product.id}:`, error);
        results.push({
          productId: product.id,
          productName: product.name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      productsProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error optimizing products:', error);
    return NextResponse.json(
      { error: 'Failed to optimize products' },
      { status: 500 }
    );
  }
}
