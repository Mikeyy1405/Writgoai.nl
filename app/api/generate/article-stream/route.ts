import { createClient } from '@/lib/supabase-server';
import { getProjectContext, buildContextPrompt } from '@/lib/project-context';
import OpenAI from 'openai';
import { generateFeaturedImage, generateArticleImage } from '@/lib/abacus-image-generator';
import {
  searchYouTubeVideo,
  scrapeSitemap,
  formatSitemapLinksForPrompt,
  createInArticleImageHtml,
  findIntroEndPosition,
  findMiddlePosition,
  insertContentAtPosition,
} from '@/lib/content-enrichment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.AIML_API_KEY;
    if (!apiKey) {
      throw new Error('AIML_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.aimlapi.com/v1',
    });
  }
  return openaiClient;
}

// Language-specific instructions
const LANGUAGE_INSTRUCTIONS: Record<string, {
  systemPrompt: string;
  writingStyle: string;
}> = {
  nl: {
    systemPrompt: 'Je bent een Nederlandse SEO content schrijver. Schrijf in het Nederlands met "je" en "jij" (informeel).',
    writingStyle: 'Schrijf in het Nederlands. Gebruik "je" en "jij" (informeel). Alle content moet in het Nederlands zijn.',
  },
  en: {
    systemPrompt: 'You are an English SEO content writer. Write in English.',
    writingStyle: 'Write in English. All content must be in English.',
  },
  de: {
    systemPrompt: 'Du bist ein deutscher SEO Content Writer. Schreibe auf Deutsch met "du" (informell).',
    writingStyle: 'Schreibe auf Deutsch. Verwende "du" (informell). Alle Inhalte müssen auf Deutsch sein.',
  },
};

export async function POST(request: Request) {
  const encoder = new TextEncoder();

  try {
    const supabase = createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Niet geautoriseerd' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      project_id,
      title,
      keyword,
      description,
      word_count = 2000,
      language = 'nl',
    } = body;

    if (!project_id || !title) {
      return new Response(
        JSON.stringify({ error: 'project_id en title zijn verplicht' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify project ownership
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project niet gevonden' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get project context (knowledge base, affiliates, internal links)
    const projectContext = await getProjectContext(project_id);
    let contextPrompt = buildContextPrompt(projectContext);

    // If no internal links from database, try sitemap scraping as fallback
    if (projectContext.internalLinks.length === 0 && project.website_url) {
      try {
        const sitemapLinks = await scrapeSitemap(project.website_url);
        if (sitemapLinks.length > 0) {
          console.log(`Found ${sitemapLinks.length} links from sitemap`);
          contextPrompt = contextPrompt + '\n\n' + formatSitemapLinksForPrompt(sitemapLinks);
        }
      } catch (e) {
        console.warn('Sitemap scraping failed:', e);
      }
    }

    const langInstructions = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS.nl;

    // Build the prompt
    const prompt = `${langInstructions.writingStyle}

${contextPrompt}

Schrijf een uitgebreid, SEO-geoptimaliseerd artikel over: "${title}"

${description ? `Context: ${description}` : ''}
${keyword ? `Focus keyword: ${keyword}` : ''}

Vereisten:
- STRIKT ${word_count} woorden (maximaal ${Math.round(word_count * 1.1)} woorden, NIET meer!)
- Dit is een HARDE LIMIET - schrijf NIET meer dan ${Math.round(word_count * 1.1)} woorden
- Gebruik HTML formatting (h2, h3, p, ul, li, strong, em)
- Maak het informatief, engaging en SEO-vriendelijk
- Gebruik de focus keyword natuurlijk door het artikel
- Voeg relevante interne links toe waar mogelijk
- Voeg affiliate links toe voor relevante producten
- Structureer met duidelijke headers en paragrafen
- Begin direct met de content (geen intro zoals "Hier is het artikel")
- Sluit af met een sterke conclusie (NIET "Conclusie", "Tot slot", "Ten slotte")

⚠️ ABSOLUUT VERBODEN - Generieke Headings:
- NOOIT: "Wat is [onderwerp]", "Definitie van", "Waarom belangrijk"
- NOOIT: "Voordelen van", "Nadelen van", "Hoe werkt"
- WEL: Specifieke, waardevolle headings die direct waarde communiceren
- Voorbeeld: "3x sneller resultaat met [techniek]", "Hoeveel tijd kost [onderwerp] per week?"

- BELANGRIJK: Houd je STRIKT aan de woordlimiet van ${word_count} woorden!

Schrijf het artikel in HTML formaat:`;

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial message
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'start', title })}\n\n`)
          );

          let fullContent = '';
          let chunkCount = 0;

          // Stream from Claude Sonnet 4.5 via AIML API
          // Calculate max tokens based on word count (roughly 1.3 tokens per word for English/Dutch)
          const estimatedTokens = Math.min(Math.round(word_count * 1.5) + 500, 8000);

          const completion = await getOpenAI().chat.completions.create({
            model: 'anthropic/claude-sonnet-4.5',
            max_tokens: estimatedTokens,
            temperature: 0.7,
            stream: true,
            messages: [
              {
                role: 'system',
                content: `${langInstructions.systemPrompt} BELANGRIJK: Houd je STRIKT aan de opgegeven woordlimiet. Schrijf NOOIT meer dan de maximale woordlimiet.`,
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
          });

          // Handle streaming chunks
          for await (const chunk of completion) {
            // Debug: log first 3 chunks completely (can be disabled by setting DEBUG=false in env)
            if (chunkCount < 3 && process.env.DEBUG !== 'false') {
              console.log(`[DEBUG] Chunk ${chunkCount + 1}:`, JSON.stringify(chunk, null, 2));
              chunkCount++;
            }

            // Handle different chunk types
            if (!chunk) {
              continue;
            }

            // String chunks
            if (typeof chunk === 'string') {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
              continue;
            }

            // Object chunks - try all possible formats
            const content =
              (chunk as any).event?.choices?.[0]?.delta?.content || // AIML API event wrapper format
              chunk.choices?.[0]?.delta?.content || // OpenAI standard
              (chunk as any).delta?.content || // Alternative format
              (chunk as any).content || // Direct content
              (chunk as any).text || // Text field
              (chunk.choices?.[0] as any)?.text || // Choices text
              '';
            
            if (content) {
              fullContent += content;
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ type: 'chunk', content })}\n\n`
                )
              );
            } else if (Object.keys(chunk).length > 0 && chunkCount > 3) {
              // Only log unexpected formats after the debug phase, and less verbosely
              console.warn('[Stream] Unexpected chunk format (keys):', Object.keys(chunk).join(', '));
            }
          }

          // Clean the content
          let cleaned = fullContent.trim();
          cleaned = cleaned.replace(/^```html\s*/gi, '');
          cleaned = cleaned.replace(/```\s*$/g, '');
          cleaned = cleaned.replace(/^(Here is|Here's|Below is|Hier is|Hieronder)[^<]*</i, '<');

          // Send progress update for media enrichment
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'progress', step: 'Verrijken met media (YouTube, afbeeldingen)...' })}\n\n`)
          );

          // Enrich content with YouTube video and images (in parallel)
          console.log('Enriching content with media...');
          const [youtubeResult, featuredImageResult, inArticleImageResult] = await Promise.allSettled([
            searchYouTubeVideo(keyword || title, language),
            generateFeaturedImage(title, keyword),
            generateArticleImage(`${keyword || title} illustration, informative diagram`, 'photorealistic'),
          ]);

          // Insert YouTube video after intro
          if (youtubeResult.status === 'fulfilled' && youtubeResult.value) {
            const video = youtubeResult.value;
            const introEndPos = findIntroEndPosition(cleaned);
            if (introEndPos > 0) {
              cleaned = insertContentAtPosition(cleaned, video.embedHtml, introEndPos);
              console.log('YouTube video inserted:', video.title);
            }
          }

          // Insert in-article image in middle
          if (inArticleImageResult.status === 'fulfilled' && inArticleImageResult.value) {
            const middlePos = findMiddlePosition(cleaned);
            if (middlePos > 0) {
              const imageHtml = createInArticleImageHtml(
                inArticleImageResult.value,
                `Illustratie over ${keyword || title}`,
                `Visuele uitleg van ${keyword || title}`
              );
              cleaned = insertContentAtPosition(cleaned, imageHtml, middlePos);
              console.log('In-article image inserted');
            }
          }

          // Get featured image URL
          const featuredImage = featuredImageResult.status === 'fulfilled' ? featuredImageResult.value : null;

          // Calculate word count
          const wordCount = cleaned.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;

          // Generate slug
          const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 60);

          // Extract meta description (first 160 chars of text content)
          const textContent = cleaned.replace(/<[^>]*>/g, ' ').trim();
          const metaDescription = textContent.substring(0, 160);

          // Save article to database
          const { data: article, error: articleError } = await supabase
            .from('articles')
            .insert({
              project_id,
              title,
              slug,
              content: cleaned,
              excerpt: metaDescription,
              meta_description: metaDescription,
              meta_title: title,
              focus_keyword: keyword || '',
              word_count: wordCount,
              featured_image: featuredImage || null,
              status: 'draft',
              author_id: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (articleError) {
            console.error('Error saving article:', articleError);
          }

          // Send completion message
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                content: cleaned,
                wordCount,
                slug,
                metaDescription,
                featuredImage: featuredImage || null,
                articleId: article?.id,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error.message || 'Er is een fout opgetreden',
              })}\n\n`
            )
          );
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
    console.error('API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Er is een fout opgetreden' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
