import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten voor complexe blog generatie met AI
export const runtime = 'nodejs'; // Gebruik Node.js runtime voor lange API calls

import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { loadWordPressSitemap, findRelevantInternalLinks } from '@/lib/sitemap-loader';
import { getBannedWordsInstructions, detectBannedWords, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { CREDIT_COSTS } from '@/lib/credits';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';
import { extractEnhancedImageContext, generateContextualImagePrompt } from '@/lib/image-context-enhancer';

// Helper function to send status updates via streaming
function createStatusStream() {
  const encoder = new TextEncoder();
  
  return new TransformStream({
    start(controller) {
      // @ts-ignore
      this.controller = controller;
    },
    transform(chunk, controller) {
      controller.enqueue(chunk);
    },
  });
}

function sendStatus(controller: any, status: string, progress: number) {
  const encoder = new TextEncoder();
  const data = JSON.stringify({ status, progress }) + '\n';
  try {
    controller.enqueue(encoder.encode(data));
  } catch (error) {
    console.error('Error sending status:', error);
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const body = await req.json();
  const {
    // Content type (NIEUW)
    contentType = 'blog', // 'blog' | 'product-review' | 'top-list'
    
    // Blog velden
    topic,
    keywords = [],
    wordCount = 1500,
    tone = 'professional',
    language = 'nl',
    seoOptimized = true,
    includeImage = true,
    imageStyle = 'realistic',
    projectId,
    sitemapUrl,
    affiliateLinks = [],
    
    // Product review/top-list velden (NIEUW)
    category,
    reviewType = 'single',
    targetAudience,
    products = [],
    additionalContext = '',
    
    // ✨ SEO opties
    includeYouTube = false,
    includeFAQ = false,
    includeDirectAnswer = true,
    generateFeaturedImage = true,
  } = body;

  // Validatie per content type
  if (contentType === 'blog' && !topic) {
    return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
  }
  
  if ((contentType === 'product-review' || contentType === 'top-list') && !category) {
    return NextResponse.json({ error: 'Categorie is verplicht' }, { status: 400 });
  }
  
  if ((contentType === 'product-review' || contentType === 'top-list') && products.length === 0) {
    return NextResponse.json({ error: 'Minimaal 1 product is verplicht' }, { status: 400 });
  }

  // Bepaal het hoofd onderwerp/titel voor logging
  const mainTopic = contentType === 'blog' ? topic : category;
  console.log(`🚀 Content generation started (${contentType}):`, { 
    topic: mainTopic, 
    wordCount, 
    tone, 
    language,
    products: products.length 
  });

  // Create streaming response
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send status
  const sendStreamStatus = (status: string, progress: number) => {
    const data = JSON.stringify({ status, progress }) + '\n';
    writer.write(encoder.encode(data)).catch(console.error);
  };

  // Start generation in background
  (async () => {
    try {
      sendStreamStatus('🚀 Blog generatie gestart...', 5);

      // Check user credits
      sendStreamStatus('✅ Credits controleren...', 10);
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
          error: `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor een blog.`,
          status: 'error',
          progress: 0
        }) + '\n\n';
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Get client AI settings for custom tone of voice
      sendStreamStatus('🎨 Tone of voice laden...', 12);
      const toneOfVoiceData = await getClientToneOfVoice(user.id, projectId);

      // Get project context if provided
      let projectContext = '';
      let wordpressApiUrl = '';
      let projectAffiliateLinks: Array<{
        url: string;
        anchorText: string;
        keywords: string[];
        category?: string;
        description?: string;
      }> = [];
      
      if (projectId) {
        sendStreamStatus('📁 Project context laden...', 15);
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { 
            name: true, 
            description: true, 
            websiteUrl: true,
            wordpressUrl: true,
          },
        });
        if (project) {
          projectContext = `
**Project Context:**
- Project: ${project.name}
- Website: ${project.websiteUrl || 'N/A'}
- Beschrijving: ${project.description || 'N/A'}
`;
          wordpressApiUrl = project.wordpressUrl || '';
        }
        
        // 🔗 STAP 0.1: Ophalen affiliate links voor dit project
        try {
          sendStreamStatus('🔗 Affiliate links laden...', 16);
          console.log('🔗 Loading affiliate links for project:', projectId);
          
          const affiliateLinksData = await prisma.affiliateLink.findMany({
            where: {
              projectId,
              isActive: true,
            },
            select: {
              url: true,
              anchorText: true,
              keywords: true,
              category: true,
              description: true,
            },
            orderBy: {
              usageCount: 'asc', // Gebruik eerst links die minder gebruikt zijn
            },
            take: 10, // Maximum 10 links om te kiezen
          });
          
          projectAffiliateLinks = affiliateLinksData;
          
          if (projectAffiliateLinks.length > 0) {
            console.log(`✅ Found ${projectAffiliateLinks.length} affiliate links for project`);
            sendStreamStatus(`✅ ${projectAffiliateLinks.length} affiliate links geladen`, 17);
          } else {
            console.log('ℹ️  No affiliate links found for this project');
          }
        } catch (affiliateError) {
          console.error('❌ Error loading affiliate links:', affiliateError);
          // Continue zonder affiliate links - niet blokkeren
        }
      }

      // STAP 0: Sitemap scraping voor interne links (als sitemapUrl is opgegeven)
      let internalLinks: Array<{ title: string; url: string; relevance: number }> = [];
      let internalLinksContext = '';
      
      // Affiliate links context
      let affiliateLinksContext = '';
      if (affiliateLinks && affiliateLinks.length > 0) {
        affiliateLinksContext = `
**Beschikbare Affiliate Links (VERPLICHT - NATUURLIJK VERWERKEN):**
${affiliateLinks.map((link: { title: string; url: string }, i: number) => 
  `${i + 1}. <a href="${link.url}">${link.title}</a>`
).join('\n')}

**REGELS VOOR AFFILIATE LINKS:**
- Verwerk ALLE ${affiliateLinks.length} affiliate link(s) natuurlijk in de tekst
- Plaats ze op relevante plekken waar ze contextuel passen
- Gebruik natuurlijke zinnen (geen "klik hier" of "bekijk deze link")
- Format: <a href="[exacte URL hierboven]">[natuurlijke ankertekst gebaseerd op titel]</a>
- Voorbeeld: "Voor meer informatie over ${affiliateLinks[0]?.title.toLowerCase()} kun je <a href="${affiliateLinks[0]?.url}">deze optie</a> bekijken."
- Zorg dat de links organisch in de flow van het artikel passen
`;
      }
      
      if (sitemapUrl) {
        sendStreamStatus('🔍 Sitemap scannen voor interne links...', 20);
        console.log('🔍 Step 0: EERST sitemap laden voor interne links...');
        console.log('   - Website URL:', sitemapUrl);
        console.log('   - WordPress API:', wordpressApiUrl || 'Niet beschikbaar, fallback naar XML sitemap');
        
        try {
          // Laad sitemap met WordPress API URL indien beschikbaar
          const sitemap = await loadWordPressSitemap(
            sitemapUrl, 
            wordpressApiUrl || undefined
          );
          
          sendStreamStatus(`✅ Sitemap geladen: ${sitemap.totalPages} pagina's gevonden`, 25);
          console.log(`✅ Sitemap geladen: ${sitemap.totalPages} pagina's gevonden`);
          console.log(`   - Posts: ${sitemap.pages.filter(p => p.type === 'post').length}`);
          console.log(`   - Pages: ${sitemap.pages.filter(p => p.type === 'page').length}`);
          console.log(`   - Categories: ${sitemap.categories.length}`);
          
          // Zoek relevante links voor dit onderwerp
          sendStreamStatus('🔗 Relevante interne links zoeken...', 28);
          internalLinks = findRelevantInternalLinks(sitemap, topic, 5);
          
          if (internalLinks.length > 0) {
            sendStreamStatus(`✅ ${internalLinks.length} relevante interne links gevonden`, 30);
            console.log(`🔗 ${internalLinks.length} relevante interne links gevonden:`);
            internalLinks.forEach(link => {
              console.log(`   - ${link.title} (${link.url}) [relevance: ${link.relevance}]`);
            });
            
            internalLinksContext = `

**🔗 INTERNE LINKS - VERPLICHT TOEVOEGEN:**

**Beschikbare Links (${internalLinks.length} stuks):**
${internalLinks.map((link, i) => `${i + 1}. "${link.title}" → ${link.url}`).join('\n')}

**STRIKTE REGELS (VERPLICHT OPVOLGEN):**
✅ Voeg ALLE ${internalLinks.length} bovenstaande links toe in de content
✅ Gebruik ALLEEN de EXACTE URLs hierboven - GEEN andere URLs verzinnen
✅ Plaats links natuurlijk verspreid door de tekst (minimaal 1 per 2-3 paragrafen)
✅ Gebruik relevante ankertekst gebaseerd op de context (GEEN "klik hier" of "lees meer")
✅ Format: <a href="[EXACTE URL]">[natuurlijke ankertekst]</a>

**Voorbeelden:**
- "Meer tips over ${internalLinks[0]?.title.toLowerCase()} vind je in <a href="${internalLinks[0]?.url}">dit artikel</a>."
- "Lees ook onze <a href="${internalLinks[1]?.url}">gids over ${internalLinks[1]?.title.toLowerCase()}</a> voor meer details."
- "Voor diepere informatie, bekijk <a href="${internalLinks[2]?.url}">deze pagina over ${internalLinks[2]?.title.toLowerCase()}</a>."

⚠️ BELANGRIJK: Controleer dat ALLE ${internalLinks.length} links in de content staan voordat je klaar bent!
`;
          } else {
            sendStreamStatus('⚠️ Geen relevante interne links gevonden', 30);
            console.log('⚠️ Geen relevante interne links gevonden voor onderwerp:', topic);
          }
        } catch (error) {
          sendStreamStatus('⚠️ Sitemap scannen mislukt, doorgaan zonder links...', 30);
          console.error('❌ Sitemap scraping mislukt:', error);
          console.error('   Error details:', error instanceof Error ? error.message : String(error));
          // Continue without internal links - niet blokkeren
        }
      } else {
        sendStreamStatus('ℹ️ Geen sitemap URL opgegeven', 30);
        console.log('ℹ️ Geen sitemap URL opgegeven, overslaan interne links');
      }

      // STAP 0.5: FEATURED IMAGE GENEREREN (NIEUW!)
      let featuredImageUrl = '';
      if (generateFeaturedImage) {
        sendStreamStatus('🖼️ Uitgelichte afbeelding genereren...', 32);
        console.log('🖼️ Step 0.5: Generating FEATURED IMAGE...');
        
        try {
          // Featured image prompt gebaseerd op content type
          let featuredPrompt = '';
          const styleMap: Record<string, string> = {
            realistic: 'photorealistic, high quality, professional photography',
            illustration: 'digital illustration, artistic, vibrant colors',
            minimalist: 'minimalist design, clean lines, simple composition',
            modern: 'modern style, sleek, contemporary',
            professional: 'professional, business-like, corporate style',
            creative: 'creative, unique perspective, artistic interpretation',
          };
          const stylePrompt = styleMap[imageStyle] || styleMap.realistic;
          
          if (contentType === 'blog') {
            featuredPrompt = `Professional featured image for article about: ${topic}. ${stylePrompt}. Eye-catching, high-quality, suitable as blog header image.`;
          } else if (contentType === 'product-review') {
            featuredPrompt = `Professional featured image for product review about: ${category}. ${stylePrompt}. Show products, comparison, review concept. Eye-catching, high-quality.`;
          } else if (contentType === 'top-list') {
            const productCount = products.length;
            featuredPrompt = `Professional featured image for top ${productCount} list about: ${category}. ${stylePrompt}. Show multiple products, ranking concept. Eye-catching, high-quality.`;
          }
          
          console.log(`   - Featured image prompt: "${featuredPrompt}"`);
          console.log(`   - Model: stable-diffusion-3 (cost-optimized: $0.037 vs $0.18)`);
          console.log(`   - Size: 1536x1024 (landscape format)`);
          
          const imageResponse = await fetch('https://lh7-rt.googleusercontent.com/docsz/AD_4nXeIUCM4of2D_9e4RcJT5sK-Ac86BleONXzcYwRGFOKzYoAIUuk4IlAo0ZaaHlDP5riSW0ZgVVsEUEkLKNwh6Ly2zA9qRiEPMu6DnrwkCNqIttyl8kIB0mtElz_a4JHftOUxezg6MnumEJmt35fz5dgcc7RH?key=YA2Z_iIVe_1u9MrC48GHTw', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'stable-diffusion-3',
              prompt: featuredPrompt,
              n: 1,
              size: '1536x1024', // Landscape format for featured image (supported size)
              style: 'realistic_image/studio_portrait',
              quality: 'high',
            }),
          });
          
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            featuredImageUrl = imageData.data?.[0]?.url || '';
            
            if (featuredImageUrl) {
              console.log(`✅ Featured image generated successfully: ${featuredImageUrl}`);
              sendStreamStatus('✅ Uitgelichte afbeelding klaar!', 34);
            } else {
              console.error('❌ No URL in featured image response:', imageData);
              sendStreamStatus('⚠️ Uitgelichte afbeelding mislukt', 34);
            }
          } else {
            const errorText = await imageResponse.text();
            console.error(`❌ Featured image generation failed (${imageResponse.status}):`, errorText);
            sendStreamStatus('⚠️ Uitgelichte afbeelding mislukt', 34);
          }
        } catch (error) {
          console.error('❌ Error generating featured image:', error);
          sendStreamStatus('⚠️ Uitgelichte afbeelding mislukt', 34);
        }
      } else {
        console.log('ℹ️ Featured image generation disabled');
      }

      // STEP 1: Web Research - Gebruik GPT-4o Search Preview (native web search)
      sendStreamStatus('🔍 Web research uitvoeren met GPT-4o Search...', 35);
      console.log('🔍 Step 1: Web Research...');
      
      const researchModel = selectOptimalModelForTask('blog_research', 'medium', 'quality');
      const keywordStr = keywords.length > 0 ? keywords.join(', ') : '';
      
      // Bepaal research onderwerp gebaseerd op content type
      const researchTopic = contentType === 'blog' ? topic : category;
      
      const researchPrompt = `Je bent een expert SEO researcher. Zoek actuele, betrouwbare informatie voor het volgende ${contentType === 'blog' ? 'blog onderwerp' : 'product review onderwerp'}.

**Onderwerp:** ${researchTopic}
${keywordStr ? `**Keywords:** ${keywordStr}` : ''}
${projectContext}

Geef een gestructureerd research rapport met:
1. **Actuele feiten en statistieken** (met jaartallen en bronnen waar mogelijk)
2. **Trending onderwerpen** gerelateerd aan dit thema
3. **Belangrijke inzichten** die lezers moeten weten
4. **Veelgestelde vragen** over dit onderwerp

Focus op ${language === 'nl' ? 'Nederlandse' : 'Engelse'} informatie en bronnen.
Geef alleen relevante, actuele informatie van ${new Date().getFullYear()}.`;

      const researchResponse = await chatCompletion({
        model: researchModel.primary.model,
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert SEO researcher. Zoek alleen actuele, betrouwbare informatie en vermeld altijd bronnen.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const researchResults = researchResponse.choices?.[0]?.message?.content || '';
      sendStreamStatus('✅ Research voltooid - actuele informatie verzameld', 50);
      console.log('✅ Research completed');

      // STEP 2: Blog Writing - Gebruik Claude 4.5 Sonnet (nieuwste en beste voor creative writing)
      const writingModel = selectOptimalModelForTask('blog_writing', 'medium', 'quality');
      sendStreamStatus(`✍️ ${contentType === 'blog' ? 'Blog' : contentType === 'product-review' ? 'Product review' : 'Toplijstje'} schrijven met Claude 4.5 Sonnet...`, 55);
      console.log(`✍️ Step 2: Writing ${contentType}...`);
      console.log(`   - Word count target: ${wordCount}`);
      console.log(`   - Content type: ${contentType}`);
      console.log(`   - Writing model: ${writingModel.primary.model}`);
    
    // Generate tone of voice instructions using helper
      const toneInstructionsText = generateToneOfVoicePrompt(toneOfVoiceData, tone as any);

    // Bepaal de schrijf prompt gebaseerd op content type
    let writingPrompt = '';
    
    // Detecteer specifieke content types van keyword research
    let specificContentType = '';
    if (topic) {
      const topicLower = topic.toLowerCase();
      if (topicLower.includes('top ') || topicLower.includes('beste ')) {
        specificContentType = 'listicle';
      } else if (topicLower.includes('hoe ') || topicLower.includes('how to')) {
        specificContentType = 'howto';
      } else if (topicLower.includes('gids') || topicLower.includes('guide')) {
        specificContentType = 'guide';
      }
    }
    
    if (contentType === 'blog') {
      // NORMALE BLOG PROMPT (met specifieke instructies per type)
      let contentTypeInstructions = '';
      
      if (specificContentType === 'listicle') {
        contentTypeInstructions = `
**LISTICLE FORMAT (VERPLICHT):**
- Titel moet het aantal items bevatten (bijv. "Top 5 beste...", "7 manieren om...")
- Elk item heeft:
  * <h2>#[nummer] [Item naam/titel]</h2>
  * 2-3 alinea's uitleg per item
  * Waarom dit item waardevol/belangrijk is
- Gebruik genummerde of ongenummerde lijst structuur
- Elk item moet gelijkwaardig zijn in lengte en diepgang
- Afbeelding per item waar mogelijk
`;
      } else if (specificContentType === 'howto') {
        contentTypeInstructions = `
**HOW-TO FORMAT (VERPLICHT):**
- Titel moet beginnen met "Hoe..." of "How to..."
- Structuur:
  * Intro: Leg uit waarom dit belangrijk is en wat de lezer leert
  * <h2>Wat heb je nodig?</h2> - Lijst met benodigdheden/vereisten
  * <h2>Stap 1: [Actie]</h2> - Duidelijke stappen met actiegerichte titels
  * <h2>Stap 2: [Actie]</h2> - etc.
  * <h2>Tips en trucs</h2> - Extra adviezen
  * Conclusie: Motiveer de lezer om te beginnen
- Stappen moeten sequentieel en logisch zijn
- Gebruik duidelijke, actiegerichte taal
- Voeg waarschuwingen toe waar nodig (<blockquote>)
`;
      } else if (specificContentType === 'guide') {
        contentTypeInstructions = `
**GIDS FORMAT (VERPLICHT):**
- Uitgebreide, diepgaande content
- Structuur:
  * Intro: Waarom deze gids belangrijk is
  * <h2>De basis</h2> - Fundamentele concepten
  * <h2>Gevorderd</h2> - Diepere details
  * <h2>Veelvoorkomende fouten</h2> - Wat te vermijden
  * <h2>Best practices</h2> - Aanbevelingen
  * Conclusie: Samenvatting en volgende stappen
- Meer diepgang dan een normale blog
- Educatief en informatief
- Gebruik voorbeelden en scenario's
`;
      }
      
      writingPrompt = `Je bent een expert SEO content writer die artikelen schrijft die 100% menselijk scoren in Originality AI.

${contentTypeInstructions}

**ONDERWERP:** ${topic}

**RESEARCH RESULTATEN:**
${researchResults}

**ARTIKEL STRUCTUUR (VERPLICHT):**
- 1 <h1> titel: SEO geoptimaliseerd, kort en pakkend (schrijf in normale zinsvorm, NIET Elke Woord Met Hoofdletter)
- Intro: 3-4 zinnen met variërende lengtes, noem het keyword
- <h2> en/of <h3> titels: elk met een menselijke, doorlopende alinea (schrijf in normale zinsvorm, NIET Elke Woord Met Hoofdletter)
- Afsluitende alinea: 4-5 zinnen
- ❌ NOOIT twee headings direct achter elkaar - ALTIJD een paragraaf ertussen

**HOOFDLETTERS IN TITELS:**
✅ GOED: <h1>Hoe werkt kunstmatige intelligentie in marketing?</h1>
✅ GOED: <h2>De voordelen van AI voor kleine bedrijven</h2>
❌ FOUT: <h1>Hoe Werkt Kunstmatige Intelligentie In Marketing?</h1>
❌ FOUT: <h2>De Voordelen Van AI Voor Kleine Bedrijven</h2>

**SCHRIJFSTIJL VOOR 100% HUMAN SCORE:**
✅ Conversationeel op B1-niveau (toegankelijk en begrijpelijk)
✅ Gebruik 'je/jij' vorm en persoonlijke voorbeelden
✅ Wissel zinslengtes af:
   - Korte zinnen (8-12 woorden)
   - Middellange zinnen (15-20 woorden)
   - Enkele lange zinnen (25+ woorden)
✅ Begin zinnen gevarieerd (NIET steeds met 'Je', 'Het', 'De', etc.)
✅ Gebruik spreektaal en informele wendingen
✅ Vermijd herhalingen binnen één alinea
✅ Maak natuurlijke overgangen: 'daarnaast', 'bovendien', 'ook'
✅ Voeg concrete voorbeelden en scenario's toe (geen mensen)
✅ Gebruik emotionele woorden die betrokkenheid tonen

**OPMAAK ELEMENTEN (VERPLICHT):**
✅ Voeg minimaal 2-3 opsommingslijsten toe met <ul><li> voor leesbaarheid
✅ Voeg waar relevant blockquotes toe met <blockquote> voor belangrijke citaten of tips
✅ Gebruik <strong> voor belangrijke punten (max 2-3 per paragraaf)
✅ Gebruik <em> voor subtiele nadruk waar passend
✅ Voeg waar mogelijk een tabel toe met <table> voor data/vergelijkingen

**VERBODEN ELEMENTEN:**
❌ Geen vaktermen of clichés
❌ Geen formele/stijve taal
❌ Geen overmatig gebruik van bijvoeglijke naamwoorden
❌ Keyword max 1 keer in headings
❌ Niet meer dan één keyword per alinea
❌ Geen voorbeelden van mensen (geen "Stel je voor dat Jan...")
❌ NOOIT headings zoals "Conclusie", "Afsluiting", "Call to Action", "Samenvatting"

${getBannedWordsInstructions()}

**SEO EISEN:**
- Minimaal ${wordCount} woorden
${toneInstructionsText}
- Keywords natuurlijk verwerken (max 1x per alinea)
${keywordStr ? `- Focus keywords: ${keywordStr}` : ''}
${seoOptimized ? '- SEO geoptimaliseerd: keywords in headings en natuurlijk in tekst' : ''}
${internalLinksContext || ''}
${affiliateLinksContext}
${projectContext ? `- Verwijs subtiel naar: ${projectContext}` : ''}

${includeDirectAnswer ? `
🎯 **DIRECT ANTWOORD (VERPLICHT):**
Voeg direct na de introductie een "Direct Answer Box" toe:

<div class="direct-answer-box" style="background: #f8f9fa; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0; border-radius: 8px;">
  <h3 style="margin-top: 0; color: #ff6b35;">Direct Antwoord</h3>
  <p><strong>Beknopt antwoord op de hoofdvraag in 2-3 zinnen.</strong></p>
</div>

Dit moet een beknopt, direct antwoord geven op de hoofdvraag van het artikel.
` : ''}

${includeFAQ ? `
❓ **FAQ SECTIE (VERPLICHT):**
Voeg aan het einde van het artikel (voor de conclusie) een FAQ sectie toe met 5-7 veelgestelde vragen:

<div class="faq-section" style="margin: 40px 0;">
  <h2>Veelgestelde vragen</h2>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
    <h3 style="color: #ff6b35;">❓ Vraag 1</h3>
    <p>Antwoord op vraag 1 in 2-4 zinnen.</p>
  </div>
  
  [... 4-6 meer FAQ items ...]
</div>

Elke vraag moet:
- Relevant zijn voor het onderwerp
- Een veelgestelde vraag zijn die lezers hebben
- Een helder, beknopt antwoord krijgen (2-4 zinnen)
- Focus keyword of gerelateerde keywords bevatten waar mogelijk
` : ''}

${includeYouTube ? `
🎥 **YOUTUBE VIDEO (VERPLICHT):**
Voeg in het midden van het artikel een relevante YouTube video toe:

<div class="youtube-embed" style="margin: 30px 0;">
  <h3>Bekijk ook deze video:</h3>
  <iframe width="100%" height="400" src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

Zoek een relevante YouTube video ID voor dit onderwerp en vervang YOUTUBE_VIDEO_ID.
` : ''}

**AFBEELDINGEN:**
- Voeg ${Math.ceil(wordCount / 750)} afbeelding(en) toe
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="Gedetailleerde beschrijving van de afbeelding" />
- Plaats afbeeldingen logisch verspreid door de tekst (niet allemaal aan het begin of einde)
- Gebruik beschrijvende alt teksten voor SEO

**HTML FORMATTING:**
- Gebruik alleen: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <img>, <a>, <blockquote>, <table>
- Gebruik de research resultaten voor actuele feiten en statistieken
- Voeg minimaal 2-3 opsommingslijsten toe met <ul><li> voor leesbaarheid
- Gebruik <strong> spaarzaam voor belangrijke woorden (max 2-3 per paragraaf)
- Voeg waar relevant <blockquote> toe voor belangrijke tips of citaten
- Voeg waar mogelijk een <table> toe voor data of vergelijkingen

**BELANGRIJK:**
- Schrijf zoals een mens schrijft: natuurlijk, gevarieerd, persoonlijk
- Gebruik korte EN lange zinnen door elkaar
- Begin alinea's op verschillende manieren
- Maak het leesbaar en toegankelijk (B1-niveau)
- GEEN AI-achtige patronen of herhalingen
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}

Schrijf nu de complete blog in perfecte HTML formatting!`;
    } else if (contentType === 'product-review' || contentType === 'top-list') {
      // PRODUCT REVIEW OF TOP-LIST PROMPT
      const productsInfo = products.map((p: any, i: number) => `
**Product ${i + 1}: ${p.name || `Product ${i + 1}`}**
- URL: ${p.url}
${p.price ? `- Prijs: ${p.price}` : ''}
${p.rating ? `- Rating: ${p.rating}` : ''}
${p.description ? `- Beschrijving: ${p.description}` : ''}
`).join('\n');

      const reviewTypeText = contentType === 'top-list' 
        ? `Top ${products.length} ${category}` 
        : (reviewType === 'single' ? 'Product Review' : 'Product Vergelijking');
      
      writingPrompt = `Je bent een expert product review writer die uitgebreide reviews schrijft die 100% menselijk scoren in Originality AI.

**TYPE:** ${reviewTypeText}
**CATEGORIE:** ${category}
${targetAudience ? `**DOELGROEP:** ${targetAudience}` : ''}
${additionalContext ? `**EXTRA CONTEXT:** ${additionalContext}` : ''}

**RESEARCH RESULTATEN:**
${researchResults}

**PRODUCTEN:**
${productsInfo}

**ARTIKEL STRUCTUUR (VERPLICHT):**
- 1 <h1> titel: Pakkende titel ${contentType === 'top-list' ? `(bijvoorbeeld "Top ${products.length} Beste ${category} van 2024")` : ''}
- Intro: 3-4 zinnen, leg uit waarom dit relevant is
${contentType === 'top-list' ? `
- Voor ELK product:
  * <h2>#[nummer] [Productnaam]</h2>
  * Foto placeholder: <img src="IMAGE_PLACEHOLDER_[nummer]" alt="[Productnaam]" />
  * Beschrijving (4-5 alinea's):
    - Wat maakt dit product uniq?
    - Voor- en nadelen
    - Voor wie is dit geschikt?
  * Product link: <a href="[product URL]">Bekijk [Productnaam]</a>
` : `
- Per product sectie:
  * <h2>[Productnaam]</h2>
  * Foto placeholder: <img src="IMAGE_PLACEHOLDER_X" alt="[Productnaam]" />
  * Uitgebreide review (6-8 alinea's)
  * Voor- en nadelen (<ul><li>)
  * Product link: <a href="[product URL]">Bekijk [Productnaam]</a>
`}
${reviewType === 'comparison' && contentType !== 'top-list' ? `
- <h2>Vergelijking</h2>: Directe vergelijking tussen producten in een tabel
- <h2>Welke kies je?</h2>: Advies gebaseerd op verschillende use cases
` : ''}
- Conclusie: Duidelijke aanbeveling met actie (4-5 zinnen)

**HOOFDLETTERS IN TITELS:**
✅ GOED: <h1>Top 5 beste laptops voor studenten in 2024</h1>
✅ GOED: <h2>De voordelen van de MacBook Air M3</h2>
❌ FOUT: <h1>Top 5 Beste Laptops Voor Studenten In 2024</h1>
❌ FOUT: <h2>De Voordelen Van De MacBook Air M3</h2>

**SCHRIJFSTIJL:**
✅ Persoonlijke ervaring en mening (zonder "ik")
✅ Eerlijk over voor- én nadelen
✅ Conversationeel en toegankelijk (B1-niveau)
✅ Concrete voorbeelden en scenario's
✅ Vergelijkingen tussen producten waar relevant
✅ Wissel zinslengtes af (kort, middel, lang)

**OPMAAK ELEMENTEN:**
✅ Voor- en nadelen in <ul><li> lijsten
✅ Product specificaties in <table> waar relevant
✅ <blockquote> voor belangrijke tips of waarschuwingen
✅ <strong> voor belangrijke punten (max 2-3 per paragraaf)
✅ Product links met natuurlijke ankertekst

**VERBODEN:**
❌ Geen AI-achtige formuleringen
❌ Geen "perfect" of overdreven superlatieve
❌ Geen geforceerde keywords
❌ Geen "Conclusie" of "Samenvatting" headings

${getBannedWordsInstructions()}

**SEO EISEN:**
- Minimaal ${wordCount} woorden
${toneInstructionsText}
- Keywords natuurlijk verwerken
- Focus op ${category}
${seoOptimized ? '- SEO geoptimaliseerd: keywords in headings en natuurlijk in tekst' : ''}
${internalLinksContext || ''}
${affiliateLinksContext}

${includeDirectAnswer ? `
🎯 **DIRECT ANTWOORD (VERPLICHT):**
Voeg direct na de introductie een "Direct Answer Box" toe:

<div class="direct-answer-box" style="background: #f8f9fa; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0; border-radius: 8px;">
  <h3 style="margin-top: 0; color: #ff6b35;">Direct Antwoord</h3>
  <p><strong>Welk product is het beste? Beknopt antwoord in 2-3 zinnen.</strong></p>
</div>
` : ''}

${includeFAQ ? `
❓ **FAQ SECTIE (VERPLICHT):**
Voeg aan het einde van het artikel (voor de conclusie) een FAQ sectie toe met 5-7 veelgestelde vragen:

<div class="faq-section" style="margin: 40px 0;">
  <h2>Veelgestelde vragen</h2>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
    <h3 style="color: #ff6b35;">❓ Vraag 1</h3>
    <p>Antwoord op vraag 1 in 2-4 zinnen.</p>
  </div>
  
  [... 4-6 meer FAQ items ...]
</div>
` : ''}

${includeYouTube ? `
🎥 **YOUTUBE VIDEO (VERPLICHT):**
Voeg in het midden van het artikel een relevante YouTube video toe:

<div class="youtube-embed" style="margin: 30px 0;">
  <h3>Bekijk ook deze video:</h3>
  <iframe width="100%" height="400" src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>
` : ''}

**AFBEELDINGEN:**
- Voeg voor ELK product een image placeholder toe
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="Gedetailleerde beschrijving" />
- Plaats direct onder de product titel

**HTML FORMATTING:**
- Gebruik alleen: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <img>, <a>, <blockquote>, <table>
- Alle product links moeten werken: <a href="[exacte product URL]">
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}

Schrijf nu de complete ${reviewTypeText.toLowerCase()} in perfecte HTML formatting!`;
    }

    console.log('📤 Sending writing request to Claude...');
    console.log(`   - Prompt length: ${writingPrompt.length} characters`);
    console.log(`   - Max tokens: 8000`);
    console.log(`   - Temperature: 0.8`);
    sendStreamStatus('📤 Tekst genereren (dit kan 3-5 minuten duren)...', 57);
    
    const writingStartTime = Date.now();
    let writingResponse;
    
    // Set up heartbeat to keep connection alive during long AI operation
    const heartbeatMessages = [
      '✍️ AI aan het schrijven... (10%)',
      '✍️ AI aan het schrijven... (30%)',
      '✍️ AI aan het schrijven... (50%)',
      '✍️ AI aan het schrijven... (70%)',
      '✍️ AI aan het schrijven... (90%)',
      '✍️ Laatste alinea\'s worden geschreven...',
    ];
    let heartbeatIndex = 0;
    const heartbeatInterval = setInterval(() => {
      if (heartbeatIndex < heartbeatMessages.length) {
        const elapsed = Math.floor((Date.now() - writingStartTime) / 1000);
        sendStreamStatus(`${heartbeatMessages[heartbeatIndex]} (${elapsed}s)`, 57 + Math.min(10, heartbeatIndex * 2));
        heartbeatIndex++;
      }
    }, 15000); // Every 15 seconds
    
    try {
      console.log('🚀 Starting blog writing with Claude...');
      writingResponse = await chatCompletion({
        model: writingModel.primary.model,
        messages: [
          {
            role: 'system',
            content: `Je bent een expert SEO content writer die artikelen schrijft die 100% menselijk scoren in Originality AI. Je schrijft natuurlijk, gevarieerd en conversationeel in het ${language === 'nl' ? 'Nederlands' : 'Engels'}. Je gebruikt alleen HTML tags: h1, h2, h3, p, ul, li, strong, em, img. Je vermijdt AI-achtige patronen en schrijft zoals een echte mens: met gevarieerde zinslengtes, persoonlijke toon, en natuurlijke overgangen.`
          },
          {
            role: 'user',
            content: writingPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 8000,
      });
      
      clearInterval(heartbeatInterval); // Stop heartbeat when complete
      
      const writingDuration = ((Date.now() - writingStartTime) / 1000).toFixed(1);
      console.log(`✅ Writing response received in ${writingDuration}s`);
      
    } catch (writingError: any) {
      clearInterval(heartbeatInterval); // Stop heartbeat on error
      
      console.error('❌ CRITICAL: Blog writing error');
      console.error('   - Error:', writingError.message);
      console.error('   - Duration:', ((Date.now() - writingStartTime) / 1000).toFixed(1), 's');
      console.error('   - Model:', writingModel.primary.model);
      
      // Send detailed error to user
      const errorData = JSON.stringify({ 
        error: `❌ Blog schrijven mislukt: ${writingError.message}. Dit kan gebeuren bij overbelasting van de AI. Probeer het direct opnieuw - meestal lukt het de tweede keer wel!`,
        status: 'error',
        progress: 0,
        details: writingError.message
      }) + '\n\n';
      await writer.write(encoder.encode(errorData));
      await writer.close();
      return;
    }

      let blogContent = writingResponse.choices?.[0]?.message?.content || '';
      
      // 🧹 CLEANUP: Remove markdown code blocks and unwanted prefixes
      console.log('🧹 Cleaning blog content...');
      console.log(`   - Original content length: ${blogContent.length}`);
      console.log(`   - First 100 chars: "${blogContent.substring(0, 100)}"`);
      
      // Remove markdown code blocks (```html, ```xml, etc.)
      blogContent = blogContent.replace(/^```[a-z]*\n?/gm, '').replace(/```$/gm, '');
      
      // Remove leading quotes and html prefix
      blogContent = blogContent.replace(/^["']html\s*/, '');
      blogContent = blogContent.replace(/^["']\s*/, '');
      
      // Trim whitespace
      blogContent = blogContent.trim();
      
      console.log(`   - Cleaned content length: ${blogContent.length}`);
      console.log(`   - First 100 chars after cleanup: "${blogContent.substring(0, 100)}"`);
      
      // Validate content length
      if (!blogContent || blogContent.trim().length < 100) {
        console.error('❌ CRITICAL: Blog content is too short or empty!');
        console.error('   - Content length:', blogContent.length);
        console.error('   - Response structure:', JSON.stringify({
          hasChoices: !!writingResponse.choices,
          choicesLength: writingResponse.choices?.length,
          hasMessage: !!writingResponse.choices?.[0]?.message,
          hasContent: !!writingResponse.choices?.[0]?.message?.content,
        }));
        
        const errorData = JSON.stringify({ 
          error: '❌ Blog generatie produceerde onvoldoende content. Probeer het direct opnieuw!',
          status: 'error',
          progress: 57
        }) + '\n\n';
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }
      
      sendStreamStatus('✅ Blog succesvol geschreven', 73);
      console.log(`✅ Blog writing completed - ${blogContent.length} characters generated`);
      
      // STAP 2.5: Verboden woorden check en filter
      sendStreamStatus('🔍 Verboden woorden controleren en filteren...', 74);
      console.log('🔍 Step 2.5: Checking and filtering banned words...');
      
      const validation = isContentValid(blogContent);
      if (!validation.valid) {
        console.warn('⚠️ Verboden woorden gevonden:', validation.bannedWords);
        sendStreamStatus(`⚠️ ${validation.bannedWords.length} verboden woorden gevonden, automatisch filteren...`, 74);
        
        // Automatisch filteren
        blogContent = removeBannedWords(blogContent);
        console.log('✅ Verboden woorden automatisch gefilterd');
        
        // Dubbele check
        const revalidation = isContentValid(blogContent);
        if (!revalidation.valid) {
          console.error('❌ Sommige verboden woorden konden niet volledig verwijderd worden:', revalidation.bannedWords);
        }
      } else {
        console.log('✅ Geen verboden woorden gevonden');
      }
      
      sendStreamStatus('✅ Content gevalideerd en gefilterd', 75);

      // STAP 2.7: Affiliate links integratie (als beschikbaar)
      if (projectAffiliateLinks && projectAffiliateLinks.length > 0) {
        try {
          sendStreamStatus('🔗 Affiliate links integreren...', 76);
          console.log(`🔗 Step 2.7: Integrating ${projectAffiliateLinks.length} affiliate links...`);
          
          // Import de functie dynamisch
          const { integrateAffiliateLinksWithAI } = await import('@/lib/affiliate-link-parser');
          
          const enhancedContent = await integrateAffiliateLinksWithAI(
            blogContent,
            projectAffiliateLinks,
            {
              maxLinks: 3, // Maximum 3 affiliate links per blog
              strategy: 'natural' // Natuurlijke integratie
            }
          );
          
          // Update content met affiliate links
          blogContent = enhancedContent;
          
          // Update usage count voor gebruikte links
          const usedLinks = projectAffiliateLinks.filter(link => 
            blogContent.includes(link.url)
          );
          
          if (usedLinks.length > 0 && projectId) {
            console.log(`✅ ${usedLinks.length} affiliate links successfully integrated`);
            sendStreamStatus(`✅ ${usedLinks.length} affiliate links toegevoegd`, 77);
            
            // Update usage count in database
            for (const link of usedLinks) {
              try {
                await prisma.affiliateLink.updateMany({
                  where: {
                    projectId,
                    url: link.url,
                  },
                  data: {
                    usageCount: { increment: 1 },
                    lastUsedAt: new Date(),
                  },
                });
              } catch (updateError) {
                console.error('Error updating affiliate link usage:', updateError);
                // Continue - usage tracking failure niet blokkeren
              }
            }
          } else {
            console.log('ℹ️ No affiliate links were integrated (possibly not relevant)');
          }
        } catch (affiliateError) {
          console.error('❌ Affiliate link integration failed:', affiliateError);
          sendStreamStatus('⚠️ Affiliate links overgeslagen', 77);
          // Continue zonder affiliate links - niet blokkeren
        }
      } else {
        console.log('ℹ️ No affiliate links available for this project');
      }

      // STAP 3: Afbeeldingen genereren (als includeImage is enabled)
      if (includeImage) {
        sendStreamStatus('🖼️ Afbeeldingen genereren met AI...', 78);
        console.log('🖼️ Step 3: Generating images...');
      
        // Find all image placeholders
        const imagePlaceholders = blogContent.match(/IMAGE_PLACEHOLDER_\d+/g) || [];
        
        if (imagePlaceholders.length > 0) {
          sendStreamStatus(`🖼️ ${imagePlaceholders.length} afbeeldingen genereren...`, 80);
          console.log(`Found ${imagePlaceholders.length} image placeholders`);
        
        // Style mapping
        const styleMap: Record<string, string> = {
          realistic: 'photorealistic, high quality, professional photography',
          illustration: 'digital illustration, artistic, vibrant colors',
          minimalist: 'minimalist design, clean lines, simple composition',
          modern: 'modern style, sleek, contemporary',
          professional: 'professional, business-like, corporate style',
          creative: 'creative, unique perspective, artistic interpretation',
        };
        
        const stylePrompt = styleMap[imageStyle] || styleMap.realistic;
        
          // Generate images for each placeholder
          for (let i = 0; i < imagePlaceholders.length; i++) {
            const placeholder = imagePlaceholders[i];
            
            try {
              sendStreamStatus(`🖼️ Afbeelding ${i + 1}/${imagePlaceholders.length} genereren...`, 80 + (i * 10 / imagePlaceholders.length));
              
              // Extract ENHANCED context around the placeholder for MAXIMUM relevance
              const placeholderIndex = blogContent.indexOf(placeholder);
              const context = extractEnhancedImageContext(blogContent, placeholderIndex, {
                contextWindowBefore: 1200, // Capture more content before
                contextWindowAfter: 800,   // Capture more content after
                maxParagraphs: 3,          // Extract up to 3 paragraphs
              });
              
              console.log(`🔍 Enhanced context extraction for image ${i + 1}/${imagePlaceholders.length}:`);
              console.log(`   - Heading: "${context.heading || 'N/A'}"`);
              console.log(`   - Paragraphs found: ${context.paragraphs.length}`);
              console.log(`   - Context preview: "${context.contextualPrompt.substring(0, 150)}..."`);
              
              // Generate AI-enhanced contextual prompt for better relevance
              const mainArticleTopic = contentType === 'blog' ? topic : category;
              const imagePrompt = await generateContextualImagePrompt(
                context,
                stylePrompt,
                mainArticleTopic
              );
              
              console.log(`✨ AI-generated contextual image prompt:`);
              console.log(`   - Prompt: "${imagePrompt}"`);
              console.log(`   - Length: ${imagePrompt.length} chars`);

            
            // Call image generation API
            console.log(`   - Image ${i + 1} prompt: "${imagePrompt}"`);
            console.log(`   - Model: stable-diffusion-3 (cost-optimized: $0.037 vs $0.18)`);
            console.log(`   - Size: 1536x1024`);
            
            const imageResponse = await fetch('https://upload.wikimedia.org/wikipedia/commons/8/82/Astronaut_Riding_a_Horse_%28SD3.5%29.webp', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
              },
              body: JSON.stringify({
                model: 'stable-diffusion-3',
                prompt: imagePrompt,
                n: 1,
                size: '1536x1024',
                style: 'realistic_image/natural_light',
                quality: 'high',
              }),
            });
            
            console.log(`   - Response status: ${imageResponse.status}`);
            
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const imageUrl = imageData.data?.[0]?.url;
              
                if (imageUrl) {
                  // Replace placeholder with actual image URL
                  blogContent = blogContent.replace(
                    new RegExp(`<img src="${placeholder}"`, 'g'),
                    `<img src="${imageUrl}"`
                  );
                  console.log(`✅ Image ${i + 1} generated successfully: ${imageUrl}`);
                } else {
                  console.error(`❌ Image ${i + 1} - No URL in response:`, imageData);
                }
              } else {
                const errorText = await imageResponse.text();
                console.error(`❌ Image ${i + 1} generation failed (${imageResponse.status}):`, errorText);
                sendStreamStatus(`⚠️ Afbeelding ${i + 1} generatie mislukt, doorgaan...`, 80 + (i * 10 / imagePlaceholders.length));
              }
            } catch (error) {
              console.error(`❌ Error generating image ${i + 1}:`, error);
              sendStreamStatus(`⚠️ Fout bij genereren afbeelding ${i + 1}, doorgaan...`, 80 + (i * 10 / imagePlaceholders.length));
            }
          }
          
          sendStreamStatus('✅ Afbeeldingen succesvol gegenereerd', 90);
          console.log('✅ All images generated');
        }
      }

      // Extract title
      sendStreamStatus('✅ Content afronden en opslaan...', 92);
      const titleMatch = blogContent.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : (contentType === 'blog' ? topic : category);

      // STAP 4: Genereer SEO Metadata
      sendStreamStatus('📊 SEO metadata genereren...', 93);
      console.log('📊 Step 4: Generating SEO metadata...');
      
      let seoMetadata = null;
      try {
        const metadataPrompt = `
Je bent een SEO expert die perfecte metadata genereert voor MAXIMALE CTR (Click-Through Rate) in Google search results.

ONDERWERP: ${contentType === 'blog' ? topic : category}
OPGEGEVEN KEYWORDS: ${keywords.join(', ')}

BLOG CONTENT (EERSTE 3000 TEKENS):
${blogContent.substring(0, 3000)}...

OPDRACHT - Genereer PERFECTE SEO metadata volgens best practices 2024:

1. **SEO Titel** (EXACT 55-60 tekens - TEL ZE!):
   - MOET het focus keyword bevatten (bij voorkeur aan het begin)
   - MOET pakkend en klikwaardig zijn (gebruik power words)
   - Gebruik getallen waar mogelijk ("Top 5", "7 Tips", etc.)
   - Gebruik emotionele triggers ("Beste", "Geheim", "Bewezen", "Ultieme")
   - Voorbeelden:
     * "Beste SEO Tips 2024: Rank #1 in Google (Bewezen)" ✅
     * "AI Marketing Tools: Top 10 Gratis Opties in 2024" ✅
     * "WordPress Sneller Maken: 7 Bewezen Methodes 2024" ✅
   
2. **Meta Omschrijving** (EXACT 150-155 tekens - TEL ZE!):
   - MOET het focus keyword minimaal 1x bevatten
   - MOET een duidelijke call-to-action bevatten
   - MOET een voordeel/resultaat beloven
   - Gebruik actieve taal en urgentie
   - Voorbeelden:
     * "Ontdek de 10 beste SEO tools voor 2024. Verhoog je rankings met deze gratis en betaalde oplossingen. Klik voor de volledige gids! ⚡" ✅
     * "Leer WordPress optimaliseren in 7 stappen. Verhoog je snelheid met 200%. Complete gids met screenshots en tips. Start nu! 🚀" ✅
   
3. **Focus Keyword** (1-4 woorden):
   - HET belangrijkste zoekwoord voor dit artikel
   - Dit keyword moet het meest prominent voorkomen in de content
   - Voorbeeld: "beste laptops 2024", "ai marketing tools", "wordpress optimaliseren"
   
4. **Extra Keywords** (8-12 keywords):
   - Gerelateerde zoekwoorden die in het artikel gebruikt zijn
   - Variaties en synoniemen van het focus keyword
   - Long-tail keywords die relevant zijn
   - Voorbeeld: als focus = "beste laptops 2024" → extra = "goedkope laptops", "laptop kopen", "laptop vergelijking", etc.
   
5. **LSI Keywords** (MINIMAAL 20-25 keywords):
   - Semantisch gerelateerde keywords (Latent Semantic Indexing)
   - Keywords die Google VERWACHT bij dit onderwerp (zoals Surfer SEO analyseert)
   - Deze verhogen topical authority en E-E-A-T score
   - Voorbeeld: focus = "digital marketing" → LSI = "online advertising, content strategy, SEO optimization, social media marketing, email campaigns, brand awareness, customer engagement, conversion optimization, analytics tracking, marketing automation, lead generation, content creation, influencer marketing, video marketing, marketing funnel, ROI tracking, audience targeting, remarketing, A/B testing, marketing analytics, customer journey mapping, brand positioning, marketing budget, growth hacking, viral marketing"

BELANGRIJK:
- Tel de tekens EXACT! Niet te lang, niet te kort
- Gebruik power words voor emotie: "beste", "ultieme", "geheim", "bewezen", "gratis", "snel"
- Gebruik getallen voor autoriteit: "Top 10", "7 Tips", "2024"  
- Gebruik emoji's spaarzaam in meta description voor opvallen: ⚡ 🚀 ✅ 💡
- Focus keyword MOET in titel én description
- LSI keywords zijn CRUCIAAL voor topical relevance

FORMAAT - Geef ALLEEN JSON terug (geen markdown, geen extra tekst):
{
  "seoTitle": "[EXACT 55-60 tekens met focus keyword]",
  "metaDescription": "[EXACT 150-155 tekens met focus keyword en CTA]",
  "focusKeyword": "[1-4 woorden hoofdkeyword]",
  "extraKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10", "keyword11", "keyword12"],
  "lsiKeywords": ["lsi1", "lsi2", "lsi3", "lsi4", "lsi5", "lsi6", "lsi7", "lsi8", "lsi9", "lsi10", "lsi11", "lsi12", "lsi13", "lsi14", "lsi15", "lsi16", "lsi17", "lsi18", "lsi19", "lsi20", "lsi21", "lsi22", "lsi23", "lsi24", "lsi25"]
}

BELANGRIJK:
- Zorg dat de lengtes EXACT kloppen
- Gebruik het focus keyword in ZOWEL titel als description
- LSI keywords moeten semantisch relevant zijn
- Geen markdown, ALLEEN pure JSON
`;

        const metadataModel = selectOptimalModelForTask('content_analysis', 'medium', 'quality');
        const metadataResponse = await chatCompletion({
          model: metadataModel.primary.model,
          messages: [
            {
              role: 'system',
              content: 'Je bent een SEO expert die perfecte metadata genereert. Je geeft ALLEEN JSON terug, geen extra tekst.'
            },
            {
              role: 'user',
              content: metadataPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        });

        const metadataText = metadataResponse.choices?.[0]?.message?.content || '{}';
        
        // Extract JSON
        try {
          const jsonMatch = metadataText.match(/\{[\s\S]*\}/);
          seoMetadata = JSON.parse(jsonMatch ? jsonMatch[0] : metadataText);
          console.log('✅ SEO metadata generated:', seoMetadata);
          
          // Validate lengths
          if (seoMetadata.seoTitle && (seoMetadata.seoTitle.length < 55 || seoMetadata.seoTitle.length > 60)) {
            console.warn(`⚠️ SEO Title length is ${seoMetadata.seoTitle.length}, should be 55-60`);
          }
          if (seoMetadata.metaDescription && (seoMetadata.metaDescription.length < 150 || seoMetadata.metaDescription.length > 155)) {
            console.warn(`⚠️ Meta Description length is ${seoMetadata.metaDescription.length}, should be 150-155`);
          }
          
          // Log generated metadata
          console.log('✅ SEO Metadata generated:');
          console.log(`   - Title (${seoMetadata.seoTitle?.length} chars): "${seoMetadata.seoTitle}"`);
          console.log(`   - Description (${seoMetadata.metaDescription?.length} chars): "${seoMetadata.metaDescription}"`);
          console.log(`   - Focus Keyword: "${seoMetadata.focusKeyword}"`);
          console.log(`   - Extra Keywords (${seoMetadata.extraKeywords?.length}): ${seoMetadata.extraKeywords?.slice(0, 3).join(', ')}...`);
          console.log(`   - LSI Keywords (${seoMetadata.lsiKeywords?.length}): ${seoMetadata.lsiKeywords?.slice(0, 5).join(', ')}...`);
        } catch (e) {
          console.warn('⚠️ Failed to parse metadata JSON, using fallback');
          seoMetadata = {
            seoTitle: topic, // VOLLEDIG BEWAREN - GEEN AFKAPPING
            metaDescription: `Lees alles over ${topic}. Ontdek tips, tricks en meer.`,
            focusKeyword: keywords[0] || topic,
            extraKeywords: keywords.slice(0, 5),
            lsiKeywords: []
          };
        }
      } catch (metadataError) {
        console.error('❌ SEO metadata generation failed:', metadataError);
        seoMetadata = {
          seoTitle: topic, // VOLLEDIG BEWAREN - GEEN AFKAPPING
          metaDescription: `Lees alles over ${topic}. Ontdek tips, tricks en meer.`,
          focusKeyword: keywords[0] || topic,
          extraKeywords: keywords.slice(0, 5),
          lsiKeywords: []
        };
      }
      
      sendStreamStatus('✅ SEO metadata klaar', 95);

      // Deduct credits (only if not unlimited)
      const creditsUsed = CREDIT_COSTS.BLOG_POST; // 70 credits voor SEO blog met research
      if (!user.isUnlimited) {
        const subscriptionDeduct = Math.min(user.subscriptionCredits, creditsUsed);
        const topUpDeduct = Math.max(0, creditsUsed - subscriptionDeduct);
        
        await prisma.client.update({
          where: { id: user.id },
          data: {
            subscriptionCredits: user.subscriptionCredits - subscriptionDeduct,
            topUpCredits: user.topUpCredits - topUpDeduct,
            totalCreditsUsed: { increment: creditsUsed },
          },
        });
      }

      const remainingCredits = user.isUnlimited ? 999999 : (user.subscriptionCredits + user.topUpCredits - creditsUsed);

      // AUTO-SAVE: Sla blog automatisch op in Content Bibliotheek (1x, na generatie)
      sendStreamStatus('💾 Opslaan in Content Bibliotheek...', 97);
      console.log('💾 Auto-saving to Content Library...');
      
      try {
        // Extract keywords from blog content
        const extractedKeywords = keywords.length > 0 ? keywords : [];
        
        // Extract image URLs from blog content
        const imageUrlMatches = blogContent.match(/src="([^"]+)"/g) || [];
        const extractedImageUrls = imageUrlMatches
          .map((match: string) => match.replace(/src="|"/g, ''))
          .filter((url: string) => !url.includes('IMAGE_PLACEHOLDER'));
        
        console.log('📝 Auto-save data:', {
          clientId: user.id,
          type: 'blog',
          title,
          hasContent: !!blogContent,
          contentLength: blogContent.length,
          keywordsCount: extractedKeywords.length,
          imagesCount: extractedImageUrls.length,
          projectId: projectId || 'none',
        });
        
        const saveResult = await autoSaveToLibrary({
          clientId: user.id,
          type: 'blog',
          title,
          content: blogContent.replace(/<[^>]*>/g, ''), // Plain text voor content
          contentHtml: blogContent, // HTML versie
          category: 'seo',
          tags: ['ai-generated', 'blog'],
          description: blogContent.substring(0, 200).replace(/<[^>]*>/g, ''),
          keywords: extractedKeywords,
          metaDesc: blogContent.substring(0, 160).replace(/<[^>]*>/g, ''),
          imageUrls: extractedImageUrls,
          projectId: projectId || undefined,
        });
        
        console.log('💾 Auto-save result:', saveResult);
        
        if (saveResult.saved) {
          console.log(`✅ ${saveResult.message}`);
          sendStreamStatus('✅ Opgeslagen in Content Bibliotheek', 99);
        } else if (saveResult.duplicate) {
          console.log(`⏭️  ${saveResult.message}`);
          sendStreamStatus('⏭️ Al opgeslagen in Content Bibliotheek', 99);
        } else {
          console.warn(`⚠️ ${saveResult.message}`);
          sendStreamStatus(`⚠️ Opslag mislukt: ${saveResult.message}`, 99);
        }
      } catch (saveError: any) {
        console.error('❌ Error auto-saving to library:', saveError);
        console.error('Error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
        });
        sendStreamStatus(`⚠️ Opslag mislukt: ${saveError.message}`, 99);
        // Continue anyway - auto-save failure should not block the response
      }

      // Send final result with BOTH status and complete flag
      console.log('✅ Blog generation completed successfully - sending final data');
      
      // First, send a status update to 100%
      sendStreamStatus('✅ Content generatie voltooid!', 100);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Then send the final data with all content
      const finalData = JSON.stringify({
        success: true,
        status: 'complete',
        progress: 100,
        title,
        content: blogContent,
        seoMetadata,
        featuredImage: featuredImageUrl,
        creditsUsed,
        remainingCredits,
      }) + '\n';
      
      await writer.write(encoder.encode(finalData));
      
      // Wait longer to ensure the data is fully sent before closing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await writer.close();
      console.log('✅ Stream closed successfully');

    } catch (error: any) {
      console.error('❌ Error generating blog:', error);
      const errorData = JSON.stringify({
        error: error.message || 'Er ging iets mis bij het genereren van de blog',
        status: 'error',
        progress: 0
      }) + '\n\n';
      await writer.write(encoder.encode(errorData));
      await writer.close();
    }
  })();

  // Return the streaming response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
