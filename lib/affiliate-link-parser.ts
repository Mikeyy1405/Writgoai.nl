
import aimlAPI from './aiml-api';

export interface ParsedAffiliateLink {
  url: string;
  anchorText: string;
  category?: string;
  keywords: string[];
}

/**
 * Parse bulk affiliate links from text
 * Supports formats like:
 * Category Name
 * Product: https://example.com/product/...
 * Product: https://example.com/another-product/...
 */
export async function parseBulkAffiliateLinks(
  text: string
): Promise<ParsedAffiliateLink[]> {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const results: ParsedAffiliateLink[] = [];
  
  let currentCategory: string | undefined;

  for (const line of lines) {
    // Check if line is a URL (starts with http or contains ://)
    const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
    
    if (urlMatch) {
      const url = urlMatch[1];
      
      // Extract potential anchor text from URL
      const anchorText = extractAnchorTextFromUrl(url, currentCategory);
      const keywords = await generateKeywordsForUrl(url, anchorText, currentCategory);
      
      results.push({
        url,
        anchorText,
        category: currentCategory,
        keywords,
      });
    } else if (line && !line.toLowerCase().startsWith('product')) {
      // This line is likely a category
      currentCategory = line;
    }
  }

  return results;
}

/**
 * Extract a readable anchor text from URL
 */
function extractAnchorTextFromUrl(url: string, category?: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Try to find a product name in the path
    for (const part of pathParts) {
      if (part.includes('_') || part.includes('-')) {
        // This looks like a product name
        const cleaned = part
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/\+/g, ' ')
          .replace(/%20/g, ' ')
          .replace(/\d+/g, '') // Remove numbers
          .trim();
        
        if (cleaned.length > 5) {
          return cleaned
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        }
      }
    }
    
    // Fallback to category if available
    if (category) {
      return category;
    }
    
    // Last fallback to domain
    return urlObj.hostname.replace('www.', '').split('.')[0];
  } catch (error) {
    return category || 'Link';
  }
}

/**
 * Generate relevant keywords using AI
 */
async function generateKeywordsForUrl(
  url: string,
  anchorText: string,
  category?: string
): Promise<string[]> {
  try {
    const prompt = `Generate 3-5 relevant Dutch keywords for this affiliate link.

URL: ${url}
Anchor Text: ${anchorText}
Category: ${category || 'Algemeen'}

Return ONLY a comma-separated list of keywords, nothing else.
Example: yoga, meditatie, mindfulness, ontspanning`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a keyword extraction expert. Generate relevant Dutch keywords for affiliate links.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 2)
      .slice(0, 5);

    return keywords.length > 0 ? keywords : [anchorText.toLowerCase()];
  } catch (error) {
    console.error('[Affiliate Parser] Error generating keywords:', error);
    // Fallback keywords
    const fallback = [anchorText.toLowerCase()];
    if (category) {
      fallback.push(category.toLowerCase());
    }
    return fallback;
  }
}

/**
 * Find relevant affiliate links for content
 */
export async function findRelevantAffiliateLinks(
  content: string,
  availableLinks: Array<{ url: string; anchorText: string; keywords: string[] }>,
  maxLinks: number = 3
): Promise<Array<{ url: string; anchorText: string; score: number }>> {
  if (availableLinks.length === 0) return [];

  const contentLower = content.toLowerCase();
  const results: Array<{ url: string; anchorText: string; score: number }> = [];

  for (const link of availableLinks) {
    let score = 0;

    // Check if keywords appear in content
    for (const keyword of link.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (contentLower.includes(keywordLower)) {
        // Count occurrences
        const regex = new RegExp(keywordLower, 'g');
        const matches = contentLower.match(regex);
        score += (matches?.length || 0) * 10;
      }
    }

    // Check if anchor text appears
    if (contentLower.includes(link.anchorText.toLowerCase())) {
      score += 20;
    }

    if (score > 0) {
      results.push({
        url: link.url,
        anchorText: link.anchorText,
        score,
      });
    }
  }

  // Sort by score and return top matches
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxLinks);
}

/**
 * Intelligently integrate affiliate links into content using AI
 * Places links strategically for high conversion
 */
export async function integrateAffiliateLinksWithAI(
  content: string,
  availableLinks: Array<{ 
    url: string; 
    anchorText: string; 
    keywords: string[]; 
    category?: string;
    description?: string;
  }>,
  options: {
    maxLinks?: number;
    strategy?: 'natural' | 'aggressive' | 'subtle';
  } = {}
): Promise<string> {
  if (availableLinks.length === 0) {
    return content;
  }

  const maxLinks = options.maxLinks || 3;
  const strategy = options.strategy || 'natural';

  try {
    // Eerst vind relevante links
    const relevantLinks = await findRelevantAffiliateLinks(
      content,
      availableLinks,
      maxLinks
    );

    if (relevantLinks.length === 0) {
      console.log('[Affiliate Integration] No relevant links found');
      return content;
    }

    console.log(`[Affiliate Integration] Found ${relevantLinks.length} relevant links`);

    // Gebruik AI om links strategisch te plaatsen
    const prompt = `Je bent een expert in affiliate marketing en content optimalisatie. Je taak is om affiliate links NATUURLIJK en STRATEGISCH in de content te integreren voor maximale conversie.

ORIGINELE CONTENT:
${content}

BESCHIKBARE AFFILIATE LINKS (gebruik EXACT deze URLs):
${relevantLinks.map((link, idx) => `${idx + 1}. [${link.anchorText}](${link.url}) - Relevantie score: ${link.score}`).join('\n')}

STRATEGIE: ${strategy}
${strategy === 'natural' ? '- Plaats links op natuurlijke, contextgebonden momenten\n- Maximaal 3 links in de hele content' : ''}
${strategy === 'aggressive' ? '- Plaats meer links waar mogelijk\n- Focus op product highlights en benefits' : ''}
${strategy === 'subtle' ? '- Minimale links, alleen bij zeer relevante context\n- Zeer subtiele integratie' : ''}

INSTRUCTIES:
1. Behoud ALLE originele content en structuur (headings, paragrafen, etc.)
2. Plaats affiliate links op deze HOOG CONVERTERENDE posities:
   - Na een probleem/vraag die het product oplost
   - Bij het noemen van specifieke producten, cursussen of diensten
   - In lijsten met aanbevelingen
   - Vlak VOOR de conclusie/samenvatting
3. Maak de link tekst NATUURLIJK en contextgericht:
   - "Bekijk [Product Naam] voor meer informatie"
   - "Ontdek de [Product/Cursus]"
   - "[Product] is een uitstekende optie hiervoor"
4. Voeg een subtiele CTA toe waar relevant:
   - "Wil je hier meer over weten?"
   - "Dit kun je direct toepassen met..."
5. GEBRUIK DE EXACTE URLS uit de lijst hierboven
6. Plaats NOOIT meer dan ${maxLinks} links
7. Links moeten LOGISCH passen in de context
8. Geen spam-achtige tekstpatronen

RETURN:
De complete content MET geïntegreerde affiliate links in markdown formaat.
Gebruik dit formaat voor links: [anchor text](url)

Begin DIRECT met de content, geen introductie of uitleg.`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in affiliate marketing en content optimalisatie. Je integreert links op een natuurlijke, niet-opdringerige manier die conversie maximaliseert.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const enhancedContent = response.choices[0].message.content;

    // Verify that links were added
    let linksAdded = 0;
    for (const link of relevantLinks) {
      if (enhancedContent.includes(link.url)) {
        linksAdded++;
      }
    }

    console.log(`[Affiliate Integration] Successfully integrated ${linksAdded} links`);

    return enhancedContent;
  } catch (error) {
    console.error('[Affiliate Integration] Error:', error);
    // Return original content on error
    return content;
  }
}

/**
 * Fetch affiliate links for a project from database
 */
export async function getProjectAffiliateLinks(
  projectId: string
): Promise<Array<{ 
  id: string;
  url: string; 
  anchorText: string; 
  keywords: string[]; 
  category?: string;
  description?: string;
}>> {
  try {
    // Deze functie zou de database moeten queryen
    // Maar dat kan niet direct in deze lib file, dus we returnen empty array
    // De implementatie moet gebeuren in de API route of component die deze functie aanroept
    return [];
  } catch (error) {
    console.error('[Affiliate Links] Error fetching links:', error);
    return [];
  }
}
