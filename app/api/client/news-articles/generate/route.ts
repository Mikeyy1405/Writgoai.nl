
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { deductCredits, CREDIT_COSTS } from '@/lib/credits';

// Helper to send progress updates
function sendProgress(
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  message: string,
  type: 'info' | 'success' | 'error' = 'info'
) {
  const data = JSON.stringify({ type, message }) + '\n';
  controller.enqueue(encoder.encode(data));
}

// Generate news article with AI
async function generateArticle(
  title: string,
  description: string,
  wordCount: number,
  language: string,
  researchData: any,
  sendProgressFn: (message: string, type?: 'info' | 'success' | 'error') => void
) {
  sendProgressFn('✍️ Artikel wordt geschreven met Claude Sonnet 4.5...');

  const systemPrompt = `Je bent een professionele nieuwsjournalist die actuele, feitelijke nieuwsartikelen schrijft. Je schrijft in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.

BELANGRIJK:
1. Schrijf een volledig, gestructureerd nieuwsartikel
2. Gebruik Markdown formatting (## voor koppen, ** voor bold, etc.)
3. Begin met een sterke inleiding (lead paragraph)
4. Gebruik specifieke feiten, cijfers en data uit de research
5. Schrijf in journalistieke stijl (objectief, feitelijk, concreet)
6. Gebruik korte paragrafen (3-4 zinnen max)
7. Sluit af met een conclusie of vooruitblik
8. Voeg [IMAGE] toe waar een afbeelding past (max 1x)`;

  const researchContent = typeof researchData === 'object' && researchData?.content 
    ? researchData.content 
    : JSON.stringify(researchData);

  const userPrompt = `Schrijf een nieuwsartikel van ongeveer ${wordCount} woorden met de volgende specificaties:

TITEL: ${title}

BESCHRIJVING/HOEK: ${description}

RESEARCH DATA:
${researchContent}

BRONNEN (voor verificatie):
${researchData?.sources?.map((s: any, i: number) => `${i + 1}. ${s.title} - ${s.url}`).join('\n') || 'Geen specifieke bronnen'}

Schrijf nu het volledige artikel in Markdown formaat. Gebruik concrete feiten en cijfers uit de research. Voeg op een passende plek [IMAGE] toe voor een illustratie.`;

  try {
    const response = await chatCompletion({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: Math.ceil(wordCount * 2.5), // Roughly 1.5-2.5 tokens per word
      temperature: 0.7,
    });

    const content = response?.choices?.[0]?.message?.content || '';
    sendProgressFn('✅ Artikel geschreven', 'success');

    return {
      success: true,
      content,
    };
  } catch (error) {
    console.error('Article generation error:', error);
    sendProgressFn('❌ Fout bij schrijven artikel', 'error');
    return {
      success: false,
      error: 'Fout bij het schrijven van het artikel',
    };
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Niet geautoriseerd' }),
      { status: 401 }
    );
  }

  const client = await prisma.client.findUnique({
    where: { email: session.user.email },
    include: { projects: true },
  });

  if (!client) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Client niet gevonden' }),
      { status: 404 }
    );
  }

  const body = await request.json();
  const { projectId, researchId, title, description, wordCount = 600, language = 'nl' } = body;

  if (!projectId || !title) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Ontbrekende vereiste velden' }),
      { status: 400 }
    );
  }

  // Verify project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return new Response(
      JSON.stringify({ type: 'error', message: 'Project niet gevonden' }),
      { status: 404 }
    );
  }

  // Get research data if researchId provided
  let researchData: any = null;
  if (researchId) {
    const research = await prisma.newsResearch.findFirst({
      where: {
        id: researchId,
        projectId,
      },
    });
    researchData = research?.researchData;
  }

  // Return streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Create article record
        sendProgress(encoder, controller, '📝 Artikel record aanmaken...');
        const article = await prisma.newsArticle.create({
          data: {
            projectId,
            researchId: researchId || undefined,
            title,
            content: '',
            wordCount: 0,
            language,
            status: 'generating',
          },
        });
        sendProgress(encoder, controller, '✅ Artikel aangemaakt', 'success');

        // Generate article with progress updates
        const articleResult = await generateArticle(
          title,
          description || '',
          wordCount,
          language,
          researchData,
          (message, type) => sendProgress(encoder, controller, message, type)
        );

        if (!articleResult.success) {
          await prisma.newsArticle.update({
            where: { id: article.id },
            data: { status: 'draft' },
          });

          sendProgress(encoder, controller, articleResult.error || 'Artikel genereren mislukt', 'error');
          const errorData = JSON.stringify({
            type: 'complete',
            success: false,
            error: articleResult.error
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
          return;
        }

        let finalContent = articleResult.content;

        // Download featured image if [IMAGE] placeholder exists
        if (finalContent.includes('[IMAGE]')) {
          sendProgress(encoder, controller, '🖼️ Rechtenvrije afbeelding zoeken via Pixabay...');

          try {
            // Read Pixabay API key from secrets
            const fs = require('fs');
            const path = require('path');
            const secretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
            let pixabayApiKey = '';

            try {
              const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
              pixabayApiKey = secrets?.pixabay?.secrets?.api_key?.value || '';
            } catch (e) {
              console.error('Could not read Pixabay API key:', e);
            }

            if (pixabayApiKey) {
              // Generate image search query from title (extract keywords)
              const imageQuery = title
                .replace(/[^\w\s]/gi, ' ')
                .split(/\s+/)
                .filter(word => word.length > 3)
                .slice(0, 3)
                .join('+');

              sendProgress(encoder, controller, `🔍 Zoeken naar: "${imageQuery.replace(/\+/g, ' ')}"...`);

              // Search Pixabay for images
              const searchUrl = `https://pixabay.com/api/?key=${pixabayApiKey}&q=${encodeURIComponent(imageQuery)}&image_type=photo&orientation=horizontal&min_width=1200&per_page=3&safesearch=true`;

              const pixabayResponse = await fetch(searchUrl);
              const pixabayData = await pixabayResponse.json();

              if (pixabayData.hits && pixabayData.hits.length > 0) {
                // Get the best matching image (first result)
                const imageData = pixabayData.hits[0];
                const imageUrl = imageData.largeImageURL || imageData.webformatURL;
                const imageAlt = imageData.tags || title;

                sendProgress(encoder, controller, '📥 Afbeelding gevonden en toevoegen...');

                // Replace [IMAGE] with proper markdown image
                finalContent = finalContent.replace(
                  '[IMAGE]',
                  `![${imageAlt}](${imageUrl})\n\n*Afbeelding: ${imageAlt} (Bron: Pixabay)*`
                );

                sendProgress(encoder, controller, '✅ Rechtenvrije afbeelding toegevoegd', 'success');
              } else {
                sendProgress(encoder, controller, '⚠️ Geen passende afbeelding gevonden, placeholder verwijderd', 'info');
                finalContent = finalContent.replace('[IMAGE]', '');
              }
            } else {
              sendProgress(encoder, controller, '⚠️ Geen Pixabay API key, placeholder verwijderd', 'info');
              finalContent = finalContent.replace('[IMAGE]', '');
            }
          } catch (imageError) {
            console.error('Image download error:', imageError);
            sendProgress(encoder, controller, '⚠️ Kon geen afbeelding downloaden, placeholder verwijderd', 'info');
            finalContent = finalContent.replace('[IMAGE]', '');
          }
        }

        // Calculate final word count
        const finalWordCount = finalContent.split(/\s+/).filter(w => w.length > 0).length;

        // Update article with generated content
        sendProgress(encoder, controller, '💾 Artikel opslaan...');
        const updatedArticle = await prisma.newsArticle.update({
          where: { id: article.id },
          data: {
            content: finalContent,
            wordCount: finalWordCount,
            status: 'completed',
          },
        });

        // Deduct credits (use NEWS_ARTICLE cost from CREDIT_COSTS)
        const creditsUsed = CREDIT_COSTS.NEWS_ARTICLE || 60;
        await deductCredits(
          client.id,
          creditsUsed,
          `Nieuwsartikel: ${title} (${finalWordCount} woorden)`,
          {
            model: 'claude-sonnet-4-20250514',
          }
        );

        sendProgress(encoder, controller, '✅ Artikel voltooid!', 'success');

        // Send completion message with data
        const completeData = JSON.stringify({
          type: 'complete',
          success: true,
          article: updatedArticle,
          creditsUsed,
        }) + '\n';
        controller.enqueue(encoder.encode(completeData));
        controller.close();
      } catch (error) {
        console.error('Article generation streaming error:', error);
        sendProgress(encoder, controller, 'Er is een fout opgetreden', 'error');
        const errorData = JSON.stringify({
          type: 'complete',
          success: false,
          error: 'Er is een fout opgetreden'
        }) + '\n';
        controller.enqueue(encoder.encode(errorData));
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
}

// GET - Get articles for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'ProjectId is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    const articles = await prisma.newsArticle.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        research: {
          select: {
            sourceType: true,
            sourceInput: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      articles,
    });
  } catch (error) {
    console.error('GET Articles API error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an article
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { error: 'ArticleId is verplicht' },
        { status: 400 }
      );
    }

    // Verify article ownership through project
    const article = await prisma.newsArticle.findFirst({
      where: {
        id: articleId,
        project: {
          clientId: client.id,
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'Artikel niet gevonden' },
        { status: 404 }
      );
    }

    await prisma.newsArticle.delete({
      where: { id: articleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Artikel verwijderd',
    });
  } catch (error) {
    console.error('DELETE Article API error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}