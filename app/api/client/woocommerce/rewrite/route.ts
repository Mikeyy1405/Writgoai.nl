
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { getWooCommerceConfig } from '@/lib/woocommerce-api';
import { getBannedWordsForLanguage, removeBannedWords } from '@/lib/banned-words';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten
export const runtime = 'nodejs';

interface WooProduct {
  id: number;
  name: string;
  description: string;
  short_description: string;
  price: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  categories: any[];
  tags: any[];
  images: any[];
  attributes?: any[];
  type: string;
  external_url?: string;
  button_text?: string;
}

// Stream helper
function createStreamResponse(stream: ReadableStream) {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Send progress update
function sendProgress(controller: ReadableStreamDefaultController, message: string) {
  const data = JSON.stringify({ type: 'progress', message });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

// Send error
function sendError(controller: ReadableStreamDefaultController, error: string) {
  const data = JSON.stringify({ type: 'error', error });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

// Send success
function sendSuccess(controller: ReadableStreamDefaultController, message: string, creditsUsed: number) {
  const data = JSON.stringify({ type: 'success', message, creditsUsed });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, productId, improvements, includeMetaDescription, optimizeTitleForSEO } = body;

    if (!projectId || !productId) {
      return NextResponse.json(
        { error: 'Project ID en Product ID zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email },
      },
      include: {
        client: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check WooCommerce configuration
    const wooConfig = getWooCommerceConfig(project);
    if (!wooConfig) {
      return NextResponse.json(
        { error: 'WooCommerce niet geconfigureerd voor dit project' },
        { status: 400 }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        let totalCredits = 0;

        try {
          sendProgress(controller, '🔍 Product ophalen van WooCommerce...');

          // Fetch product from WooCommerce using the client
          const { createWooCommerceClient } = await import('@/lib/woocommerce-api');
          const wooClient = createWooCommerceClient(wooConfig);
          const product = await wooClient.getProduct(productId);
          
          if (!product) {
            throw new Error('Product niet gevonden');
          }

          sendProgress(controller, '✅ Product opgehaald');
          sendProgress(controller, '🤖 AI analyse starten...');

          // Get tone of voice
          const toneOfVoice = await getClientToneOfVoice(project.client.id);
          const tonePrompt = generateToneOfVoicePrompt(toneOfVoice);

          // Determine language from project or default to Dutch
          const language = (project as any).preferredLanguage || 'nl';
          const languageInstruction = language === 'en' 
            ? 'Write in perfect, fluent English' 
            : language === 'fr'
            ? 'Écrivez en français naturel et fluide'
            : language === 'es'
            ? 'Escribe en español fluido y natural'
            : 'Schrijf in perfect, natuurlijk Nederlands';

          const bannedWords = getBannedWordsForLanguage(language);
          const bannedWordsText = bannedWords.join(', ');

          // Build AI prompt for product description
          let rewritePrompt = `Je bent een expert copywriter voor e-commerce producten. Je taak is om een bestaande productbeschrijving volledig te herschrijven en te optimaliseren voor conversie en SEO.

${tonePrompt}

${languageInstruction}

HUIDIGE PRODUCT:
Titel: ${product.name}
Beschrijving: ${product.description || 'Geen beschrijving'}
Korte beschrijving: ${product.short_description || 'Geen'}
Prijs: €${product.price || product.regular_price}
Categorieën: ${product.categories?.map((c: any) => c.name).join(', ') || 'Geen'}
${product.attributes && product.attributes.length > 0 ? `Specificaties: ${product.attributes.map((a: any) => `${a.name}: ${a.options?.join(', ')}`).join('; ')}` : ''}

${improvements ? `GEWENSTE VERBETERINGEN:\n${improvements}\n` : ''}

VEREISTEN:
1. Schrijf een pakkende, uitgebreide productbeschrijving (300-500 woorden)
2. Benadruk de voordelen en unieke verkooppunten
3. Gebruik overtuigende, verkoopgerichte taal
4. Structureer met koppen en bullet points
5. Voeg call-to-actions toe
6. Optimaliseer voor zoekmachines (natuurlijke keyword integratie)
7. Gebruik HTML formatting: <h2>, <h3>, <p>, <ul>, <li>, <strong>
8. Maak het scanbaar en mobielvriendelijk
9. BELANGRIJK: Gebruik NOOIT deze AI-woorden: ${bannedWordsText}
10. Schrijf menselijk, natuurlijk en authentiek - GEEN robotachtige AI-taal
11. **KRITIEK**: Begin NIET met de productnaam/titel in de beschrijving - de titel is al zichtbaar boven de beschrijving, start direct met de voordelen/features

${optimizeTitleForSEO ? `11. Genereer ook een SEO-geoptimaliseerde titel (max 60 karakters, pakkend en keyword-rijk)` : ''}
${includeMetaDescription ? `12. Genereer ook een meta description (max 160 karakters, pakkend met CTA)` : ''}

FORMAAT:
Geef je antwoord in dit EXACTE JSON formaat:
{
  "description": "De volledige HTML productbeschrijving",
  "short_description": "Korte samenvatting (1-2 zinnen, 100-150 karakters)",
  ${optimizeTitleForSEO ? '"optimized_title": "SEO-geoptimaliseerde titel",' : ''}
  ${includeMetaDescription ? '"meta_description": "SEO meta description",' : ''}
  "reasoning": "Korte uitleg van je aanpak"
}`;

          sendProgress(controller, '✍️ Productbeschrijving herschrijven...');

          // Call AI to rewrite product
          const aiResponse = await chatCompletion({
            model: TEXT_MODELS.CLAUDE_SONNET,
            messages: [
              {
                role: 'user',
                content: rewritePrompt,
              },
            ],
            temperature: 0.8,
            max_tokens: 4000,
          });

          totalCredits += 20; // Estimated credits for rewrite

          // Extract content from AIML API response format
          const content = aiResponse?.choices?.[0]?.message?.content;
          
          if (!content) {
            console.error('AI Response structure:', JSON.stringify(aiResponse, null, 2));
            throw new Error('AI generatie mislukt - geen content ontvangen');
          }

          // Parse AI response
          let rewriteData;
          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              rewriteData = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error('Geen JSON gevonden in AI response');
            }
          } catch (parseError) {
            console.error('Failed to parse AI response:', content);
            throw new Error('AI response kon niet geparsed worden');
          }

          sendProgress(controller, '✅ Nieuwe beschrijving gegenereerd');
          sendProgress(controller, '🧹 Content opschonen...');

          // Clean banned words
          let cleanedDescription = removeBannedWords(rewriteData.description || '');
          let cleanedShortDescription = removeBannedWords(rewriteData.short_description || '');
          let cleanedTitle = rewriteData.optimized_title 
            ? removeBannedWords(rewriteData.optimized_title) 
            : product.name;
          let cleanedMetaDescription = rewriteData.meta_description
            ? removeBannedWords(rewriteData.meta_description)
            : '';

          sendProgress(controller, '✅ Content opgeschoond');
          sendProgress(controller, '📤 Product updaten in WooCommerce...');

          // Prepare update data
          const updateData: any = {
            description: cleanedDescription,
            short_description: cleanedShortDescription,
          };

          if (optimizeTitleForSEO && cleanedTitle) {
            updateData.name = cleanedTitle;
          }

          if (includeMetaDescription && cleanedMetaDescription) {
            updateData.meta_data = [
              ...(product.meta_data || []).filter((m: any) => m.key !== '_yoast_wpseo_metadesc'),
              { key: '_yoast_wpseo_metadesc', value: cleanedMetaDescription },
            ];
          }

          // Update product in WooCommerce
          await wooClient.updateProduct(productId, updateData);

          sendProgress(controller, '✅ Product succesvol bijgewerkt!');

          // Track in database (check if exists first)
          const existingProduct = await prisma.wooCommerceProduct.findFirst({
            where: {
              projectId: project.id,
              wooProductId: product.id,
            },
          });

          if (existingProduct) {
            await prisma.wooCommerceProduct.update({
              where: { id: existingProduct.id },
              data: {
                aiOptimized: true,
                lastOptimized: new Date(),
                optimizationCount: { increment: 1 },
                name: cleanedTitle,
                description: cleanedDescription,
                shortDescription: cleanedShortDescription,
              },
            });
          } else {
            await prisma.wooCommerceProduct.create({
              data: {
                projectId: project.id,
                wooProductId: product.id,
                sku: product.sku || `woo-${product.id}`,
                name: cleanedTitle,
                description: cleanedDescription,
                shortDescription: cleanedShortDescription,
                aiOptimized: true,
                lastOptimized: new Date(),
                optimizationCount: 1,
              },
            });
          }

          sendProgress(controller, '💾 Tracking opgeslagen');

          // Send final success
          sendSuccess(
            controller,
            'Product succesvol herschreven en bijgewerkt!',
            Math.round(totalCredits)
          );

          controller.close();
        } catch (error: any) {
          console.error('Error in product rewrite:', error);
          sendError(controller, error.message || 'Onbekende fout opgetreden');
          controller.close();
        }
      },
    });

    return createStreamResponse(stream);
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}
