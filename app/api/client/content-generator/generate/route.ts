import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { deductCredits } from '@/lib/credits';
import { generateSmartImage } from '@/lib/smart-image-generator';
import { getBannedWordsInstructions } from '@/lib/banned-words';
import { marked } from 'marked';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;
export const runtime = 'nodejs';

/**
 * 🎨 FLEXIBLE CONTENT GENERATOR
 * Genereer content met volledige controle over alle opties
 */

export async function POST(request: NextRequest) {
  console.log('🎨 [Content Generator] API called');

  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    console.log('✅ [Content Generator] Authenticated:', session.user.id);

    // 2. Parse request
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const {
      title,
      projectId,
      language = 'nl',
      wordCount = 1500,
      tone = 'friendly',
      includeImages = false,
      includeInternalLinks = false,
      includeBolProducts = false,
      includeTables = false,
      includeQuotes = false,
      includeLists = true,
      includeFAQ = false,
      includeCheckboxes = false,
      keywords = '',
      publishToWordPress = false,
    } = body;

    console.log('📦 [Content Generator] Request:', {
      title,
      projectId,
      language,
      wordCount,
      includeImages,
    });

    // 3. Validate
    if (!projectId || !title) {
      return NextResponse.json(
        { error: 'Project ID and title are required' },
        { status: 400 }
      );
    }

    // 4. Get project with affiliate links and internal pages
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        clientId: true,
        preferredProducts: true,
        importantPages: true,
        sitemap: true,
        bolcomEnabled: true,
        bolcomAffiliateId: true,
        bolcomClientId: true,
        bolcomClientSecret: true,
        websiteUrl: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    console.log('✅ [Content Generator] Project loaded:', project.name);

    // Parse internal pages from sitemap or importantPages
    let internalPages: Array<{ title: string; url: string }> = [];
    if (includeInternalLinks) {
      // First, try importantPages if available
      if (project.importantPages && typeof project.importantPages === 'object') {
        const pages = project.importantPages as any;
        if (Array.isArray(pages)) {
          internalPages = pages
            .filter((p: any) => p.title && p.url)
            .map((p: any) => ({ title: p.title, url: p.url }))
            .slice(0, 10); // Max 10 pages
        }
      }

      // If no important pages, try sitemap
      if (internalPages.length === 0 && project.sitemap) {
        const sitemap = project.sitemap as any;
        if (Array.isArray(sitemap?.pages)) {
          internalPages = sitemap.pages
            .filter((p: any) => p.title && p.url)
            .map((p: any) => ({ title: p.title, url: p.url }))
            .slice(0, 10); // Max 10 pages
        }
      }
    }

    // Get affiliate products - AUTOMATISCH ZOEKEN via Bol.com API
    let affiliateProducts: Array<{
      name: string;
      url: string;
      price: number;
      description: string;
    }> = [];
    
    if (includeBolProducts && project.bolcomEnabled && project.bolcomClientId && project.bolcomClientSecret) {
      try {
        console.log('🛒 [Content Generator] Zoeken naar Bol.com producten...');
        // Note: sendSSE not available yet at this point in execution
        // sendSSE({ progress: 10, message: 'Bol.com producten zoeken...' });
        
        // Gebruik de title + keywords als zoekterm
        const searchQuery = keywords ? `${title} ${keywords}` : title;
        
        const { quickProductSearch } = await import('@/lib/bolcom-product-finder');
        const foundProducts = await quickProductSearch(
          searchQuery,
          {
            clientId: project.bolcomClientId,
            clientSecret: project.bolcomClientSecret,
            affiliateId: project.bolcomAffiliateId || undefined,
          },
          3 // Max 3 producten
        );
        
        // Format producten voor de AI prompt
        affiliateProducts = foundProducts.map(p => ({
          name: p.title,
          url: p.affiliateUrl || p.url,
          price: p.price,
          description: p.summary || p.description.substring(0, 150),
        }));
        
        console.log(`✅ [Content Generator] ${affiliateProducts.length} Bol.com producten gevonden`);
        // Note: sendSSE not available yet at this point in execution
        // sendSSE({ progress: 12, message: `${affiliateProducts.length} producten gevonden` });
      } catch (error: any) {
        console.error('❌ [Content Generator] Fout bij Bol.com zoeken:', error.message);
        // Fallback naar preferred products als API faalt
        if (project.preferredProducts && Array.isArray(project.preferredProducts)) {
          affiliateProducts = project.preferredProducts.slice(0, 3).map((name: string) => ({
            name,
            url: '',
            price: 0,
            description: '',
          }));
        }
      }
    }

    console.log('📦 [Content Generator] Data loaded:', {
      internalPages: internalPages.length,
      affiliateProducts: affiliateProducts.length,
      internalPagesData: internalPages.map(p => ({ title: p.title, url: p.url })),
      affiliateProductsData: affiliateProducts.map(p => ({ name: p.name, price: p.price })),
    });

    // 5. Create streaming response with timeout safety
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    let streamClosed = false;
    const sendSSE = (data: any) => {
      if (streamClosed) return;
      try {
        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      } catch (err: any) {
        console.error('[Content Generator] Write error:', err.message);
        streamClosed = true;
      }
    };

    // Safety timeout: force close stream after 5 minutes
    const safetyTimeout = setTimeout(async () => {
      if (!streamClosed) {
        console.warn('⚠️ [Content Generator] Safety timeout triggered after 5 minutes');
        sendSSE({ error: 'Request timeout exceeded' });
        try {
          await writer.close();
        } catch (e) {}
        streamClosed = true;
      }
    }, 300000); // 5 minutes

    // 6. Generate content in background
    (async () => {
      let heartbeatInterval: NodeJS.Timeout | undefined;
      
      try {
        sendSSE({ progress: 5, message: 'Projectgegevens laden...' });

        // Build comprehensive AI prompt with ALL original rules
        const languageMap: Record<string, string> = {
          nl: 'Nederlands',
          en: 'English',
          de: 'Deutsch',
          fr: 'Français',
          es: 'Español',
        };

        const toneMap: Record<string, string> = {
          friendly: 'Vriendelijk en toegankelijk',
          professional: 'Professioneel en zakelijk',
          casual: 'Informeel en relaxed',
          authoritative: 'Gezaghebbend en expert',
        };

        const imageCount = includeImages ? 3 : 0;

        // Get current year for up-to-date content
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleDateString('nl-NL', { month: 'long' });

        sendSSE({ progress: 10, message: 'AI prompt voorbereiden...' });

        const writingPrompt = `Je bent een expert contentschrijver die SEO-geoptimaliseerde artikelen schrijft.

**HUIDIGE DATUM & ACTUALITEIT:**
🚨 Het is nu ${currentMonth} ${currentYear}
🚨 GEBRUIK ${currentYear} in alle datums, voorbeelden en verwijzingen
🚨 NOOIT verouderde jaartallen gebruiken (zoals 2024 of eerder)
🚨 Gebruik actuele trends en ontwikkelingen van ${currentYear}

**ONDERWERP & BASIS:**
Titel: ${title}
${keywords ? `Keywords: ${keywords}` : ''}
Taal: ${languageMap[language] || 'Nederlands'}
Toon: ${toneMap[tone] || 'Vriendelijk'}
Lengte: ${wordCount} woorden

**HTML STRUCTUUR (VERPLICHT):**
✅ Intro paragraaf: 3-4 zinnen in <p> tag, noem keyword
✅ Gebruik <h2> en <h3> voor secties met natuurlijke paragrafen
✅ Afsluitende paragraaf: 4-5 zinnen in <p> tag
❌ NOOIT twee headings direct achter elkaar

**NEDERLANDSE HOOFDLETTERS (VERPLICHT):**
✅ GOED: <h2>De voordelen van AI voor bedrijven</h2>
❌ FOUT: <h2>De Voordelen Van AI Voor Bedrijven</h2>
Alleen eerste letter hoofdletter!

**SCHRIJFSTIJL VOOR 100% HUMAN SCORE:**
✅ Conversationeel (B1-niveau Nederlands)
✅ Gebruik 'je/jij' vorm
✅ Wissel zinslengtes af (kort 40%, middel 40%, lang 20%)
✅ Vermijd formele woorden: "uiteraard" → "natuurlijk", "optimaal" → "goed"
✅ Geen AI-patronen of herhalingen
✅ Concrete voorbeelden (geen fictieve personen)

**OPMAAK:**
${includeLists ? '✅ Minimaal 2-3 <ul><li> lijsten (VERPLICHT)' : ''}
✅ <strong> voor belangrijke punten (max 2-3 per paragraaf)
${includeFAQ ? '✅ FAQ sectie met <details><summary> voor accordion' : ''}
${includeTables ? '✅ Voeg 1-2 vergelijkingstabellen toe met <table>' : ''}
${includeQuotes ? '✅ Voeg 2-3 inspirerende quotes toe met <blockquote>' : ''}
${includeCheckboxes ? '✅ Voeg actionable checklist toe met <ul><li> en checkmarks' : ''}

${getBannedWordsInstructions(language as any)}

**AFBEELDINGEN:**
${imageCount > 0 ? `
- Voeg PRECIES ${imageCount} afbeeldingen toe op logische plekken:
  ${Array.from({length: imageCount}, (_, i) => 
    `* IMAGE_PLACEHOLDER_${i + 1}: ${i === 0 ? 'Na intro sectie' : i === 1 ? 'Halverwege artikel' : 'Voor conclusie'}`
  ).join('\n  ')}
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="DETAILED_IMAGE_DESCRIPTION" />
- ⚠️ BELANGRIJK: Geef bij alt text een GEDETAILLEERDE beschrijving van wat de afbeelding moet tonen:
  * Beschrijf de specifieke visuele inhoud die past bij die sectie
  * Gebruik 8-15 woorden in de alt text
  * Geef concrete, specifieke details over wat er op de afbeelding moet staan
  * Voorbeeld: "Moderne yoga studio met groene planten en natuurlijk licht door grote ramen"
  * NIET algemeen zoals "yoga afbeelding" maar SPECIFIEK zoals "vrouw doet downward dog pose op paarse mat in lichte kamer"
` : '❌ GEEN afbeeldingen'}

${includeInternalLinks && internalPages.length > 0 ? `**🔗 INTERNE LINKS (ZEER BELANGRIJK - CONTEXTUEEL VERWERKEN!):**

Beschikbare pagina's om naar te linken:
${internalPages.map((page, i) => `${i + 1}. "${page.title}" → ${page.url}`).join('\n')}

📌 VEREISTEN VOOR CONTEXTUELE LINKS:
✅ Voeg minimaal ${Math.min(3, internalPages.length)} van deze links toe - MAAR ALLEEN waar ze LOGISCH passen
✅ Link ALLEEN naar pagina's die INHOUDELIJK RELEVANT zijn voor wat je op dat moment bespreekt
✅ Verwerk links NATUURLIJK in lopende zinnen, alsof je de lezer naar gerelateerde info wijst
✅ Gebruik beschrijvende anchor text die duidelijk maakt waar de link naartoe gaat
✅ Plaats links waar de lezer echt gebaat is bij extra informatie
✅ GEEN lijst van links onderaan - alleen inline links in relevante context

HOE TE LINKEN (voorbeelden):
1. Als je een concept noemt dat wordt uitgelegd op een andere pagina:
   "De basis principes van [concept] worden uitgebreid behandeld in onze <a href="[URL]" class="internal-link">gids over [onderwerp]</a>."

2. Als je verwijst naar gerelateerde informatie:
   "Voor meer informatie over [gerelateerd onderwerp], zie onze <a href="[URL]" class="internal-link">artikel over [onderwerp]</a>."

3. Als je een verdieping aanbiedt:
   "Wil je hier dieper op ingaan? Lees dan onze <a href="[URL]" class="internal-link">uitgebreide handleiding</a>."

4. Als je een specifiek aspect noemt:
   "Dit hangt nauw samen met <a href="[URL]" class="internal-link">[gerelateerd concept]</a>, waar we eerder over schreven."

FORMAT (VERPLICHT):
<a href="[EXACTE_URL_VAN_LIJST]" class="internal-link">beschrijvende anchor text</a>

FOUT ❌:
- "Klik hier voor meer info"
- "Lees dit artikel"
- Link naar iets dat niet relevant is voor de huidige context
- Alle links in één lijst onderaan

GOED ✅:
- "Voor beginners raden we aan om eerst <a href="${project.websiteUrl}/yoga-beginners" class="internal-link">deze basis oefeningen</a> onder de knie te krijgen."
- "Dit principe wordt ook toegepast bij <a href="${project.websiteUrl}/advanced-techniques" class="internal-link">geavanceerde technieken</a>."

🚨 BELANGRIJKSTE REGEL: Link ALLEEN naar pagina's die ECHT relevant zijn voor wat je op dat moment bespreekt!
🚨 GEBRUIK DE EXACTE URLs VAN DE LIJST HIERBOVEN - VERZIN GEEN NIEUWE URLS!
` : includeInternalLinks ? '**INTERNE LINKS:**\n⚠️ Geen interne pagina\'s beschikbaar in project - sla interne links over\n' : ''}

${includeBolProducts && affiliateProducts.length > 0 ? `**🛒 BOL.COM PRODUCTEN (ZEER BELANGRIJK - VERPLICHT TOEVOEGEN!):**

Beschikbare producten:
${affiliateProducts.map((product, i) => `${i + 1}. ${product}`).join('\n')}
${project.bolcomAffiliateId ? `\nAffiliate ID: ${project.bolcomAffiliateId}` : ''}

📌 VEREISTEN:
✅ Voeg minimaal ${Math.min(2, affiliateProducts.length)} van deze producten toe in de tekst
✅ Plaats product aanbevelingen op relevante plekken (bijv. na uitleg concept)
✅ Leg kort uit WAAROM het product nuttig is
✅ Gebruik de EXACTE productnamen hierboven

FORMAT:
<div class="bol-product" data-product="[EXACTE_PRODUCTNAAM_HIERBOVEN]">
Een korte beschrijving waarom dit product nuttig is voor de lezer. Bijvoorbeeld: "Dit product helpt je om..."
</div>

VOORBEELD:
Als je schrijft over yoga en er is een product "Yoga mat antislip", schrijf dan:
<div class="bol-product" data-product="Yoga mat antislip">
Een goede yoga mat is essentieel voor een veilige beoefening. Deze antislip mat biedt extra grip en comfort tijdens je yoga sessies.
</div>

🚨 GEBRUIK DE PRODUCTNAMEN VAN HIERBOVEN - NIET VERZINNEN!
` : includeBolProducts ? '**BOL.COM PRODUCTEN:**\n⚠️ Geen Bol.com producten beschikbaar in project - sla producten over\n' : ''}

**KRITIEKE LENGTE VEREISTE:**
🚨 Target: ${wordCount} woorden (MINIMUM)
🚨 Schrijf het COMPLETE artikel tot MINIMAAL ${wordCount} woorden
🚨 Stop NIET voortijdig - maak het artikel COMPLEET af
🚨 Zorg voor een VOLLEDIGE afsluiting met conclusie paragraaf
🚨 Het artikel MOET een duidelijk begin, midden én einde hebben
🚨 De laatste paragraaf MOET een conclusie zijn die het artikel afsluit

**ARTIKEL STRUCTUUR (VERPLICHT):**
1. Intro paragraaf (3-4 zinnen)
2. Minimaal 5-8 secties met <h2> of <h3>
3. Natuurlijke paragrafen tussen headings
4. Concrete voorbeelden en details
5. **CONCLUSIE PARAGRAAF** (4-5 zinnen die het artikel afsluit)
   - Begin met: "Tot slot", "Kortom", "Samenvattend", of "Al met al"
   - Vat kernpunten samen
   - Geef een call-to-action of slotopmerking

**OUTPUT FORMAT (KRITIEK BELANGRIJK):**
🚨 GEEN markdown code blocks (geen \`\`\`html of \`\`\`)
🚨 Begin DIRECT met <p> of <h2> - NIET met code markers
🚨 Pure HTML zonder extra formattering
🚨 Output MOET beginnen met: <p> (intro paragraaf)
🚨 Output MOET eindigen met: </p> (conclusie paragraaf)

**🚨 ALLERBELANGRIJKST - VERGEET DIT NIET:**
${includeInternalLinks && internalPages.length > 0 ? `✅ Voeg de INTERNE LINKS hierboven toe in de tekst (VERPLICHT!)` : ''}
${includeBolProducts && affiliateProducts.length > 0 ? `✅ Voeg de BOL.COM PRODUCTEN hierboven toe in de tekst (VERPLICHT!)` : ''}
${includeInternalLinks && internalPages.length > 0 || includeBolProducts && affiliateProducts.length > 0 ? `✅ Gebruik de EXACTE URLs en productnamen die hierboven staan` : ''}

Schrijf nu het VOLLEDIGE en COMPLETE artikel in PURE HTML met een duidelijke conclusie!`;

        sendSSE({ progress: 15, message: 'AI schrijft content...' });

        // Start heartbeat for more responsive progress
        let heartbeatProgress = 15;
        heartbeatInterval = setInterval(() => {
          if (heartbeatProgress < 55 && !streamClosed) {
            heartbeatProgress += 5;
            sendSSE({ 
              progress: heartbeatProgress, 
              message: heartbeatProgress < 30 ? 'AI analyseert onderwerp...' : 
                       heartbeatProgress < 45 ? 'Content wordt geschreven...' :
                       'AI rondt artikel af...'
            });
          }
        }, 4000);

        // Call AI using AIML API with Claude 4.5 Sonnet
        console.log('🤖 [Content Generator] Calling Claude 4.5 Sonnet...');
        const aiStartTime = Date.now();

        // Calculate safe max_tokens for complete content (Claude 4.5 max: 8192)
        // Formula: (words * 1.5 tokens per word) + (HTML overhead ~500) + (buffer 20%)
        const estimatedTokens = Math.ceil(wordCount * 1.5 * 1.2) + 500;
        const safeMaxTokens = Math.min(estimatedTokens, 8000); // Use almost full capacity
        
        console.log(`🔢 [Content Generator] Target words: ${wordCount}, Max tokens: ${safeMaxTokens}`);

        const contentResponse = await Promise.race([
          chatCompletion({
            model: TEXT_MODELS.CLAUDE_45,
            messages: [
              {
                role: 'system',
                content: 'Je bent een expert contentschrijver. Volg ALLE instructies precies en gebruik GEEN verboden woorden. Schrijf ALTIJD complete artikelen met een goede afsluiting.',
              },
              {
                role: 'user',
                content: writingPrompt,
              },
            ],
            temperature: 0.7,
            max_tokens: safeMaxTokens,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Content generatie duurde te lang')), 120000) // 2 minuten timeout
          ),
        ]);

        const aiDuration = Date.now() - aiStartTime;
        console.log(`✅ [Content Generator] AI response received in ${aiDuration}ms`);

        // Stop heartbeat
        clearInterval(heartbeatInterval);
        sendSSE({ progress: 60, message: 'Content wordt verwerkt...' });

        let contentHtml = contentResponse.choices[0]?.message?.content || '';
        console.log('📄 [Content Generator] Raw content length:', contentHtml.length);

        // Clean up markdown code blocks and formatting artifacts
        contentHtml = contentHtml
          .replace(/^```html\s*/i, '') // Remove opening ```html
          .replace(/^```\s*/i, '') // Remove opening ```
          .replace(/\s*```\s*$/i, '') // Remove closing ```
          .trim();

        console.log('📄 [Content Generator] Cleaned content length:', contentHtml.length);

        // Validate content completeness
        const hasProperEnding = contentHtml.endsWith('</p>') || 
                               contentHtml.endsWith('</div>') || 
                               contentHtml.endsWith('</ul>') ||
                               contentHtml.endsWith('</ol>');
        
        if (!hasProperEnding) {
          console.warn('⚠️ [Content Generator] Content may be incomplete - no proper closing tag');
          // Add a conclusie if missing
          contentHtml += '\n\n<p>Dit is het einde van het artikel. Voor meer informatie over dit onderwerp, neem contact met ons op of lees onze andere artikelen.</p>';
        }

        // Generate AI images if requested
        if (includeImages && imageCount > 0) {
          sendSSE({ progress: 65, message: `AI afbeeldingen genereren (${imageCount}x)...` });

          for (let i = 1; i <= imageCount; i++) {
            const placeholder = `IMAGE_PLACEHOLDER_${i}`;
            const match = contentHtml.match(
              new RegExp(`<img[^>]*src="${placeholder}"[^>]*alt="([^"]+)"`, 'i')
            );

            if (match) {
              const description = match[1];
              const imageProgress = 65 + Math.floor((i / imageCount) * 15);
              sendSSE({ 
                progress: imageProgress, 
                message: `Afbeelding ${i}/${imageCount} wordt gegenereerd...` 
              });
              console.log(`🖼️ [Content Generator] Generating image ${i}/${imageCount}:`, description);

              try {
                const imageResult = await generateSmartImage({
                  prompt: description,
                  projectId,
                  type: i === 1 ? 'featured' : 'mid-text',
                });

                contentHtml = contentHtml.replace(
                  new RegExp(`src="${placeholder}"`, 'g'),
                  `src="${imageResult.imageUrl}"`
                );

                // Deduct image credits (4 per image for SD 3.5)
                await deductCredits(session.user.id, 4, 'Image generation');
                console.log(`✅ [Content Generator] Image ${i}/${imageCount} generated`);
              } catch (error) {
                console.error(`❌ [Content Generator] Image ${i} generation failed:`, error);
                // Remove failed image placeholder
                contentHtml = contentHtml.replace(
                  new RegExp(`<img[^>]*src="${placeholder}"[^>]*>`, 'g'),
                  ''
                );
              }
            }
          }
        }

        sendSSE({ progress: 85, message: 'Content wordt opgeslagen...' });

        // Calculate actual word count
        const actualWordCount = contentHtml
          .replace(/<[^>]*>/g, '')
          .split(/\s+/)
          .filter((w) => w.length > 0).length;

        console.log(`📊 [Content Generator] Word count: ${actualWordCount}/${wordCount} (${Math.round((actualWordCount/wordCount)*100)}%)`);

        // Save to SavedContent
        const savedContent = await prisma.savedContent.create({
          data: {
            clientId: session.user.id,
            projectId,
            type: 'blog',
            title,
            content: contentHtml, // Store as HTML
            contentHtml: contentHtml,
            description: contentHtml
              .replace(/<[^>]*>/g, '')
              .substring(0, 200)
              .trim(),
            keywords: keywords
              ? keywords
                  .split(',')
                  .map((k: string) => k.trim())
                  .filter((k: string) => k.length > 0)
              : [],
            wordCount: actualWordCount,
            slug: title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 100),
            tags: [],
            imageUrls: [],
          },
        });

        const contentId = savedContent.id;
        console.log('✅ [Content Generator] Content saved:', contentId);

        // Deduct base content generation credits
        await deductCredits(session.user.id, 10, 'Content generation');

        sendSSE({ progress: 100, message: 'Gereed!' });
        sendSSE({ contentId });

        await writer.close();
        streamClosed = true;
        clearTimeout(safetyTimeout);
        console.log('✅ [Content Generator] Stream closed successfully');
      } catch (error: any) {
        console.error('❌ [Content Generator] Generation error:', error);
        console.error('Error stack:', error.stack);

        // Stop heartbeat on error
        if (typeof heartbeatInterval !== 'undefined') {
          clearInterval(heartbeatInterval);
        }

        if (!streamClosed) {
          sendSSE({
            error: error.message || 'Generation failed',
            message: error.message || 'Er ging iets mis bij het genereren',
          });
          await writer.close();
          streamClosed = true;
          clearTimeout(safetyTimeout);
        }
      }
    })();

    // Return stream
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('❌ [Content Generator] Initialization error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Initialization failed' },
      { status: 500 }
    );
  }
}
