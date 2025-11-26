
/**
 * AI-Powered Bol.com Product Finder
 * Combineert web research met Bol.com API om de beste producten te vinden
 */

import { chatCompletion } from './aiml-api';
import {
  searchBolcomProducts,
  getBolcomProduct,
  getBolcomOffer,
  getBolcomRating,
  getBolcomMedia,
  generateBolcomAffiliateLink,
  type BolcomCredentials,
  type BolcomProduct,
} from './bolcom-api';
import { performWebResearch } from './web-research-v2';

export interface ProductResearchRequest {
  query: string; // bijv. "beste noise cancelling koptelefoon 2025"
  keywords?: string[]; // Extra keywords voor research
  maxProducts?: number; // Max aantal producten (default: 5)
  priceRange?: { min?: number; max?: number };
  category?: string; // Categorie hint
}

export interface EnrichedProduct {
  // Bol.com data
  ean: string;
  bolProductId: number;
  title: string;
  description: string;
  url: string;
  affiliateUrl: string;
  image: {
    url: string;
    width: number;
    height: number;
  };
  price: number;
  strikethroughPrice?: number;
  deliveryInfo: string;
  rating?: number;
  ratingCount?: number;
  seller: string;
  
  // AI research data
  pros: string[]; // Voor- en nadelen van internet research
  cons: string[];
  summary: string; // Korte samenvatting waarom dit product goed is
  useCases: string[]; // Waarvoor is dit product geschikt
  targetAudience: string; // Voor wie is dit product
  
  // Ranking info
  overallScore: number; // 1-10 score
  rank: number; // Positie in de lijst (1 = beste)
  
  // Specificaties (van Bol.com)
  specifications?: Array<{ name: string; value: string }>;
}

export interface ProductResearchResult {
  query: string;
  products: EnrichedProduct[];
  researchSummary: string; // Algemene conclusie over de producten
  buyingGuide?: string; // Koopadvies gebaseerd op research
}

/**
 * Zoek en analyseer producten met AI (SNELLE VERSIE voor Deep Research Writer)
 */
export async function findBestProducts(
  request: ProductResearchRequest,
  credentials: BolcomCredentials,
  onProgress?: (step: string) => void
): Promise<ProductResearchResult> {
  try {
    const maxProducts = Math.min(request.maxProducts || 3, 3);
    
    onProgress?.(`🔍 Zoeken naar ${maxProducts} producten op Bol.com...`);

    // Direct zoeken op Bol.com zonder eerst web research
    // Dit is veel sneller en voor Deep Research Writer voldoende
    const searchQuery = request.query;
    
    const searchResult = await searchBolcomProducts(searchQuery, credentials, {
      resultsPerPage: maxProducts * 2, // Zoek wat meer voor betere keuze
      sortBy: 'rating', // Sorteer op rating voor beste producten
    });

    if (searchResult.results.length === 0) {
      throw new Error('Geen producten gevonden');
    }

    onProgress?.(`✅ ${searchResult.results.length} producten gevonden, data ophalen...`);

    // Fetch details voor de beste producten (parallel voor snelheid)
    const productPromises = searchResult.results
      .slice(0, maxProducts)
      .map(async (result) => {
        try {
          // Haal product details op
          const product = await getBolcomProduct(
            result.ean,
            credentials,
            {
              includeOffer: true,
              includeRating: true,
              includeMedia: true,
            }
          );
          
          // ✅ AFBEELDING OPHALEN - MEERDERE BRONNEN PROBEREN
          let imageUrl = '';
          let imageWidth = 400;
          let imageHeight = 400;
          
          // Probeer media data op te halen voor hogere kwaliteit
          try {
            const mediaData = await getBolcomMedia(result.ean, credentials);
            
            // Prioriteit 1: Media API renditions (hoogste kwaliteit)
            if (mediaData?.images?.[0]?.renditions?.[0]?.url) {
              imageUrl = mediaData.images[0].renditions[0].url;
              imageWidth = mediaData.images[0].renditions[0].width || 400;
              imageHeight = mediaData.images[0].renditions[0].height || 400;
              console.log(`✅ [Image] Media API rendition: ${imageUrl.substring(0, 80)}...`);
            }
          } catch (mediaError) {
            console.warn(`Could not fetch media for ${result.ean}:`, mediaError);
          }
          
          // Prioriteit 3: Product image (from search result)
          if (!imageUrl && product.image?.url) {
            imageUrl = product.image.url;
            imageWidth = product.image.width || 400;
            imageHeight = product.image.height || 400;
            console.log(`✅ [Image] Product image: ${imageUrl.substring(0, 80)}...`);
          }
          
          // Prioriteit 4: Search result image (fallback)
          if (!imageUrl && result.image?.url) {
            imageUrl = result.image.url;
            imageWidth = result.image.width || 400;
            imageHeight = result.image.height || 400;
            console.log(`✅ [Image] Search result: ${imageUrl.substring(0, 80)}...`);
          }
          
          // Log als GEEN afbeelding gevonden
          if (!imageUrl) {
            console.error(`❌ [Image] GEEN AFBEELDING GEVONDEN voor: ${product.title} (EAN: ${result.ean})`);
          }
          
          return { 
            product, 
            searchTerm: searchQuery,
            imageData: { url: imageUrl, width: imageWidth, height: imageHeight }
          };
        } catch (error) {
          console.error(`Error fetching product ${result.ean}:`, error);
          return null;
        }
      });

    const bolcomResults = (await Promise.all(productPromises)).filter(r => r !== null);

    if (bolcomResults.length === 0) {
      throw new Error('Kon geen productgegevens ophalen');
    }

    onProgress?.('🤖 AI genereert product analyses...');

    // Genereer analyses voor alle producten in één keer (veel sneller dan individueel)
    const allProductTitles = bolcomResults.map((r, i) => 
      `${i + 1}. ${r!.product.title} (€${r!.product.offer?.price || 0})`
    ).join('\n');

    const batchAnalysisPrompt = `
Genereer voor elk van deze producten een korte analyse voor: "${request.query}"

PRODUCTEN:
${allProductTitles}

⚠️ BELANGRIJK: 
- Selecteer ALLEEN producten die DIRECT RELEVANT zijn voor "${request.query}"
- Filter producten die NIET passen (bijv. boeken als er om fysieke producten wordt gevraagd)
- Zorg voor DIVERSITEIT in producttypen - niet alleen één categorie
- Geef lagere scores (1-3) aan irrelevante producten

Geef voor ELK product in JSON formaat:
{
  "products": [
    {
      "productNumber": 1,
      "relevant": true, (false als product niet relevant is)
      "relevanceReason": "Dit product past goed omdat...", (uitleg waarom wel/niet relevant)
      "pros": ["voordeel 1", "voordeel 2", "voordeel 3"], (3-4 punten)
      "cons": ["nadeel 1", "nadeel 2"], (2-3 punten)
      "summary": "Korte samenvatting waarom dit product goed is (1-2 zinnen)",
      "overallScore": 8.5 (1-10, lage score voor irrelevante producten)
    },
    ...
  ]
}

Wees strikt in relevantie beoordeling. Focus op de belangrijkste punten.
`;

    const batchAnalysisResponse = await chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: batchAnalysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    let productAnalyses: any[] = [];
    try {
      const analysisContent = batchAnalysisResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      const parsedData = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
      productAnalyses = parsedData.products || [];
    } catch (e) {
      console.error('Failed to parse product analyses:', e);
      // Fallback: lege analyses
      productAnalyses = bolcomResults.map((_, i) => ({
        productNumber: i + 1,
        pros: [],
        cons: [],
        summary: '',
        overallScore: 7,
      }));
    }

    // Build enriched products
    const enrichedProducts: EnrichedProduct[] = [];

    for (let i = 0; i < bolcomResults.length; i++) {
      const result = bolcomResults[i];
      if (!result) continue;

      const product = result.product;
      const analysis = productAnalyses[i] || {
        relevant: true,
        relevanceReason: '',
        pros: [],
        cons: [],
        summary: '',
        overallScore: 7,
      };

      // Skip irrelevant products or products with low score
      if (analysis.relevant === false || analysis.overallScore < 4) {
        console.log(`[BolcomProductFinder] Skipping irrelevant product: ${product.title} (score: ${analysis.overallScore})`);
        continue;
      }

      // Use the imageData we collected earlier (with multiple fallbacks)
      const imageData = result.imageData || { 
        url: product.image?.url || '', 
        width: product.image?.width || 400, 
        height: product.image?.height || 400 
      };

      enrichedProducts.push({
        ean: product.ean,
        bolProductId: product.bolProductId,
        title: product.title,
        description: product.description || '',
        url: product.url,
        affiliateUrl: generateBolcomAffiliateLink(
          product.url,
          credentials.affiliateId,
          product.title
        ),
        image: {
          url: imageData.url,
          width: imageData.width,
          height: imageData.height,
        },
        price: product.offer?.price || 0,
        strikethroughPrice: product.offer?.strikethroughPrice,
        deliveryInfo: product.offer?.deliveryDescription || '',
        rating: product.rating,
        ratingCount: 0,
        seller: 'bol.com',
        pros: analysis.pros || [],
        cons: analysis.cons || [],
        summary: analysis.summary || product.description?.substring(0, 150) || '',
        useCases: [],
        targetAudience: '',
        overallScore: analysis.overallScore || product.rating || 7,
        rank: i + 1,
        specifications: product.specificationGroups?.[0]?.specifications,
      });
    }

    // Check if we have enough relevant products
    if (enrichedProducts.length < maxProducts) {
      console.log(`[BolcomProductFinder] Only ${enrichedProducts.length} relevant products found (requested: ${maxProducts})`);
    }

    // Sort by overallScore
    enrichedProducts.sort((a, b) => b.overallScore - a.overallScore);
    enrichedProducts.forEach((product, index) => {
      product.rank = index + 1;
    });

    onProgress?.(`✅ ${enrichedProducts.length} relevante producten klaar!`);

    return {
      query: request.query,
      products: enrichedProducts,
      researchSummary: `Gevonden producten voor: ${request.query}`,
      buyingGuide: '',
    };
  } catch (error) {
    console.error('Product research error:', error);
    throw error;
  }
}

/**
 * Quick product search zonder uitgebreide research
 * Handig voor snel producten toevoegen
 */
export async function quickProductSearch(
  searchTerm: string,
  credentials: BolcomCredentials,
  maxResults: number = 3
): Promise<EnrichedProduct[]> {
  try {
    const searchResult = await searchBolcomProducts(searchTerm, credentials, {
      resultsPerPage: maxResults,
      sortBy: 'relevance',
    });

    const products: EnrichedProduct[] = [];

    for (const product of searchResult.results) {
      try {
        // Get detailed info - use base product info from search
        const baseProduct = product;
        
        // Explicitly fetch offer, media, and rating data
        let offerData;
        let mediaData;
        let ratingData;
        
        try {
          offerData = await getBolcomOffer(product.ean, credentials);
        } catch (e) {
          console.warn(`Could not fetch offer for ${product.ean}:`, e);
        }
        
        try {
          mediaData = await getBolcomMedia(product.ean, credentials);
        } catch (e) {
          console.warn(`Could not fetch media for ${product.ean}:`, e);
        }
        
        try {
          ratingData = await getBolcomRating(product.ean, credentials);
        } catch (e) {
          console.warn(`Could not fetch rating for ${product.ean}:`, e);
        }

        // Use base product info from search result, fallback to search result data
        const price = offerData?.price || baseProduct.offer?.price || 0;
        
        // ✅ AFBEELDING OPHALEN - MEERDERE BRONNEN PROBEREN
        let imageUrl = '';
        let imageWidth = 200;
        let imageHeight = 200;
        
        // Prioriteit 1: Media API renditions (hoogste kwaliteit)
        if (mediaData?.images?.[0]?.renditions?.[0]?.url) {
          imageUrl = mediaData.images[0].renditions[0].url;
          imageWidth = mediaData.images[0].renditions[0].width || 200;
          imageHeight = mediaData.images[0].renditions[0].height || 200;
          console.log(`✅ [Image] Media API rendition: ${imageUrl.substring(0, 80)}...`);
        } 
        // Prioriteit 2: Search result image
        else if (baseProduct.image?.url) {
          imageUrl = baseProduct.image.url;
          imageWidth = baseProduct.image.width || 200;
          imageHeight = baseProduct.image.height || 200;
          console.log(`✅ [Image] Search result: ${imageUrl.substring(0, 80)}...`);
        }
        
        // Log als GEEN afbeelding gevonden
        if (!imageUrl) {
          console.error(`❌ [Image] GEEN AFBEELDING GEVONDEN voor: ${baseProduct.title} (EAN: ${product.ean})`);
          console.error(`   - mediaData:`, mediaData ? 'available' : 'null');
          console.error(`   - baseProduct.image:`, baseProduct.image || 'null');
        }
        const rating = ratingData?.averageRating || baseProduct.rating;

        products.push({
          ean: baseProduct.ean,
          bolProductId: baseProduct.bolProductId,
          title: baseProduct.title,
          description: baseProduct.description || '',
          url: baseProduct.url,
          affiliateUrl: generateBolcomAffiliateLink(
            baseProduct.url,
            credentials.affiliateId,
            baseProduct.title // Include product name for tracking
          ),
          image: {
            url: imageUrl,
            width: imageWidth,
            height: imageHeight,
          },
          price: price,
          strikethroughPrice: offerData?.strikethroughPrice || baseProduct.offer?.strikethroughPrice,
          deliveryInfo: offerData?.deliveryDescription || baseProduct.offer?.deliveryDescription || '',
          rating: rating,
          ratingCount: 0,
          seller: offerData?.seller?.name || 'bol.com',
          pros: [],
          cons: [],
          summary: baseProduct.description || '',
          useCases: [],
          targetAudience: '',
          overallScore: rating || 7,
          rank: 0,
          specifications: baseProduct.specificationGroups?.[0]?.specifications,
        });
      } catch (error) {
        console.error(`Error fetching product details for ${product.ean}:`, error);
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return products;
  } catch (error) {
    console.error('Quick product search error:', error);
    throw error;
  }
}
