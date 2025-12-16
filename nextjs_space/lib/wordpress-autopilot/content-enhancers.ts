/**
 * Content Enhancers
 * Helper functies voor het automatisch toevoegen van interne links, affiliate links en afbeeldingen
 */

import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import type { InternalLink, AffiliateLink, ContentImage } from './types';

/**
 * Find relevant internal links from existing WordPress content
 */
export async function findInternalLinks(
  siteId: string,
  content: string,
  focusKeyword: string,
  topic: string,
  limit: number = 5
): Promise<InternalLink[]> {
  try {
    console.log('🔗 Finding internal links...');

    // Get existing published content for this site
    const existingContent = await prisma.contentCalendarItem.findMany({
      where: {
        siteId,
        status: 'published',
        publishedUrl: { not: null },
      },
      select: {
        id: true,
        title: true,
        publishedUrl: true,
        focusKeyword: true,
        topic: true,
        secondaryKeywords: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 50, // Analyze last 50 posts
    });

    if (existingContent.length === 0) {
      console.log('   No existing content found for internal linking');
      return [];
    }

    // Use AI to find relevant internal links
    const analysisPrompt = `Je bent een SEO expert. Analyseer de content en identificeer de meest relevante interne links.

NIEUWE CONTENT:
Focus Keyword: ${focusKeyword}
Topic: ${topic}
Content Preview: ${content.substring(0, 1000)}...

BESCHIKBARE ARTIKELEN:
${existingContent
  .map(
    (item, i) => `
${i + 1}. "${item.title}"
   URL: ${item.publishedUrl}
   Focus Keyword: ${item.focusKeyword}
   Topic: ${item.topic}
`
  )
  .join('\n')}

Selecteer de ${limit} meest relevante artikelen voor interne linking.

Voor elk artikel, geef:
1. URL van het artikel
2. Natuurlijke anchor text (contextgepast, niet geforceerd)
3. Het artikel waar het naar linkt
4. Relevantie score (1-10)

Return JSON array:
[
  {
    "url": "URL",
    "anchorText": "natuurlijke anchor text",
    "targetTitle": "Artikel titel",
    "relevanceScore": 8
  }
]

Regels voor anchor text:
- Maak het natuurlijk en contextgepast
- Gebruik variatie (niet altijd exact keyword)
- Maak het klikbaar en interessant
- Vermijd spammy anchor texts
`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'claude-sonnet-4',
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content_response = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content_response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.log('   Failed to parse internal links');
      return [];
    }

    const links: InternalLink[] = JSON.parse(jsonMatch[0]);

    // Add position (will be calculated when inserting into content)
    const linksWithPosition = links.map((link, index) => ({
      ...link,
      position: index * 500, // Spread throughout content
    }));

    console.log(`✅ Found ${linksWithPosition.length} internal links`);

    return linksWithPosition.slice(0, limit);
  } catch (error) {
    console.error('❌ Failed to find internal links:', error);
    return [];
  }
}

/**
 * Find and insert affiliate links
 */
export async function findAffiliateLinks(
  clientId: string,
  content: string,
  topic: string,
  limit: number = 3
): Promise<AffiliateLink[]> {
  try {
    console.log('💰 Finding affiliate links...');

    // Get client's affiliate links
    const affiliateLinks = await prisma.affiliateLink.findMany({
      where: { clientId },
      select: {
        id: true,
        url: true,
        productName: true,
        description: true,
        category: true,
      },
    });

    if (affiliateLinks.length === 0) {
      console.log('   No affiliate links configured');
      return [];
    }

    // Use AI to find relevant affiliate links
    const analysisPrompt = `Je bent een content marketing expert. Analyseer de content en identificeer waar affiliate links natuurlijk passen.

CONTENT:
Topic: ${topic}
Content Preview: ${content.substring(0, 1000)}...

BESCHIKBARE AFFILIATE LINKS:
${affiliateLinks
  .map(
    (link, i) => `
${i + 1}. ${link.productName}
   URL: ${link.url}
   ${link.description || ''}
   Categorie: ${link.category || 'Algemeen'}
`
  )
  .join('\n')}

Selecteer maximaal ${limit} affiliate links die:
1. Relevant zijn voor de content
2. Natuurlijk passen in de context
3. Waarde toevoegen voor de lezer

Voor elk, geef:
- Product ID (uit bovenstaande lijst)
- Natuurlijke anchor text
- Waar in de content dit past (early/middle/late)

Return JSON array:
[
  {
    "id": "affiliate-link-id",
    "anchorText": "natuurlijke link tekst",
    "position": "middle"
  }
]

BELANGRIJK:
- Alleen links die echt relevant zijn
- Maak anchor text natuurlijk (geen "klik hier")
- Voeg waarde toe, geen spam
- Als geen goede match: return lege array []
`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content_response = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content_response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.log('   No relevant affiliate links found');
      return [];
    }

    const selectedLinks: Array<{
      id: string;
      anchorText: string;
      position: string;
    }> = JSON.parse(jsonMatch[0]);

    // Map to full affiliate link objects
    const fullLinks: AffiliateLink[] = selectedLinks
      .map((selected, index) => {
        const affiliate = affiliateLinks.find(a => a.id === selected.id);
        if (!affiliate) return null;

        const positionMap = { early: 500, middle: 1500, late: 2500 };
        const position =
          positionMap[selected.position as keyof typeof positionMap] ||
          1000 + index * 800;

        return {
          id: affiliate.id,
          url: affiliate.url,
          anchorText: selected.anchorText,
          productName: affiliate.productName,
          position,
          disclosure:
            'Deze link bevat een affiliate link. Als je via deze link een aankoop doet, kunnen wij een commissie verdienen zonder extra kosten voor jou.',
        };
      })
      .filter((link): link is AffiliateLink => link !== null);

    console.log(`✅ Found ${fullLinks.length} affiliate links`);

    return fullLinks;
  } catch (error) {
    console.error('❌ Failed to find affiliate links:', error);
    return [];
  }
}

/**
 * Generate images for content
 * This is a placeholder - you'll need to integrate with your AI image generation service
 */
export async function generateContentImages(
  title: string,
  content: string,
  topic: string,
  count: number = 3
): Promise<ContentImage[]> {
  try {
    console.log('🖼️  Generating content images...');

    // Use AI to determine what images are needed
    const imagePrompt = `Je bent een content expert. Analyseer dit artikel en bepaal welke afbeeldingen nodig zijn.

ARTIKEL:
Titel: ${title}
Topic: ${topic}
Content: ${content.substring(0, 800)}...

Bepaal ${count} afbeeldingen die het artikel ondersteunen.

Voor elke afbeelding, geef:
1. Beschrijving van de afbeelding (voor image generation)
2. Alt text (SEO-vriendelijk)
3. Caption (optioneel)
4. Waar in het artikel (early/middle/late)

Return JSON array:
[
  {
    "description": "Gedetailleerde beschrijving voor image generation",
    "alt": "SEO-vriendelijke alt tekst",
    "caption": "Bijschrift indien relevant",
    "position": "middle"
  }
]
`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: imagePrompt }],
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 1500,
    });

    const content_response = response.choices[0]?.message?.content || '[]';
    const jsonMatch = content_response.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.log('   Failed to generate image suggestions');
      return [];
    }

    const imageSuggestions: Array<{
      description: string;
      alt: string;
      caption?: string;
      position: string;
    }> = JSON.parse(jsonMatch[0]);

    // TODO: Integrate with actual image generation service
    // For now, return placeholder images
    const images: ContentImage[] = imageSuggestions.map((suggestion, index) => {
      const positionMap = { early: 300, middle: 1200, late: 2000 };
      const position =
        positionMap[suggestion.position as keyof typeof positionMap] ||
        800 + index * 600;

      return {
        url: `https://upload.wikimedia.org/wikipedia/commons/e/e0/PlaceholderLC.png`,
        alt: suggestion.alt,
        caption: suggestion.caption,
        position,
        source: 'generated',
      };
    });

    console.log(`✅ Generated ${images.length} image placeholders`);
    console.log(
      '   Note: Integrate with actual image generation service for production'
    );

    return images;
  } catch (error) {
    console.error('❌ Failed to generate images:', error);
    return [];
  }
}

/**
 * Insert links and images into content at optimal positions
 */
export function insertLinksAndImages(
  htmlContent: string,
  internalLinks: InternalLink[],
  affiliateLinks: AffiliateLink[],
  images: ContentImage[]
): string {
  let content = htmlContent;

  // Sort all items by position
  const allItems = [
    ...internalLinks.map(l => ({ type: 'internal', item: l, pos: l.position })),
    ...affiliateLinks.map(l => ({ type: 'affiliate', item: l, pos: l.position })),
    ...images.map(i => ({ type: 'image', item: i, pos: i.position })),
  ].sort((a, b) => a.pos - b.pos);

  // Find paragraph tags to insert content
  const paragraphs = content.match(/<p>.*?<\/p>/gs) || [];

  if (paragraphs.length === 0) {
    console.log('   No paragraphs found in content');
    return content;
  }

  let insertCount = 0;
  const totalItems = allItems.length;
  const paragraphInterval = Math.max(
    1,
    Math.floor(paragraphs.length / (totalItems + 1))
  );

  allItems.forEach((item, index) => {
    const targetParagraphIndex = Math.min(
      (index + 1) * paragraphInterval,
      paragraphs.length - 1
    );
    const targetParagraph = paragraphs[targetParagraphIndex];

    if (!targetParagraph) return;

    let insertion = '';

    if (item.type === 'internal') {
      const link = item.item as InternalLink;
      insertion = `<p><a href="${link.url}" rel="noopener">${link.anchorText}</a></p>`;
    } else if (item.type === 'affiliate') {
      const link = item.item as AffiliateLink;
      insertion = `<p><a href="${link.url}" rel="nofollow noopener sponsored" target="_blank">${link.anchorText}</a></p>
<p><em style="font-size: 0.9em; color: #666;">${link.disclosure}</em></p>`;
    } else if (item.type === 'image') {
      const img = item.item as ContentImage;
      insertion = `
<figure style="margin: 2em 0;">
  <img src="${img.url}" alt="${img.alt}" style="max-width: 100%; height: auto;" />
  ${img.caption ? `<figcaption style="font-size: 0.9em; color: #666; margin-top: 0.5em;">${img.caption}</figcaption>` : ''}
</figure>
`;
    }

    // Insert after the target paragraph
    content = content.replace(
      targetParagraph,
      targetParagraph + '\n' + insertion
    );
    insertCount++;
  });

  console.log(
    `✅ Inserted ${insertCount} items into content (${internalLinks.length} internal, ${affiliateLinks.length} affiliate, ${images.length} images)`
  );

  return content;
}

/**
 * Main function to enhance content with all features
 */
export async function enhanceContent(
  siteId: string,
  clientId: string,
  htmlContent: string,
  title: string,
  focusKeyword: string,
  topic: string,
  includeImages: boolean = true
): Promise<{
  enhancedContent: string;
  internalLinks: InternalLink[];
  affiliateLinks: AffiliateLink[];
  images: ContentImage[];
}> {
  console.log('🚀 Enhancing content with links and images...');

  // Find internal links (3-5 links)
  const internalLinks = await findInternalLinks(
    siteId,
    htmlContent,
    focusKeyword,
    topic,
    5
  );

  // Find affiliate links (2-3 links)
  const affiliateLinks = await findAffiliateLinks(
    clientId,
    htmlContent,
    topic,
    3
  );

  // Generate images if enabled (2-4 images)
  const images = includeImages
    ? await generateContentImages(title, htmlContent, topic, 3)
    : [];

  // Insert everything into content
  const enhancedContent = insertLinksAndImages(
    htmlContent,
    internalLinks,
    affiliateLinks,
    images
  );

  console.log('✅ Content enhancement completed');

  return {
    enhancedContent,
    internalLinks,
    affiliateLinks,
    images,
  };
}
