
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendChatCompletion } from '@/lib/aiml-chat-client';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { publishToWordPress, WordPressConfig } from '@/lib/wordpress-publisher';
import { searchBolcomProducts } from '@/lib/bolcom-api';
import { generateImage } from '@/lib/aiml-api';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (step: string, message: string) => {
        const data = `data: ${JSON.stringify({ step, message })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      const sendError = (error: string) => {
        const data = `data: ${JSON.stringify({ error, step: 'error' })}\n\n`;
        controller.enqueue(encoder.encode(data));
        controller.close();
      };

      try {
        // Step 1: Authentication
        sendProgress('auth', 'Authenticatie controleren...');
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
          sendError('Niet geautoriseerd');
          return;
        }

        // Step 2: Parse request
        sendProgress('parse', 'Request gegevens verwerken...');
        const body = await request.json();
        const { topicId, projectId, config } = body;

        if (!topicId || !projectId) {
          sendError('Topic ID en Project ID zijn verplicht');
          return;
        }

        // Step 3: Get client
        sendProgress('client', 'Client gegevens ophalen...');
        const client = await prisma.client.findUnique({
          where: { email: session.user.email },
        });

        if (!client) {
          sendError('Client niet gevonden');
          return;
        }

        // Step 4: Get topic and project
        sendProgress('topic', 'Topic en project gegevens ophalen...');
        const topic = await prisma.topicalTopic.findUnique({
          where: { id: topicId },
          include: {
            category: {
              include: {
                topicalMap: {
                  include: {
                    project: true,
                  },
                },
              },
            },
          },
        });

        if (!topic) {
          sendError('Topic niet gevonden');
          return;
        }

        const project = topic.category.topicalMap.project;

        // Step 5: Generate article content
        sendProgress('generate', 'Artikel content genereren met AI...');
        
        const systemPrompt = `Je bent een expert SEO content schrijver. Schrijf een uitgebreid, SEO-geoptimaliseerd artikel in het Nederlands.

VEREISTEN:
- Minimaal 1500 woorden
- Professional en informatief
- Perfect geoptimaliseerd voor "${topic.title}"
- Gebruik H2 en H3 koppen
- Natuurlijke schrijfstijl
${config.includeFAQ ? '- Voeg een FAQ sectie toe aan het einde' : ''}
${config.includeTables ? '- Voeg relevante tabellen toe waar mogelijk' : ''}
${config.includeInternalLinks ? '- Gebruik natuurlijke anker teksten voor interne links' : ''}

BELANGRIJK: Schrijf in vlotte paragrafen, geen lijst formaat. Gebruik markdown formatting (** voor bold, ## voor H2, ### voor H3).`;

        const userPrompt = `Schrijf een volledig artikel over: "${topic.title}"

Keywords: ${topic.keywords.join(', ')}
Type: ${topic.type === 'commercial' ? 'Commercial (productgericht, vergelijkend)' : 'Informational (educatief, how-to)'}
Niche: ${project.niche || 'Algemeen'}

${config.includeTables ? '\nVoeg minimaal 1 vergelijkingstabel toe met relevante data.' : ''}
${config.includeFAQ ? '\nVoeg een FAQ sectie toe met minimaal 5 veelgestelde vragen.' : ''}`;

        const articleResponse = await sendChatCompletion({
          model: 'google/gemini-2.0-flash-thinking-exp-01-21',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 4000,
          stream: false,
        });

        // Type guard to check if response is ChatCompletion (not Stream)
        let articleContent = '';
        if ('choices' in articleResponse && Array.isArray(articleResponse.choices)) {
          articleContent = articleResponse.choices[0]?.message?.content || '';
        } else {
          sendError('Onverwacht response formaat van AI');
          return;
        }

        if (!articleContent) {
          sendError('Fout bij genereren artikel content');
          return;
        }

        // Step 6: Generate images if requested
        let featuredImage = '';
        const inlineImages: string[] = [];

        if (config.includeImages) {
          sendProgress('images', `${config.imageCount} afbeeldingen genereren...`);
          
          try {
            // Generate featured image
            const featuredPrompt = `A professional, high-quality image representing: ${topic.title}. Modern, clean, and visually appealing.`;
            const featuredResult = await generateImage({
              prompt: featuredPrompt,
              model: 'FLUX_PRO',
              width: 1024,
              height: 576, // 16:9 aspect ratio
            });
            if (featuredResult.images && featuredResult.images[0]) {
              featuredImage = featuredResult.images[0];
            }

            // Generate inline images
            for (let i = 0; i < Math.min(config.imageCount - 1, 4); i++) {
              const imagePrompt = `Professional image for article section about: ${topic.keywords[i] || topic.title}`;
              const imageResult = await generateImage({
                prompt: imagePrompt,
                model: 'FLUX_PRO',
                width: 1024,
                height: 576, // 16:9 aspect ratio
              });
              if (imageResult.images && imageResult.images[0]) {
                inlineImages.push(imageResult.images[0]);
              }
            }
          } catch (error) {
            console.error('Error generating images:', error);
            sendProgress('images-fallback', 'Afbeeldingen overgeslagen vanwege fout');
          }
        }

        // Step 7: Add Bol affiliate products if requested
        if (config.includeBolLinks) {
          sendProgress('bol', 'Bol.com producten zoeken...');
          
          try {
            // Get Bol.com credentials from auth secrets
            const fs = await import('fs').then(m => m.promises);
            const path = await import('path');
            const authPath = path.join(process.env.HOME || '/home/ubuntu', '.config', 'abacusai_auth_secrets.json');
            
            let bolCredentials = null;
            try {
              const authData = await fs.readFile(authPath, 'utf-8');
              const auth = JSON.parse(authData);
              if (auth['bol.com']?.secrets) {
                bolCredentials = {
                  clientId: auth['bol.com'].secrets.client_id?.value || '',
                  clientSecret: auth['bol.com'].secrets.client_secret?.value || '',
                };
              }
            } catch (e) {
              console.error('Error reading Bol.com credentials:', e);
            }

            if (bolCredentials && bolCredentials.clientId && bolCredentials.clientSecret) {
              const searchQuery = topic.keywords[0] || topic.title;
              const result = await searchBolcomProducts(searchQuery, bolCredentials, {
                resultsPerPage: 3,
              });

              if (result.results && result.results.length > 0) {
                // Add products section
                articleContent += '\n\n## Aanbevolen Producten\n\n';
                
                result.results.forEach((product: any) => {
                  articleContent += `### ${product.title}\n\n`;
                  articleContent += `${product.summary || ''}\n\n`;
                  articleContent += `**Prijs:** €${product.offerData?.offers?.[0]?.price || 'N/A'}\n\n`;
                  articleContent += `[Bekijk op Bol.com](${product.url})\n\n`;
                });
              }
            } else {
              sendProgress('bol-fallback', 'Bol.com credentials niet gevonden - producten overgeslagen');
            }
          } catch (error) {
            console.error('Error fetching Bol products:', error);
            sendProgress('bol-fallback', 'Bol.com producten overgeslagen vanwege fout');
          }
        }

        // Step 8: Insert inline images into content
        if (inlineImages.length > 0) {
          const sections = articleContent.split('\n\n');
          const imageInterval = Math.floor(sections.length / (inlineImages.length + 1));
          
          inlineImages.forEach((imageUrl, index) => {
            const insertIndex = (index + 1) * imageInterval;
            if (insertIndex < sections.length) {
              sections.splice(insertIndex, 0, `![](${imageUrl})`);
            }
          });
          
          articleContent = sections.join('\n\n');
        }

        // Step 9: Save to content library
        sendProgress('save', 'Opslaan in Content Bibliotheek...');
        
        const savedContent = await autoSaveToLibrary({
          type: 'blog',
          title: topic.title,
          content: articleContent,
          metaDesc: `${topic.title} - ${topic.keywords.slice(0, 3).join(', ')}`,
          thumbnailUrl: featuredImage,
          keywords: topic.keywords, // Keep as array
          tags: topic.keywords,
          clientId: client.id,
          projectId: project.id,
          language: project.language || 'NL',
        });

        // Step 10: Mark topic as completed
        sendProgress('complete', 'Topic markeren als voltooid...');
        
        await prisma.topicalTopic.update({
          where: { id: topicId },
          data: {
            isCompleted: true,
            contentId: savedContent.contentId,
          },
        });

        // Step 11: Publish to WordPress if configured
        if (project.wordpressUrl && project.wordpressUsername && project.wordpressPassword) {
          sendProgress('wordpress', 'Publiceren naar WordPress...');
          
          try {
            const wpConfig: WordPressConfig = {
              siteUrl: project.wordpressUrl,
              username: project.wordpressUsername,
              applicationPassword: project.wordpressPassword,
            };

            await publishToWordPress(wpConfig, {
              title: topic.title,
              content: articleContent,
              excerpt: `${topic.title} - ${topic.keywords.slice(0, 3).join(', ')}`,
              status: 'publish',
              featuredImageUrl: featuredImage || undefined,
              tags: topic.keywords, // Tags can be strings
              seoTitle: topic.title,
              seoDescription: `${topic.title} - ${topic.keywords.slice(0, 3).join(', ')}`,
              focusKeyword: topic.keywords[0] || topic.title,
            });

            sendProgress('done', `✅ Artikel succesvol geschreven, opgeslagen en gepubliceerd!`);
          } catch (error) {
            console.error('WordPress publish error:', error);
            sendProgress('done', `✅ Artikel geschreven en opgeslagen. WordPress publicatie mislukt.`);
          }
        } else {
          sendProgress('done', `✅ Artikel succesvol geschreven en opgeslagen in bibliotheek!`);
        }

        const data = `data: ${JSON.stringify({ 
          step: 'done', 
          success: true, 
          contentId: savedContent.contentId,
          message: 'Artikel succesvol aangemaakt!'
        })}\n\n`;
        controller.enqueue(encoder.encode(data));
        controller.close();

      } catch (error: any) {
        console.error('Auto-write error:', error);
        sendError(error.message || 'Er is een fout opgetreden');
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
