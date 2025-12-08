import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deductCredits } from '@/lib/credits';
import { searchBolcomProducts } from '@/lib/bolcom-api';
import { findRelevantInternalLinks } from '@/lib/sitemap-loader';
import { generateContentStream, type UltimateWriterConfig } from '@/lib/ultimate-writer-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * 🚀 ULTIMATE WRITER - GENERATE API
 * Stream-based content generation with all features
 */

const WORDS_PER_CREDIT = 500;

export async function POST(request: NextRequest) {
  console.log('🚀 [Ultimate Writer] Generate API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse request
    const body = await request.json();
    const config: UltimateWriterConfig = body;

    console.log('📦 [Ultimate Writer] Configuration:', {
      contentType: config.contentType,
      topic: config.topic,
      wordCount: config.wordCount,
      projectId: config.projectId,
    });

    // 3. Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 4. Get project data if project selected
    if (config.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: config.projectId },
        select: {
          id: true,
          name: true,
          websiteUrl: true,
          brandVoice: true,
          customInstructions: true,
          sitemap: true,
          importantPages: true,
          bolcomEnabled: true,
          bolcomAffiliateId: true,
          bolcomClientId: true,
          bolcomClientSecret: true,
        },
      });

      if (project) {
        config.project = project;

        // Get internal links
        if (config.includeInternalLinks && config.internalLinksCount > 0) {
          const internalLinks: Array<{ title: string; url: string }> = [];

          // Try importantPages first
          if (project.importantPages && typeof project.importantPages === 'object') {
            const pages = project.importantPages as any;
            if (Array.isArray(pages)) {
              internalLinks.push(
                ...pages
                  .filter((p: any) => p.title && p.url)
                  .slice(0, config.internalLinksCount)
                  .map((p: any) => ({ title: p.title, url: p.url }))
              );
            }
          }

          // If not enough, try sitemap
          if (internalLinks.length < config.internalLinksCount && project.sitemap) {
            const sitemap = project.sitemap as any;
            if (Array.isArray(sitemap.urls)) {
              const additionalLinks = sitemap.urls
                .filter((url: any) => url.title && url.loc)
                .slice(0, config.internalLinksCount - internalLinks.length)
                .map((url: any) => ({ title: url.title || url.loc, url: url.loc }));
              internalLinks.push(...additionalLinks);
            }
          }

          config.internalLinks = internalLinks;
        }

        // Get Bol.com products
        if (
          config.includeBolProducts &&
          config.bolProductCount > 0 &&
          project.bolcomEnabled &&
          project.bolcomClientId &&
          project.bolcomClientSecret
        ) {
          try {
            const searchQuery = `${config.primaryKeyword} ${config.topic}`.slice(0, 100);
            const bolProducts = await searchBolcomProducts(
              searchQuery,
              {
                clientId: project.bolcomClientId,
                clientSecret: project.bolcomClientSecret
              },
              {
                resultsPerPage: config.bolProductCount
              }
            );
            config.bolProducts = bolProducts.results.slice(0, config.bolProductCount);
            console.log(`✅ [Ultimate Writer] Found ${config.bolProducts.length} Bol.com products`);
          } catch (error) {
            console.error('⚠️ [Ultimate Writer] Bol.com search failed:', error);
            config.bolProducts = [];
          }
        }
      }
    }

    // 5. Calculate and deduct credits
    const creditsNeeded = Math.ceil(config.wordCount / WORDS_PER_CREDIT);
    console.log(`💰 [Ultimate Writer] Credits needed: ${creditsNeeded}`);

    const deductResult = await deductCredits(client.id, creditsNeeded);
    if (!deductResult.success) {
      return NextResponse.json(
        { error: 'Onvoldoende credits. Je hebt minimaal ' + creditsNeeded + ' credits nodig.' },
        { status: 402 }
      );
    }

    // 6. Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate content with streaming
          for await (const chunk of generateContentStream(config)) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }

          controller.close();
        } catch (error) {
          console.error('❌ [Ultimate Writer] Stream error:', error);
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Generation failed',
          })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('❌ [Ultimate Writer] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
