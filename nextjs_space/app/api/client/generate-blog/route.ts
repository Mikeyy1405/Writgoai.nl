import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minuten voor complexe blog generatie met AI
export const runtime = 'nodejs'; // Gebruik Node.js runtime voor lange API calls

import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { 
  loadWordPressSitemap, 
  findRelevantInternalLinks,
  findRelevantInternalLinksWithAI,
  insertInternalLinksIntoHTML
} from '@/lib/sitemap-loader';
import { getBannedWordsInstructions, detectBannedWords, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { CREDIT_COSTS } from '@/lib/credits';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';
import { 
  getProductIntegrationInstructions, 
  processProductBoxes,
  type ProductInfo 
} from '@/lib/product-box-generator';
import type { DisplayType } from '@/lib/affiliate-display-html';
import { generateAffiliateDisplayHTML } from '@/lib/affiliate-display-html';
import { generateSocialMediaPost, type SocialMediaPost } from '@/lib/social-media-generator';

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

let streamClosed = false;

function sendStatus(controller: any, status: string, progress: number) {
  if (streamClosed) {
    console.log('[BlogGen] ⚠️ Stream closed, ignoring status:', status);
    return;
  }
  const encoder = new TextEncoder();
  const data = JSON.stringify({ status, progress }) + '\n';
  try {
    controller.enqueue(encoder.encode(data));
  } catch (error) {
    console.error('[BlogGen] ❌ Enqueue error:', (error as Error).message);
    streamClosed = true;
  }
}

export async function POST(req: NextRequest) {
  // Reset stream state for this request
  streamClosed = false;
  
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const body = await req.json();
  let {
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
    imageCount = 2, // Aantal afbeeldingen (0-5)
    imageStyle = 'realistic',
    projectId,
    sitemapUrl,
    affiliateLinks = [],
    
    // 🎯 Artikel stijl (NIEUW van frontend)
    articleStyle, // 'informatief' | 'lijstje' | 'howto' | 'review-enkel' | 'beste-lijst' | 'vergelijking' | 'nieuws' | 'gids' | 'mening'
    
    // 📋 Custom outline (optioneel)
    outline,
    
    // Product review/top-list velden (NIEUW)
    category,
    reviewType = 'single',
    targetAudience,
    products = [],
    additionalContext = '',
    
    // 🎨 Link Display Type
    linkDisplayType = 'ai-mix', // 'text-link' | 'product-box' | 'cta-box' | 'product-grid' | 'comparison-table' | 'ai-mix'
    
    // ✨ SEO opties
    includeYouTube = false,
    includeFAQ = false,
    includeDirectAnswer = true,
    generateFeaturedImage = true,
    includeQuotes = true,
    includeTables = true,
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
            language: true,
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
          // 🔗 BUGFIX: Gebruik project websiteUrl voor interne links als geen sitemapUrl is opgegeven
          if (!sitemapUrl && project.websiteUrl) {
            sitemapUrl = project.websiteUrl;
            console.log('✅ Using project websiteUrl for internal links:', sitemapUrl);
          }
          // Use project language if available
          if (project.language) {
            language = project.language.toLowerCase();
          }
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
**Beschikbare Affiliate Links (STRATEGISCH PLAATSEN):**
${affiliateLinks.map((link: { title: string; url: string; description?: string }, i: number) => 
  `${i + 1}. "${link.title}" → ${link.url}${link.description ? ` (${link.description})` : ''}`
).join('\n')}

**VERPLICHTE REGELS VOOR NATUURLIJKE LINK PLAATSING:**

🎯 **BELANGRIJKSTE REGEL: Links moeten ORGANISCH in lopende zinnen zitten - NOOIT als aparte zin!**

✅ **CORRECTE VOORBEELDEN:**
- "Deze tools helpen je daarbij, zoals <a href="[url]">[titel]</a>, die populair is bij professionals."
- "Wil je meer weten? Dan is <a href="[url]">[titel]</a> een handige bron om te raadplegen."
- "Voor een complete uitleg over dit onderwerp kun je terecht bij <a href="[url]">[titel]</a> voor meer informatie."

❌ **FOUT - NOOIT DOEN:**
- "Voor meer informatie over het samenstellen van een budget gaming PC, <a href="[url]">lees meer over budget gaming PC samenstellen onder 500 euro</a>." ❌ (Dit is een aparte zin die er tussendoor komt)
- "Bekijk ook <a href="[url]">[titel]</a>." ❌ (Te abrupt, niet geïntegreerd)
- "Meer informatie: <a href="[url]">[titel]</a>" ❌ (Niet in lopende tekst)

📍 **WAAR TE PLAATSEN:**
1. **Midden in een paragraaf** waar je het onderwerp bespreekt
2. **Als natuurlijk onderdeel van een zin** die al informatie geeft
3. **Bij concrete voorbeelden** waar de link relevant is
4. **In tips/advies secties** als aanvullende bron

❌ **NOOIT PLAATSEN:**
- Als aparte zin tussen paragrafen door
- In de vorm van "Voor meer informatie over X, lees meer over X" (veel te onnatuurlijk!)
- Als "Bekijk ook..." of "Lees meer..." zinnen
- Tussen twee volledige zinnen als tussenzin

✅ **INTEGRATIETECHNIEK:**
- Schrijf eerst de volledige zin ZONDER link
- Kijk dan waar de link BINNEN die zin past
- Vervang een relevant woord/phrase door de link
- De zin moet nog steeds natuurlijk lezen met de link erin

💡 **TEST:** Lees de paragraaf hardop. Als de link onnatuurlijk klinkt of er "tussendoor gepropt" is, verplaats of verwijder hem!
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

**🔗 INTERNE LINKS - NATUURLIJK INTEGREREN:**

**Beschikbare Links (${internalLinks.length} stuks):**
${internalLinks.map((link, i) => `${i + 1}. "${link.title}" → ${link.url}`).join('\n')}

**NATUURLIJKE INTEGRATIE REGELS:**
✅ Voeg zoveel mogelijk van deze ${internalLinks.length} links toe (minimaal 60%)
✅ Gebruik ALLEEN de EXACTE URLs hierboven - GEEN andere URLs verzinnen
✅ Plaats links ORGANISCH in lopende zinnen - NOOIT als aparte zin!
✅ Gebruik relevante ankertekst gebaseerd op de context (GEEN "klik hier" of "lees meer")
✅ Format: <a href="[EXACTE URL]">[natuurlijke ankertekst binnen de zin]</a>

**✅ CORRECTE VOORBEELDEN (links IN lopende zinnen):**
- "Deze strategie werkt uitstekend in combinatie met <a href="${internalLinks[0]?.url}">${internalLinks[0]?.title.toLowerCase()}</a>, wat je extra mogelijkheden geeft."
- "Voor een complete aanpak helpt het om <a href="${internalLinks[1]?.url}">${internalLinks[1]?.title.toLowerCase()}</a> erbij te betrekken."
- "De beste resultaten bereik je door <a href="${internalLinks[2]?.url}">${internalLinks[2]?.title.toLowerCase()}</a> toe te passen in je workflow."

**❌ FOUT - NOOIT DOEN (links als aparte/tussenzinnen):**
- "Meer tips over X vind je in dit artikel." ❌ (Aparte zin)
- "Lees ook onze gids over X voor meer details." ❌ (Aparte zin)
- "Voor meer informatie over X, bekijk deze pagina over X." ❌ (Tussenzin)

**💡 INTEGRATIETIP:**
- Zoek een paragraaf waar het onderwerp relevant is
- Schrijf eerst een volledige zin over dat onderwerp
- Vervang een relevant deel van die zin door de link
- De zin moet nog steeds vloeiend lezen met de link erin
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
          // Featured image prompt gebaseerd on content type - ALWAYS IN ENGLISH
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
          
          // Translate topic and category to English for better image generation
          let translatedTopic = topic;
          let translatedCategory = category;
          
          if (language === 'nl' || language === 'NL') {
            const translations: Record<string, string> = {
              'broodrooster': 'toaster',
              'koffiezetapparaat': 'coffee maker',
              'stofzuiger': 'vacuum cleaner',
              'wasmachine': 'washing machine',
              'koelkast': 'refrigerator',
              'magnetron': 'microwave',
              'mixer': 'blender',
              'airfryer': 'air fryer',
              'muziek': 'music',
              'piano': 'piano',
              'gitaar': 'guitar',
              'yoga': 'yoga',
              'fitness': 'fitness',
              'sport': 'sports',
              'beste': 'best',
              'top': 'top',
              'review': 'review',
              'vergelijking': 'comparison',
              'gids': 'guide',
            };
            
            Object.entries(translations).forEach(([dutch, english]) => {
              const regex = new RegExp(dutch, 'gi');
              translatedTopic = translatedTopic.replace(regex, english);
              translatedCategory = translatedCategory.replace(regex, english);
            });
          }
          
          // 🎯 Add domain context for better featured image generation
          let featuredDomainContext = '';
          const featuredTopicLower = (contentType === 'blog' ? translatedTopic : translatedCategory).toLowerCase();
          
          if (featuredTopicLower.includes('music') || featuredTopicLower.includes('piano') || 
              featuredTopicLower.includes('guitar') || featuredTopicLower.includes('keyboard') || 
              featuredTopicLower.includes('lesson') || featuredTopicLower.includes('trial')) {
            featuredDomainContext = 'musical instrument, music lesson, musical education, ';
          } else if (featuredTopicLower.includes('sport') || featuredTopicLower.includes('fitness') || 
                     featuredTopicLower.includes('training') || featuredTopicLower.includes('exercise')) {
            featuredDomainContext = 'sports activity, fitness, physical exercise, ';
          } else if (featuredTopicLower.includes('recipe') || featuredTopicLower.includes('cooking') || 
                     featuredTopicLower.includes('food') || featuredTopicLower.includes('dish')) {
            featuredDomainContext = 'food, cooking, culinary, restaurant dish, ';
          } else if (featuredTopicLower.includes('computer') || featuredTopicLower.includes('software') || 
                     featuredTopicLower.includes('app') || featuredTopicLower.includes('website')) {
            featuredDomainContext = 'technology, digital, computer, software, ';
          }
          
          if (contentType === 'blog') {
            featuredPrompt = `${featuredDomainContext}Professional high-quality featured hero image for article about: ${translatedTopic}.
${stylePrompt}, photorealistic, modern editorial style, sharp focus, studio lighting, professional photography.
Wide shot, dynamic composition, vibrant colors, trending on Unsplash, magazine cover quality.
NO TEXT, NO WATERMARKS, NO LOGOS, NO WORDS.
Style: editorial magazine photography, ultra detailed, 8K resolution.`;
          } else if (contentType === 'product-review') {
            featuredPrompt = `${featuredDomainContext}Professional high-quality featured image for product review: ${translatedCategory}.
${stylePrompt}, show products clearly, comparison layout, professional product photography.
Clean composition, excellent lighting, commercial photography style, sharp details.
NO TEXT, NO WATERMARKS, NO LOGOS, NO WORDS.
Style: professional product photography, ultra detailed, 8K resolution.`;
          } else if (contentType === 'top-list') {
            const productCount = products.length;
            featuredPrompt = `${featuredDomainContext}Professional high-quality featured image for top ${productCount} ranking list: ${translatedCategory}.
${stylePrompt}, multiple products arranged attractively, ranking/comparison concept.
Professional product photography, clean layout, vibrant colors, editorial style.
NO TEXT, NO WATERMARKS, NO LOGOS, NO WORDS.
Style: editorial product photography, ultra detailed, 8K resolution.`;
          }
          
          console.log(`   - Featured image prompt: "${featuredPrompt}"`);
          console.log(`   - Model: stable-diffusion-v35-large (high quality: $0.037 - 26% goedkoper!)`);
          console.log(`   - Size: 1024x768 (landscape format)`);
          
          const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
            },
            body: JSON.stringify({
              model: 'stable-diffusion-v35-large',
              prompt: featuredPrompt,
              n: 1,
              width: 1024,
              height: 768,
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
        trackUsage: {
          clientId: user!.id,
          projectId: projectId,
          feature: 'blog_generator_research',
        },
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
    
    // Map articleStyle naar specificContentType
    let specificContentType = '';
    if (articleStyle) {
      // Gebruik expliciet ingestelde article style van frontend
      const styleMap: Record<string, string> = {
        'informatief': 'informatief',
        'lijstje': 'listicle',
        'howto': 'howto',
        'review-enkel': 'single-review',
        'beste-lijst': 'product-list',
        'vergelijking': 'comparison',
        'nieuws': 'news',
        'gids': 'guide',
        'mening': 'opinion'
      };
      specificContentType = styleMap[articleStyle] || '';
    }
    
    // Fallback: detecteer van topic als geen articleStyle is opgegeven
    if (!specificContentType && topic) {
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
      } else if (specificContentType === 'single-review') {
        contentTypeInstructions = `
**PRODUCT REVIEW FORMAT (ENKEL PRODUCT):**
- Titel: "[Product naam] Review: Is het de aankoop waard?"
- Structuur:
  * Intro: Kort overzicht van het product
  * <h2>Wat is [Product naam]?</h2> - Basis informatie
  * <h2>Voor- en nadelen</h2> - Eerlijke balans
  * <h2>Belangrijkste eigenschappen</h2> - Key features
  * <h2>Prijs-kwaliteit verhouding</h2> - Is het de prijs waard?
  * <h2>Alternatieven</h2> - Vergelijkbare producten
  * Conclusie: Eindoordeel en aanbeveling
- Eerlijk en gebalanceerd
- Gebruik concrete details en specificaties
- Persoonlijke ervaring waar mogelijk
`;
      } else if (specificContentType === 'product-list') {
        contentTypeInstructions = `
**BESTE PRODUCTEN LIJST FORMAT:**
- Titel: "Top [X] beste [producten] van ${new Date().getFullYear()}"
- Structuur:
  * Intro: Waarom deze lijst, selectiecriteria
  * <h2>#1. [Product naam] - Beste keuze overall</h2>
    - Voor- en nadelen
    - Waarom dit product #1 is
    - {{PRODUCT_BOX_0_PRODUCT_BOX}} (gebruik placeholders!)
  * <h2>#2. [Product naam] - Beste voor budget</h2>
    - etc.
  * <h2>Koopgids: Waar op te letten</h2> - Aankooptips
  * Conclusie: Samenvatting en aanbeveling
- Rangschik producten logisch (best overall, best budget, etc.)
- Gebruik product placeholders voor elk product
- Wees specifiek over voor- en nadelen
`;
      } else if (specificContentType === 'comparison') {
        contentTypeInstructions = `
**VERGELIJKING FORMAT:**
- Titel: "[Product A] vs [Product B]: Welke is beter?"
- Structuur:
  * Intro: Waarom deze vergelijking relevant is
  * <h2>[Product A] overzicht</h2> - Belangrijkste features
  * <h2>[Product B] overzicht</h2> - Belangrijkste features
  * <h2>Prijs vergelijking</h2> - Kosten analyse
  * <h2>Features vergelijking</h2> - Side-by-side
  * <h2>Voor- en nadelen</h2> - Van beide producten
  * <h2>Welke moet je kiezen?</h2> - Aanbeveling per use case
  * Conclusie: Eindoordeel
- Gebruik tabellen voor vergelijkingen waar mogelijk
- Objectief en gebalanceerd
- Eindoordeel gebaseerd op use cases
`;
      } else if (specificContentType === 'news') {
        contentTypeInstructions = `
**NIEUWS ARTIKEL FORMAT:**
- Titel: Pakkende nieuwskop met actualiteit
- Structuur:
  * Lead: Meest belangrijke info in eerste alinea (wie, wat, waar, wanneer)
  * <h2>De details</h2> - Uitgebreide context
  * <h2>Wat betekent dit?</h2> - Analyse en impact
  * <h2>Reacties en meningen</h2> - Verschillende perspectieven
  * <h2>Wat kunnen we verwachten?</h2> - Toekomst perspectief
  * Conclusie: Samenvatting en impact
- Actueel en relevant
- Gebruik recent nieuws en bronnen
- Objectief en neutraal in toon
`;
      } else if (specificContentType === 'opinion') {
        contentTypeInstructions = `
**MENING / OPINION FORMAT:**
- Titel: Duidelijk standpunt (bijv. "Waarom [onderwerp] overgewaardeerd is")
- Structuur:
  * Intro: Stel je standpunt meteen
  * <h2>Mijn perspectief</h2> - Leg je mening uit
  * <h2>Waarom anderen het oneens zijn</h2> - Andere standpunten
  * <h2>Mijn argumenten</h2> - Onderbouw je mening
  * <h2>Tegenwerpingen</h2> - Beantwoord kritiek
  * Conclusie: Herhaal standpunt en call to action
- Persoonlijk en overtuigend
- Gebruik 'ik' vorm
- Onderbouw met feiten maar geef persoonlijke interpretatie
- Wees niet bang voor een sterke mening
`;
      } else if (specificContentType === 'informatief') {
        contentTypeInstructions = `
**INFORMATIEF ARTIKEL FORMAT:**
- Uitgebreide, objectieve informatie over een onderwerp
- Structuur:
  * Intro: Wat behandelt dit artikel
  * Hoofdsecties met relevante h2/h3 kopjes
  * Conclusie: Samenvatting van belangrijkste punten
- Educatief en informatief
- Objectieve toon
- Goed onderbouwd met feiten
`;
      }
      
      // 🚨 PRODUCT & AFFILIATE LINK INSTRUCTIONS EERST - MEEST KRITIEK!
      let productInstructionsBlock = '';
      
      // Add affiliate links instructions
      let affiliateLinkInstructions = '';
      if (affiliateLinks && affiliateLinks.length > 0) {
        affiliateLinkInstructions = `\n\n**🔗 AFFILIATE LINKS - CONTEXTUEEL PLAATSEN:**\n`;
        affiliateLinkInstructions += `Je hebt ${affiliateLinks.length} affiliate link(s) die je CONTEXTUEEL in de tekst moet plaatsen:\n\n`;
        
        affiliateLinks.forEach((link: any, index: number) => {
          const linkTitle = link.title || link.anchorText || 'Bekijk meer';
          const linkUrl = link.url || '#';
          affiliateLinkInstructions += `- {{AFFILIATE_LINK_${index}}} → "${linkTitle}"\n`;
        });
        
        affiliateLinkInstructions += `\n**BELANGRIJK:**\n`;
        affiliateLinkInstructions += `- Plaats deze links INLINE in de tekst waar het relevant is\n`;
        affiliateLinkInstructions += `- Gebruik natuurlijke zinnen, bijvoorbeeld: "Voor meer informatie over X, bekijk {{AFFILIATE_LINK_0}}"\n`;
        affiliateLinkInstructions += `- Of: "Je kunt meer lezen over Y via {{AFFILIATE_LINK_1}}"\n`;
        affiliateLinkInstructions += `- NIET als aparte lijst onderaan, maar verwerkt in de tekst\n`;
        affiliateLinkInstructions += `- Zorg dat elke link minimaal 1x wordt gebruikt\n\n`;
      }
      
      if (products && products.length > 0) {
        productInstructionsBlock = `
🚨🚨🚨 KRITIEKE REGEL #1 - LEES DIT EERST! 🚨🚨🚨

JE MOET PRODUCTBOXEN EN CTA BOXES TOEVOEGEN MET PLACEHOLDER CODES - NOOIT MET MARKDOWN!

✅ CORRECT VOORBEELD (PRODUCT BOX):
Yoga met gewichten biedt extra uitdaging.

{{PRODUCT_BOX_0_PRODUCT_BOX}}

De gewichten zorgen voor meer weerstand.

✅ CORRECT VOORBEELD (CTA BOX):
Wil je direct beginnen met content marketing?

{{PRODUCT_BOX_0_CTA_BOX}}

Deze tools helpen je op weg.

❌ FOUT VOORBEELD (NOOIT DOEN):
**✔ Top Product**
## **Tunturi Dumbbell set**
★★★★☆ **4.7** **Prijs** **€14.99**

❌ FOUT VOORBEELD (NOOIT DOEN):
**🎯 Start vandaag nog!**
[Bekijk de beste opties →]

WAAROM? Omdat de placeholder codes worden AUTOMATISCH vervangen door mooie HTML met:
- Correcte emoji's (🏆, ⭐, 🛒, 🎯)
- Styling en kleuren
- Product afbeeldingen van Bol.com
- Werkende knoppen met hover effecten
- Professionele CTA boxes met gradient achtergronden

ALS JE ZELF MARKDOWN SCHRIJFT, WORDEN DE PRODUCTEN EN CTA'S NIET GOED WEERGEGEVEN!

BESCHIKBARE PLACEHOLDER CODES:
${products.map((p: any, i: number) => {
  let displayCode = 'TEXT_LINK'; // Default
  if (linkDisplayType === 'product-box') displayCode = 'PRODUCT_BOX';
  else if (linkDisplayType === 'cta-box') displayCode = 'CTA_BOX';
  else if (linkDisplayType === 'product-grid') displayCode = 'PRODUCT_GRID';
  else if (linkDisplayType === 'comparison-table') displayCode = 'COMPARISON_TABLE';
  return `{{PRODUCT_BOX_${i}_${displayCode}}} - ${p.name}`;
}).join('\n')}

WANNEER GEBRUIK JE WELKE?
- {{PRODUCT_BOX_X_TEXT_LINK}} = Simpele tekstlink in de lopende tekst
- {{PRODUCT_BOX_X_PRODUCT_BOX}} = Uitgelichte product box met afbeelding, prijs, rating
- {{PRODUCT_BOX_X_CTA_BOX}} = Call-to-Action box voor belangrijke punten in het artikel
- {{PRODUCT_BOX_X_PRODUCT_GRID}} = Grid met meerdere producten naast elkaar
- {{PRODUCT_BOX_X_COMPARISON_TABLE}} = Vergelijkingstabel voor meerdere producten

⚠️ BELANGRIJK: Als de gebruiker SPECIFIEK vraagt om "een CTA" of "call to action" toe te voegen:
- Gebruik ALTIJD de {{PRODUCT_BOX_X_CTA_BOX}} placeholder!
- Plaats deze op een logische plek in het artikel waar je de lezer wilt activeren
- Voeg een korte intro zin toe VOOR de placeholder (bijvoorbeeld: "Klaar om te starten?")
- Voeg een korte follow-up zin toe NA de placeholder

GEBRUIK DEZE CODES IN JE ARTIKEL!

`;
      }
      
      writingPrompt = `Je bent een expert SEO content writer die artikelen schrijft die 100% menselijk scoren in Originality AI.

${productInstructionsBlock}
${affiliateLinkInstructions}

${contentTypeInstructions}

**ONDERWERP:** ${topic}

**RESEARCH RESULTATEN:**
${researchResults}

${outline && outline.length > 0 ? `
**📋 VERPLICHTE OUTLINE - VOLG DEZE STRUCTUUR EXACT:**
${outline.map((section: any, index: number) => `
${index + 1}. <h2>${section.heading}</h2>
${section.subheadings && section.subheadings.length > 0 ? section.subheadings.map((sub: string) => `   - <h3>${sub}</h3>`).join('\n') : ''}
`).join('\n')}

**BELANGRIJK:** Volg deze outline EXACT. Gebruik deze headings in deze volgorde. Je mag extra paragrafen toevoegen, maar verander de outline structuur NIET.
` : ''}

**ARTIKEL STRUCTUUR (VERPLICHT):**
- 1 <h1> titel: SEO geoptimaliseerd, kort en pakkend (schrijf in normale zinsvorm, NIET Elke Woord Met Hoofdletter)
- Intro: 3-4 zinnen met variërende lengtes, noem het keyword
- <h2> en/of <h3> titels: elk met een menselijke, doorlopende alinea (schrijf in normale zinsvorm, NIET Elke Woord Met Hoofdletter)
- Afsluitende alinea: VERPLICHT 4-6 zinnen die het artikel netjes afronden
- ❌ NOOIT twee headings direct achter elkaar - ALTIJD een paragraaf ertussen

**KRITIEKE AFSLUITING REGELS:**
✅ Het artikel MOET een volledige, natuurlijke afsluiting hebben met 4-6 zinnen
✅ De afsluitende alinea moet:
   - Het belangrijkste punt herhalen
   - Een praktische tip of actie geven
   - De lezer motiveren om te beginnen
   - NIET eindigen met "Succes!" of "Veel plezier!" (te afgezaagd)
   - WEL eindigen met een natuurlijke, motiverende zin
❌ NOOIT abrupt stoppen halverwege een sectie
❌ NOOIT stoppen zonder afsluitende alinea
❌ NOOIT eindigen met een vraag of open einde

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

**OPMAAK ELEMENTEN:**
✅ Voeg minimaal 2-3 opsommingslijsten toe met <ul><li> voor leesbaarheid (VERPLICHT)
${includeQuotes ? '✅ Voeg waar relevant blockquotes toe met <blockquote> voor belangrijke citaten of tips' : '❌ Geen blockquotes gebruiken'}
✅ Gebruik <strong> voor belangrijke punten (max 2-3 per paragraaf) (VERPLICHT)
✅ Gebruik <em> voor subtiele nadruk waar passend
${includeTables ? '✅ Voeg waar mogelijk een tabel toe met <table> voor data/vergelijkingen (optioneel, alleen als het echt waarde toevoegt)' : '❌ Geen tabellen gebruiken'}

**VERBODEN ELEMENTEN:**
❌ Geen vaktermen of clichés
❌ Geen formele/stijve taal
❌ Geen overmatig gebruik van bijvoeglijke naamwoorden
❌ Keyword max 1 keer in headings
❌ Niet meer dan één keyword per alinea
❌ Geen voorbeelden van mensen (geen "Stel je voor dat Jan...")
❌ NOOIT headings zoals "Conclusie", "Afsluiting", "Call to Action", "Samenvatting"

**🚫 PRODUCT & CTA MARKDOWN VERBODEN:**
Als je producten of CTA's moet toevoegen (zie product instructies hierboven):
❌ NOOIT **🏆 TOP AANBEVELING** schrijven - gebruik ALLEEN placeholder {{PRODUCT_BOX_X_CTA_BOX}}
❌ NOOIT **🎯 Start vandaag!** of **📣 Klaar om te beginnen?** - gebruik ALLEEN placeholder {{PRODUCT_BOX_X_CTA_BOX}}
❌ NOOIT ### Product naam - gebruik ALLEEN placeholder {{PRODUCT_BOX_X_PRODUCT_BOX}}
❌ NOOIT zelf emoji's bij producten/CTA's (🏆, ⭐, 🛒, 🎯, 📣) - deze zitten al in de HTML
❌ NOOIT **bold tekst** voor producten of CTA's - gebruik ALLEEN placeholders
❌ NOOIT markdown buttons zoals [Bekijk product →] - gebruik ALLEEN placeholders
❌ NOOIT markdown formatting voor product of CTA presentatie
✅ WEL CORRECT: gebruik de {{PRODUCT_BOX_X_TYPE}} placeholders zoals geïnstrueerd
✅ De placeholders worden automatisch vervangen door mooie HTML met styling
✅ Als je een CTA wilt maken: gebruik {{PRODUCT_BOX_X_CTA_BOX}} en voeg een simpele intro/outro zin toe

${getBannedWordsInstructions()}

**SEO EISEN:**
- **EXACT WOORDAANTAL: ${wordCount} woorden (acceptabel bereik: ${Math.floor(wordCount * 0.9)}-${Math.ceil(wordCount * 1.1)} woorden)**
- **KRITIEK: Het artikel MOET tussen ${Math.floor(wordCount * 0.9)} en ${Math.ceil(wordCount * 1.1)} woorden zijn - niet korter, niet veel langer!**
${toneInstructionsText}
- Keywords natuurlijk verwerken (max 1x per alinea)
${keywordStr ? `- Focus keywords: ${keywordStr}` : ''}
${seoOptimized ? '- SEO geoptimaliseerd: keywords in headings en natuurlijk in tekst' : ''}
${internalLinksContext || ''}
${affiliateLinksContext}
${projectContext ? `- Verwijs subtiel naar: ${projectContext}` : ''}

${includeDirectAnswer ? `
🎯 **DIRECT ANTWOORD (VERPLICHT):**
Voeg direct na de introductie een "Direct Antwoord" toe als DIKGEDRUKTE TEKST (GEEN box):

<p><strong style="font-size: 1.1em; color: #ff6b35;">📌 Direct Antwoord: </strong><strong>Beknopt antwoord op de hoofdvraag in 2-3 zinnen met de belangrijkste conclusie of oplossing.</strong></p>

BELANGRIJK:
- GEEN div met background of border - alleen dikgedrukte tekst
- Gebruik <strong> tags voor nadruk
- Begin met emoji 📌 voor visuele aandacht
- Maximaal 2-3 zinnen, super beknopt en to-the-point
` : ''}

${includeFAQ ? `
❓ **FAQ SECTIE (VERPLICHT):**
Voeg aan het einde van het artikel (voor de conclusie) een FAQ sectie toe met 5-7 veelgestelde vragen:

<div class="faq-section" style="margin: 40px 0;">
  <h2>Veelgestelde vragen</h2>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #ff6b35;">
    <h3 style="color: #ff6b35; margin-top: 0;">❓ Vraag 1</h3>
    <p style="color: #333; margin-bottom: 0;">Antwoord op vraag 1 in 2-4 zinnen.</p>
  </div>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #ff6b35;">
    <h3 style="color: #ff6b35; margin-top: 0;">❓ Vraag 2</h3>
    <p style="color: #333; margin-bottom: 0;">Antwoord op vraag 2 in 2-4 zinnen.</p>
  </div>
  
  [... 3-5 meer FAQ items met EXACT dezelfde styling ...]
</div>

KRITIEKE STYLING REGELS:
- ALTIJD background: #f8f9fa (lichtgrijs, GEEN wit)
- ALTIJD border-left: 3px solid #ff6b35 (oranje accent)
- ALTIJD color: #333 voor de antwoord tekst (GEEN wit, altijd donkergrijs)
- ALTIJD color: #ff6b35 voor de vraag titel (oranje)
- Margin en padding zoals in het voorbeeld

Elke vraag moet:
- Relevant zijn voor het onderwerp
- Een veelgestelde vraag zijn die lezers hebben
- Een helder, beknopt antwoord krijgen (2-4 zinnen)
- Focus keyword of gerelateerde keywords bevatten waar mogelijk
- DEZELFDE styling hebben als het voorbeeld
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
${imageCount > 0 ? `- Voeg PRECIES ${imageCount} ${imageCount === 1 ? 'afbeelding' : 'afbeeldingen'} toe op logische plekken:
  ${Array.from({length: imageCount}, (_, i) => `* IMAGE_PLACEHOLDER_${i + 1}: ${i === 0 ? 'Na intro sectie' : i === 1 ? 'Halverwege artikel' : 'Voor conclusie'}`).join('\n  ')}
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="DETAILED_IMAGE_DESCRIPTION" />
- ⚠️ BELANGRIJK: Geef bij alt text een GEDETAILLEERDE beschrijving van wat de afbeelding moet tonen:
  * Beschrijf de specifieke visuele inhoud die past bij die sectie
  * Gebruik 8-15 woorden in de alt text
  * Geef concrete, specifieke details over wat er op de afbeelding moet staan
  * Voorbeeld: "Moderne yoga studio met groene planten en natuurlijk licht door grote ramen"
  * NIET algemeen zoals "yoga afbeelding" maar SPECIFIEK zoals "vrouw doet downward dog pose op paarse mat in lichte kamer"
- NIET MEER DAN ${imageCount} ${imageCount === 1 ? 'AFBEELDING' : 'AFBEELDINGEN'}` : '- GEEN AFBEELDINGEN TOEVOEGEN (imageCount = 0)'}

**HTML FORMATTING:**
- Gebruik alleen: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <img>, <a>${includeQuotes ? ', <blockquote>' : ''}${includeTables ? ', <table>' : ''}
- Gebruik de research resultaten voor actuele feiten en statistieken
- Voeg minimaal 2-3 opsommingslijsten toe met <ul><li> voor leesbaarheid
- Gebruik <strong> spaarzaam voor belangrijke woorden (max 2-3 per paragraaf)
${includeQuotes ? '- Voeg waar relevant <blockquote> toe voor belangrijke tips of citaten' : ''}
${includeTables ? '- Voeg waar mogelijk een <table> toe voor data of vergelijkingen' : ''}

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
✅ Voor- en nadelen in <ul><li> lijsten (VERPLICHT)
${includeTables ? '✅ Product specificaties in <table> waar relevant (optioneel)' : '❌ Geen tabellen gebruiken'}
${includeQuotes ? '✅ <blockquote> voor belangrijke tips of waarschuwingen' : '❌ Geen blockquotes gebruiken'}
✅ <strong> voor belangrijke punten (max 2-3 per paragraaf) (VERPLICHT)
✅ Product links met natuurlijke ankertekst

**VERBODEN:**
❌ Geen AI-achtige formuleringen
❌ Geen "perfect" of overdreven superlatieve
❌ Geen geforceerde keywords
❌ Geen "Conclusie" of "Samenvatting" headings

${getBannedWordsInstructions()}

**SEO EISEN:**
- **EXACT WOORDAANTAL: ${wordCount} woorden (acceptabel bereik: ${Math.floor(wordCount * 0.9)}-${Math.ceil(wordCount * 1.1)} woorden)**
- **KRITIEK: Het artikel MOET tussen ${Math.floor(wordCount * 0.9)} en ${Math.ceil(wordCount * 1.1)} woorden zijn - niet korter, niet veel langer!**
${toneInstructionsText}
- Keywords natuurlijk verwerken
- Focus op ${category}
${seoOptimized ? '- SEO geoptimaliseerd: keywords in headings en natuurlijk in tekst' : ''}
${internalLinksContext || ''}
${affiliateLinksContext}

${includeDirectAnswer ? `
🎯 **DIRECT ANTWOORD (VERPLICHT):**
Voeg direct na de introductie een "Direct Antwoord" toe als DIKGEDRUKTE TEKST (GEEN box):

<p><strong style="font-size: 1.1em; color: #ff6b35;">📌 Direct Antwoord: </strong><strong>Welk product is het beste? Beknopt antwoord in 2-3 zinnen met de beste keuze en waarom.</strong></p>

BELANGRIJK:
- GEEN div met background of border - alleen dikgedrukte tekst
- Gebruik <strong> tags voor nadruk
- Begin met emoji 📌 voor visuele aandacht
- Maximaal 2-3 zinnen, super beknopt en to-the-point
` : ''}

${includeFAQ ? `
❓ **FAQ SECTIE (VERPLICHT):**
Voeg aan het einde van het artikel (voor de conclusie) een FAQ sectie toe met 5-7 veelgestelde vragen:

<div class="faq-section" style="margin: 40px 0;">
  <h2>Veelgestelde vragen</h2>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #ff6b35;">
    <h3 style="color: #ff6b35; margin-top: 0;">❓ Vraag 1</h3>
    <p style="color: #333; margin-bottom: 0;">Antwoord op vraag 1 in 2-4 zinnen.</p>
  </div>
  
  <div class="faq-item" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 3px solid #ff6b35;">
    <h3 style="color: #ff6b35; margin-top: 0;">❓ Vraag 2</h3>
    <p style="color: #333; margin-bottom: 0;">Antwoord op vraag 2 in 2-4 zinnen.</p>
  </div>
  
  [... 3-5 meer FAQ items met EXACT dezelfde styling ...]
</div>

KRITIEKE STYLING REGELS:
- ALTIJD background: #f8f9fa (lichtgrijs, GEEN wit)
- ALTIJD border-left: 3px solid #ff6b35 (oranje accent)
- ALTIJD color: #333 voor de antwoord tekst (GEEN wit, altijd donkergrijs)
- ALTIJD color: #ff6b35 voor de vraag titel (oranje)
- Margin en padding zoals in het voorbeeld
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
${imageCount > 0 ? `- Voeg PRECIES ${imageCount} ${imageCount === 1 ? 'afbeelding' : 'afbeeldingen'} toe:
  ${Array.from({length: imageCount}, (_, i) => `* IMAGE_PLACEHOLDER_${i + 1}: ${i === 0 ? 'Plaats bij het eerste/belangrijkste product' : 'Plaats bij een ander belangrijk product of sectie'}`).join('\n  ')}
- Format: <img src="IMAGE_PLACEHOLDER_X" alt="Gedetailleerde beschrijving" />
- NIET MEER DAN ${imageCount} ${imageCount === 1 ? 'AFBEELDING' : 'AFBEELDINGEN'}` : '- GEEN AFBEELDINGEN TOEVOEGEN (imageCount = 0)'}

**HTML FORMATTING:**
- Gebruik alleen: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <img>, <a>${includeQuotes ? ', <blockquote>' : ''}${includeTables ? ', <table>' : ''}
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
      '✍️ AI analyseert onderwerp...',
      '📝 Structuur wordt bepaald...',
      '✍️ Eerste paragrafen schrijven...',
      '📊 Keywords worden geïntegreerd...',
      '🎨 Content wordt verfijnd...',
      '✨ Bijna klaar met schrijven...',
    ];
    let heartbeatIndex = 0;
    let heartbeatProgress = 57;
    let heartbeatStopped = false;
    
    const heartbeatInterval = setInterval(() => {
      if (heartbeatStopped || streamClosed) {
        // Clear interval immediately if stopped or stream closed
        clearInterval(heartbeatInterval);
        return;
      }
      
      // Progress from 57% to 69% max (leaves 30% room for image generation, internal links, and final processing)
      heartbeatProgress = Math.min(heartbeatProgress + 1.0, 69);
      const elapsed = Math.floor((Date.now() - writingStartTime) / 1000);
      const message = heartbeatMessages[heartbeatIndex % heartbeatMessages.length];
      sendStreamStatus(`${message} (${elapsed}s)`, Math.floor(heartbeatProgress));
      heartbeatIndex++;
      
      // Don't auto-stop - let the AI finish naturally
      // The heartbeat will be stopped explicitly after AI response is received
    }, 10000); // Every 10 seconds
    
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
        trackUsage: {
          clientId: user!.id,
          projectId: projectId,
          feature: 'blog_generator_writing',
        },
      });
      
      // CRITICAL: Stop heartbeat immediately
      heartbeatStopped = true;
      clearInterval(heartbeatInterval);
      console.log('⏹️ [BlogGen] Heartbeat stopped after AI response');
      
      const writingDuration = ((Date.now() - writingStartTime) / 1000).toFixed(1);
      console.log(`✅ Writing response received in ${writingDuration}s`);
      
      // Clear status update - AI generation complete
      sendStreamStatus('✅ Content ontvangen, verwerken...', 70);
      console.log('📊 [BlogGen] Status update sent: 70%');
      
    } catch (writingError: any) {
      // CRITICAL: Ensure heartbeat is fully stopped on error too
      heartbeatStopped = true;
      clearInterval(heartbeatInterval);
      console.log('⏹️ [BlogGen] Heartbeat stopped due to error');
      
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
      
      // 🛠️ MARKDOWN CLEANUP: Remove markdown product formatting if AI ignored instructions
      if (products && products.length > 0) {
        console.log(`🛠️ Checking for markdown product formatting...`);
        
        // Check if AI used markdown instead of placeholders
        const hasMarkdownProducts = /\*\*[✔✓🏆⭐]\s*(TOP|BESTSELLER|Top Product)/i.test(blogContent);
        
        if (hasMarkdownProducts) {
          console.warn('⚠️ AI used markdown for products instead of placeholders!');
          console.log('🔧 Attempting to clean up markdown and insert correct HTML...');
          
          // Remove markdown product sections (they're incorrectly formatted anyway)
          // Pattern: Markdown headings with emoji, prices, ratings, etc.
          blogContent = blogContent.replace(/\*\*[✔✓🏆⭐â˜…ðŸ†â­]\s*[A-Z\s]+\*\*\s*##?\s*\*\*[^\n]+\*\*[^<]*?(?=<h[23]|$)/gi, '');
          
          // Remove orphaned emoji and markdown
          blogContent = blogContent.replace(/\*\*[â˜…★⭐]+[^\*]*\*\*/g, '');
          blogContent = blogContent.replace(/â˜…|â­|â‚¬|ðŸ†|ðŸ›'/g, ''); // Remove broken emoji encoding
          
          console.log('✅ Cleaned up markdown product formatting');
          
          // Now insert product boxes at logical positions
          console.log('🎨 Inserting product HTML boxes...');
          
          const h2Sections = blogContent.split(/(<h2[^>]*>.*?<\/h2>)/);
          const sectionsPerProduct = Math.max(2, Math.floor(h2Sections.length / (products.length + 1)));
          
          // 🤖 AI CONTENT GENEREREN - BESCHRIJVING + VOOR/NADELEN
          console.log('🤖 Genereer unieke AI content voor alle producten...');
          for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            console.log(`   📝 Product ${i + 1}/${products.length}: "${product.name}"`);
            
            try {
              const contentPrompt = `Schrijf in het ${language === 'nl' ? 'Nederlands' : language === 'en' ? 'Engels' : language === 'fr' ? 'Frans' : language === 'de' ? 'Duits' : 'Spaans'} voor dit product:

**Product:** ${product.name}
${product.price ? `**Prijs:** ${product.price}` : ''}

Geef terug in JSON formaat:
{
  "description": "korte verkopende beschrijving (max 2 zinnen, 30-40 woorden)",
  "pros": ["pluspunt 1", "pluspunt 2", "pluspunt 3"],
  "cons": ["minpunt 1", "minpunt 2"]
}

Vereisten:
- Beschrijving: aantrekkelijk, specifiek, natuurlijk
- 3-4 concrete pluspunten (korte zinnen, geen AI-clichés)
- 2-3 eerlijke minpunten (kleine nadelen, niet overdreven negatief)
- Gebruik actieve taal en specifieke details
- Wees realistisch en geloofwaardig`;

              const contentResponse = await chatCompletion({
                model: 'claude-sonnet-4.5',
                messages: [
                  {
                    role: 'system',
                    content: 'Je bent een expert productrecensent. Schrijf natuurlijke, unieke beschrijvingen met eerlijke voor- en nadelen. Retourneer ALLEEN valide JSON zonder extra tekst.'
                  },
                  {
                    role: 'user',
                    content: contentPrompt
                  }
                ],
                temperature: 0.8,
                max_tokens: 300,
                trackUsage: {
                  clientId: user!.id,
                  projectId: projectId,
                  feature: 'blog_generator_product_content',
                },
              });

              const generatedContent = contentResponse.choices?.[0]?.message?.content?.trim() || '';
              if (generatedContent) {
                try {
                  // Parse JSON response
                  const contentData = JSON.parse(generatedContent);
                  
                  // ✅ OVERSCHRIJF met AI-gegenereerde content
                  product.description = contentData.description || `${product.name} - Een kwalitatief product tegen een scherpe prijs.`;
                  product.pros = contentData.pros || [];
                  product.cons = contentData.cons || [];
                  
                  console.log(`      ✅ Beschrijving: "${product.description.substring(0, 50)}..."`);
                  console.log(`      ✅ Pluspunten: ${product.pros.length}`);
                  console.log(`      ✅ Minpunten: ${product.cons.length}`);
                } catch (parseError) {
                  console.error(`      ❌ JSON parse fout:`, parseError);
                  // Fallback
                  product.description = `${product.name} - Een kwalitatief product tegen een scherpe prijs.`;
                  product.pros = [];
                  product.cons = [];
                }
              } else {
                // Fallback
                product.description = `${product.name} - Een kwalitatief product tegen een scherpe prijs.`;
                product.pros = [];
                product.cons = [];
                console.log(`      ⚠️ Fallback content gebruikt`);
              }
            } catch (error) {
              console.error(`      ❌ Fout bij genereren content:`, error);
              // Fallback
              product.description = `${product.name} - Een kwalitatief product tegen een scherpe prijs.`;
              product.pros = [];
              product.cons = [];
            }
          }
          console.log('✅ Alle unieke productcontent gegenereerd');
          
          products.forEach((product: any, index: number) => {
            const insertPosition = Math.min(
              (index + 1) * sectionsPerProduct * 2,
              h2Sections.length - 1
            );
            
            // Generate HTML directly
            // ✅ PRODUCT AFBEELDING OPHALEN - MEERDERE VELDEN CONTROLEREN
            const imageUrl = product.imageUrl || product.image || '';
            console.log(`   📦 Product ${index + 1}: "${product.name}"`);
            console.log(`      - product.imageUrl: ${product.imageUrl || 'NIET BESCHIKBAAR'}`);
            console.log(`      - product.image: ${product.image || 'NIET BESCHIKBAAR'}`);
            console.log(`      - Gebruikt: ${imageUrl || '❌ GEEN AFBEELDING'}`);
            
            if (!imageUrl) {
              console.error(`❌ WAARSCHUWING: Product "${product.name}" heeft GEEN afbeelding!`);
              console.error(`   - Volledige product data:`, JSON.stringify(product, null, 2));
            }
            
            const productData = {
              id: product.url,
              title: product.name,
              price: product.price,
              rating: product.rating ? parseFloat(product.rating.split('/')[0]) : undefined,
              reviewCount: 0,
              image: imageUrl, // ✅ Dit wordt gebruikt door generateAffiliateDisplayHTML
              affiliateUrl: product.url,
              description: product.description, // ✅ Nu altijd aanwezig (AI-gegenereerd)
              pros: product.pros || [], // ✅ AI-gegenereerde pluspunten
              cons: product.cons || [], // ✅ AI-gegenereerde minpunten
              category: undefined,
            };
            
            const productHTML = generateAffiliateDisplayHTML(productData, linkDisplayType as DisplayType);
            
            if (insertPosition > 0 && insertPosition < h2Sections.length) {
              h2Sections.splice(insertPosition, 0, '\n\n' + productHTML + '\n\n');
              console.log(`   ✅ Inserted product ${index + 1} at position ${insertPosition}`);
            }
          });
          
          blogContent = h2Sections.join('');
          console.log('✅ All product boxes inserted via fallback mechanism');
        } else {
          // AI correctly used placeholders - process them normally
          console.log(`🎨 AI correctly used placeholders - processing normally...`);
          console.log(`   - Display type: ${linkDisplayType}`);
          
          try {
            blogContent = processProductBoxes(
              blogContent,
              products as ProductInfo[],
              linkDisplayType as DisplayType
            );
            console.log('✅ Product boxes successfully integrated');
          } catch (error) {
            console.error('❌ Error processing product boxes:', error);
          }
          
          // Auto-link products (automatically link product mentions)
          if (projectId) {
            try {
              const projectData = await prisma.project.findUnique({
                where: { id: projectId },
                select: {
                  id: true,
                  bolcomEnabled: true,
                  bolcomClientId: true,
                  bolcomClientSecret: true,
                  bolcomAffiliateId: true,
                },
              });
              
              if (projectData?.bolcomEnabled && projectData?.bolcomClientId && projectData?.bolcomClientSecret && projectData?.bolcomAffiliateId) {
                const { autoLinkProducts } = await import('@/lib/auto-link-products');
                
                const autoLinkResult = await autoLinkProducts({
                  projectId: projectData.id,
                  content: blogContent,
                  credentials: {
                    clientId: projectData.bolcomClientId,
                    clientSecret: projectData.bolcomClientSecret,
                    affiliateId: projectData.bolcomAffiliateId,
                  },
                });
                
                blogContent = autoLinkResult.content;
                
                if (autoLinkResult.linksInserted > 0) {
                  console.log(`🔗 Auto-linked ${autoLinkResult.linksInserted} products: ${autoLinkResult.productsLinked.join(', ')}`);
                }
              }
            } catch (error) {
              console.error('❌ Error auto-linking products:', error);
            }
          }
        }
      }
      
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

      // 🛒 STAP 2.5: PRODUCT PLACEHOLDERS VERIFICATION
      // Check if AI used product placeholders, if not, log warning
      if (products && products.length > 0) {
        console.log('🛒 Step 2.5: Verifying product placeholder usage...');
        console.log(`   - Expected ${products.length} products`);
        console.log(`   - Display type: ${linkDisplayType}`);
        
        // Count how many placeholders were actually used
        const placeholderPattern = /\{\{PRODUCT_BOX_\d+_[A-Z_]+\}\}/g;
        const foundPlaceholders = blogContent.match(placeholderPattern) || [];
        
        console.log(`   - Found ${foundPlaceholders.length} placeholders in AI generated content`);
        
        if (foundPlaceholders.length === 0) {
          console.warn('⚠️ WARNING: AI did not use product placeholders!');
          console.warn('   This means product boxes will not be displayed correctly.');
          console.warn('   The AI should use {{PRODUCT_BOX_X_TYPE}} placeholders.');
        } else if (foundPlaceholders.length < products.length) {
          console.warn(`⚠️ WARNING: Only ${foundPlaceholders.length}/${products.length} placeholders found`);
        } else {
          console.log(`✅ All product placeholders correctly used by AI`);
        }
      }

      // STAP 3: Afbeeldingen genereren (als includeImage is enabled)
      if (includeImage && imageCount > 0) {
        sendStreamStatus('🖼️ Afbeeldingen genereren met AI...', 78);
        console.log('🖼️ Step 3: Generating images...');
      
        // Find all [IMAGE-X] or IMAGE_PLACEHOLDER_X patterns in content
        const imagePlaceholderPattern = /\[IMAGE-(\d+)\]|IMAGE_PLACEHOLDER_(\d+)|<img[^>]*src=["']IMAGE_PLACEHOLDER_(\d+)["']/g;
        let placeholderMatch;
        const foundPlaceholders: Set<number> = new Set();
        
        // Extract all unique placeholder numbers
        while ((placeholderMatch = imagePlaceholderPattern.exec(blogContent)) !== null) {
          const placeholderNum = placeholderMatch[1] || placeholderMatch[2] || placeholderMatch[3];
          if (placeholderNum) {
            foundPlaceholders.add(parseInt(placeholderNum));
          }
        }
        
        const placeholderCount = foundPlaceholders.size;
        
        if (placeholderCount > 0) {
          sendStreamStatus(`🖼️ ${placeholderCount} afbeeldingen genereren...`, 80);
          console.log(`✅ Found ${placeholderCount} image placeholders in content`);
          
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
          
          // Sort placeholder numbers for sequential processing
          const sortedPlaceholders = Array.from(foundPlaceholders).sort((a, b) => a - b);
          
          // Generate images for each placeholder
          for (let i = 0; i < sortedPlaceholders.length; i++) {
            const placeholderNum = sortedPlaceholders[i];
            
            try {
              sendStreamStatus(`🖼️ Afbeelding ${i + 1}/${placeholderCount} genereren...`, 80 + (i * 10 / placeholderCount));
              
              // Extract context around the placeholder for better image relevance
              const placeholderPatterns = [
                `[IMAGE-${placeholderNum}]`,
                `IMAGE_PLACEHOLDER_${placeholderNum}`,
                `<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["']`
              ];
              
              let contextStart = -1;
              for (const pattern of placeholderPatterns) {
                const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                const match = regex.exec(blogContent);
                if (match && match.index !== undefined) {
                  contextStart = match.index;
                  break;
                }
              }
              
              if (contextStart === -1) {
                console.warn(`⚠️ Could not find placeholder ${placeholderNum} in content`);
                continue;
              }
              
              // Extract context before and after placeholder
              const contextBefore = blogContent.substring(Math.max(0, contextStart - 600), contextStart);
              const contextAfter = blogContent.substring(contextStart, Math.min(blogContent.length, contextStart + 400));
              
              // Extract relevant context elements
              const headingMatch = contextBefore.match(/<h[12]>([^<]+)<\/h[12]>/);
              const subheadingMatch = contextBefore.match(/<h3>([^<]+)<\/h3>/);
              const paragraphMatches = contextAfter.match(/<p>([^<]+)<\/p>/g) || [];
              
              // Build context prompt
              const contextParts: string[] = [];
              contextParts.push(contentType === 'blog' ? topic : category);
              
              if (headingMatch) {
                contextParts.push(headingMatch[1].trim());
              }
              
              if (subheadingMatch) {
                contextParts.push(subheadingMatch[1].trim());
              }
              
              if (paragraphMatches.length > 0) {
                const para1 = paragraphMatches[0].replace(/<\/?p>/g, '').substring(0, 120).trim();
                contextParts.push(para1);
              }
              
              const contextPrompt = contextParts.join('. ');
              
              // Build image prompt - ALWAYS IN ENGLISH for better AI understanding
              const mainTopic = contentType === 'blog' ? topic : category;
              
              // Translate topic and context to English for image generation
              let translatedTopic = mainTopic;
              let translatedContext = contextPrompt;
              
              if (language === 'nl' || language === 'NL') {
                // Dutch to English translation for common product terms
                const translations: Record<string, string> = {
                  'broodrooster': 'toaster',
                  'koffiezetapparaat': 'coffee maker',
                  'stofzuiger': 'vacuum cleaner',
                  'wasmachine': 'washing machine',
                  'koelkast': 'refrigerator',
                  'magnetron': 'microwave',
                  'mixer': 'blender',
                  'airfryer': 'air fryer',
                  'beste': 'best',
                  'top': 'top',
                  'review': 'review',
                  'vergelijking': 'comparison',
                  'gids': 'guide',
                };
                
                // Replace Dutch words with English equivalents
                Object.entries(translations).forEach(([dutch, english]) => {
                  const regex = new RegExp(dutch, 'gi');
                  translatedTopic = translatedTopic.replace(regex, english);
                  translatedContext = translatedContext.replace(regex, english);
                });
              }
              
              // Define different perspectives for variety (rotate through them)
              const imagePerspectives = [
                'Close-up detailed view, macro photography, shallow depth of field',
                'Wide environmental shot, establishing scene, landscape orientation',
                'Over-the-shoulder perspective, human element, lifestyle photography',
                'Product shot, clean background, commercial photography style',
                'Action scene, dynamic movement, captured moment',
                'Top-down flat lay, organized composition, minimalist style'
              ];
              
              const perspective = imagePerspectives[i % imagePerspectives.length];
              const timestamp = Date.now() + i; // Unique seed per image
              
              const imagePrompt = `Professional high-quality photorealistic image for blog article.

ARTICLE TOPIC: ${translatedTopic}
${keywords && keywords.length > 0 ? `KEYWORDS: ${keywords.join(', ')}` : ''}

CONTEXT: ${translatedContext.substring(0, 250)}

PERSPECTIVE: ${perspective}

STYLE: ${stylePrompt}, editorial magazine photography, ultra detailed, 8K resolution, excellent composition and lighting, vibrant natural colors, modern professional aesthetic.

NO TEXT, NO WATERMARKS, NO LOGOS, NO WORDS.

Unique composition seed #${timestamp}`;

              console.log(`🎨 Generating image ${i + 1}/${placeholderCount}:`);
              console.log(`   - Perspective: ${perspective}`);
              console.log(`   - Context: "${contextPrompt.substring(0, 100)}..."`);
              
              // Generate image with Stable Diffusion 3.5 (26% cheaper + better quality)
              const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
                },
                body: JSON.stringify({
                  model: 'stable-diffusion-v35-large',
                  prompt: imagePrompt,
                  n: 1,
                  width: 1920,
                  height: 1080,
                }),
              });
              
              if (imageResponse.ok) {
                const imageData = await imageResponse.json();
                const imageUrl = imageData.images?.[0]?.url || imageData.data?.[0]?.url;
                
                if (imageUrl) {
                  // Replace ALL variations of this placeholder with actual image
                  const imgTag = `<img src="${imageUrl}" alt="${mainTopic} - afbeelding ${placeholderNum}" loading="lazy" style="width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`;
                  
                  // Replace [IMAGE-X] format
                  blogContent = blogContent.replace(new RegExp(`\\[IMAGE-${placeholderNum}\\]`, 'g'), imgTag);
                  
                  // Replace IMAGE_PLACEHOLDER_X format (not in img tag)
                  blogContent = blogContent.replace(new RegExp(`IMAGE_PLACEHOLDER_${placeholderNum}(?![^<]*>)`, 'g'), imgTag);
                  
                  // Replace <img src="IMAGE_PLACEHOLDER_X" ... /> format
                  blogContent = blogContent.replace(
                    new RegExp(`<img[^>]*src=["']IMAGE_PLACEHOLDER_${placeholderNum}["'][^>]*>`, 'g'),
                    imgTag
                  );
                  
                  console.log(`✅ Image ${i + 1} generated and replaced: ${imageUrl.substring(0, 80)}...`);
                } else {
                  console.error(`❌ Image ${i + 1} - No URL in response:`, imageData);
                }
              } else {
                const errorText = await imageResponse.text();
                console.error(`❌ Image ${i + 1} generation failed (${imageResponse.status}):`, errorText);
                sendStreamStatus(`⚠️ Afbeelding ${i + 1} generatie mislukt, doorgaan...`, 80 + (i * 10 / placeholderCount));
              }
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 1000));
              
            } catch (error) {
              console.error(`❌ Error generating image ${i + 1}:`, error);
              sendStreamStatus(`⚠️ Fout bij genereren afbeelding ${i + 1}, doorgaan...`, 80 + (i * 10 / placeholderCount));
            }
          }
          
          sendStreamStatus('✅ Afbeeldingen succesvol gegenereerd', 90);
          console.log('✅ All images generated');
        } else {
          console.log('⚠️ No image placeholders found in content');
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

1. **SEO Titel** (EXACT 55 tekens - TEL PRECIES!):
   - MOET het focus keyword bevatten (bij voorkeur aan het begin)
   - MOET pakkend en klikwaardig zijn (gebruik power words)
   - Gebruik getallen waar mogelijk ("Top 5", "7 Tips", etc.)
   - Gebruik emotionele triggers ("Beste", "Geheim", "Bewezen", "Ultieme")
   - MOET PRECIES 55 tekens zijn - niet 54, niet 56, maar EXACT 55!
   - Voorbeelden (ALLE exact 55 tekens):
     * "Beste SEO Tips 2024: Rank #1 Google met Deze Tricks" (55✅)
     * "AI Marketing Tools 2024: Top 10 Gratis Opties Review" (55✅)
     * "WordPress Sneller: 7 Bewezen Methodes + Tips [2024]" (55✅)
   
2. **Meta Omschrijving** (EXACT 125-135 tekens - TEL PRECIES!):
   - MOET het focus keyword minimaal 1x bevatten
   - MOET een duidelijke call-to-action bevatten
   - MOET een voordeel/resultaat beloven
   - Gebruik actieve taal en urgentie
   - MOET tussen 125 en 135 tekens zijn - niet langer, niet korter!
   - Voorbeelden (alle 125-135 tekens):
     * "Ontdek de beste SEO tools 2024. Verhoog je rankings gratis. Klik voor complete gids en start direct! ⚡" (125✅)
     * "Leer WordPress optimaliseren in 7 stappen. Verhoog snelheid met 200%. Complete gids + screenshots. Start nu! 🚀" (135✅)
   
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
  "seoTitle": "[PRECIES 55 tekens met focus keyword]",
  "metaDescription": "[PRECIES 125-135 tekens met focus keyword en CTA]",
  "focusKeyword": "[1-4 woorden hoofdkeyword]",
  "extraKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10", "keyword11", "keyword12"],
  "lsiKeywords": ["lsi1", "lsi2", "lsi3", "lsi4", "lsi5", "lsi6", "lsi7", "lsi8", "lsi9", "lsi10", "lsi11", "lsi12", "lsi13", "lsi14", "lsi15", "lsi16", "lsi17", "lsi18", "lsi19", "lsi20", "lsi21", "lsi22", "lsi23", "lsi24", "lsi25"]
}

KRITIEKE REGELS:
- SEO Titel: EXACT 55 tekens - tel ze dubbel na!
- Meta Omschrijving: EXACT 125-135 tekens - tel ze dubbel na!
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
          trackUsage: {
            clientId: user!.id,
            projectId: projectId,
            feature: 'blog_generator_metadata',
          },
        });

        const metadataText = metadataResponse.choices?.[0]?.message?.content || '{}';
        
        // Extract JSON
        try {
          const jsonMatch = metadataText.match(/\{[\s\S]*\}/);
          seoMetadata = JSON.parse(jsonMatch ? jsonMatch[0] : metadataText);
          console.log('✅ SEO metadata generated:', seoMetadata);
          
          // Validate lengths - STRICT requirements
          if (seoMetadata.seoTitle) {
            const titleLength = seoMetadata.seoTitle.length;
            if (titleLength !== 55) {
              console.warn(`⚠️ SEO Title length is ${titleLength}, should be EXACTLY 55`);
              // Auto-fix: trim or pad to 55 characters
              if (titleLength > 55) {
                seoMetadata.seoTitle = seoMetadata.seoTitle.substring(0, 52) + '...';
                console.log(`✂️ Trimmed SEO Title to: "${seoMetadata.seoTitle}" (${seoMetadata.seoTitle.length})`);
              } else if (titleLength < 55) {
                // Pad with year or relevant suffix
                const padding = ' ' + new Date().getFullYear();
                seoMetadata.seoTitle = (seoMetadata.seoTitle + padding).substring(0, 55);
                console.log(`➕ Padded SEO Title to: "${seoMetadata.seoTitle}" (${seoMetadata.seoTitle.length})`);
              }
            }
          }
          
          if (seoMetadata.metaDescription) {
            const descLength = seoMetadata.metaDescription.length;
            if (descLength < 125 || descLength > 135) {
              console.warn(`⚠️ Meta Description length is ${descLength}, should be 125-135`);
              // Auto-fix: trim or pad to valid range
              if (descLength > 135) {
                seoMetadata.metaDescription = seoMetadata.metaDescription.substring(0, 132) + '...';
                console.log(`✂️ Trimmed Meta Description to: "${seoMetadata.metaDescription}" (${seoMetadata.metaDescription.length})`);
              } else if (descLength < 125) {
                // Pad with CTA
                const padding = ' Lees meer!';
                seoMetadata.metaDescription = (seoMetadata.metaDescription + padding).substring(0, 135);
                console.log(`➕ Padded Meta Description to: "${seoMetadata.metaDescription}" (${seoMetadata.metaDescription.length})`);
              }
            }
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
          // Create smart fallback that meets length requirements
          const fallbackTopic = (contentType === 'blog' ? topic : category).substring(0, 50);
          const yearSuffix = ` ${new Date().getFullYear()}`;
          const titlePadding = (fallbackTopic + yearSuffix).substring(0, 55);
          const finalTitle = titlePadding.length === 55 ? titlePadding : (titlePadding + ' '.repeat(55 - titlePadding.length)).substring(0, 55);
          
          const descBase = `Ontdek alles over ${fallbackTopic}. Praktische tips en handige inzichten. Bekijk onze complete gids en start direct!`;
          const finalDesc = descBase.substring(0, 135);
          
          seoMetadata = {
            seoTitle: finalTitle,
            metaDescription: finalDesc,
            focusKeyword: keywords[0] || (contentType === 'blog' ? topic : category),
            extraKeywords: keywords.slice(0, 5),
            lsiKeywords: []
          };
          console.log(`📝 Fallback metadata created:`);
          console.log(`   - Title (${finalTitle.length}): "${finalTitle}"`);
          console.log(`   - Description (${finalDesc.length}): "${finalDesc}"`);
        }
      } catch (metadataError) {
        console.error('❌ SEO metadata generation failed:', metadataError);
        // Create smart fallback that meets length requirements
        const fallbackTopic = (contentType === 'blog' ? topic : category).substring(0, 50);
        const yearSuffix = ` ${new Date().getFullYear()}`;
        const titlePadding = (fallbackTopic + yearSuffix).substring(0, 55);
        const finalTitle = titlePadding.length === 55 ? titlePadding : (titlePadding + ' '.repeat(55 - titlePadding.length)).substring(0, 55);
        
        const descBase = `Ontdek alles over ${fallbackTopic}. Praktische tips en handige inzichten. Bekijk onze complete gids en start direct!`;
        const finalDesc = descBase.substring(0, 135);
        
        seoMetadata = {
          seoTitle: finalTitle,
          metaDescription: finalDesc,
          focusKeyword: keywords[0] || (contentType === 'blog' ? topic : category),
          extraKeywords: keywords.slice(0, 5),
          lsiKeywords: []
        };
        console.log(`📝 Error fallback metadata created:`);
        console.log(`   - Title (${finalTitle.length}): "${finalTitle}"`);
        console.log(`   - Description (${finalDesc.length}): "${finalDesc}"`);
      }
      
      sendStreamStatus('✅ SEO metadata klaar', 95);

      // 📱 SOCIAL MEDIA POST GENERATIE
      let socialMediaPost: SocialMediaPost | undefined;
      try {
        sendStreamStatus('📱 Social media post genereren...', 96);
        console.log('📱 Generating social media post...');
        
        socialMediaPost = await generateSocialMediaPost(title, blogContent, keywords);
        
        console.log('✅ Social media post generated:', {
          textLength: socialMediaPost.text.length,
          hashtagsCount: socialMediaPost.hashtags.length,
          hasImagePrompt: !!socialMediaPost.imagePrompt
        });
        
        sendStreamStatus('✅ Social media post klaar', 97);
      } catch (socialError) {
        console.error('⚠️ Social media generation failed (non-fatal):', socialError);
        // Continue zonder social media post - dit is niet kritiek
      }

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
      // ====== FORCEER INTERNE LINKS (POST-PROCESSING) ======
      // 🔗 AI-gedreven interne link insertie - GARANTEERT minimaal 5 interne links
      if (sitemapUrl) {
        sendStreamStatus('🔗 Interne links toevoegen...', 95);
        console.log('🔗 Force-inserting internal links into content...');
        
        try {
          // Als we nog geen interne links hebben geselecteerd via sitemap, doe dat nu
          if (internalLinks.length === 0) {
            console.log('⚠️ No internal links selected yet, loading sitemap now...');
            const sitemap = await loadWordPressSitemap(
              sitemapUrl,
              wordpressApiUrl || undefined
            );
            
            if (sitemap && sitemap.pages.length > 0) {
              // Gebruik AI om links te selecteren
              const selectedLinks = await findRelevantInternalLinksWithAI(
                sitemap,
                topic,
                keywords,
                8 // Selecteer 8 relevante links
              );
              
              // Converteer naar oude format voor compatibiliteit
              internalLinks = selectedLinks.map(link => ({
                title: link.title,
                url: link.url,
                relevance: 5 // Default relevance score
              }));
              
              console.log(`✅ AI selected ${internalLinks.length} internal links`);
            }
          }
          
          // Als we nu interne links hebben, forceer ze in de content
          if (internalLinks.length > 0) {
            const linksToInsert = internalLinks.map(link => ({
              title: link.title,
              url: link.url,
              relevance: `Score: ${link.relevance}`
            }));
            
            blogContent = await insertInternalLinksIntoHTML(
              blogContent,
              linksToInsert,
              5 // Minimaal 5 interne links
            );
            
            console.log('✅ Internal links successfully inserted into content');
            sendStreamStatus('✅ Interne links toegevoegd', 96);
          } else {
            console.log('⚠️ No internal links available to insert');
          }
        } catch (error) {
          console.error('❌ Error inserting internal links:', error);
          // Continue zonder interne links als insertie faalt
        }
      }
      
      sendStreamStatus('💾 Opslaan in Content Bibliotheek...', 97);
      console.log('💾 Auto-saving to Content Library...');
      
      // Declare saveResult outside try-catch so it's available for success payload
      let saveResult: { success: boolean; saved: boolean; duplicate: boolean; contentId?: string; message: string } = {
        success: false,
        saved: false,
        duplicate: false,
        message: 'Not attempted',
      };
      
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
        
        saveResult = await autoSaveToLibrary({
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
          language: language.toUpperCase() as 'NL' | 'EN' | 'FR' | 'ES' | 'DE' | 'IT' | 'PT', // Convert to uppercase for database
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

      // 🎨 POST-PROCESSING: Verbeter styling en verwijder placeholders
      console.log('🎨 Post-processing content...');
      
      // 1. Verbeter blockquote styling (leesbare quotes)
      blogContent = blogContent.replace(
        /<blockquote>/g,
        '<blockquote style="background: #f8fafc; border-left: 4px solid #ff6b35; padding: 20px 24px; margin: 24px 0; border-radius: 8px; font-style: italic; color: #1e293b; font-size: 1.05em; line-height: 1.7; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">'
      );
      
      // 2. Verwijder resterende image placeholders die niet zijn gevuld
      blogContent = blogContent.replace(/<img[^>]*src="IMAGE_PLACEHOLDER_\d+"[^>]*>/g, '');
      
      // 3. Ensure consistent product box spacing
      blogContent = blogContent.replace(
        /(<div class="writgo-product-box")/g,
        '\n\n$1'
      );
      
      // 4. 🔗 REPLACE AFFILIATE LINK PLACEHOLDERS (contextueel in tekst)
      const hasAffiliateLinks = affiliateLinks && affiliateLinks.length > 0;
      
      if (hasAffiliateLinks) {
        console.log('🔗 Replacing affiliate link placeholders...');
        console.log(`   - Loose affiliate links: ${affiliateLinks.length}`);
        
        affiliateLinks.forEach((link: any, index: number) => {
          const linkTitle = link.title || link.anchorText || 'Bekijk meer';
          const linkUrl = link.url || '#';
          const placeholder = `{{AFFILIATE_LINK_${index}}}`;
          
          // Create HTML link
          const htmlLink = `<a href="${linkUrl}" target="_blank" rel="nofollow noopener"><strong>${linkTitle}</strong></a>`;
          
          // Replace all occurrences of this placeholder
          const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          const replacedCount = (blogContent.match(regex) || []).length;
          blogContent = blogContent.replace(regex, htmlLink);
          
          console.log(`   ✅ Replaced ${replacedCount}x: ${placeholder} → "${linkTitle}"`);
        });
        
        console.log(`✅ All affiliate link placeholders replaced`);
      }
      
      console.log('✅ Post-processing complete');

      // Send final result with BOTH status and complete flag
      console.log('✅ Blog generation completed successfully - sending final data');
      
      // First, send a status update to 100%
      // 🛑 CRITICAL: Stop all background processes before sending final message
      console.log('🛑 [BlogGen] Finalizing...');
      
      // Ensure heartbeat is stopped (should already be stopped at 65%)
      heartbeatStopped = true;
      clearInterval(heartbeatInterval);
      
      sendStreamStatus('✅ Content generatie voltooid!', 100);
      console.log('📊 [BlogGen] Status update sent: 100%');
      
      // Then send the final data with all content
      const finalData = JSON.stringify({
        success: true,
        done: true, // ✅ ADDED: Required for frontend to detect completion
        status: 'complete',
        progress: 100,
        contentId: saveResult.contentId || '', // ✅ ADDED: For redirect to library
        title,
        content: blogContent,
        seoMetadata,
        featuredImage: featuredImageUrl,
        socialMediaPost,
        creditsUsed,
        remainingCredits,
        redirectUrl: saveResult.contentId ? `/client-portal/content-library/${saveResult.contentId}/edit` : undefined,
      }) + '\n';
      
      console.log('📤 [BlogGen] Sending final success payload');
      await writer.write(encoder.encode(finalData));
      
      // Mark stream as closed and close immediately
      streamClosed = true;
      await writer.close();
      console.log('✅ [BlogGen] Stream closed successfully');

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