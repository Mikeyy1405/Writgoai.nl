
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const runtime = 'nodejs';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { CREDIT_COSTS } from '@/lib/credits';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { loadWordPressSitemap, findRelevantInternalLinks } from '@/lib/sitemap-loader';
import { generateSmartImage } from '@/lib/smart-image-generator';
import { getBannedWordsInstructions, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { searchBolcomProducts, generateBolcomAffiliateLink } from '@/lib/bolcom-api';

/**
 * 🚀 VOLAUTOMATISCHE CONTENT GENERATOR
 * - Kiest automatisch de beste parameters
 * - Genereert direct perfect content
 * - Slaat op in Content Library
 * - Klaar voor review en publish
 */

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const body = await req.json();
  const {
    topic, // Het enige verplichte veld!
    projectId, // Optioneel - voor context
    topicalTopicId, // Optioneel - ID van het topic uit de topical map
    language = 'nl', // Auto-detect mogelijk
    // Manual parameters from Content Specialist
    wordCount,
    tone,
    includeImages,
    includeFAQ,
    internalLinks: includeInternalLinks,
    bolProducts,
    affiliateLinks = [],
    publishToWordPress = false, // Nieuw: direct naar WordPress publiceren
  } = body;

  if (!topic) {
    return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
  }

  const useManualParams = wordCount !== undefined; // If wordCount is provided, use manual mode
  console.log(`🚀 ${useManualParams ? 'MANUELE' : 'VOLAUTOMATISCHE'} GENERATIE START: "${topic}"${topicalTopicId ? ' (uit Topical Map)' : ''}`);

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  let streamClosed = false;
  const sendStatus = (status: string, progress: number) => {
    if (streamClosed) {
      console.log('[AutoContent] ⚠️ Stream closed, ignoring status:', status);
      return;
    }
    const data = JSON.stringify({ status, progress, message: status }) + '\n';
    writer.write(encoder.encode(`data: ${data}\n\n`)).catch((err) => {
      console.error('[AutoContent] ❌ Write error:', err.message);
      streamClosed = true;
    });
  };

  // Start generation in background
  (async () => {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    try {
      sendStatus('🚀 Content generatie gestart...', 5);

      // Check user credits
      const user = await prisma.client.findUnique({
        where: { email: session.user.email },
        select: { 
          id: true, 
          subscriptionCredits: true,
          topUpCredits: true,
          isUnlimited: true
        },
      });

      const totalCredits = user ? user.subscriptionCredits + user.topUpCredits : 0;
      const requiredCredits = CREDIT_COSTS.BLOG_POST; // 50 credits
      
      if (!user || (!user.isUnlimited && totalCredits < requiredCredits)) {
        const errorData = JSON.stringify({ 
          error: `Onvoldoende credits. Je hebt ${requiredCredits} credits nodig.`,
          status: 'error',
          progress: 0
        }) + '\n\n';
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // 🎯 STAP 1: PARAMETERS BEPALEN (manueel of automatisch)
      let autoParams;
      
      if (useManualParams) {
        // Use manual parameters from Content Specialist
        sendStatus('✅ Manuele parameters gebruiken...', 10);
        autoParams = {
          contentType: 'informatief',
          wordCount: wordCount || 1500,
          tone: tone || 'professioneel',
          keywords: [topic],
          seoOptimized: true,
          includeFAQ: includeFAQ !== undefined ? includeFAQ : true,
          includeImages: includeImages !== undefined ? includeImages : true,
          imageCount: (includeImages !== undefined && includeImages) ? 2 : 0,
          includeInternalLinks: includeInternalLinks !== undefined ? includeInternalLinks : true,
          bolProducts: bolProducts || false,
          affiliateLinks: affiliateLinks || [],
          reasoning: 'Gebruiker gekozen instellingen'
        };
        console.log('✅ Manual parameters:', autoParams);
        sendStatus(`✅ Instellingen: ${autoParams.wordCount} woorden, ${autoParams.tone}`, 15);
      } else {
        // Auto-detect parameters with AI
        sendStatus('🎯 Parameters automatisch bepalen...', 10);
        console.log('🔍 Detecteren content type en parameters...');

        const detectionResponse = await chatCompletion({
          model: 'google/gemini-3-pro-preview',
          messages: [
            {
              role: 'system',
              content: `Je bent een content strategie expert. Analyseer het onderwerp en bepaal de beste parameters voor content creatie.
              
Geef ALLEEN JSON terug (geen markdown, geen tekst):
{
  "contentType": "informatief" | "lijstje" | "howto" | "review-enkel" | "beste-lijst" | "vergelijking" | "nieuws" | "gids",
  "wordCount": 600-2000,
  "tone": "professional" | "casual" | "friendly",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "seoOptimized": true,
  "includeFAQ": boolean,
  "includeImages": boolean,
  "imageCount": 0-2,
  "reasoning": "Kort waarom deze keuzes"
}`
            },
            {
              role: 'user',
              content: `Analyseer dit onderwerp en bepaal de beste content parameters:

Onderwerp: ${topic}
Taal: ${language}

Geef optimale instellingen voor maximale SEO impact en leesbaarheid.`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });

        try {
          const responseText = detectionResponse.choices[0]?.message?.content || '{}';
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          autoParams = JSON.parse(jsonMatch ? jsonMatch[0] : responseText);
          
          // Ensure keywords is always an array
          if (!Array.isArray(autoParams.keywords)) {
            autoParams.keywords = [topic];
          }
          
          console.log('✅ Auto-parameters:', autoParams);
        } catch (e) {
          // Fallback parameters
          autoParams = {
            contentType: 'informatief',
            wordCount: 1200,
            tone: 'professional',
            keywords: [topic],
            seoOptimized: true,
            includeFAQ: true,
            includeImages: true,
            imageCount: 2,
            reasoning: 'Standaard optimale instellingen'
          };
          console.log('⚠️ Fallback naar standaard parameters');
        }

        sendStatus(`✅ Parameters bepaald: ${autoParams.contentType}, ${autoParams.wordCount} woorden`, 15);
      }

      // 🔍 STAP 2: PROJECT CONTEXT & SITEMAP
      let projectContext = '';
      let sitemapUrl = '';
      let internalLinks: Array<{ title: string; url: string; relevance: number }> = [];
      let bolcomAffiliateId = '';

      if (projectId) {
        sendStatus('📁 Project context ophalen...', 20);
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { 
            name: true, 
            description: true, 
            websiteUrl: true,
            language: true,
            bolcomAffiliateId: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
            preferredProducts: true,
            importantPages: true,
            sitemap: true,
          },
        });

        if (project) {
          projectContext = `Project: ${project.name}\nWebsite: ${project.websiteUrl || 'N/A'}`;
          sitemapUrl = project.websiteUrl || '';
          bolcomAffiliateId = project.bolcomAffiliateId || '';
          
          sendStatus(`✅ Project: ${project.name}`, 22);

          // Load internal links - Priority 1: importantPages, Priority 2: sitemap
          if (project.importantPages && typeof project.importantPages === 'object') {
            try {
              const pages = project.importantPages as any;
              if (Array.isArray(pages) && pages.length > 0) {
                internalLinks = pages
                  .filter((p: any) => p.title && p.url)
                  .map((p: any) => ({ 
                    title: p.title, 
                    url: p.url, 
                    relevance: 1 // Set high relevance for important pages
                  }))
                  .slice(0, 10);
                sendStatus(`✅ ${internalLinks.length} belangrijke pagina's geladen`, 24);
                console.log(`✅ ${internalLinks.length} belangrijke pagina's uit project geladen`);
              }
            } catch (error) {
              console.log('⚠️ Belangrijke pagina\'s niet beschikbaar');
            }
          }

          // If no important pages, try sitemap
          if (internalLinks.length === 0 && sitemapUrl) {
            try {
              sendStatus(`🔍 Sitemap scannen: ${sitemapUrl.replace('https://', '')}`, 24);
              const sitemap = await loadWordPressSitemap(sitemapUrl);
              internalLinks = findRelevantInternalLinks(sitemap, topic, 5);
              sendStatus(`✅ Sitemap: ${internalLinks.length} relevante links gevonden`, 28);
              console.log(`✅ ${internalLinks.length} interne links uit sitemap gevonden`);
            } catch (error) {
              console.log('⚠️ Sitemap niet beschikbaar, doorgaan zonder interne links');
              sendStatus('⚠️ Sitemap niet beschikbaar', 28);
            }
          }
        }
      }

      // 🧠 STAP 3: WEB RESEARCH met Gemini 3 Pro
      sendStatus(`🔍 Web research: ${autoParams.keywords.length} keywords analyseren...`, 30);
      console.log('🔍 Research starten...');

      const researchResponse = await chatCompletion({
        model: 'google/gemini-3-pro-preview',
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO research expert. Zoek actuele informatie en trends.'
          },
          {
            role: 'user',
            content: `Zoek actuele informatie over: ${topic}

Keywords: ${autoParams.keywords.join(', ')}
${projectContext}

Geef:
1. Actuele trends en statistieken
2. Veelgestelde vragen  
3. Belangrijke feiten
4. Gerelateerde onderwerpen

Formaat: Gestructureerd overzicht in het ${language === 'nl' ? 'Nederlands' : 'Engels'}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const research = researchResponse.choices[0]?.message?.content || '';
      const researchLength = research.split(/\s+/).length;
      sendStatus(`✅ Research voltooid: ${researchLength} woorden verwerkt`, 45);

      // 🎨 STAP 4: FEATURED IMAGE GENEREREN
      let featuredImageUrl = '';
      if (autoParams.includeImages) {
        sendStatus('🖼️ Featured hero image genereren...', 50);
        try {
          // Extract first meaningful sentence from research for context
          const researchFirstLine = research.split('\n').find(line => line.trim().length > 20) || '';
          const contextHint = researchFirstLine.substring(0, 100);
          
          // Enhanced contextual prompt
          const featuredPrompt = `Professional high-quality hero image for: ${topic}.
Context: ${contextHint}
Wide hero shot, photorealistic professional photography, modern editorial magazine style.
Excellent composition, natural lighting, vibrant colors, sharp focus, ultra detailed.
Dynamic perspective, trending editorial style, professional quality.
NO TEXT, NO WATERMARKS, NO LOGOS, NO CAPTIONS.
8K resolution, magazine cover quality photography.`;

          console.log(`🎯 [Featured Image] Topic: "${topic}"`);

          const imageResult = await generateSmartImage({
            prompt: featuredPrompt,
            projectId,
            type: 'featured',
            width: 1920,
            height: 1080,
          });

          if (imageResult.success && imageResult.imageUrl) {
            featuredImageUrl = imageResult.imageUrl;
            const imageModel = imageResult.model || imageResult.source || 'AI';
            sendStatus(`✅ Featured image: ${imageModel} (1920x1080)`, 52);
            console.log('✅ Featured image gegenereerd:', imageModel);
          }
        } catch (error) {
          console.log('⚠️ Featured image generatie mislukt, doorgaan zonder');
          sendStatus('⚠️ Featured image overgeslagen', 52);
        }
      }

      // ✍️ STAP 5: CONTENT SCHRIJVEN met Claude 4.5 Sonnet
      sendStatus(`✍️ AI schrijft artikel: ${autoParams.wordCount} woorden target...`, 55);
      console.log('✍️ Content generatie starten...');

      // Start heartbeat interval to keep connection alive during long AI call
      const heartbeatMessages = [
        `📝 Claude 4.5 analyseert: "${topic.substring(0, 40)}..."`,
        `🔍 Structuur: H1, ${autoParams.wordCount > 800 ? '4-6' : '3-4'} H2 secties`,
        `✍️ Schrijven: intro + eerste sectie (${Math.floor(autoParams.wordCount * 0.3)} woorden)`,
        `📊 Keywords integreren: ${autoParams.keywords.slice(0, 3).join(', ')}`,
        `🎨 Content verfijnen: tussentitels + lists`,
        `✨ Finaliseren: conclusie + laatste checks`,
        `⚡ AI verwerkt laatste ${autoParams.wordCount - Math.floor(autoParams.wordCount * 0.8)} woorden...`
      ];
      
      let heartbeatIndex = 0;
      let heartbeatProgress = 55;
      let heartbeatStopped = false;
      
      heartbeatInterval = setInterval(() => {
        if (heartbeatStopped || streamClosed) {
          // Clear interval immediately if stopped or stream closed
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          return;
        }
        
        // Progress from 55% to 85% max (keep going during AI processing)
        heartbeatProgress = Math.min(heartbeatProgress + 1, 85);
        const message = heartbeatMessages[heartbeatIndex % heartbeatMessages.length];
        sendStatus(message, Math.floor(heartbeatProgress));
        heartbeatIndex++;
        
        // Auto-stop at 85% (AI should be done by then)
        if (heartbeatProgress >= 85) {
          heartbeatStopped = true;
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          console.log('⏹️ [AutoContent] Heartbeat auto-stopped at 85%');
        }
      }, 4000); // Every 4 seconds to give AI more time

      // Build internal links context
      let internalLinksContext = '';
      if (internalLinks.length > 0) {
        const minLinks = Math.max(3, Math.floor(internalLinks.length * 0.6));
        internalLinksContext = `

**🔗 INTERNE LINKS (ZEER BELANGRIJK - CONTEXTUEEL VERWERKEN!):**

Beschikbare pagina's om naar te linken (${internalLinks.length} stuks):
${internalLinks.map((link, i) => `${i + 1}. "${link.title}" → ${link.url}`).join('\n')}

📌 VEREISTEN VOOR CONTEXTUELE LINKS:
✅ Voeg minimaal ${minLinks} van deze links toe - MAAR ALLEEN waar ze LOGISCH passen
✅ Link ALLEEN naar pagina's die INHOUDELIJK RELEVANT zijn voor wat je op dat moment bespreekt
✅ Verwerk links NATUURLIJK in lopende zinnen, alsof je de lezer naar gerelateerde info wijst
✅ Gebruik beschrijvende anchor text die duidelijk maakt waar de link naartoe gaat
✅ Plaats links waar de lezer echt gebaat is bij extra informatie
✅ GEEN lijst van links onderaan - alleen inline links in relevante context

HOE TE LINKEN (voorbeelden):
1. Bij het noemen van een concept dat elders wordt uitgelegd:
   "De basis principes van [concept] worden uitgebreid behandeld in onze <a href="[URL]" class="internal-link">gids over [onderwerp]</a>."

2. Bij verwijzing naar gerelateerde informatie:
   "Voor meer informatie over [gerelateerd onderwerp], zie onze <a href="[URL]" class="internal-link">artikel over [onderwerp]</a>."

3. Bij het aanbieden van verdieping:
   "Wil je hier dieper op ingaan? Lees dan onze <a href="[URL]" class="internal-link">uitgebreide handleiding</a>."

4. Bij het noemen van een specifiek aspect:
   "Dit hangt nauw samen met <a href="[URL]" class="internal-link">[gerelateerd concept]</a>, waar we eerder over schreven."

FORMAT (VERPLICHT):
<a href="[EXACTE_URL_VAN_LIJST]" class="internal-link">beschrijvende anchor text</a>

FOUT ❌:
- "Klik hier voor meer info"
- "Lees dit artikel"
- Link naar iets dat niet relevant is voor de huidige context
- Alle links in één lijst onderaan

GOED ✅:
- "Voor beginners raden we aan om eerst <a href="/beginners-gids" class="internal-link">deze basis principes</a> onder de knie te krijgen."
- "Dit principe wordt ook toegepast bij <a href="/advanced-techniques" class="internal-link">geavanceerde technieken</a>."

🚨 BELANGRIJKSTE REGEL: Link ALLEEN naar pagina's die ECHT relevant zijn voor wat je op dat moment bespreekt!
🚨 GEBRUIK DE EXACTE URLs VAN DE LIJST HIERBOVEN - VERZIN GEEN NIEUWE URLS!
`;
      }

      // 🛒 STAP 5: BOL.COM PRODUCTEN OPHALEN (indien gevraagd)
      let bolProductsContext = '';
      if (autoParams.bolProducts && bolcomAffiliateId && projectId) {
        try {
          sendStatus('🛒 Bol.com producten laden...', 48);
          
          // First, check if there are preferred products in the project
          const projectWithBol = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
              bolcomClientId: true,
              bolcomClientSecret: true,
              bolcomAffiliateId: true,
              preferredProducts: true,
            }
          });

          let productsWithLinks: Array<{
            title: string;
            description?: string;
            price?: number;
            affiliateLink?: string;
          }> = [];

          // Priority 1: Use preferred products from project if available
          if (projectWithBol?.preferredProducts && projectWithBol.preferredProducts.length > 0) {
            productsWithLinks = projectWithBol.preferredProducts.slice(0, 3).map(product => ({
              title: product,
              description: `Aanbevolen product uit project`,
            }));
            console.log(`✅ ${productsWithLinks.length} voorkeursproducten uit project geladen`);
          }
          // Priority 2: Search Bol.com API if credentials are available
          else if (projectWithBol?.bolcomClientId && projectWithBol?.bolcomClientSecret) {
            // Search for relevant products based on topic
            const searchResults = await searchBolcomProducts(
              topic,
              {
                clientId: projectWithBol.bolcomClientId,
                clientSecret: projectWithBol.bolcomClientSecret,
                affiliateId: projectWithBol.bolcomAffiliateId,
              },
              {
                resultsPerPage: 5,
                sortBy: 'relevance',
                countryCode: 'NL',
              }
            );

            if (searchResults.results && searchResults.results.length > 0) {
              // Take top 3 products
              const topProducts = searchResults.results.slice(0, 3);
              
              // Generate affiliate links
              productsWithLinks = topProducts.map(product => ({
                title: product.title,
                description: product.description || '',
                price: product.offer?.price || 0,
                affiliateLink: generateBolcomAffiliateLink(
                  product.url,
                  projectWithBol.bolcomAffiliateId,
                  product.title
                ),
              }));

              console.log(`✅ ${productsWithLinks.length} Bol.com producten via API gevonden`);
            } else {
              console.log('⚠️ Geen Bol.com producten gevonden voor onderwerp');
            }
          } else {
            console.log('⚠️ Bol.com credentials niet volledig geconfigureerd');
          }

          // Build products context if we have any products
          if (productsWithLinks.length > 0) {
            const hasAffiliateLinks = productsWithLinks.some(p => p.affiliateLink);
            const minProducts = Math.min(2, productsWithLinks.length);
            
            bolProductsContext = `

**🛒 BOL.COM PRODUCTEN (ZEER BELANGRIJK - VERPLICHT TOEVOEGEN!):**

Beschikbare producten (${productsWithLinks.length} stuks):
${productsWithLinks.map((product, i) => `
${i + 1}. ${product.title}
   ${product.price ? `Prijs: €${product.price.toFixed(2)}` : ''}
   ${product.affiliateLink ? `Link: ${product.affiliateLink}` : ''}
   ${product.description ? `Omschrijving: ${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}` : ''}
`).join('\n')}

📌 VEREISTEN:
✅ Voeg minimaal ${minProducts} van deze producten toe in de tekst
✅ Plaats product aanbevelingen op relevante plekken (bijv. na uitleg concept)
✅ Leg kort uit WAAROM het product nuttig is
✅ Gebruik de EXACTE productnamen en links hierboven

FORMAT:
${hasAffiliateLinks ? `<a href="[EXACTE_AFFILIATE_LINK_HIERBOVEN]" target="_blank" rel="noopener sponsored">[product_title]</a>` : `<div class="bol-product" data-product="[EXACTE_PRODUCTNAAM_HIERBOVEN]">Korte uitleg waarom nuttig</div>`}

VOORBEELD:
${hasAffiliateLinks ? `"Een goede optie is <a href="https://partner.bol.com/..." target="_blank" rel="noopener sponsored">${productsWithLinks[0].title}</a> dat helpt bij..."` : `<div class="bol-product" data-product="${productsWithLinks[0].title}">Dit product is essentieel omdat het...</div>`}

🚨 GEBRUIK DE PRODUCTNAMEN EN LINKS VAN HIERBOVEN - NIET VERZINNEN!
`;
          }
        } catch (bolError) {
          console.error('⚠️ Bol.com product ophalen gefaald:', bolError);
          // Continue zonder Bol.com producten
        }
      } else if (autoParams.bolProducts && !bolcomAffiliateId) {
        bolProductsContext = `

**⚠️ BOL.COM PRODUCTEN:**
Bol.com producten zijn aangevraagd, maar er is geen affiliate ID geconfigureerd voor dit project.
`;
      }

      const writingPrompt = `Je bent een expert content writer. Schrijf een ${autoParams.contentType} artikel dat 100% menselijk scoort.

**ONDERWERP:** ${topic}
**WOORDAANTAL:** ${autoParams.wordCount} woorden (STRIKT)
**TOON:** ${autoParams.tone}
**TAAL:** ${language === 'nl' ? 'Nederlands' : 'Engels'}
**KEYWORDS:** ${autoParams.keywords.join(', ')}

**RESEARCH:**
${research}

${projectContext ? `**PROJECT CONTEXT:**\n${projectContext}\n` : ''}
${internalLinksContext}
${bolProductsContext}

**KRITIEKE OUTPUT FORMAT VEREISTE:**
🚨 GEBRUIK ALLEEN HTML TAGS - GEEN MARKDOWN!
🚨 GEEN \`\`\`html of \`\`\` code blocks
🚨 Begin DIRECT met <h1> tag
🚨 Gebruik <h2>, <h3>, <p>, <ul>, <li>, <strong>, etc.
🚨 NOOIT markdown syntax zoals ## of **tekst**

**ARTIKEL STRUCTUUR:**
✅ Begin met <h1>Hoofdtitel</h1> (gebaseerd op onderwerp)
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
✅ Minimaal 2-3 <ul><li> lijsten (VERPLICHT)
✅ <strong> voor belangrijke punten (max 2-3 per paragraaf)
${autoParams.includeFAQ ? '✅ FAQ sectie met <details><summary> voor accordion' : '❌ Geen FAQ'}

${getBannedWordsInstructions()}

**AFBEELDINGEN:**
${autoParams.imageCount > 0 ? `
- Voeg PRECIES ${autoParams.imageCount} afbeeldingen toe op logische plekken:
  ${Array.from({length: autoParams.imageCount}, (_, i) => 
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

**KRITIEKE LENGTE VEREISTE:**
🚨 Target: ${autoParams.wordCount} woorden
🚨 Schrijf het COMPLETE artikel tot ${autoParams.wordCount} woorden
🚨 Stop NIET voortijdig - maak het artikel COMPLEET af

**🚨 ALLERBELANGRIJKST - VERGEET DIT NIET:**
${internalLinksContext ? `✅ Voeg de INTERNE LINKS hierboven toe in de tekst (VERPLICHT!)` : ''}
${bolProductsContext ? `✅ Voeg de BOL.COM PRODUCTEN hierboven toe in de tekst (VERPLICHT!)` : ''}
${internalLinksContext || bolProductsContext ? `✅ Gebruik de EXACTE URLs en productnamen die hierboven staan` : ''}

Schrijf nu het VOLLEDIGE en COMPLETE artikel in PURE HTML (geen markdown, geen code blocks)!`;

      console.log('🤖 [AutoContent] Calling AI for content generation...', {
        model: 'claude-sonnet-4-5',
        wordCount: autoParams.wordCount,
        maxTokens: Math.ceil((autoParams.wordCount + 200) * 4),
        promptLength: writingPrompt.length
      });
      
      // Add timeout to AI generation (2 minutes max)
      console.log('🤖 [AutoContent] Starting AI content generation with timeout...');
      const contentResponse = await Promise.race([
        chatCompletion({
          model: 'claude-sonnet-4-5',
          messages: [
            {
              role: 'user',
              content: writingPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: Math.min(Math.ceil((autoParams.wordCount + 200) * 2.5), 7000) // Safe limit under Claude 4.5 max
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AI generatie timeout na 2 minuten')), 120000)
        )
      ]);

      console.log('✅ [AutoContent] AI response received', {
        hasContent: !!contentResponse.choices?.[0]?.message?.content,
        contentLength: contentResponse.choices?.[0]?.message?.content?.length || 0,
        model: contentResponse.model
      });

      // CRITICAL: Stop heartbeat immediately
      heartbeatStopped = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('⏹️ [AutoContent] Heartbeat stopped after AI response');
      }
      
      // Immediate status update - no waiting
      const rawContentLength = contentResponse.choices[0]?.message?.content?.length || 0;
      sendStatus(`✅ AI klaar: ${Math.floor(rawContentLength / 4)} woorden ontvangen`, 70);
      console.log('📊 [AutoContent] Status update sent: 70%');

      let content = contentResponse.choices[0]?.message?.content || '';

      // Clean up any markdown/code blocks that might have been generated
      console.log('🧹 Cleaning content format...');
      sendStatus('🧹 Content opmaak optimaliseren...', 72);
      
      // Remove code blocks (```html, ```markdown, etc.)
      content = content.replace(/```[\w]*\n?/g, '');
      content = content.replace(/```\n?$/g, '');
      
      // Convert markdown headings to HTML if present
      content = content.replace(/^### (.+)$/gm, '<h3>$1</h3>');
      content = content.replace(/^## (.+)$/gm, '<h2>$1</h2>');
      content = content.replace(/^# (.+)$/gm, '<h1>$1</h1>');
      
      // Convert markdown bold to HTML
      content = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      
      // Convert markdown lists to HTML if present
      content = content.replace(/^- (.+)$/gm, '<li>$1</li>');
      
      // Wrap orphaned list items in <ul> tags
      content = content.replace(/(<li>[\s\S]+?<\/li>)(?!\n*<li>)/g, (match) => {
        if (!match.includes('<ul>')) {
          return `<ul>\n${match}\n</ul>`;
        }
        return match;
      });

      // Word count check (alleen afkappen als ECHT te lang)
      let actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      const maxAllowedWords = autoParams.wordCount + 100; // Ruimere marge

      if (actualWordCount > maxAllowedWords) {
        console.warn(`⚠️ Te lang (${actualWordCount}), inkorten naar ${maxAllowedWords}...`);
        // Alleen afkappen als het extreem te lang is
        const sentences = content.split(/(?<=[.!?])\s+/);
        let trimmed = '';
        let currentWords = 0;
        
        for (const sentence of sentences) {
          const words = sentence.split(/\s+/).filter(w => w.length > 0).length;
          if (currentWords + words <= maxAllowedWords) {
            trimmed += sentence + ' ';
            currentWords += words;
          } else {
            break;
          }
        }
        
        content = trimmed.trim();
        actualWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      }

      console.log(`✅ Content gegenereerd: ${actualWordCount} woorden`);

      // Banned words check
      const validation = isContentValid(content);
      if (!validation.valid) {
        console.log('🔄 Filtering banned words...');
        content = removeBannedWords(content);
      }

      sendStatus(`✅ Artikel compleet: ${actualWordCount} woorden`, 75);
      console.log('📊 [AutoContent] Status update sent: 75%');

      // 🖼️ STAP 6: MID-TEXT IMAGES
      if (autoParams.imageCount > 0 && autoParams.includeImages) {
        sendStatus(`🖼️ ${autoParams.imageCount} afbeeldingen genereren met SD 3.5...`, 78);
        
        for (let i = 1; i <= Math.min(autoParams.imageCount, 5); i++) {
          const placeholder = `IMAGE_PLACEHOLDER_${i}`;
          
          // Extract the alt text from the generated content - this is what the AI described should be in the image!
          const imgTagMatch = content.match(new RegExp(`<img[^>]*src="${placeholder}"[^>]*alt="([^"]+)"[^>]*>`, 'i'));
          
          if (imgTagMatch) {
            try {
              const altText = imgTagMatch[1];
              console.log(`🎯 [Image ${i}] Alt text: "${altText}"`);
              
              // Use the AI's detailed description as the image prompt!
              const contextualPrompt = `Professional high-quality photorealistic image: ${altText}.
High quality professional photography, excellent composition and lighting.
Sharp focus, vibrant natural colors, modern editorial style.
NO TEXT, NO WATERMARKS, NO LOGOS, NO CAPTIONS.
Ultra detailed, 8K resolution, professional photography.`;

              console.log(`🖼️ Generating contextual image ${i}/${autoParams.imageCount}...`);

              const imgResult = await generateSmartImage({
                prompt: contextualPrompt,
                projectId,
                type: 'mid-text',
                width: 1920,
                height: 1080,
              });

              if (imgResult.success && imgResult.imageUrl) {
                // Replace placeholder with actual image, keeping the detailed alt text
                content = content.replace(
                  new RegExp(`<img[^>]*src="${placeholder}"[^>]*>`, 'g'),
                  `<img src="${imgResult.imageUrl}" alt="${altText}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`
                );
                console.log(`✅ [Image ${i}] Generated successfully from: "${altText.substring(0, 50)}..."`);
              }
            } catch (error) {
              console.log(`⚠️ Image ${i} generatie mislukt:`, error);
            }
          }
        }
      }

      sendStatus(`✅ Content klaar: ${actualWordCount} woorden + afbeeldingen`, 82);
      console.log('📊 [AutoContent] Status update sent: 82%');

      // 💾 STAP 7: OPSLAAN IN CONTENT LIBRARY
      sendStatus('💾 Database: content opslaan...', 85);
      console.log('📊 [AutoContent] Status update sent: 85%');

      const title = topic; // Simplified title
      const savedContent = await autoSaveToLibrary({
        clientId: user.id,
        projectId: projectId || null,
        type: 'blog',
        title,
        content,
        language: language.toUpperCase(),
      });

      const contentId = savedContent.contentId || '';
      sendStatus(`✅ Database: opgeslagen met ID ${contentId.substring(0, 8)}...`, 88);
      console.log('✅ Content opgeslagen in library:', contentId);

      // ✅ UPDATE TOPICAL TOPIC STATUS (if from topical map)
      if (topicalTopicId && contentId) {
        try {
          await prisma.topicalTopic.update({
            where: { id: topicalTopicId },
            data: {
              status: 'completed',
              isCompleted: true,
              contentId: contentId
            }
          });
          console.log(`✅ Topical topic ${topicalTopicId} gemarkeerd als voltooid`);
        } catch (topicError) {
          console.error('⚠️ Kon topical topic niet updaten:', topicError);
          // Don't fail the entire request, just log the error
        }
      }

      // 🌐 WORDPRESS PUBLICATIE (indien gevraagd)
      let wordpressUrl = '';
      if (publishToWordPress && projectId) {
        try {
          sendStatus('📤 WordPress: publiceren...', 90);
          
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
              wordpressUrl: true,
              wordpressUsername: true,
              wordpressPassword: true,
              name: true,
            }
          });

          if (project?.wordpressUrl && project.wordpressUsername && project.wordpressPassword) {
            const wpResult = await publishToWordPress({
              siteUrl: project.wordpressUrl,
              username: project.wordpressUsername,
              applicationPassword: project.wordpressPassword,
              title,
              content,
              status: 'publish',
              categories: [],
              tags: autoParams.keywords || [],
              featuredImageUrl: featuredImageUrl || undefined,
            });

            if (wpResult.success && wpResult.postUrl) {
              wordpressUrl = wpResult.postUrl;
              sendStatus(`✅ WordPress: gepubliceerd`, 93);
              console.log(`✅ Gepubliceerd naar WordPress: ${wordpressUrl}`);
              
              // Update saved content with WordPress URL
              await prisma.savedContent.update({
                where: { id: contentId },
                data: { 
                  publishedUrl: wordpressUrl,
                  publishedAt: new Date()
                }
              });
            }
          } else {
            console.log('⚠️ WordPress credentials niet volledig, publicatie overgeslagen');
          }
        } catch (wpError) {
          console.error('⚠️ WordPress publicatie gefaald:', wpError);
          // Don't fail the entire request, just log the error
        }
      }

      // ✅ CREDITS AFTREKKEN
      if (!user.isUnlimited) {
        if (user.subscriptionCredits >= requiredCredits) {
          await prisma.client.update({
            where: { id: user.id },
            data: { subscriptionCredits: { decrement: requiredCredits } }
          });
          const newBalance = user.subscriptionCredits - requiredCredits;
          console.log(`💳 Credits: ${newBalance} subscription credits over`);
        } else {
          const remaining = requiredCredits - user.subscriptionCredits;
          await prisma.client.update({
            where: { id: user.id },
            data: {
              subscriptionCredits: 0,
              topUpCredits: { decrement: remaining }
            }
          });
          const newBalance = user.topUpCredits - remaining;
          console.log(`💳 Credits: ${newBalance} top-up credits over`);
        }
      } else {
        console.log('💳 Unlimited account: geen credits afgetrokken');
      }

      // ✅ SUCCESS - Final status update
      console.log('🛑 [AutoContent] Finalizing...');
      
      // CRITICAL: Ensure heartbeat is stopped (should already be stopped at 68%)
      heartbeatStopped = true;
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      sendStatus(`🎉 Compleet! ${actualWordCount} woorden + ${autoParams.imageCount} afbeeldingen`, 100);
      console.log('📊 [AutoContent] Status update sent: 100%');

      // Send success message with content in SSE format
      console.log('📤 [AutoContent] Preparing success payload...');
      
      // CRITICAL: Validate contentId before sending
      if (!contentId) {
        console.error('❌ [AutoContent] ERROR: contentId is empty or undefined!');
        throw new Error('Content werd opgeslagen maar geen ID ontvangen');
      }
      
      const successPayload = {
        status: 'complete',
        success: true,
        done: true,
        progress: 100,
        contentId: contentId,
        title,
        content: content, // Send the generated content
        wordCount: actualWordCount,
        creditsUsed: requiredCredits,
        message: wordpressUrl 
          ? `Content succesvol gegenereerd en gepubliceerd naar WordPress! 🚀` 
          : 'Content succesvol gegenereerd en opgeslagen!',
        redirectUrl: `/client-portal/content-library/${contentId}/edit`,
        wordpressUrl: wordpressUrl || undefined,
      };
      
      console.log('[AutoContent] ✅ Sending success payload', {
        contentId,
        contentIdLength: contentId.length,
        title,
        contentLength: content.length,
        wordpressUrl,
        redirectUrl: successPayload.redirectUrl,
        payload: successPayload, // Log full payload
      });
      
      const successData = `data: ${JSON.stringify(successPayload)}\n\n`;
      console.log('[AutoContent] 📤 Success data string:', successData.substring(0, 200) + '...');
      
      await writer.write(encoder.encode(successData));
      console.log('[AutoContent] ✅ Success data written to stream');
      
      // Small delay to ensure data is flushed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mark stream as closed and close immediately
      streamClosed = true;
      await writer.close();
      console.log('✅ [AutoContent] Stream closed successfully');

    } catch (error: any) {
      console.error('❌ [AutoContent] Generation error:', error);
      console.error('❌ [AutoContent] Error stack:', error.stack);
      console.error('❌ [AutoContent] Error details:', {
        message: error.message,
        name: error.name,
        code: error.code
      });
      
      // Stop heartbeat if it's running
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('⏹️ [AutoContent] Heartbeat stopped due to error');
      }
      
      const errorMessage = error.message || 'Content generatie mislukt';
      const errorData = `data: ${JSON.stringify({
        status: 'error',
        error: errorMessage,
        progress: 0,
        done: true // Mark as done so client knows to stop waiting
      })}\n\n`;
      
      console.log('📤 [AutoContent] Sending error to client:', errorMessage);
      await writer.write(encoder.encode(errorData));
      await writer.close();
    } finally {
      // Ensure heartbeat is stopped in all cases
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
