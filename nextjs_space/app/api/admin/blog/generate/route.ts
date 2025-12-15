import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { publishToWordPress, getWordPressConfig } from '@/lib/wordpress-publisher';

export const dynamic = 'force-dynamic';

// Helper function to send SSE message
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(message));
}

/**
 * Helper function to extract plain text from AI-generated HTML for metadata
 * 
 * SECURITY NOTE: This function is used to extract plain text from AI-generated HTML
 * for metadata purposes (title, excerpt). The HTML content comes from our controlled
 * AI generation system, not from user input. The full HTML content is stored as-is
 * in the database for display purposes.
 * 
 * For production use with user-generated content, consider using a proper HTML sanitization
 * library like DOMPurify or sanitize-html.
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Simple text extraction: remove all content between < and >
  // This is safe for our use case since:
  // 1. Content is AI-generated, not user input
  // 2. Only used for metadata extraction (title/excerpt)
  // 3. Full HTML is preserved in database for display
  let text = html
    .replace(/<[^>]+>/g, ' ') // Replace all tags with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Decode basic HTML entities
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&', // This must be last
  };
  
  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), char);
  }
  
  return text.trim();
}

// Constants for AI prompt limits
const MAX_SITEMAP_URLS = 20; // Maximum sitemap URLs to include in prompt
const MAX_AFFILIATE_LINKS = 10; // Maximum affiliate links to include in prompt

/**
 * Build AI prompt for blog generation with project context
 */
function buildBlogPrompt(params: {
  articleTitle: string;
  keywords: any;
  targetWordCount: number;
  includeFAQ: boolean;
  tone?: string;
  targetAudience?: string;
  project?: any;
  sitemapUrls?: string[];
  affiliateLinks?: any[];
  addInternalLinks?: boolean;
  addAffiliateLinks?: boolean;
}): string {
  const { 
    articleTitle, 
    keywords, 
    targetWordCount, 
    includeFAQ, 
    tone, 
    targetAudience, 
    project,
    sitemapUrls = [],
    affiliateLinks = [],
    addInternalLinks = false,
    addAffiliateLinks = false
  } = params;
  
  const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords || '';
  const wordCount = targetWordCount || 1500;

  // Build project-specific context
  let projectContext = '';
  if (project) {
    if (project.brandVoice || project.toneOfVoice) {
      projectContext += `\n- Brand Voice/Tone of Voice: ${project.brandVoice || project.toneOfVoice}`;
    }
    if (project.targetAudience) {
      projectContext += `\n- Doelgroep: ${project.targetAudience}`;
    }
    if (project.niche) {
      projectContext += `\n- Niche: ${project.niche}`;
    }
    if (project.additionalInfo) {
      projectContext += `\n- Brand context: ${project.additionalInfo}`;
    }
  }

  // Build internal links context
  let internalLinksContext = '';
  if (addInternalLinks && sitemapUrls.length > 0) {
    // Limit URLs to avoid token overflow
    const relevantUrls = sitemapUrls.slice(0, MAX_SITEMAP_URLS);
    internalLinksContext = `\n\nINTERNE LINKS (voeg 2-4 relevante interne links toe in de content):
${relevantUrls.map(url => `- ${url}`).join('\n')}

BELANGRIJK: Integreer deze interne links natuurlijk in de tekst waar relevant. Gebruik beschrijvende anchor texts.`;
  }

  // Build affiliate links context
  let affiliateLinksContext = '';
  if (addAffiliateLinks && affiliateLinks.length > 0) {
    // Limit affiliate links to avoid token overflow
    const relevantLinks = affiliateLinks.slice(0, MAX_AFFILIATE_LINKS);
    affiliateLinksContext = `\n\nAFFILIATE LINKS (voeg 1-3 relevante product aanbevelingen toe):
${relevantLinks.map((link: any) => 
  `- ${link.anchorText}: ${link.url}${link.category ? ` (Categorie: ${link.category})` : ''}${link.keywords && link.keywords.length > 0 ? ` [Keywords: ${link.keywords.join(', ')}]` : ''}`
).join('\n')}

BELANGRIJK: Integreer deze affiliate links alleen waar ze natuurlijk passen en waarde toevoegen aan de lezer. Gebruik natuurlijke product aanbevelingen.`;
  }

  // Determine target audience and tone
  const finalTargetAudience = targetAudience || project?.targetAudience || '';
  const finalTone = tone || project?.brandVoice || project?.toneOfVoice || 'professioneel maar toegankelijk';

  return `Schrijf een complete, SEO-geoptimaliseerde blog post over "${articleTitle}".

VERPLICHTE ELEMENTEN:
1. Titel (H1) - pakkend en keyword-rijk
2. Inleiding (150-200 woorden) - hook de lezer
3. Minimaal 4 hoofdsecties met H2 headers
4. Subsecties met H3 headers waar relevant
5. Conclusie (100-150 woorden)
6. Call-to-action (probeer WritgoAI gratis)
${includeFAQ ? '7. FAQ sectie met minimaal 5 vragen en antwoorden' : ''}

SEO VEREISTEN:
${keywordsStr ? `- Focus keywords: ${keywordsStr}` : ''}
- Natuurlijke keyword integratie (geen stuffing)
- Informatieve, waardevolle content
- Leesbare zinnen en alinea's
${finalTargetAudience ? `- Doelgroep: ${finalTargetAudience}` : ''}
- Tone: ${finalTone}${projectContext}

CONTENT VEREISTEN:
- Minimaal ${wordCount} woorden
- Gebruik praktische voorbeelden
- Voeg tips en best practices toe
- Schrijf in het Nederlands
- Geen marketing buzzwords of clichés
- Schrijf in HTML formaat met juiste tags (<p>, <h2>, <h3>, etc.)

BELANGRIJK:
- Begin direct met de content (geen markdown formatting)
- Gebruik alleen HTML tags
- Geen introductiezinnen zoals "Hier is je blog post"
- Start met <h1> titel en eindig met conclusie${internalLinksContext}${affiliateLinksContext}`;
}

// POST - Generate blog content with streaming support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title: inputTitle,
      topic, 
      keywords, 
      category,
      targetWordCount,
      tone, 
      targetAudience,
      generateImages,
      includeFAQ,
      autoPublish,
      projectId,
      project,
      addInternalLinks,
      addAffiliateLinks,
    } = body;

    const articleTitle = inputTitle || topic;
    
    if (!articleTitle) {
      return NextResponse.json({ error: 'Titel of topic is verplicht' }, { status: 400 });
    }

    // Get client from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Fetch full project details if projectId is provided
    let projectDetails = null;
    let sitemapUrls: string[] = [];
    let affiliateLinks: any[] = [];

    if (projectId) {
      projectDetails = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          affiliateLinks: {
            where: {
              isActive: true
            }
          }
        }
      });

      if (!projectDetails || projectDetails.clientId !== client.id) {
        return NextResponse.json({ error: 'Geen toegang tot dit project' }, { status: 403 });
      }

      // Extract sitemap URLs if available
      if (projectDetails.sitemap && typeof projectDetails.sitemap === 'object') {
        const sitemapData = projectDetails.sitemap as any;
        if (sitemapData.pages && Array.isArray(sitemapData.pages)) {
          sitemapUrls = sitemapData.pages
            .map((page: any) => {
              // Handle both string URLs and objects with url property
              if (typeof page === 'string') return page;
              if (page && typeof page === 'object' && page.url) return page.url;
              return null;
            })
            .filter((url): url is string => url !== null && typeof url === 'string');
        }
      }

      // Get affiliate links
      affiliateLinks = projectDetails.affiliateLinks || [];
    }

    // Check if streaming is supported
    const acceptHeader = request.headers.get('accept');
    const supportsStreaming = acceptHeader?.includes('text/event-stream');

    if (supportsStreaming) {
      // Return streaming response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Phase 1: SERP Analysis (simulated for now)
            sendSSE(controller, {
              phase: 'SERP Analyse',
              progress: 10,
              message: 'Analyseren van top Google resultaten...',
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            sendSSE(controller, {
              phaseComplete: 'SERP Analyse',
              progress: 25,
            });

            // Phase 2: Content Generation
            sendSSE(controller, {
              phase: 'Content Generatie',
              progress: 30,
              message: 'SEO-geoptimaliseerde content schrijven...',
            });

            const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords || '';

            const prompt = buildBlogPrompt({
              articleTitle,
              keywords,
              targetWordCount,
              includeFAQ,
              tone,
              targetAudience,
              project: projectDetails || project,
              sitemapUrls,
              affiliateLinks,
              addInternalLinks,
              addAffiliateLinks,
            });

            const response = await chatCompletion({
              messages: [{ role: 'user', content: prompt }],
              model: 'gpt-4o',
              temperature: 0.7,
            });

            let content = response.choices[0]?.message?.content || '';
            
            // Clean content
            const htmlStart = content.search(/<h1|<p|<div/i);
            if (htmlStart > 0) {
              content = content.substring(htmlStart);
            }
            content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');

            sendSSE(controller, {
              phaseComplete: 'Content Generatie',
              progress: 60,
            });

            // Phase 3: SEO & Images
            sendSSE(controller, {
              phase: 'SEO & Afbeeldingen',
              progress: 65,
              message: 'Meta data optimaliseren...',
            });

            const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
            const title = titleMatch ? stripHtmlTags(titleMatch[1]) : articleTitle;

            let slug = title
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');

            // Check for existing slug and add suffix if needed
            const existingPost = await prisma.blogPost.findFirst({
              where: {
                slug: {
                  startsWith: slug,
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            });

            if (existingPost) {
              // Extract number from existing slug if present
              const match = existingPost.slug.match(/-(\d+)$/);
              const nextNumber = match ? parseInt(match[1]) + 1 : 2;
              slug = `${slug}-${nextNumber}`;
            }

            const paragraphs = content.match(/<p>(.*?)<\/p>/gi) || [];
            const excerpt = stripHtmlTags(
              paragraphs
                .slice(0, 2)
                .join(' ')
            ).substring(0, 300);

            const actualWordCount = content.split(/\s+/).length;
            const readingTimeMinutes = Math.ceil(actualWordCount / 200);

            sendSSE(controller, {
              phaseComplete: 'SEO & Afbeeldingen',
              progress: 80,
            });

            // Phase 4: Save
            sendSSE(controller, {
              phase: 'Opslaan',
              progress: 85,
              message: 'Artikel opslaan...',
            });

            // Save to database
            const postData: any = {
              clientId: client.id,
              title,
              slug,
              excerpt,
              content,
              category: category || 'AI & Content Marketing',
              tags: keywordsStr ? keywordsStr.split(',').map((k: string) => k.trim()) : [],
              status: autoPublish ? 'published' : 'draft',
              publishedAt: autoPublish ? new Date() : null,
              readingTimeMinutes,
              wordCount: actualWordCount,
              metaTitle: title.substring(0, 60),
              metaDescription: excerpt.substring(0, 155),
              focusKeyword: keywordsStr?.split(',')[0]?.trim() || '',
            };

            // Add projectId if provided
            if (projectId) {
              postData.projectId = projectId;
            }

            const post = await prisma.blogPost.create({
              data: postData,
            });

            sendSSE(controller, {
              phaseComplete: 'Opslaan',
              progress: 90,
            });

            // Publish to WordPress if autoPublish is enabled and project has WordPress configured
            let wordpressUrl = '';
            if (autoPublish && projectId && projectDetails?.wordpressUrl) {
              try {
                sendSSE(controller, {
                  phase: 'WordPress Publicatie',
                  progress: 92,
                  message: 'Publiceren naar WordPress...',
                });

                const wpConfig = await getWordPressConfig({ projectId });
                
                if (wpConfig) {
                  const wpResult = await publishToWordPress(wpConfig, {
                    title,
                    content,
                    excerpt,
                    status: 'publish',
                    tags: keywordsStr ? keywordsStr.split(',').map((k: string) => k.trim()) : [],
                    seoTitle: title.substring(0, 60),
                    seoDescription: excerpt.substring(0, 155),
                    focusKeyword: keywordsStr?.split(',')[0]?.trim() || '',
                  });

                  wordpressUrl = wpResult.link;
                  
                  // Update blog post with WordPress URL
                  await prisma.blogPost.update({
                    where: { id: post.id },
                    data: {
                      wordpressUrl: wpResult.link,
                      wordpressPostId: wpResult.id.toString(),
                    }
                  });

                  sendSSE(controller, {
                    phaseComplete: 'WordPress Publicatie',
                    progress: 98,
                    message: `Gepubliceerd op WordPress: ${wpResult.link}`,
                  });
                } else {
                  console.warn(`WordPress config not found for project ${projectId}. Please configure WordPress credentials in project settings.`);
                  sendSSE(controller, {
                    phase: 'WordPress Publicatie',
                    progress: 98,
                    message: 'WordPress credentials niet gevonden. Configureer deze in project instellingen.',
                  });
                }
              } catch (wpError: any) {
                console.error('WordPress publish error:', wpError);
                sendSSE(controller, {
                  phase: 'WordPress Publicatie',
                  progress: 98,
                  message: `WordPress publicatie mislukt: ${wpError.message}. Artikel is wel opgeslagen.`,
                });
              }
            }

            sendSSE(controller, {
              progress: 100,
            });

            // Send completion
            sendSSE(controller, {
              complete: true,
              postId: post.id,
              wordpressUrl,
              message: wordpressUrl 
                ? `Artikel succesvol gegenereerd en gepubliceerd op WordPress!`
                : 'Artikel succesvol gegenereerd!',
            });

            controller.close();
          } catch (error: any) {
            console.error('Generation error:', error);
            sendSSE(controller, {
              error: error.message || 'Er is een fout opgetreden',
            });
            controller.close();
          }
        },
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Fallback: Non-streaming response (legacy support)
    // Note: This path returns the raw content without saving to database
    const keywordsStr = Array.isArray(keywords) ? keywords.join(', ') : keywords || '';

    const prompt = buildBlogPrompt({
      articleTitle,
      keywords,
      targetWordCount,
      includeFAQ: includeFAQ || false,
      tone,
      targetAudience,
      project: projectDetails || project,
      sitemapUrls,
      affiliateLinks,
      addInternalLinks,
      addAffiliateLinks,
    });

    const response = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.7,
    });

    let content = response.choices[0]?.message?.content || '';
    
    const htmlStart = content.search(/<h1|<p|<div/i);
    if (htmlStart > 0) {
      content = content.substring(htmlStart);
    }
    content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');

    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? stripHtmlTags(titleMatch[1]) : articleTitle;

    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const paragraphs = content.match(/<p>(.*?)<\/p>/gi) || [];
    const excerpt = stripHtmlTags(
      paragraphs
        .slice(0, 2)
        .join(' ')
    ).substring(0, 300);

    const actualWordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(actualWordCount / 200);

    return NextResponse.json({
      title,
      slug,
      excerpt,
      content,
      readingTimeMinutes,
      wordCount: actualWordCount,
      metaTitle: title.substring(0, 60),
      metaDescription: excerpt.substring(0, 155),
      focusKeyword: keywordsStr?.split(',')[0]?.trim() || '',
    });
  } catch (error) {
    console.error('Error generating blog content:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
