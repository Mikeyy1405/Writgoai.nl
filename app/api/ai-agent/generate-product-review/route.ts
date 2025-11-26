

export const dynamic = "force-dynamic";
// Deze route is verplaatst naar /api/ai-agent/generate-blog
// Alle content types (blog, product-review, top-list) gebruiken nu één geünificeerde API
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { getBannedWordsInstructions, removeBannedWords, isContentValid } from '@/lib/banned-words';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { CREDIT_COSTS } from '@/lib/credits';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

interface Product {
  name: string;
  url: string;  // Can be affiliate or regular URL
  price?: string;
  rating?: string;
  description?: string;
  imageUrl?: string;  // Main product image
  imageUrls?: string[];  // Multiple product images (max 5)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  const body = await req.json();
  const {
    category,
    reviewType = 'single',
    targetAudience = '',
    tone = 'helpful',
    language = 'nl',
    products = [],
    additionalContext = '',
  } = body;

  if (!category || products.length === 0) {
    return NextResponse.json({ error: 'Categorie en producten zijn verplicht' }, { status: 400 });
  }

  console.log('🚀 Product review generation started:', { category, reviewType, productCount: products.length });

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
      sendStreamStatus('🚀 Product review generatie gestart...', 5);

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
      const requiredCredits = CREDIT_COSTS.BLOG_POST; // 70 credits voor product review met scraping
      
      if (!user || (!user.isUnlimited && totalCredits < requiredCredits)) {
        const errorData = JSON.stringify({ 
          error: `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor een product review.`,
          status: 'error',
          progress: 0
        }) + '\n\n';
        await writer.write(encoder.encode(errorData));
        await writer.close();
        return;
      }

      // Get client's tone of voice settings
      const toneOfVoiceData = await getClientToneOfVoice(user.id);
      const customToneInstructions = generateToneOfVoicePrompt(toneOfVoiceData, tone as any);

      // STEP 1: Scrape product images (multiple per product)
      sendStreamStatus('🖼️ Product afbeeldingen ophalen...', 20);
      console.log('🖼️ Step 1: Scraping product images (multiple)...');
      
      const productsWithImages = await Promise.all(
        products.map(async (product: Product) => {
          let imageUrls: string[] = [];
          
          try {
            // Scrape images from product page (works for all websites)
            {
              const response = await fetch(product.url, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                  'Accept': 'text/html,application/xhtml+xml',
                  'Accept-Language': 'nl-NL,nl;q=0.9'
                }
              });
              
              if (response.ok) {
                const html = await response.text();
                
                // Extract ALL product images from page
                // Strategy 1: Bol.com specific - main image
                const bolMainImageMatch = html.match(/id="image-zoom-modal-selected-image"[^>]+src="([^"]+)"/i);
                if (bolMainImageMatch?.[1]) {
                  imageUrls.push(bolMainImageMatch[1]);
                  console.log('✅ Found Bol.com main image');
                }
                
                // Strategy 2: Bol.com carousel images
                const bolCarouselMatches = html.matchAll(/data-test="([^"]*thumb[^"]*)"[^>]+src="([^"]+)"/gi);
                for (const match of bolCarouselMatches) {
                  const thumbUrl = match[2];
                  // Convert thumbnail to full-size (remove -XL suffix if present)
                  const fullUrl = thumbUrl.replace(/-XL(\.[a-z]+)$/i, '$1');
                  if (fullUrl && !imageUrls.includes(fullUrl)) {
                    imageUrls.push(fullUrl);
                  }
                }
                
                // Strategy 3: Open Graph image (fallback)
                if (imageUrls.length === 0) {
                  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
                  if (ogImageMatch?.[1]) {
                    imageUrls.push(ogImageMatch[1]);
                    console.log('✅ Found OG image');
                  }
                }
                
                // Strategy 4: Schema.org product images (can be array)
                if (imageUrls.length === 0) {
                  const schemaMatch = html.match(/"image"\s*:\s*(\[.*?\]|"[^"]+")/i);
                  if (schemaMatch?.[1]) {
                    try {
                      const imageData = JSON.parse(schemaMatch[1]);
                      const images = Array.isArray(imageData) ? imageData : [imageData];
                      imageUrls.push(...images.filter((url: string) => url.startsWith('http')));
                      console.log('✅ Found Schema.org images');
                    } catch (e) {
                      // Single image string
                      const singleImg = schemaMatch[1].replace(/"/g, '');
                      if (singleImg.startsWith('http')) {
                        imageUrls.push(singleImg);
                      }
                    }
                  }
                }
                
                // Strategy 5: All high-quality img tags
                if (imageUrls.length === 0) {
                  const allImages = html.match(/<img[^>]+src="([^"]+)"[^>]*>/gi) || [];
                  for (const imgTag of allImages) {
                    const srcMatch = imgTag.match(/src="([^"]+)"/i);
                    const widthMatch = imgTag.match(/width="(\d+)"/i);
                    const src = srcMatch?.[1];
                    const width = widthMatch?.[1] ? parseInt(widthMatch[1]) : 0;
                    
                    // Only high-quality product images (min 400px)
                    if (src && width >= 400 && !imageUrls.includes(src)) {
                      imageUrls.push(src);
                    }
                  }
                  console.log(`✅ Found ${imageUrls.length} high-quality images from HTML`);
                }
                
                // Make sure all URLs are absolute
                const baseUrl = new URL(product.url);
                for (let i = 0; i < imageUrls.length; i++) {
                  if (imageUrls[i] && !imageUrls[i].startsWith('http')) {
                    imageUrls[i] = new URL(imageUrls[i], baseUrl.origin).href;
                  }
                }
              }
            }
            
            console.log(`📸 Total images for ${product.name}:`, imageUrls.length);
            
            return {
              ...product,
              imageUrl: imageUrls[0] || '', // Main image
              imageUrls: imageUrls.slice(0, 5) // Max 5 images per product
            };
          } catch (error) {
            console.error(`❌ Error fetching images for ${product.name}:`, error);
          }
          
          return { 
            ...product, 
            imageUrl: '', 
            imageUrls: [] 
          };
        })
      );

      sendStreamStatus('✅ Product informatie verzameld', 30);

      // STEP 2: Research phase
      sendStreamStatus('🔍 Marktonderzoek uitvoeren...', 35);
      console.log('🔍 Step 2: Market Research...');
      
      const researchModel = selectOptimalModelForTask('blog_research', 'medium', 'quality');
      
      const researchPrompt = `Je bent een expert product reviewer. Zoek actuele informatie over de ${category} markt.

**Productcategorie:** ${category}
${targetAudience ? `**Doelgroep:** ${targetAudience}` : ''}

Geef een kort research rapport met:
1. **Trends & Ontwikkelingen** in ${category} (2024-2025)
2. **Belangrijke Aankoopfactoren** waar kopers op letten
3. **Prijs ranges** en wat je daarvoor krijgt
4. **Veelvoorkomende problemen** in deze productcategorie

Focus op ${language === 'nl' ? 'Nederlandse' : 'Engelse'} markt en bronnen.`;

      const researchResponse = await chatCompletion({
        model: researchModel.primary.model,
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert product researcher met focus op consumentenelektronica en e-commerce.'
          },
          {
            role: 'user',
            content: researchPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const researchResults = researchResponse.choices?.[0]?.message?.content || '';
      sendStreamStatus('✅ Marktonderzoek voltooid', 50);

      // STEP 3: Generate review content
      sendStreamStatus('✍️ Product review schrijven...', 55);
      console.log('✍️ Step 3: Writing Product Review...');
      
      const writingModel = selectOptimalModelForTask('blog_writing', 'medium', 'quality');
      
      const toneInstructions: Record<string, string> = {
        helpful: 'Behulpzaam en praktisch. Geef eerlijke adviezen.',
        expert: 'Autoritair en technisch. Gebruik specifieke termen.',
        casual: 'Vriendelijk en toegankelijk. Praat zoals tegen een vriend.',
        enthusiastic: 'Enthousiast en positief. Laat je passie zien.',
      };

      const reviewTypeInstructions: Record<string, string> = {
        single: 'Schrijf een uitgebreide, diepgaande review over DIT ENE product. Beschrijf alle ins en outs, features, specificaties, voor- en nadelen, gebruik in de praktijk, en voor wie het wel/niet geschikt is. Ga DIEP op elk aspect in.',
        top5: 'Maak een Top 5 lijst met de 5 beste producten, gerangschikt van 5 naar 1 (beste als laatste)',
        top10: 'Maak een Top 10 lijst met de 10 beste producten, gerangschikt van 10 naar 1 (beste als laatste)',
        comparison: 'Maak een uitgebreide vergelijking tussen de producten met voor- en nadelen',
      };

      const productsInfo = productsWithImages.map((p, i) => `
**Product ${i + 1}: ${p.name}**
- URL: ${p.url}
${p.price ? `- Prijs: ${p.price}` : ''}
${p.rating ? `- Rating: ${p.rating}` : ''}
${p.description ? `- Beschrijving: ${p.description}` : ''}
${p.imageUrl ? `- Hoofdafbeelding: ${p.imageUrl}` : ''}
${(p as any).imageUrls && (p as any).imageUrls.length > 1 ? `- Extra afbeeldingen: ${(p as any).imageUrls.slice(1).join(', ')}` : ''}
`).join('\n');

      const writingPrompt = reviewType === 'single' 
        ? `Je bent een expert product reviewer die eerlijke, uitgebreide reviews schrijft.

**REVIEW TYPE:** ${reviewTypeInstructions[reviewType]}

**PRODUCTCATEGORIE:** ${category}
**PRODUCT:** ${productsWithImages[0].name}
${targetAudience ? `**DOELGROEP:** ${targetAudience}` : ''}

**MARKTONDERZOEK:**
${researchResults}

**PRODUCT DETAILS:**
${productsInfo}

${customToneInstructions}

**ARTIKEL STRUCTUUR VOOR SINGLE PRODUCT REVIEW (VERPLICHT):**

1. **<h1>Titel</h1>**
   - SEO geoptimaliseerd, bijv. "${productsWithImages[0].name} Review 2025: Alle Ins en Outs + Eerlijke Mening"
   - Of: "${productsWithImages[0].name} Test: Is Het De Prijs Waard?"
   - Schrijf in normale zinsvorm (NIET Elke Woord Met Hoofdletter)

2. **Intro (3-4 alinea's)**
   - Waarom dit product interessant is
   - Eerste indruk / hands-on ervaring
   - Voor wie is deze review bedoeld
   ${targetAudience ? `- Specifiek gericht op ${targetAudience}` : ''}
   - Wat je in deze review leert

3. **Product Overzicht**
   ${productsWithImages[0]?.imageUrl ? `<img src="${productsWithImages[0].imageUrl}" alt="${productsWithImages[0].name}" class="product-hero-image" />` : ''}
   
   <div class="product-overview">
     <h2>${productsWithImages[0].name} - Het Overzicht</h2>
     
     <div class="quick-specs">
       <ul>
         <li><strong>Product:</strong> ${productsWithImages[0].name}</li>
         ${productsWithImages[0].price ? `<li><strong>Prijs:</strong> ${productsWithImages[0].price}</li>` : ''}
         ${productsWithImages[0].rating ? `<li><strong>Rating:</strong> ⭐ ${productsWithImages[0].rating}</li>` : ''}
         <li><strong>Categorie:</strong> ${category}</li>
       </ul>
     </div>
     
     <p><strong>TL;DR Samenvatting:</strong> [2-3 zinnen - de kernboodschap van deze review]</p>
     
     <p><strong><a href="${productsWithImages[0].url}" target="_blank" rel="noopener noreferrer${productsWithImages[0].url.includes('partner') || productsWithImages[0].url.includes('affiliate') ? ' nofollow' : ''}" class="cta-button">🛒 Bekijk ${productsWithImages[0].name} →</a></strong></p>
   </div>

4. **<h2>Technische Specificaties & Features</h2>**
   - Gedetailleerd overzicht van ALLE belangrijke specs
   - Gebruik <h3> voor elke hoofdcategorie (Design, Prestaties, etc.)
   - Beschrijf elk kenmerk uitgebreid
   - Wat maakt dit product technisch uniek?
   - Vergelijk met concurrenten waar relevant
   ${(productsWithImages[0] as any).imageUrls && (productsWithImages[0] as any).imageUrls.length > 1 ? `
   - GEBRUIK EXTRA AFBEELDINGEN: Plaats extra product afbeeldingen bij relevante secties:
     ${(productsWithImages[0] as any).imageUrls.slice(1, 4).map((url: string, idx: number) => 
       `<img src="${url}" alt="${productsWithImages[0].name} - detail ${idx + 1}" class="product-detail-image" />`
     ).join('\n     ')}` : ''}

5. **<h2>In de Praktijk: Hands-On Ervaring</h2>**
   - <h3>Eerste Indruk & Unboxing</h3>
   - <h3>Dagelijks Gebruik</h3>
   - <h3>Prestaties in Echte Scenario's</h3>
   - Concrete voorbeelden en ervaringen
   - Wat valt op in de praktijk?
   - Verschillen tussen specs en werkelijkheid
   ${(productsWithImages[0] as any).imageUrls && (productsWithImages[0] as any).imageUrls.length > 3 ? `
   - Plaats indien beschikbaar een detail afbeelding bij de hands-on ervaring` : ''}

6. **<h2>Diepgaande Analyse</h2>**
   
   <h3>✅ Sterke Punten (Voordelen)</h3>
   <ul>
     <li><strong>Punt 1:</strong> [Uitgebreide uitleg waarom dit goed is]</li>
     <li><strong>Punt 2:</strong> [Met voorbeelden en concrete details]</li>
     <li><strong>Punt 3:</strong> [Vergelijking met alternatieven]</li>
     [Minimaal 5-7 voordelen met uitgebreide toelichting]
   </ul>
   
   <h3>❌ Zwakke Punten (Nadelen)</h3>
   <ul>
     <li><strong>Punt 1:</strong> [Eerlijke kritiek met nuance]</li>
     <li><strong>Punt 2:</strong> [Wat had beter gekund]</li>
     <li><strong>Punt 3:</strong> [Deal-breakers voor bepaalde gebruikers]</li>
     [Minimaal 3-5 nadelen - wees eerlijk!]
   </ul>

7. **<h2>Vergelijking met Alternatieven</h2>**
   - Noem 2-3 directe concurrenten
   - Waar scoort dit product beter?
   - Waar blijft het achter?
   - Prijs-kwaliteit vergelijking

8. **<h2>Voor Wie is ${productsWithImages[0].name}?</h2>**
   
   <h3>✅ Perfect Voor:</h3>
   - [Specifieke gebruikersgroep 1 met uitleg]
   - [Specifieke use-case 1]
   - [Specifiek scenario 1]
   
   <h3>❌ Minder Geschikt Voor:</h3>
   - [Gebruikersgroep die beter iets anders kan kiezen]
   - [Scenario's waar dit product tekortschiet]

9. **<h2>Prijs-Kwaliteit Verhouding</h2>**
   - Is het de prijs waard?
   - Waar zit de waarde?
   - Vergelijking met duurdere/goedkopere alternatieven
   ${productsWithImages[0].price ? `- Analyse van ${productsWithImages[0].price}` : ''}

10. **<h2>Veelgestelde Vragen</h2>**
    - Minimaal 5-7 FAQ's in <h3> format
    - Beantwoord vragen die kopers echt hebben
    - Gebaseerd op marktonderzoek

11. **<h2>Eindoordeel & Conclusie</h2>**
    
    <div class="final-verdict">
      <h3>⭐ Onze Beoordeling: [X/10]</h3>
      
      <p><strong>Samenvatting:</strong> [2-3 alinea's met het eindoordeel]</p>
      
      <h4>Beste Eigenschap:</h4>
      <p>[De absolute killer feature]</p>
      
      <h4>Grootste Minpunt:</h4>
      <p>[Het belangrijkste nadeel]</p>
      
      <h4>Verdict:</h4>
      <p>[Duidelijke aanbeveling: Aanrader / Met voorbehoud / Niet aanraden]</p>
      
      <p><strong><a href="${productsWithImages[0].url}" target="_blank" rel="noopener noreferrer${productsWithImages[0].url.includes('partner') || productsWithImages[0].url.includes('affiliate') ? ' nofollow' : ''}" class="cta-button">🛒 Bekijk Beste Prijs voor ${productsWithImages[0].name} →</a></strong></p>
    </div>

**SCHRIJFSTIJL:**
- Toon: ${toneInstructions[tone]}
- Diepgaand en uitgebreid - ga ECHT de diepte in
- Conversationeel en toegankelijk (B1 niveau)
- Gebruik 'je/jij' vorm
- Wissel zinslengtes af (kort, middel, lang)
- Wees EERLIJK over voor- én nadelen - geloofwaardigheid is key
- Gebruik concrete voorbeelden en scenario's
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}
- Minimaal 2000-2500 woorden - dit is een UITGEBREIDE review

${additionalContext ? `**EXTRA FOCUS:** ${additionalContext}` : ''}

**URL LINKS (BELANGRIJK):**
- De URL kan een affiliate link zijn of een gewone product link
- Gebruik ALTIJD rel="noopener noreferrer" voor externe links
- Voeg rel="nofollow" toe als de URL keywords bevat zoals 'partner', 'affiliate', 'ref='
- Formaat: <a href="[url]" target="_blank" rel="noopener noreferrer [nofollow]">🛒 Tekst →</a>

${getBannedWordsInstructions()}

**HTML FORMATTING:**
- Gebruik: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>, <img>, <div>
- Maak het visueel aantrekkelijk en scanbaar
- Gebruik blockquotes voor belangrijke tips
- Structureer met divs voor speciale secties

Schrijf nu de complete, uitgebreide product review in perfecte HTML formatting!`
        : `Je bent een expert product reviewer die eerlijke, uitgebreide reviews schrijft.

**REVIEW TYPE:** ${reviewTypeInstructions[reviewType]}

**PRODUCTCATEGORIE:** ${category}
${targetAudience ? `**DOELGROEP:** ${targetAudience}` : ''}

**MARKTONDERZOEK:**
${researchResults}

**PRODUCTEN OM TE REVIEWEN:**
${productsInfo}

${customToneInstructions}

**ARTIKEL STRUCTUUR (VERPLICHT):**

1. **<h1>Titel</h1>**
   - SEO geoptimaliseerd, bijv. "De ${productsWithImages.length} Beste ${category} van 2025 [Vergelijking + Koopgids]"
   - Schrijf in normale zinsvorm (NIET Elke Woord Met Hoofdletter)

2. **Intro (3-4 alinea's)**
   - Waarom deze review belangrijk is
   - Wat je gaat leren
   - Korte preview van de top picks
   ${targetAudience ? `- Specifiek gericht op ${targetAudience}` : ''}

3. **Snelle Vergelijkingstabel** (VERPLICHT)
   - Gebruik <table> met alle producten
   - Kolommen: Product, Prijs, Rating, Beste Voor, Koop Link
   - Maak de tabel responsive en overzichtelijk
   - GEBRUIK de affiliate links waar beschikbaar!

4. **Per Product (gedetailleerde review):**
   
   <div class="product-review" id="product-[nummer]">
     ${productsWithImages[0]?.imageUrl ? `<img src="${productsWithImages[0].imageUrl}" alt="${productsWithImages[0].name}" class="product-image" />` : ''}
     
     <h2>${productsWithImages[0]?.name || 'Product Naam'}</h2>
     
     <div class="product-meta">
       <span class="price">${productsWithImages[0]?.price || 'Prijs onbekend'}</span>
       <span class="rating">⭐ ${productsWithImages[0]?.rating || 'N/A'}</span>
     </div>
     
     <p><strong>Samenvatting:</strong> [1-2 zinnen wat dit product uniek maakt]</p>
     
     <h3>Waarom we dit product aanbevelen</h3>
     <p>[Uitgebreide paragraaf met concrete details]</p>
     
     ${(productsWithImages[0] as any)?.imageUrls && (productsWithImages[0] as any).imageUrls.length > 1 ? `
     <div class="product-gallery">
       ${(productsWithImages[0] as any).imageUrls.slice(1, 3).map((url: string, idx: number) => 
         `<img src="${url}" alt="${productsWithImages[0].name} - afbeelding ${idx + 2}" class="gallery-image" />`
       ).join('\n       ')}
     </div>
     ` : ''}
     
     <h3>Voordelen</h3>
     <ul>
       <li>Specifiek voordeel 1</li>
       <li>Specifiek voordeel 2</li>
       <li>Specifiek voordeel 3</li>
     </ul>
     
     <h3>Nadelen</h3>
     <ul>
       <li>Eerlijk nadeel 1</li>
       <li>Eerlijk nadeel 2</li>
     </ul>
     
     <h3>Voor wie is dit product?</h3>
     <p>[Specifieke doelgroep en use cases]</p>
     
     <p><strong><a href="${productsWithImages[0]?.url}" target="_blank" rel="noopener noreferrer${productsWithImages[0]?.url.includes('partner') || productsWithImages[0]?.url.includes('affiliate') ? ' nofollow' : ''}" class="cta-button">🛒 Bekijk ${productsWithImages[0]?.name} →</a></strong></p>
   </div>
   
   [HERHAAL VOOR ALLE ${productsWithImages.length} PRODUCTEN]
   [OPMERKING: Als een product meerdere afbeeldingen heeft, gebruik dan de extra afbeeldingen in een gallerij tussen de samenvatting en voordelen]

5. **<h2>Koopgids: Waar Let Je Op Bij ${category}?</h2>**
   - <h3> subkoppen voor elk belangrijk aspect
   - Concrete, praktische adviezen
   - Gebaseerd op het marktonderzoek

6. **<h2>Veelgestelde Vragen</h2>**
   - Minimaal 3-5 FAQ's in <h3> format
   - Korte, heldere antwoorden

7. **Conclusie (2-3 alinea's)**
   - Samenvatting van top pick
   - Budget optie
   - Premium optie
   - Final thoughts

**SCHRIJFSTIJL:**
- Toon: ${toneInstructions[tone]}
- Conversationeel en toegankelijk (B1 niveau)
- Gebruik 'je/jij' vorm
- Wissel zinslengtes af (kort, middel, lang)
- Wees eerlijk over voor- én nadelen
- Gebruik concrete voorbeelden
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}

${additionalContext ? `**EXTRA FOCUS:** ${additionalContext}` : ''}

**URL LINKS (BELANGRIJK):**
- De URL kan een affiliate link zijn of een gewone product link
- Gebruik ALTIJD rel="noopener noreferrer" voor externe links
- Voeg rel="nofollow" toe als de URL keywords bevat zoals 'partner', 'affiliate', 'ref='
- Formaat: <a href="[url]" target="_blank" rel="noopener noreferrer [nofollow]">🛒 Bekijk [Product] →</a>
- Plaats call-to-actions op natuurlijke plekken

**AFBEELDINGEN:**
- Gebruik de verstrekte product afbeeldingen
- Plaats afbeeldingen bij elk product review block
- Gebruik descriptive alt teksten

${getBannedWordsInstructions()}

**HTML FORMATTING:**
- Gebruik: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>, <img>, <table>, <div>
- Maak het visueel aantrekkelijk en scanbaar
- Gebruik blockquotes voor belangrijke tips

Schrijf nu de complete product review in perfecte HTML formatting!`;

      const writingResponse = await chatCompletion({
        model: writingModel.primary.model,
        messages: [
          {
            role: 'system',
            content: `Je bent een expert product reviewer die eerlijke, uitgebreide reviews schrijft in het ${language === 'nl' ? 'Nederlands' : 'Engels'}. Je gebruikt alleen HTML tags en schrijft natuurlijk, gevarieerd en conversationeel. Je bent eerlijk over voor- en nadelen en geeft praktische adviezen.`
          },
          {
            role: 'user',
            content: writingPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 12000,
      });

      let reviewContent = writingResponse.choices?.[0]?.message?.content || '';
      sendStreamStatus('✅ Review succesvol geschreven', 85);

      // STEP 4: Banned words check
      sendStreamStatus('🔍 Content valideren...', 90);
      const validation = isContentValid(reviewContent);
      if (!validation.valid) {
        reviewContent = removeBannedWords(reviewContent);
      }
      sendStreamStatus('✅ Content gevalideerd', 92);

      // Extract title
      const titleMatch = reviewContent.match(/<h1>(.*?)<\/h1>/);
      const title = titleMatch ? titleMatch[1] : `${category} Review - Top ${productsWithImages.length}`;

      // Deduct credits
      const creditsUsed = CREDIT_COSTS.BLOG_POST; // 70 credits voor product review met scraping en research
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

      // AUTO-SAVE to Content Library
      sendStreamStatus('💾 Opslaan in Content Bibliotheek...', 95);
      console.log('💾 Auto-saving product review to Content Library...');
      
      try {
        const imageUrls = productsWithImages
          .filter(p => p.imageUrl)
          .map(p => p.imageUrl);
        
        const reviewTypeLabel = reviewType === 'single' ? 'individuele' : reviewType;
        
        console.log('📝 Auto-save data:', {
          clientId: user.id,
          type: 'blog',
          title,
          hasContent: !!reviewContent,
          contentLength: reviewContent.length,
          category: 'product-review',
          reviewType,
          productsCount: productsWithImages.length,
          imagesCount: imageUrls.length,
        });
        
        const saveResult = await autoSaveToLibrary({
          clientId: user.id,
          type: 'blog',
          title,
          content: reviewContent.replace(/<[^>]*>/g, ''),
          contentHtml: reviewContent,
          category: 'product-review',
          tags: ['product-review', reviewType, ...(reviewType === 'single' ? ['diepgaand', 'uitgebreid'] : ['vergelijking'])],
          description: reviewType === 'single' 
            ? `Uitgebreide review van ${productsWithImages[0].name} in de ${category} categorie`
            : `${reviewTypeLabel} review voor ${category}`,
          keywords: reviewType === 'single'
            ? [productsWithImages[0].name, category, 'review', 'test', 'ervaring']
            : [category, 'review', 'beste', reviewTypeLabel],
          metaDesc: reviewContent.substring(0, 160).replace(/<[^>]*>/g, ''),
          imageUrls,
        });
        
        console.log('💾 Auto-save result:', saveResult);
        
        if (saveResult.saved) {
          console.log(`✅ ${saveResult.message}`);
          sendStreamStatus('✅ Opgeslagen in Content Bibliotheek', 98);
        } else if (saveResult.duplicate) {
          console.log(`⏭️  ${saveResult.message}`);
          sendStreamStatus('⏭️ Al opgeslagen in Content Bibliotheek', 98);
        } else {
          console.warn(`⚠️ ${saveResult.message}`);
          sendStreamStatus(`⚠️ Opslag mislukt: ${saveResult.message}`, 98);
        }
      } catch (saveError: any) {
        console.error('❌ Error auto-saving:', saveError);
        console.error('Error details:', {
          message: saveError.message,
          stack: saveError.stack,
          name: saveError.name,
        });
        sendStreamStatus(`⚠️ Opslag mislukt: ${saveError.message}`, 98);
      }

      sendStreamStatus('✅ Product review generatie voltooid!', 100);

      // Send final result
      const finalData = JSON.stringify({
        success: true,
        title,
        content: reviewContent,
        creditsUsed,
        remainingCredits,
        status: 'complete',
        progress: 100
      }) + '\n\n';
      
      await writer.write(encoder.encode(finalData));
      await writer.close();

    } catch (error: any) {
      console.error('❌ Error generating product review:', error);
      const errorData = JSON.stringify({
        error: error.message || 'Er ging iets mis bij het genereren van de review',
        status: 'error',
        progress: 0
      }) + '\n\n';
      await writer.write(encoder.encode(errorData));
      await writer.close();
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
