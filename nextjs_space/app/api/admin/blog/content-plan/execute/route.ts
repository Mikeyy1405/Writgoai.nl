import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

export const dynamic = 'force-dynamic';

interface PlanItem {
  title: string;
  description: string;
  contentType: string;
  keywords: string[];
  estimatedWords: number;
  scheduledDate: string;
  order: number;
  selected?: boolean;
}

interface ExecuteRequest {
  planName: string;
  niche: string;
  targetAudience: string;
  language: string;
  tone: string;
  period: string;
  keywords?: string[];
  items: PlanItem[];
  clientId?: string;
}

/**
 * Helper function to strip HTML tags for metadata
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  let text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
  };
  
  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), char);
  }
  
  return text.trim();
}

/**
 * POST /api/admin/blog/content-plan/execute
 * 
 * Saves content plan and generates blog posts
 * Supports streaming for progress updates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      planName,
      niche,
      targetAudience,
      language,
      tone,
      period,
      keywords = [],
      items,
      clientId,
    }: ExecuteRequest = body;

    // Validation
    if (!planName || !niche || !targetAudience || !language || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Plan naam, niche, doelgroep, taal en items zijn verplicht' },
        { status: 400 }
      );
    }

    // Filter only selected items
    const selectedItems = items.filter(item => item.selected !== false);
    
    if (selectedItems.length === 0) {
      return NextResponse.json(
        { error: 'Selecteer minimaal één blog post om te genereren' },
        { status: 400 }
      );
    }

    console.log(`[Content Plan Execute] Starting execution for ${selectedItems.length} blog posts`);

    // Determine client ID
    let actualClientId = clientId;
    
    if (!actualClientId && session.user?.email) {
      // Find or create a client for the admin user
      let client = await prisma.client.findFirst({
        where: { email: session.user.email },
      });

      if (!client) {
        // Create a default client for the admin
        client = await prisma.client.create({
          data: {
            name: session.user.name || 'Admin',
            email: session.user.email,
            password: '', // No password needed for admin-created client
            isActive: true,
          },
        });
        console.log(`[Content Plan Execute] Created client for admin: ${client.id}`);
      }
      
      actualClientId = client.id;
    }

    if (!actualClientId) {
      return NextResponse.json(
        { error: 'Could not determine client ID' },
        { status: 400 }
      );
    }

    // Check if streaming is supported
    const acceptHeader = request.headers.get('accept');
    const supportsStreaming = acceptHeader?.includes('text/event-stream');

    if (supportsStreaming) {
      // Return streaming response for real-time progress
      return handleStreamingExecution(
        actualClientId,
        planName,
        niche,
        targetAudience,
        language,
        tone,
        period,
        keywords,
        selectedItems
      );
    }

    // Non-streaming: Execute in background and return plan ID
    const plan = await createContentPlan(
      actualClientId,
      planName,
      niche,
      targetAudience,
      language,
      tone,
      period,
      keywords,
      selectedItems
    );

    // Start background generation (don't await)
    executeContentPlan(plan.id, selectedItems, niche, targetAudience, tone, language)
      .catch(error => {
        console.error('[Content Plan Execute] Background generation failed:', error);
      });

    return NextResponse.json({
      success: true,
      message: 'Contentplan wordt uitgevoerd op de achtergrond',
      planId: plan.id,
      totalItems: selectedItems.length,
    });

  } catch (error: any) {
    console.error('[Content Plan Execute] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * Create content plan in database
 */
async function createContentPlan(
  clientId: string,
  name: string,
  niche: string,
  targetAudience: string,
  language: string,
  tone: string,
  period: string,
  keywords: string[],
  items: PlanItem[]
) {
  const plan = await prisma.contentPlan.create({
    data: {
      clientId,
      name,
      niche,
      targetAudience,
      language,
      tone,
      totalPosts: items.length,
      period,
      keywords,
      status: 'in_progress',
    },
  });

  // Create plan items
  for (const item of items) {
    await prisma.contentPlanItem.create({
      data: {
        planId: plan.id,
        title: item.title,
        description: item.description,
        scheduledDate: new Date(item.scheduledDate),
        keywords: item.keywords,
        contentType: item.contentType,
        estimatedWords: item.estimatedWords,
        order: item.order,
        status: 'pending',
      },
    });
  }

  return plan;
}

/**
 * Execute content plan generation
 */
async function executeContentPlan(
  planId: string,
  items: PlanItem[],
  niche: string,
  targetAudience: string,
  tone: string,
  language: string
) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
      // Find the plan item
      const planItem = await prisma.contentPlanItem.findFirst({
        where: {
          planId,
          title: item.title,
        },
      });

      if (!planItem) {
        console.error(`[Content Plan Execute] Plan item not found: ${item.title}`);
        continue;
      }

      // Update status to generating
      await prisma.contentPlanItem.update({
        where: { id: planItem.id },
        data: { status: 'generating' },
      });

      // Generate blog post
      const blogPost = await generateBlogPost(item, niche, targetAudience, tone, language);

      // Update plan item with blog post ID
      await prisma.contentPlanItem.update({
        where: { id: planItem.id },
        data: {
          status: 'generated',
          blogPostId: blogPost.id,
        },
      });

      console.log(`[Content Plan Execute] Generated blog ${i + 1}/${items.length}: ${blogPost.title}`);

    } catch (error: any) {
      console.error(`[Content Plan Execute] Failed to generate blog post: ${item.title}`, error);
      
      // Update item status to failed
      const planItem = await prisma.contentPlanItem.findFirst({
        where: {
          planId,
          title: item.title,
        },
      });

      if (planItem) {
        await prisma.contentPlanItem.update({
          where: { id: planItem.id },
          data: { status: 'failed' },
        });
      }
    }
  }

  // Update plan status to completed
  await prisma.contentPlan.update({
    where: { id: planId },
    data: { status: 'completed' },
  });

  console.log(`[Content Plan Execute] Completed plan: ${planId}`);
}

/**
 * Generate a single blog post using AI
 */
async function generateBlogPost(
  item: PlanItem,
  niche: string,
  targetAudience: string,
  tone: string,
  language: string
) {
  const keywordsStr = item.keywords.join(', ');
  const wordCount = item.estimatedWords || 1500;

  const prompt = `Schrijf een complete, SEO-geoptimaliseerde blog post over "${item.title}".

CONTEXT:
- Niche: ${niche}
- Doelgroep: ${targetAudience}
- Content Type: ${item.contentType}
- Beschrijving: ${item.description}

VERPLICHTE ELEMENTEN:
1. Titel (H1) - gebruik: "${item.title}"
2. Inleiding (150-200 woorden) - hook de lezer
3. Minimaal 4 hoofdsecties met H2 headers
4. Subsecties met H3 headers waar relevant
5. Conclusie (100-150 woorden)
6. Call-to-action

SEO VEREISTEN:
- Focus keywords: ${keywordsStr}
- Natuurlijke keyword integratie (geen stuffing)
- Informatieve, waardevolle content
- Leesbare zinnen en alinea's
- Doelgroep: ${targetAudience}
- Tone: ${tone}

CONTENT VEREISTEN:
- Minimaal ${wordCount} woorden
- Gebruik praktische voorbeelden
- Voeg tips en best practices toe
- Schrijf in het ${language}
- Geen marketing buzzwords of clichés
- Schrijf in HTML formaat met juiste tags (<p>, <h2>, <h3>, etc.)

BELANGRIJK:
- Begin direct met de content (geen markdown formatting)
- Gebruik alleen HTML tags
- Geen introductiezinnen zoals "Hier is je blog post"
- Start met <h1>${item.title}</h1> en eindig met conclusie`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 8000,
  });

  let content = response.choices[0]?.message?.content || '';
  
  // Clean content
  const htmlStart = content.search(/<h1|<p|<div/i);
  if (htmlStart > 0) {
    content = content.substring(htmlStart);
  }
  content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');

  // Extract title
  const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  const title = titleMatch ? stripHtmlTags(titleMatch[1]) : item.title;

  // Generate slug
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Check for existing slug and add suffix if needed
  const existingPost = await prisma.blogPost.findFirst({
    where: {
      slug: { startsWith: slug },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingPost) {
    const match = existingPost.slug.match(/-(\d+)$/);
    const nextNumber = match ? parseInt(match[1]) + 1 : 2;
    slug = `${slug}-${nextNumber}`;
  }

  // Extract excerpt
  const paragraphs = content.match(/<p>(.*?)<\/p>/gi) || [];
  const excerpt = stripHtmlTags(paragraphs.slice(0, 2).join(' ')).substring(0, 300);

  // Calculate metrics
  const actualWordCount = content.split(/\s+/).length;
  const readingTimeMinutes = Math.ceil(actualWordCount / 200);

  // Save to database
  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      category: niche,
      tags: item.keywords,
      status: 'draft',
      readingTimeMinutes,
      wordCount: actualWordCount,
      metaTitle: title.substring(0, 60),
      metaDescription: excerpt.substring(0, 155),
      focusKeyword: item.keywords[0] || '',
      scheduledFor: new Date(item.scheduledDate),
    },
  });

  return post;
}

/**
 * Handle streaming execution for real-time progress updates
 */
function handleStreamingExecution(
  clientId: string,
  planName: string,
  niche: string,
  targetAudience: string,
  language: string,
  tone: string,
  period: string,
  keywords: string[],
  items: PlanItem[]
) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Helper to send SSE messages
        const sendSSE = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        };

        // Create plan
        sendSSE({
          phase: 'Opslaan',
          progress: 5,
          message: 'Contentplan opslaan...',
        });

        const plan = await createContentPlan(
          clientId,
          planName,
          niche,
          targetAudience,
          language,
          tone,
          period,
          keywords,
          items
        );

        sendSSE({
          phase: 'Generatie',
          progress: 10,
          message: 'Start met genereren van blog posts...',
          planId: plan.id,
        });

        // Generate each blog post
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const progressPercent = 10 + ((i / items.length) * 85);

          sendSSE({
            phase: 'Generatie',
            progress: Math.round(progressPercent),
            message: `Genereren: ${item.title}`,
            current: i + 1,
            total: items.length,
          });

          try {
            const planItem = await prisma.contentPlanItem.findFirst({
              where: { planId: plan.id, title: item.title },
            });

            if (planItem) {
              await prisma.contentPlanItem.update({
                where: { id: planItem.id },
                data: { status: 'generating' },
              });

              const blogPost = await generateBlogPost(item, niche, targetAudience, tone, language);

              await prisma.contentPlanItem.update({
                where: { id: planItem.id },
                data: {
                  status: 'generated',
                  blogPostId: blogPost.id,
                },
              });

              sendSSE({
                itemComplete: true,
                title: item.title,
                blogPostId: blogPost.id,
              });
            }
          } catch (error: any) {
            console.error(`Failed to generate: ${item.title}`, error);
            
            sendSSE({
              itemFailed: true,
              title: item.title,
              error: error.message,
            });
          }
        }

        // Complete
        await prisma.contentPlan.update({
          where: { id: plan.id },
          data: { status: 'completed' },
        });

        sendSSE({
          complete: true,
          progress: 100,
          message: 'Contentplan volledig uitgevoerd!',
          planId: plan.id,
        });

        controller.close();
      } catch (error: any) {
        console.error('[Streaming Execute] Error:', error);
        const sendSSE = (data: any) => {
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        };
        sendSSE({ error: error.message });
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
