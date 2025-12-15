/**
 * Site Manager - AI Rewrite API
 * 🤖 Herschrijf WordPress/WooCommerce content met AI
 * Ondersteunt single en bulk rewrite met streaming progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { createWooCommerceClient, getWooCommerceConfig } from '@/lib/woocommerce-api';
import { getBannedWordsForLanguage, removeBannedWords } from '@/lib/banned-words';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';
import { deductCredits } from '@/lib/credits';

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

interface RewriteItem {
  type: 'post' | 'product' | 'page';
  id: number;
  fields: Array<'title' | 'content' | 'excerpt' | 'meta_description' | 'seo_title'>;
  currentTitle?: string;
  currentContent?: string;
  currentExcerpt?: string;
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

// Send error
function sendError(controller: ReadableStreamDefaultController, error: string) {
  const data = JSON.stringify({ type: 'error', error });
  controller.enqueue(new TextEncoder().encode(data + '\n'));
}

// Send complete
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

/**
 * POST /api/client/site-manager/rewrite
 * Herschrijf content met AI (single of bulk)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      projectId, 
      items, 
      instructions, 
      tone, 
      language,
      autoSave 
    } = body;

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
          sendProgress(controller, 0, `🚀 Start herschrijven van ${itemCount} item(s)...`);

          // Get tone of voice and language settings
          const toneOfVoice = await getClientToneOfVoice(project.client.id);
          const tonePrompt = generateToneOfVoicePrompt(toneOfVoice);
          const lang = language || (project as any).preferredLanguage || 'nl';
          const bannedWords = getBannedWordsForLanguage(lang);

          // Get WordPress/WooCommerce config
          const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
          const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
          const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

          if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
            throw new Error('WordPress configuratie ontbreekt');
          }

          const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
          const wooConfig = getWooCommerceConfig(project);

          // Process each item
          for (let i = 0; i < items.length; i++) {
            const item: RewriteItem = items[i];
            const progressPercent = Math.round((i / itemCount) * 90); // Leave 10% for completion

            sendProgress(
              controller, 
              progressPercent, 
              `📝 Herschrijven item ${i + 1}/${itemCount}: ${item.currentTitle || item.type}...`,
              { itemId: item.id, itemType: item.type }
            );

            try {
              // Fetch current content if not provided
              let currentContent = {
                title: item.currentTitle || '',
                content: item.currentContent || '',
                excerpt: item.currentExcerpt || ''
              };

              if (!item.currentTitle || !item.currentContent) {
                sendProgress(controller, progressPercent + 2, `🔍 Content ophalen...`);
                currentContent = await fetchItemContent(
                  item.type,
                  item.id,
                  wordpressUrl,
                  auth,
                  wooConfig
                );
              }

              // Build AI prompt
              const prompt = buildRewritePrompt(
                item,
                currentContent,
                instructions,
                tone,
                lang,
                tonePrompt,
                bannedWords
              );

              sendProgress(controller, progressPercent + 5, `🤖 AI genereren...`);

              // Call AI
              const aiResponse = await chatCompletion({
                model: TEXT_MODELS.CLAUDE_SONNET,
                messages: [
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
                temperature: 0.8,
                max_tokens: 4000,
              });

              // Calculate credits (10 per item, 20% discount for 5+)
              const itemCredits = itemCount >= 5 ? 8 : 10;
              totalCredits += itemCredits;

              // Parse AI response
              const content = aiResponse?.choices?.[0]?.message?.content;
              if (!content) {
                throw new Error('AI generatie mislukt - geen content ontvangen');
              }

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

              // Clean banned words
              const cleanedData = {
                title: rewriteData.title ? removeBannedWords(rewriteData.title) : undefined,
                content: rewriteData.content ? removeBannedWords(rewriteData.content) : undefined,
                excerpt: rewriteData.excerpt ? removeBannedWords(rewriteData.excerpt) : undefined,
                meta_description: rewriteData.meta_description ? removeBannedWords(rewriteData.meta_description) : undefined,
                seo_title: rewriteData.seo_title ? removeBannedWords(rewriteData.seo_title) : undefined,
              };

              sendProgress(controller, progressPercent + 8, `✅ Item ${i + 1} gegenereerd`);

              // Auto-save to WordPress if requested
              if (autoSave) {
                sendProgress(controller, progressPercent + 9, `💾 Opslaan naar WordPress...`);
                await saveToWordPress(
                  item.type,
                  item.id,
                  cleanedData,
                  wordpressUrl,
                  auth,
                  wooConfig
                );
                sendProgress(controller, progressPercent + 10, `✅ Item ${i + 1} opgeslagen`);
              }

              results.push({
                itemId: item.id,
                itemType: item.type,
                success: true,
                newData: cleanedData,
                saved: autoSave
              });

            } catch (itemError: any) {
              console.error(`Error rewriting item ${item.id}:`, itemError);
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
            `Site Manager AI Rewrite - ${itemCount} items`,
            {
              model: TEXT_MODELS.CLAUDE_SONNET,
              tool: 'site_manager_rewrite'
            }
          );

          sendProgress(controller, 100, `🎉 Klaar! ${results.filter(r => r.success).length}/${itemCount} items succesvol herschreven`);
          sendComplete(
            controller,
            'Alle items verwerkt',
            results,
            totalCredits
          );

          controller.close();
        } catch (error: any) {
          console.error('Error in rewrite stream:', error);
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

async function fetchItemContent(
  type: string,
  id: number,
  wordpressUrl: string,
  auth: string,
  wooConfig: any
): Promise<{ title: string; content: string; excerpt: string }> {
  if (type === 'product' && wooConfig) {
    const wooClient = createWooCommerceClient(wooConfig);
    const product = await wooClient.getProduct(id);
    return {
      title: product.name,
      content: product.description || '',
      excerpt: product.short_description || ''
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
      content: data.content.rendered,
      excerpt: data.excerpt.rendered
    };
  }
}

function buildRewritePrompt(
  item: RewriteItem,
  currentContent: { title: string; content: string; excerpt: string },
  instructions: string,
  tone?: string,
  language?: string,
  tonePrompt?: string,
  bannedWords?: string[]
): string {
  const languageInstruction = language === 'en' 
    ? 'Write in perfect, fluent English' 
    : language === 'fr'
    ? 'Écrivez en français naturel et fluide'
    : language === 'es'
    ? 'Escribe en español fluido y natural'
    : 'Schrijf in perfect, natuurlijk Nederlands';

  const bannedWordsText = bannedWords?.join(', ') || '';
  const fieldsToRewrite = item.fields.join(', ');

  return `Je bent een expert content writer. Je taak is om bestaande ${item.type} content te herschrijven en te optimaliseren.

${tonePrompt || ''}

${languageInstruction}

HUIDIGE CONTENT:
Titel: ${currentContent.title}
Content: ${currentContent.content.substring(0, 2000)}${currentContent.content.length > 2000 ? '...' : ''}
Excerpt: ${currentContent.excerpt}

INSTRUCTIES VAN GEBRUIKER:
${instructions}

VEREISTEN:
1. Herschrijf de gevraagde velden: ${fieldsToRewrite}
${item.fields.includes('title') ? '2. Titel: Max 60 karakters, pakkend en keyword-rijk' : ''}
${item.fields.includes('content') ? '3. Content: Verbeter leesbaarheid, structuur en SEO' : ''}
${item.fields.includes('excerpt') ? '4. Excerpt: 100-150 karakters, pakkende samenvatting' : ''}
${item.fields.includes('meta_description') ? '5. Meta Description: 120-160 karakters, pakkend met CTA' : ''}
${item.fields.includes('seo_title') ? '6. SEO Title: Max 60 karakters, geoptimaliseerd voor zoekmachines' : ''}
7. BELANGRIJK: Gebruik NOOIT deze AI-woorden: ${bannedWordsText}
8. Schrijf menselijk, natuurlijk en authentiek
9. Behoud belangrijke keywords en informatie
10. Verbeter leesbaarheid en structuur

FORMAAT:
Geef je antwoord in dit EXACTE JSON formaat:
{
  ${item.fields.includes('title') ? '"title": "Nieuwe titel",' : ''}
  ${item.fields.includes('content') ? '"content": "Nieuwe content met HTML formatting",' : ''}
  ${item.fields.includes('excerpt') ? '"excerpt": "Nieuwe excerpt",' : ''}
  ${item.fields.includes('meta_description') ? '"meta_description": "Nieuwe meta description",' : ''}
  ${item.fields.includes('seo_title') ? '"seo_title": "Nieuwe SEO title",' : ''}
  "reasoning": "Korte uitleg van je aanpak"
}`;
}

async function saveToWordPress(
  type: string,
  id: number,
  data: any,
  wordpressUrl: string,
  auth: string,
  wooConfig: any
): Promise<void> {
  if (type === 'product' && wooConfig) {
    const wooClient = createWooCommerceClient(wooConfig);
    const updateData: any = {};
    
    if (data.title) updateData.name = data.title;
    if (data.content) updateData.description = data.content;
    if (data.excerpt) updateData.short_description = data.excerpt;
    
    if (data.meta_description) {
      updateData.meta_data = [
        { key: '_yoast_wpseo_metadesc', value: data.meta_description }
      ];
    }
    
    await wooClient.updateProduct(id, updateData);
  } else {
    const endpoint = type === 'post' ? 'posts' : 'pages';
    const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${id}`;
    
    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.excerpt) updateData.excerpt = data.excerpt;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update ${type} in WordPress`);
    }
  }
}
