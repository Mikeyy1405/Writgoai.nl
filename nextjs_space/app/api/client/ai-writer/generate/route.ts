import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { deductCredits } from '@/lib/credits';
import { getClientToneOfVoice } from '@/lib/tone-of-voice-helper';
import { searchBolcomProducts } from '@/lib/bolcom-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * 🎨 AI CONTENT WRITER STUDIO - GENERATE
 * Comprehensive content generation with full customization
 */

interface GenerateRequest {
  // Content Configuration
  contentType: string;
  topic: string;
  tone: string;
  wordCount: number;
  language: string;
  keywords: string;
  secondaryKeywords?: string;
  targetAudience?: string;
  customInstructions?: string;
  
  // SEO
  generateMetaDescription: boolean;
  
  // Project Integration
  projectId?: string;
  includeInternalLinks: boolean;
  internalLinksCount: number;
  includeBolProducts: boolean;
  bolProductsCount: number;
}

export async function POST(request: NextRequest) {
  console.log('🎨 [AI Writer] Generate API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Parse request
    const body: GenerateRequest = await request.json();
    const {
      contentType,
      topic,
      tone,
      wordCount,
      language,
      keywords,
      secondaryKeywords,
      targetAudience,
      customInstructions,
      generateMetaDescription,
      projectId,
      includeInternalLinks,
      internalLinksCount,
      includeBolProducts,
      bolProductsCount,
    } = body;

    console.log('📦 [AI Writer] Configuration:', {
      contentType,
      topic,
      language,
      wordCount,
      projectId,
    });

    // 3. Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // 4. Get project tone-of-voice if project selected
    let toneOfVoice = '';
    let projectCustomInstructions = '';
    let project = null;
    let internalLinks: Array<{ title: string; url: string }> = [];
    let bolProducts: Array<{ name: string; url: string; price: string }> = [];

    if (projectId) {
      project = await prisma.project.findUnique({
        where: { id: projectId },
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
        toneOfVoice = project.brandVoice || '';
        projectCustomInstructions = project.customInstructions || '';

        // Get internal links if requested
        if (includeInternalLinks && internalLinksCount > 0) {
          // Try importantPages first
          if (project.importantPages && typeof project.importantPages === 'object') {
            const pages = project.importantPages as any;
            if (Array.isArray(pages)) {
              internalLinks = pages
                .filter((p: any) => p.title && p.url)
                .slice(0, internalLinksCount)
                .map((p: any) => ({ title: p.title, url: p.url }));
            }
          }

          // If not enough, try sitemap
          if (internalLinks.length < internalLinksCount && project.sitemap) {
            const sitemap = project.sitemap as any;
            if (Array.isArray(sitemap.urls)) {
              const additionalLinks = sitemap.urls
                .filter((url: any) => url.title && url.loc)
                .slice(0, internalLinksCount - internalLinks.length)
                .map((url: any) => ({ title: url.title || url.loc, url: url.loc }));
              internalLinks = [...internalLinks, ...additionalLinks];
            }
          }
        }

        // Get Bol.com products if requested
        if (
          includeBolProducts &&
          bolProductsCount > 0 &&
          project.bolcomEnabled &&
          project.bolcomClientId &&
          project.bolcomClientSecret
        ) {
          try {
            const searchQuery = `${topic} ${keywords}`.trim();
            const bolcomResult = await searchBolcomProducts(
              searchQuery,
              {
                clientId: project.bolcomClientId,
                clientSecret: project.bolcomClientSecret,
                affiliateId: project.bolcomAffiliateId || undefined,
              },
              {
                resultsPerPage: bolProductsCount,
              }
            );

            if (bolcomResult && bolcomResult.results) {
              bolProducts = bolcomResult.results.slice(0, bolProductsCount).map((p) => ({
                name: p.title,
                url: p.url,
                price: p.offer?.price?.toFixed(2) || 'N/A',
              }));
            }
          } catch (error) {
            console.error('❌ [AI Writer] Error fetching Bol.com products:', error);
          }
        }
      }
    }

    // 5. Build AI prompt
    const languageMap: Record<string, string> = {
      nl: 'Nederlands',
      en: 'Engels (English)',
      de: 'Duits (Deutsch)',
      fr: 'Frans (Français)',
      es: 'Spaans (Español)',
      it: 'Italiaans (Italiano)',
      pt: 'Portugees (Português)',
    };

    const contentTypeMap: Record<string, string> = {
      'blog-artikel': 'Blog artikel',
      'landingspagina': 'Landingspagina',
      'product-beschrijving': 'Product beschrijving',
      'about-us': 'About Us pagina',
      'faq': 'FAQ pagina',
      'service': 'Service pagina',
    };

    let prompt = `Je bent een expert content writer voor websites. Schrijf hoogwaardige, SEO-geoptimaliseerde content.

**CONFIGURATIE:**
- Content type: ${contentTypeMap[contentType] || contentType}
- Onderwerp: ${topic}
- Toon: ${tone}
- Lengte: ${wordCount} woorden
- Taal: ${languageMap[language] || language}
- Primaire keyword: ${keywords}`;

    if (secondaryKeywords) {
      prompt += `\n- Secondary keywords: ${secondaryKeywords}`;
    }

    if (targetAudience) {
      prompt += `\n- Doelgroep: ${targetAudience}`;
    }

    if (toneOfVoice) {
      prompt += `\n\n**TONE OF VOICE (MERK STEM):**\n${toneOfVoice}\n\nVolg deze tone of voice instructies nauwkeurig. Dit bepaalt HOE je schrijft.`;
    }

    if (projectCustomInstructions) {
      prompt += `\n\n**PROJECT INSTRUCTIES:**\n${projectCustomInstructions}`;
    }

    if (customInstructions) {
      prompt += `\n\n**EXTRA INSTRUCTIES:**\n${customInstructions}`;
    }

    if (internalLinks.length > 0) {
      prompt += `\n\n**INTERNE LINKS (verwerk natuurlijk ${internalLinks.length} links in de tekst):**\n${internalLinks.map((l) => `- ${l.title}: ${l.url}`).join('\n')}`;
    }

    if (bolProducts.length > 0) {
      prompt += `\n\n**BOL.COM PRODUCTEN (verwerk als aanbevelingen met affiliate links):**\n${bolProducts.map((p) => `- ${p.name}: ${p.url} (€${p.price})`).join('\n')}`;
    }

    prompt += `\n\n**FORMAAT:**
- Gebruik proper HTML formatting met semantische tags (h2, h3, p, ul, ol, etc.)
- Gebruik <h2> voor hoofdsecties en <h3> voor subsecties
- Gebruik <p> tags voor paragrafen
- Gebruik <ul> en <li> voor bullet lists
- Gebruik <ol> en <li> voor genummerde lijsten
- Gebruik <strong> voor belangrijke tekst
- Gebruik <em> voor nadruk
- Maak linkjes met <a href="...">tekst</a>
- Geen markdown, alleen HTML
- Begin NIET met een <h1> titel (die komt apart)

Schrijf nu de volledige content in ${languageMap[language]} met proper HTML formatting.`;

    console.log('🤖 [AI Writer] Generating content...');

    // 6. Generate content with AI
    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_45,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: Math.max(4000, wordCount * 2),
    });

    let generatedContent = response.choices[0]?.message?.content || '';

    // 7. Generate meta description if requested
    let metaDescription = '';
    if (generateMetaDescription) {
      const metaPrompt = `Schrijf een SEO-geoptimaliseerde meta description (max 160 karakters) voor een artikel over: ${topic}

Hoofdkeyword: ${keywords}
Taal: ${languageMap[language]}

Schrijf alleen de meta description, geen extra tekst.`;

      const metaResponse = await chatCompletion({
        model: TEXT_MODELS.CLAUDE_45,
        messages: [
          {
            role: 'user',
            content: metaPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      metaDescription = metaResponse.choices[0]?.message?.content?.trim() || '';
    }

    // 8. Deduct credits (estimated based on word count)
    const creditCost = Math.ceil(wordCount / 500);
    await deductCredits(client.id, creditCost, 'AI Writer - Content Generation');

    // 9. Return result
    return NextResponse.json({
      success: true,
      content: generatedContent,
      metaDescription,
      wordCount,
      contentType,
      language,
      internalLinksAdded: internalLinks.length,
      bolProductsAdded: bolProducts.length,
    });
  } catch (error: any) {
    console.error('❌ [AI Writer] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate content',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
