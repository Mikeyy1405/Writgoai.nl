/**
 * Site Manager - SEO Optimize API
 * 🔍 Optimaliseer meta titles en descriptions met AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { createWooCommerceClient, getWooCommerceConfig } from '@/lib/woocommerce-api';
import { removeBannedWords, getBannedWordsForLanguage } from '@/lib/banned-words';
import { deductCredits } from '@/lib/credits';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface SeoOptimizeItem {
  type: 'post' | 'product' | 'page';
  id: number;
  currentTitle?: string;
  currentContent?: string;
  focusKeyword?: string;
}

/**
 * POST /api/client/site-manager/seo-optimize
 * Optimaliseer SEO meta data met AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, items, language } = body;

    if (!projectId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Project ID en items zijn verplicht' },
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
        client: {
          select: {
            id: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        let totalCredits = 0;
        const results: any[] = [];

        try {
          const itemCount = items.length;
          sendProgress(controller, 0, `🔍 Start SEO optimalisatie van ${itemCount} item(s)...`);

          // Get WordPress config
          const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
          const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
          const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

          if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
            throw new Error('WordPress configuratie ontbreekt');
          }

          const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
          const wooConfig = getWooCommerceConfig(project);
          const lang = language || (project as any).preferredLanguage || 'nl';
          const bannedWords = getBannedWordsForLanguage(lang);

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item: SeoOptimizeItem = items[i];
            const progressPercent = Math.round((i / itemCount) * 90);

            sendProgress(
              controller, 
              progressPercent, 
              `🔍 Optimaliseren item ${i + 1}/${itemCount}...`,
              { itemId: item.id, itemType: item.type }
            );

            try {
              // Fetch current content if not provided
              let currentContent = {
                title: item.currentTitle || '',
                content: item.currentContent || ''
              };

              if (!item.currentTitle || !item.currentContent) {
                sendProgress(controller, progressPercent + 2, `📥 Content ophalen...`);
                currentContent = await fetchItemContent(
                  item.type,
                  item.id,
                  wordpressUrl,
                  auth,
                  wooConfig
                );
              }

              // Build SEO optimization prompt
              const prompt = buildSeoPrompt(
                item,
                currentContent,
                lang,
                bannedWords
              );

              sendProgress(controller, progressPercent + 5, `🤖 AI SEO analyse...`);

              // Call AI
              const aiResponse = await chatCompletion({
                model: TEXT_MODELS.CLAUDE_SONNET,
                messages: [
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
                temperature: 0.7,
                max_tokens: 1000,
              });

              // Calculate credits (5 per item, 20% discount for 5+)
              const itemCredits = itemCount >= 5 ? 4 : 5;
              totalCredits += itemCredits;

              // Parse AI response
              const content = aiResponse?.choices?.[0]?.message?.content;
              if (!content) {
                throw new Error('AI generatie mislukt');
              }

              let seoData;
              try {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  seoData = JSON.parse(jsonMatch[0]);
                } else {
                  throw new Error('Geen JSON gevonden in AI response');
                }
              } catch (parseError) {
                console.error('Failed to parse AI response:', content);
                throw new Error('AI response kon niet geparsed worden');
              }

              // Clean banned words
              const cleanedData = {
                seo_title: seoData.seo_title ? removeBannedWords(seoData.seo_title) : '',
                meta_description: seoData.meta_description ? removeBannedWords(seoData.meta_description) : '',
                focus_keyword: seoData.focus_keyword || item.focusKeyword || '',
              };

              sendProgress(controller, progressPercent + 8, `✅ Item ${i + 1} geoptimaliseerd`);

              // Save to WordPress
              sendProgress(controller, progressPercent + 9, `💾 Opslaan...`);
              await saveSeoToWordPress(
                item.type,
                item.id,
                cleanedData,
                wordpressUrl,
                auth,
                wooConfig
              );

              results.push({
                itemId: item.id,
                itemType: item.type,
                success: true,
                newSeo: cleanedData
              });

            } catch (itemError: any) {
              console.error(`Error optimizing item ${item.id}:`, itemError);
              results.push({
                itemId: item.id,
                itemType: item.type,
                success: false,
                error: itemError.message
              });
              sendProgress(
                controller, 
                progressPercent, 
                `❌ Fout bij item ${i + 1}: ${itemError.message}`
              );
            }
          }

          // Deduct credits
          await deductCredits(
            project.client.id,
            totalCredits,
            `Site Manager SEO Optimize - ${itemCount} items`,
            {
              model: TEXT_MODELS.CLAUDE_SONNET,
              tool: 'site_manager_seo'
            }
          );

          sendProgress(controller, 100, `🎉 SEO optimalisatie voltooid!`);
          sendComplete(
            controller,
            'Alle items verwerkt',
            results,
            totalCredits
          );

          controller.close();
        } catch (error: any) {
          console.error('Error in SEO optimize stream:', error);
          sendError(controller, error.message || 'Onbekende fout opgetreden');
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: error.message || 'Interne serverfout' },
      { status: 500 }
    );
  }
}

function sendProgress(
  controller: ReadableStreamDefaultController,
  progress: number,
  message: string,
  data?: any
) {
  const payload = JSON.stringify({ 
    type: 'progress', 
    progress, 
    message,
    ...data 
  });
  controller.enqueue(new TextEncoder().encode(payload + '\n'));
}

function sendError(controller: ReadableStreamDefaultController, error: string) {
  const data = JSON.stringify({ type: 'error', error });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

function sendComplete(
  controller: ReadableStreamDefaultController,
  message: string,
  results: any[],
  creditsUsed: number
) {
  const data = JSON.stringify({ 
    type: 'complete', 
    message, 
    results,
    creditsUsed 
  });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

async function fetchItemContent(
  type: string,
  id: number,
  wordpressUrl: string,
  auth: string,
  wooConfig: any
): Promise<{ title: string; content: string }> {
  if (type === 'product' && wooConfig) {
    const wooClient = createWooCommerceClient(wooConfig);
    const product = await wooClient.getProduct(id);
    return {
      title: product.name,
      content: product.description || ''
    };
  } else {
    const endpoint = type === 'post' ? 'posts' : 'pages';
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${id}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} from WordPress`);
    }

    const data = await response.json();
    return {
      title: data.title.rendered,
      content: data.content.rendered
    };
  }
}

function buildSeoPrompt(
  item: SeoOptimizeItem,
  currentContent: { title: string; content: string },
  language: string,
  bannedWords: string[]
): string {
  const languageInstruction = language === 'en' 
    ? 'Write in perfect English' 
    : language === 'fr'
    ? 'Écrivez en français'
    : language === 'es'
    ? 'Escribe en español'
    : 'Schrijf in Nederlands';

  const bannedWordsText = bannedWords.join(', ');

  return `Je bent een SEO expert. Genereer geoptimaliseerde meta title en description voor deze content.

${languageInstruction}

HUIDIGE CONTENT:
Titel: ${currentContent.title}
Content (eerste 500 tekens): ${currentContent.content.replace(/<[^>]*>/g, '').substring(0, 500)}...
${item.focusKeyword ? `Focus Keyword: ${item.focusKeyword}` : ''}

VEREISTEN:
1. SEO Title: Max 60 karakters, begin met focus keyword indien mogelijk
2. Meta Description: 120-160 karakters, pakkend met call-to-action
3. Focus Keyword: Extraheer of suggereer het belangrijkste keyword
4. Optimaliseer voor click-through rate (CTR)
5. Maak het pakkend en relevant
6. BELANGRIJK: Gebruik NOOIT deze AI-woorden: ${bannedWordsText}
7. Schrijf menselijk en natuurlijk

FORMAAT:
Geef je antwoord in dit EXACTE JSON formaat:
{
  "seo_title": "Geoptimaliseerde SEO titel (max 60 chars)",
  "meta_description": "Geoptimaliseerde meta description (120-160 chars)",
  "focus_keyword": "Hoofd keyword",
  "reasoning": "Korte uitleg van keuzes"
}`;
}

async function saveSeoToWordPress(
  type: string,
  id: number,
  seoData: any,
  wordpressUrl: string,
  auth: string,
  wooConfig: any
): Promise<void> {
  if (type === 'product' && wooConfig) {
    const wooClient = createWooCommerceClient(wooConfig);
    const metaData = [
      { key: '_yoast_wpseo_title', value: seoData.seo_title },
      { key: '_yoast_wpseo_metadesc', value: seoData.meta_description },
    ];
    
    if (seoData.focus_keyword) {
      metaData.push({ key: '_yoast_wpseo_focuskw', value: seoData.focus_keyword });
    }
    
    await wooClient.updateProduct(id, { meta_data: metaData });
  } else {
    const endpoint = type === 'post' ? 'posts' : 'pages';
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${id}`;
    
    // Note: Yoast SEO meta fields typically require a specific plugin API or meta_data handling
    // This is a simplified version - you may need to adjust based on your Yoast SEO setup
    const updateData = {
      meta: {
        _yoast_wpseo_title: seoData.seo_title,
        _yoast_wpseo_metadesc: seoData.meta_description,
        _yoast_wpseo_focuskw: seoData.focus_keyword || ''
      }
    };

    // Note: WordPress REST API uses POST for updates (not PUT)
    // This is the standard WordPress REST API convention
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update SEO meta in WordPress`);
    }
  }
}
