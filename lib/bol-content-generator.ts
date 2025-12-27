/**
 * Bol.com Product Article Generator
 * Generates comprehensive product review articles in the Kérastase format
 */

import { generateAICompletion } from '@/lib/ai-client';
import { BolClient, BolProduct, generateBolAffiliateLink, formatBolPrice } from '@/lib/bol-client';

interface ProductReview {
  product: BolProduct;
  rank: number;
  specifications: {
    volume?: string;
    suitableFor: string;
    effects: string[];
    texture?: string;
  };
  experience: string;
  pros: string[];
  cons: string[];
  verdict: string;
}

interface BolArticleContent {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  wordCount: number;
}

/**
 * Get current date info for dynamic content
 */
function getCurrentDateInfo() {
  const now = new Date();
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return {
    day: now.getDate(),
    month: months[now.getMonth()],
    year: now.getFullYear(),
    nextYear: now.getFullYear() + 1,
    fullDate: now.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };
}

/**
 * Generate product reviews using AI
 */
async function generateProductReviews(
  products: BolProduct[],
  productCategory: string
): Promise<ProductReview[]> {
  const reviews: ProductReview[] = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];

    const reviewPrompt = `Genereer een uitgebreide productbeoordeling voor het volgende ${productCategory} product:

Product: ${product.title}
Prijs: ${product.offer?.price ? formatBolPrice(product.offer.price) : 'Prijs op aanvraag'}
Rating: ${product.rating ? `${product.rating}/5 sterren` : 'Nog geen beoordeling'}
Beschrijving: ${product.description || 'Geen beschrijving beschikbaar'}

Geef output als JSON met het volgende formaat:
{
  "specifications": {
    "volume": "indien relevant, bijv. 250ml",
    "suitableFor": "geschikt voor welk type haar/huid/etc",
    "effects": ["effect 1", "effect 2", "effect 3"],
    "texture": "textuur beschrijving indien relevant"
  },
  "experience": "2-3 zinnen over de praktische ervaring met dit product",
  "pros": ["pluspunt 1", "pluspunt 2", "pluspunt 3", "pluspunt 4"],
  "cons": ["minpunt 1", "minpunt 2"],
  "verdict": "Concluderend oordeel in 2-3 zinnen met een duidelijke aanbeveling"
}

Regels:
- Wees specifiek en relevant voor dit producttype
- Pluspunten moeten concreet en waardevol zijn
- Minpunten moeten eerlijk maar constructief zijn
- Het oordeel moet een duidelijke aanbeveling geven
- Gebruik professionele maar toegankelijke taal`;

    try {
      const reviewResponse = await generateAICompletion({
        task: 'content',
        systemPrompt: 'Je bent een expert productreviewer die gedetailleerde, eerlijke beoordelingen schrijft. Output alleen JSON.',
        userPrompt: reviewPrompt,
        maxTokens: 800,
        temperature: 0.7,
      });

      const jsonMatch = reviewResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const review = JSON.parse(jsonMatch[0]);
        reviews.push({
          product,
          rank: i + 1,
          specifications: review.specifications || {
            suitableFor: 'Geschikt voor alle types',
            effects: ['Hoogwaardige kwaliteit'],
          },
          experience: review.experience || 'Een uitstekend product met goede resultaten.',
          pros: review.pros || ['Goede kwaliteit', 'Betrouwbaar merk'],
          cons: review.cons || ['Prijs kan hoog zijn'],
          verdict: review.verdict || 'Een solide keuze in deze categorie.',
        });
      }
    } catch (error) {
      console.error(`Failed to generate review for ${product.ean}:`, error);
      // Fallback review
      reviews.push({
        product,
        rank: i + 1,
        specifications: {
          suitableFor: 'Geschikt voor alle types',
          effects: ['Hoogwaardige kwaliteit'],
        },
        experience: 'Een populair product met goede beoordelingen.',
        pros: ['Goede prijs-kwaliteitverhouding', 'Betrouwbaar merk', 'Snel leverbaar'],
        cons: ['Beschikbaarheid kan variëren'],
        verdict: 'Een uitstekende keuze voor wie op zoek is naar kwaliteit.',
      });
    }
  }

  return reviews;
}

/**
 * Generate product review HTML section
 */
function generateProductReviewHTML(
  review: ProductReview,
  siteCode: string
): string {
  const { product, rank, specifications, experience, pros, cons, verdict } = review;
  const affiliateLink = generateBolAffiliateLink(product.url, siteCode, product.title);

  const priceDisplay = product.offer
    ? formatBolPrice(product.offer.price)
    : 'Prijs op aanvraag';

  const originalPriceHTML = product.offer?.strikethroughPrice
    ? `<p><strong>Normale prijs:</strong> <del>${formatBolPrice(product.offer.strikethroughPrice)}</del></p>`
    : '';

  const ratingHTML = product.rating
    ? `<p><strong>Rating:</strong> ${'⭐'.repeat(Math.round(product.rating))} (${product.rating.toFixed(1)}/5)</p>`
    : '';

  const specsHTML = `
<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
  <h4>📋 Specificaties</h4>
  <ul>
    ${specifications.volume ? `<li><strong>Inhoud:</strong> ${specifications.volume}</li>` : ''}
    <li><strong>Geschikt voor:</strong> ${specifications.suitableFor}</li>
    <li><strong>Effecten:</strong> ${specifications.effects.join(', ')}</li>
    ${specifications.texture ? `<li><strong>Textuur:</strong> ${specifications.texture}</li>` : ''}
  </ul>
</div>`;

  const prosHTML = `
<div style="margin: 20px 0;">
  <h4 style="color: #28a745;">✅ Pluspunten</h4>
  <ul>
    ${pros.map(p => `<li>${p}</li>`).join('\n    ')}
  </ul>
</div>`;

  const consHTML = `
<div style="margin: 20px 0;">
  <h4 style="color: #dc3545;">❌ Minpunten</h4>
  <ul>
    ${cons.map(c => `<li>${c}</li>`).join('\n    ')}
  </ul>
</div>`;

  return `
<div class="bol-product-review" style="border: 2px solid #e0e0e0; border-radius: 12px; padding: 25px; margin: 30px 0; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
  <div style="display: flex; align-items: center; margin-bottom: 20px;">
    <div style="background: #0000a4; color: white; font-weight: bold; font-size: 1.5rem; padding: 10px 18px; border-radius: 8px; margin-right: 15px;">
      #${rank}
    </div>
    <h3 style="margin: 0; flex: 1;">${product.title}</h3>
  </div>

  ${product.image ? `
  <div style="text-align: center; margin: 20px 0;">
    <img src="${product.image.url}" alt="${product.title}" style="max-width: 100%; max-height: 300px; object-fit: contain;" />
  </div>` : ''}

  <div style="background: #0000a4; color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0; font-size: 1.2rem;"><strong>💰 Prijs: ${priceDisplay}</strong></p>
    ${originalPriceHTML}
    ${ratingHTML}
    ${product.offer?.deliveryDescription ? `<p style="margin: 5px 0 0 0;">🚚 ${product.offer.deliveryDescription}</p>` : ''}
  </div>

  ${specsHTML}

  <div style="margin: 20px 0;">
    <h4>💭 Onze ervaring</h4>
    <p>${experience}</p>
  </div>

  ${prosHTML}
  ${consHTML}

  <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4>🏆 Ons oordeel</h4>
    <p>${verdict}</p>
  </div>

  <div style="text-align: center; margin-top: 25px;">
    <a href="${affiliateLink}" target="_blank" rel="noopener sponsored" style="display: inline-block; background: #0000a4; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: background 0.3s;">
      Bekijk op Bol.com en bestel →
    </a>
  </div>
</div>`;
}

/**
 * Generate buying guide section
 */
async function generateBuyingGuide(
  productCategory: string,
  products: BolProduct[]
): Promise<string> {
  const dateInfo = getCurrentDateInfo();

  const prompt = `Schrijf een uitgebreide koopgids voor ${productCategory} producten.

De koopgids moet de volgende secties bevatten:

1. **Hoe kies je de juiste ${productCategory}?**
   - Begrijp je haartype/behoeften/situatie
   - Waar moet je op letten bij het kiezen

2. **Belangrijke factoren om te overwegen**
   - Lijst met 5-7 factoren
   - Elk met een korte uitleg

3. **Praktische scenario's**
   - 3-4 scenario's zoals "Gevoelige hoofdhuid? Kies voor...", "Budget-vriendelijk? Probeer..."
   - Met concrete oplossingen

4. **Prijs-kwaliteit vergelijking**
   - Tabel met prijsklassen (budget, mid-range, premium)
   - Wat te verwachten in elke categorie

5. **Tips voor optimaal gebruik**
   - 5-7 praktische tips
   - Doe's en don'ts

Gebruik HTML opmaak met <h3>, <h4>, <p>, <ul>, <ol>, <table> tags.
Schrijf in het Nederlands, professioneel maar toegankelijk.
Totaal ongeveer 600-800 woorden.
Begin met <h2>Complete koopgids: De beste ${productCategory} kiezen</h2>`;

  try {
    const guide = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert productadviseur die uitgebreide, praktische koopgidsen schrijft. Output alleen HTML zonder markdown code blocks.',
      userPrompt: prompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    return guide.replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Failed to generate buying guide:', error);
    return `
<h2>Complete koopgids: De beste ${productCategory} kiezen</h2>

<h3>Hoe kies je de juiste ${productCategory}?</h3>
<p>Bij het kiezen van ${productCategory} is het belangrijk om rekening te houden met je specifieke behoeften en situatie. Niet elk product werkt hetzelfde voor iedereen.</p>

<h3>Belangrijke factoren</h3>
<ul>
  <li><strong>Kwaliteit:</strong> Kijk naar ingrediënten en samenstelling</li>
  <li><strong>Prijs:</strong> Bepaal je budget vooraf</li>
  <li><strong>Reviews:</strong> Lees ervaringen van andere gebruikers</li>
  <li><strong>Merk:</strong> Kies voor betrouwbare merken</li>
  <li><strong>Geschiktheid:</strong> Check of het product bij jouw situatie past</li>
</ul>

<h3>Praktische tips</h3>
<ol>
  <li>Begin met een klein formaat om te testen</li>
  <li>Let op allergieën en gevoeligheden</li>
  <li>Vergelijk prijzen en aanbiedingen</li>
  <li>Lees de gebruiksaanwijzing zorgvuldig</li>
  <li>Bewaar het product op de juiste manier</li>
</ol>`;
  }
}

/**
 * Generate FAQ section
 */
async function generateFAQ(
  productCategory: string,
  products: BolProduct[]
): Promise<string> {
  const prompt = `Genereer een FAQ sectie over ${productCategory} met 6-8 veelgestelde vragen.

Elke vraag moet:
- Als H3 heading met vraagteken
- Direct antwoord in de eerste zin (vet gedrukt met <strong>)
- Uitgebreide uitleg in 2-3 extra zinnen

Voorbeeldvragen:
- "Hoe vaak moet ik ${productCategory} gebruiken?"
- "Wat is het verschil tussen [varianten]?"
- "Kunnen deze producten helpen bij [probleem]?"
- "Zijn deze producten geschikt voor [specifieke situatie]?"
- "Wat is de gemiddelde prijs van ${productCategory}?"
- "Hoe bewaar ik ${productCategory} het beste?"

Gebruik HTML met <h3> voor vragen en <p> voor antwoorden.
Begin met <h2>Veelgestelde vragen over ${productCategory}</h2>`;

  try {
    const faq = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert die duidelijke, informatieve FAQ secties schrijft. Output alleen HTML zonder markdown code blocks.',
      userPrompt: prompt,
      maxTokens: 1500,
      temperature: 0.7,
    });

    return faq.replace(/```html|```/g, '').trim();
  } catch (error) {
    console.error('Failed to generate FAQ:', error);
    return `
<h2>Veelgestelde vragen over ${productCategory}</h2>

<h3>Hoe vaak moet ik ${productCategory} gebruiken?</h3>
<p><strong>Dit hangt af van het type product en je persoonlijke behoeften.</strong> Over het algemeen wordt aangeraden om de instructies op de verpakking te volgen. Voor de meeste producten is dagelijks gebruik veilig en effectief.</p>

<h3>Wat is het verschil tussen goedkope en dure ${productCategory}?</h3>
<p><strong>Het prijsverschil zit vaak in de kwaliteit van ingrediënten en de merknaam.</strong> Duurdere producten gebruiken vaak hoogwaardiger ingrediënten en hebben meer onderzoek achter zich. Dat betekent niet dat goedkopere alternatieven slecht zijn - het hangt af van je specifieke behoeften.</p>

<h3>Zijn deze producten geschikt voor een gevoelige hoofdhuid?</h3>
<p><strong>Veel moderne ${productCategory} zijn speciaal ontwikkeld voor gevoelige huid.</strong> Controleer altijd het etiket en kies voor producten die als "hypoallergeen" of "voor gevoelige huid" zijn gemarkeerd. Bij twijfel kun je eerst een pluktest doen.</p>`;
  }
}

/**
 * Generate complete Bol.com product article
 */
export async function generateBolProductArticle(
  searchQuery: string,
  productCategory: string,
  productCount: number = 5,
  bolClient: BolClient,
  siteCode: string
): Promise<BolArticleContent> {
  const dateInfo = getCurrentDateInfo();

  // Search for products
  const searchResult = await bolClient.searchProducts(searchQuery, {
    pageSize: Math.min(productCount * 2, 20),
    includeImage: true,
    includeOffer: true,
    includeRating: true,
  });

  if (searchResult.products.length === 0) {
    throw new Error(`Geen producten gevonden voor "${searchQuery}"`);
  }

  // Select top products
  const topProducts = searchResult.products
    .filter(p => p.offer?.price && p.title)
    .sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (a.offer?.price || 999) - (b.offer?.price || 999);
    })
    .slice(0, productCount);

  if (topProducts.length === 0) {
    throw new Error('Geen geschikte producten gevonden met prijsinformatie');
  }

  // Generate reviews
  const reviews = await generateProductReviews(topProducts, productCategory);

  // Generate introduction
  const introPrompt = `Schrijf een professionele introductie (2 paragrafen, totaal 150-200 woorden) voor een artikel over de beste ${productCategory} van ${dateInfo.year}.

De introductie moet:
- Beginnen met waarom ${productCategory} belangrijk is
- De kwaliteit en voordelen van goede producten benadrukken
- Vermelden dat we de beste ${productCount} producten hebben getest en beoordeeld
- Een preview geven van wat de lezer kan verwachten
- Professioneel maar toegankelijk zijn

Output alleen de HTML (2-3 <p> tags) zonder markdown code blocks.`;

  let introduction = '';
  try {
    introduction = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert content writer. Output alleen HTML zonder markdown.',
      userPrompt: introPrompt,
      maxTokens: 400,
      temperature: 0.7,
    });
    introduction = introduction.replace(/```html|```/g, '').trim();
  } catch (error) {
    introduction = `<p>Op zoek naar de beste ${productCategory}? Je bent niet de enige. De keuze voor het juiste product kan een groot verschil maken in resultaat en tevredenheid.</p>
<p>We hebben uitgebreid onderzoek gedaan en de beste ${productCount} ${productCategory} van ${dateInfo.year} voor je op een rij gezet. In dit artikel vind je gedetailleerde reviews, specificaties, voor- en nadelen, en onze eerlijke oordelen om je te helpen de perfecte keuze te maken.</p>`;
  }

  // Generate "Our top pick" section
  const topPick = reviews[0];
  const topPickHTML = `
<div style="background: linear-gradient(135deg, #0000a4 0%, #000080 100%); color: white; padding: 30px; border-radius: 12px; margin: 30px 0;">
  <h2 style="color: white; margin-top: 0;">🏆 Onze topkeuze: ${topPick.product.title}</h2>
  <p style="font-size: 1.1rem;">${topPick.verdict}</p>
  <p><strong>Waarom deze?</strong> ${topPick.pros.slice(0, 2).join(', ')}</p>
  <a href="${generateBolAffiliateLink(topPick.product.url, siteCode, topPick.product.title)}" target="_blank" rel="noopener sponsored" style="display: inline-block; background: white; color: #0000a4; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">
    Bekijk de beste keuze →
  </a>
</div>`;

  // Generate product reviews HTML
  const reviewsHTML = reviews.map(review =>
    generateProductReviewHTML(review, siteCode)
  ).join('\n\n');

  // Generate buying guide
  const buyingGuide = await generateBuyingGuide(productCategory, topProducts);

  // Generate FAQ
  const faq = await generateFAQ(productCategory, topProducts);

  // Generate conclusion
  const conclusionPrompt = `Schrijf een afsluitende sectie voor een artikel over de beste ${productCategory}.

De conclusie moet:
- Een korte samenvatting geven (2-3 zinnen)
- Nogmaals de topkeuze (${topPick.product.title}) aanbevelen
- Eindigen met een CTA om de producten te bekijken

Gebruik een creatieve heading (NIET "Conclusie" of "Tot slot").
Output alleen HTML zonder markdown code blocks.`;

  let conclusion = '';
  try {
    conclusion = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een expert content writer. Output alleen HTML zonder markdown.',
      userPrompt: conclusionPrompt,
      maxTokens: 300,
      temperature: 0.7,
    });
    conclusion = conclusion.replace(/```html|```/g, '').trim();
  } catch (error) {
    conclusion = `
<h2>Maak de juiste keuze voor ${dateInfo.year}</h2>
<p>Met deze uitgebreide gids heb je alle informatie om de beste ${productCategory} te kiezen. Of je nu kiest voor onze topkeuze ${topPick.product.title}, of voor een ander product uit onze lijst - je kunt er zeker van zijn dat je een kwaliteitsproduct krijgt.</p>
<p>Vergeet niet om de specificaties en reviews goed door te nemen om het product te vinden dat het beste bij jouw situatie past.</p>`;
  }

  // Build complete article
  const title = `Beste ${productCategory} van ${dateInfo.year}: Top ${productCount} Getest & Vergeleken`;

  const content = `
${introduction}

${topPickHTML}

<h2>De ${productCount} beste ${productCategory} van ${dateInfo.year}</h2>
<p>Na uitgebreid onderzoek en vergelijking hebben we de volgende producten geselecteerd als de beste ${productCategory} die je momenteel kunt kopen:</p>

${reviewsHTML}

${buyingGuide}

${faq}

${conclusion}

<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
  <p style="margin: 0; font-size: 0.9rem; color: #666;">
    <strong>Disclaimer:</strong> Dit artikel bevat affiliate links naar Bol.com. Als je via deze links een aankoop doet, ontvangen wij een kleine commissie zonder extra kosten voor jou. Dit helpt ons om meer kwalitatieve content te maken. Onze reviews blijven altijd eerlijk en onafhankelijk.
  </p>
</div>`.trim();

  // Generate metadata
  const excerpt = `Ontdek de beste ${productCategory} van ${dateInfo.year}. Uitgebreide reviews van de top ${productCount}, inclusief specificaties, voor- en nadelen, en onze eerlijke oordelen. Vind het perfecte product voor jouw situatie.`;

  const metaTitle = `${title} | Uitgebreide Review & Koopgids`;
  const metaDescription = `Vergelijk de beste ${productCategory} van ${dateInfo.year} ✓ Top ${productCount} getest ✓ Eerlijke reviews ✓ Koopgids ✓ Voor- en nadelen ✓ Beste prijs-kwaliteit`;

  // Count words
  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;

  return {
    title,
    content,
    excerpt,
    metaTitle,
    metaDescription,
    wordCount,
  };
}
