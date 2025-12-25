import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { BolClient, generateBolAffiliateLink, generateProductCardHTML, productCardCSS } from '@/lib/bol-client';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any;
}

interface ProductWithReview {
  ean: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  deliveryInfo?: string;
  pros: string[];
  cons: string[];
  verdict: string;
  rank: number;
}

/**
 * POST - Generate a top 5 product list with Bol.com products
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      project_id,
      search_query,
      list_title,
      list_count = 5,
      language = 'nl',
      include_css = true,
    } = body;

    if (!project_id || !search_query) {
      return NextResponse.json({
        error: 'project_id and search_query are required',
      }, { status: 400 });
    }

    // Get Bol.com affiliate config
    const { data: affiliate, error: affiliateError } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('*')
      .eq('project_id', project_id)
      .eq('platform', 'bol.com')
      .eq('is_active', true)
      .single();

    if (affiliateError || !affiliate?.client_id || !affiliate?.client_secret) {
      return NextResponse.json({
        error: 'Bol.com affiliate not configured for this project',
        details: 'Please add Bol.com API credentials in project settings',
      }, { status: 400 });
    }

    // Create Bol.com client
    const bolClient = new BolClient({
      clientId: affiliate.client_id,
      clientSecret: affiliate.client_secret,
    });

    // Search for products
    const searchResult = await bolClient.searchProducts(search_query, {
      pageSize: Math.min(list_count * 2, 20), // Get more to filter
      includeImage: true,
      includeOffer: true,
      includeRating: true,
    });

    if (searchResult.products.length === 0) {
      return NextResponse.json({
        error: 'No products found',
        details: `No products found for "${search_query}"`,
      }, { status: 404 });
    }

    // Take top products (prefer those with ratings and prices)
    const topProducts = searchResult.products
      .filter(p => p.offer?.price && p.title)
      .sort((a, b) => {
        // Sort by rating (if available) then by price
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (a.offer?.price || 999) - (b.offer?.price || 999);
      })
      .slice(0, list_count);

    if (topProducts.length === 0) {
      return NextResponse.json({
        error: 'No suitable products found',
        details: 'Products found but none have prices',
      }, { status: 404 });
    }

    // Generate pros, cons, and verdict for each product using AI
    const productsWithReviews: ProductWithReview[] = [];

    for (let i = 0; i < topProducts.length; i++) {
      const product = topProducts[i];
      
      // Generate review content with AI
      const reviewPrompt = `Genereer een korte productbeoordeling voor:
Product: ${product.title}
Prijs: €${product.offer?.price?.toFixed(2) || 'Onbekend'}
Rating: ${product.rating ? `${product.rating}/5` : 'Geen rating'}

Geef output als JSON:
{
  "pros": ["pluspunt 1", "pluspunt 2", "pluspunt 3"],
  "cons": ["minpunt 1", "minpunt 2"],
  "verdict": "Kort oordeel in 1-2 zinnen"
}

Regels:
- Schrijf in het ${language === 'nl' ? 'Nederlands' : language === 'de' ? 'Duits' : 'Engels'}
- Wees specifiek en relevant voor dit type product
- Pluspunten moeten positief zijn
- Minpunten moeten eerlijk maar niet te negatief zijn
- Oordeel moet een aanbeveling bevatten`;

      let pros: string[] = [];
      let cons: string[] = [];
      let verdict = '';

      try {
        const reviewResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: 'Je bent een productreviewer. Output alleen JSON.',
          userPrompt: reviewPrompt,
          maxTokens: 500,
          temperature: 0.7,
        });

        const jsonMatch = reviewResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const review = JSON.parse(jsonMatch[0]);
          pros = review.pros || [];
          cons = review.cons || [];
          verdict = review.verdict || '';
        }
      } catch (e) {
        console.warn(`Failed to generate review for ${product.ean}:`, e);
        // Use default values
        pros = ['Goede prijs-kwaliteitverhouding', 'Snel leverbaar'];
        cons = ['Controleer specificaties voor aankoop'];
        verdict = 'Een solide keuze in deze categorie.';
      }

      productsWithReviews.push({
        ean: product.ean,
        title: product.title,
        description: product.description,
        url: product.url,
        imageUrl: product.image?.url,
        price: product.offer?.price,
        originalPrice: product.offer?.strikethroughPrice,
        rating: product.rating,
        deliveryInfo: product.offer?.deliveryDescription,
        pros,
        cons,
        verdict,
        rank: i + 1,
      });

      // Cache product
      await getSupabaseAdmin()
        .from('product_cache')
        .upsert({
          ean: product.ean,
          platform: 'bol.com',
          title: product.title,
          description: product.description,
          image_url: product.image?.url,
          price: product.offer?.price,
          original_price: product.offer?.strikethroughPrice,
          rating: product.rating,
          url: product.url,
          delivery_info: product.offer?.deliveryDescription,
          pros,
          cons,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'ean',
        });
    }

    // Generate HTML for each product card
    const productCardsHtml = productsWithReviews.map(product => {
      return generateProductCardHTML(
        {
          ean: product.ean,
          bolProductId: product.ean,
          title: product.title,
          description: product.description,
          url: product.url,
          image: product.imageUrl ? {
            url: product.imageUrl,
            width: 500,
            height: 500,
          } : undefined,
          rating: product.rating,
          offer: product.price ? {
            price: product.price,
            strikethroughPrice: product.originalPrice,
            deliveryDescription: product.deliveryInfo,
          } : undefined,
        },
        affiliate.site_code || '',
        {
          pros: product.pros,
          cons: product.cons,
          verdict: product.verdict,
          rank: product.rank,
        }
      );
    }).join('\n\n');

    // Generate intro text
    const introPrompt = `Schrijf een korte introductie (2-3 zinnen) voor een top ${list_count} lijst over: "${list_title || search_query}"
Schrijf in het ${language === 'nl' ? 'Nederlands' : language === 'de' ? 'Duits' : 'Engels'}.
Output alleen de tekst, geen HTML tags.`;

    let introText = '';
    try {
      introText = await generateAICompletion({
        task: 'content',
        systemPrompt: 'Je bent een content schrijver.',
        userPrompt: introPrompt,
        maxTokens: 200,
        temperature: 0.7,
      });
    } catch (e) {
      introText = `Bekijk onze selectie van de beste ${search_query} producten.`;
    }

    // Build complete HTML
    const title = list_title || `Top ${list_count} Beste ${search_query}`;
    const completeHtml = `
<div class="product-list-container">
  <h2>${title}</h2>
  <p class="product-list-intro">${introText}</p>
  
  ${productCardsHtml}
  
  <p class="affiliate-disclosure">
    <small>* Dit artikel bevat affiliate links. Als je via deze links een product koopt, ontvangen wij een kleine commissie zonder extra kosten voor jou.</small>
  </p>
</div>

${include_css ? `<style>${productCardCSS}
.product-list-container {
  max-width: 900px;
  margin: 0 auto;
}
.product-list-intro {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}
.affiliate-disclosure {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
}
</style>` : ''}
`.trim();

    return NextResponse.json({
      success: true,
      title,
      intro: introText,
      products: productsWithReviews,
      html: completeHtml,
      css: include_css ? productCardCSS : null,
    });

  } catch (error: any) {
    console.error('Product list generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
