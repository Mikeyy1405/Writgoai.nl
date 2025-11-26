
/**
 * AI Product Optimizer
 * Generates optimized product descriptions, titles, and metadata
 */

import { chatCompletion } from './aiml-api';

export interface ProductOptimizationOptions {
  originalName: string;
  originalDescription?: string;
  originalShortDescription?: string;
  price?: string;
  category?: string;
  keywords?: string[];
  targetAudience?: string;
  language?: 'NL' | 'EN' | 'DE';
}

export interface OptimizedProduct {
  name: string;
  description: string;
  short_description: string;
  seo_title?: string;
  meta_description?: string;
  tags?: string[];
}

/**
 * Optimize product with AI
 */
export async function optimizeProduct(
  options: ProductOptimizationOptions
): Promise<OptimizedProduct> {
  const {
    originalName,
    originalDescription,
    originalShortDescription,
    price,
    category,
    keywords = [],
    targetAudience,
    language = 'NL',
  } = options;

  const languageInstructions = {
    NL: 'Schrijf in het Nederlands',
    EN: 'Write in English',
    DE: 'Schreiben Sie auf Deutsch',
  };

  const prompt = `Je bent een professionele e-commerce copywriter. Optimaliseer de volgende productinformatie voor betere conversie en SEO.

${languageInstructions[language]}.

ORIGINEEL PRODUCT:
Naam: ${originalName}
${originalDescription ? `Beschrijving: ${originalDescription}` : ''}
${originalShortDescription ? `Korte beschrijving: ${originalShortDescription}` : ''}
${price ? `Prijs: €${price}` : ''}
${category ? `Categorie: ${category}` : ''}
${keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''}
${targetAudience ? `Doelgroep: ${targetAudience}` : ''}

INSTRUCTIES:
1. Maak een pakkende productnaam (max 70 karakters)
2. Schrijf een uitgebreide productbeschrijving (300-500 woorden) die:
   - De voordelen benadrukt (niet alleen features)
   - SEO-vriendelijk is met natuurlijke keyword integratie
   - Een duidelijke structuur heeft met koppen en bullets
   - Een call-to-action bevat
3. Maak een korte beschrijving (100-150 karakters) voor in overzichten
4. Genereer een SEO-geoptimaliseerde titel (max 60 karakters)
5. Schrijf een meta description (150-160 karakters)
6. Stel 5-8 relevante tags voor

Retourneer ALLEEN een JSON object (geen extra tekst) met deze structuur:
{
  "name": "Geoptimaliseerde productnaam",
  "description": "Volledige HTML productbeschrijving met <p>, <h3>, <ul>, <li> tags",
  "short_description": "Korte beschrijving",
  "seo_title": "SEO titel",
  "meta_description": "Meta beschrijving",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  try {
    const response = await chatCompletion({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'claude-sonnet-4-5',
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Parse JSON response
    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const optimized: OptimizedProduct = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!optimized.name || !optimized.description || !optimized.short_description) {
      throw new Error('AI response missing required fields');
    }

    return optimized;
  } catch (error: any) {
    console.error('Product optimization error:', error);
    throw new Error(`Failed to optimize product: ${error.message}`);
  }
}

/**
 * Batch optimize products
 */
export async function batchOptimizeProducts(
  products: ProductOptimizationOptions[],
  onProgress?: (completed: number, total: number) => void
): Promise<OptimizedProduct[]> {
  const optimized: OptimizedProduct[] = [];
  
  for (let i = 0; i < products.length; i++) {
    try {
      const result = await optimizeProduct(products[i]);
      optimized.push(result);
      
      if (onProgress) {
        onProgress(i + 1, products.length);
      }
    } catch (error: any) {
      console.error(`Failed to optimize product ${i + 1}:`, error);
      // Continue with other products
      optimized.push({
        name: products[i].originalName,
        description: products[i].originalDescription || '',
        short_description: products[i].originalShortDescription || '',
      });
    }
  }
  
  return optimized;
}
