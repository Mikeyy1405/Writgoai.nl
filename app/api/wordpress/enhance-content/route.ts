import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { generateArticleImage } from '@/lib/aiml-image-generator';
import { generateAICompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface EnhanceRequest {
  article_id: string;
  content: string;
  action: 'rewrite-text' | 'add-affiliate-links' | 'add-internal-links' | 'add-images' | 'full-enhancement';
  selected_text?: string; // For rewrite-text
  project_id: string;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: EnhanceRequest = await request.json();
    const { article_id, content, action, selected_text, project_id } = body;

    if (!article_id || !content || !action || !project_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get article details
    const { data: article } = await supabase
      .from('articles')
      .select('*')
      .eq('id', article_id)
      .single();

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    let result: any = {};

    switch (action) {
      case 'rewrite-text':
        result = await rewriteText(selected_text || content);
        break;

      case 'add-affiliate-links':
        result = await addAffiliateLinks(content, project_id, supabase);
        break;

      case 'add-internal-links':
        result = await addInternalLinks(content, article_id, project_id, supabase);
        break;

      case 'add-images':
        result = await addImages(content, article.title, article.focus_keyword, project_id, article_id, supabase);
        break;

      case 'full-enhancement':
        result = await fullEnhancement(content, article, project_id, article_id, supabase);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Content enhancement error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Rewrite text using AI
 */
async function rewriteText(text: string): Promise<{ rewritten_text: string }> {
  const rewrittenText = await generateAICompletion({
    systemPrompt: 'Je bent een expert contentschrijver die teksten herschrijft om ze boeiender, professioneler en SEO-vriendelijker te maken. Je behoudt altijd de kernboodschap en belangrijkste informatie. Je schrijft uitsluitend in het Nederlands.',
    userPrompt: `Herschrijf de volgende tekst om deze boeiender, professioneler en SEO-vriendelijker te maken. Behoud de kernboodschap en belangrijkste informatie.

Tekst om te herschrijven:
${text}

Geef alleen de herschreven tekst terug, zonder extra uitleg.`,
    task: 'content',
    temperature: 0.7,
    maxTokens: 2000,
  });

  return { rewritten_text: rewrittenText };
}

/**
 * Add bol.com affiliate links to content
 */
async function addAffiliateLinks(content: string, project_id: string, supabase: any): Promise<{ enhanced_content: string; links_added: number }> {
  // Get affiliate configuration
  const { data: affiliates, error: affiliateError } = await supabase
    .from('project_affiliates')
    .select('*')
    .eq('project_id', project_id)
    .eq('platform', 'bol.com')
    .eq('is_active', true);

  if (affiliateError) {
    console.error('Error fetching affiliates:', affiliateError);
    return { enhanced_content: content, links_added: 0 };
  }

  if (!affiliates || affiliates.length === 0) {
    return { enhanced_content: content, links_added: 0 };
  }

  const affiliate = affiliates[0];

  // Use AI to identify products that could benefit from affiliate links
  const responseText = await generateAICompletion({
    systemPrompt: 'Je bent een expert in het identificeren van producten in content die geschikt zijn voor affiliate links naar bol.com. Je geeft altijd een geldige JSON array terug.',
    userPrompt: `Analyseer de volgende HTML content en identificeer producten of items die kunnen worden gelinkt naar bol.com.

Voor elk gevonden product, geef terug:
1. Het product/item
2. Een voorgestelde zoekterm voor bol.com
3. De exacte tekst in de content die moet worden gelinkt

Content:
${content}

Retourneer een JSON array met formaat:
[
  {
    "product": "naam van het product",
    "search_term": "zoekterm voor bol.com",
    "text_to_link": "exacte tekst uit content"
  }
]

Als er geen producten zijn, retourneer een lege array [].`,
    task: 'content',
    temperature: 0.5,
    maxTokens: 4000,
  });

  let products: Array<{ product: string; search_term: string; text_to_link: string }> = [];

  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      products = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response for affiliate links:', e);
    return { enhanced_content: content, links_added: 0 };
  }

  let enhancedContent = content;
  let linksAdded = 0;

  // Add affiliate links
  for (const item of products) {
    const bolUrl = `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(item.search_term)}`;
    const affiliateUrl = `https://partner.bol.com/click/click?p=2&t=url&s=${affiliate.site_code}&f=TXL&url=${encodeURIComponent(bolUrl)}&name=${encodeURIComponent(item.product)}`;

    // Replace plain text with affiliate link
    const linkHtml = `<a href="${affiliateUrl}" target="_blank" rel="noopener sponsored" title="${item.product}">${item.text_to_link}</a>`;

    // Only replace if the text isn't already linked
    const regex = new RegExp(`(?<!<a[^>]*>)${escapeRegExp(item.text_to_link)}(?![^<]*<\/a>)`, 'g');
    const newContent = enhancedContent.replace(regex, linkHtml);

    if (newContent !== enhancedContent) {
      enhancedContent = newContent;
      linksAdded++;
    }
  }

  return { enhanced_content: enhancedContent, links_added: linksAdded };
}

/**
 * Add internal links to content
 */
async function addInternalLinks(content: string, current_article_id: string, project_id: string, supabase: any): Promise<{ enhanced_content: string; links_added: number }> {
  // Get other articles from the same project
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, slug, content, focus_keyword')
    .eq('project_id', project_id)
    .neq('id', current_article_id)
    .limit(50);

  if (!articles || articles.length === 0) {
    return { enhanced_content: content, links_added: 0 };
  }

  // Prepare article context for AI
  const articlesList = articles.map((a: any) => ({
    title: a.title,
    slug: a.slug,
    keyword: a.focus_keyword || '',
    excerpt: a.content.substring(0, 200)
  }));

  // Use AI to suggest relevant internal links
  const responseText = await generateAICompletion({
    systemPrompt: 'Je bent een expert in het identificeren van interne link opportuniteiten in content. Je geeft altijd een geldige JSON array terug met alleen relevante, logische link suggesties.',
    userPrompt: `Analyseer de volgende HTML content en identificeer plaatsen waar relevante interne links kunnen worden toegevoegd.

Beschikbare artikelen om naar te linken:
${JSON.stringify(articlesList, null, 2)}

Content:
${content}

Voor elke relevante interne link opportuniteit, geef terug:
1. De exacte tekst die moet worden gelinkt
2. De slug van het artikel (uit de lijst hierboven)
3. Een korte reden waarom deze link relevant is

Retourneer een JSON array met formaat:
[
  {
    "text_to_link": "exacte tekst uit content",
    "target_slug": "artikel-slug",
    "reason": "waarom relevant"
  }
]

Voeg alleen links toe waar het echt logisch en relevant is. Maximum 5 links. Als er geen goede matches zijn, retourneer een lege array [].`,
    task: 'content',
    temperature: 0.5,
    maxTokens: 4000,
  });

  let linkOpportunities: Array<{ text_to_link: string; target_slug: string; reason: string }> = [];

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      linkOpportunities = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response for internal links:', e);
    return { enhanced_content: content, links_added: 0 };
  }

  let enhancedContent = content;
  let linksAdded = 0;

  // Add internal links
  for (const opportunity of linkOpportunities) {
    const targetArticle = articles.find((a: any) => a.slug === opportunity.target_slug);
    if (!targetArticle) continue;

    const linkUrl = `/blog/${opportunity.target_slug}`;
    const linkHtml = `<a href="${linkUrl}" title="${targetArticle.title}">${opportunity.text_to_link}</a>`;

    // Only replace if the text isn't already linked
    const regex = new RegExp(`(?<!<a[^>]*>)${escapeRegExp(opportunity.text_to_link)}(?![^<]*<\/a>)`, 'g');
    const newContent = enhancedContent.replace(regex, linkHtml);

    if (newContent !== enhancedContent) {
      enhancedContent = newContent;
      linksAdded++;
    }
  }

  return { enhanced_content: enhancedContent, links_added: linksAdded };
}

/**
 * Add images to content
 */
async function addImages(content: string, title: string, focusKeyword: string, project_id: string, article_id: string, supabase: any): Promise<{ enhanced_content: string; images_added: number }> {
  // Use AI to identify sections that need images
  const responseText = await generateAICompletion({
    systemPrompt: 'Je bent een expert in het identificeren van secties in content waar afbeeldingen de leeservaring verbeteren. Je geeft altijd een geldige JSON array terug.',
    userPrompt: `Analyseer de volgende HTML content en identificeer 3-5 plaatsen waar een afbeelding de content zou verbeteren.

Content:
${content}

Voor elke afbeelding, geef terug:
1. Een beschrijvende prompt voor afbeelding generatie
2. De sectie waar de afbeelding moet worden toegevoegd (eerste 50 karakters van de sectie)

Retourneer een JSON array met formaat:
[
  {
    "prompt": "beschrijving voor afbeelding",
    "section_start": "eerste 50 karakters van sectie"
  }
]

Maximum 3 afbeeldingen. Focus op belangrijke secties die visuele ondersteuning nodig hebben.`,
    task: 'content',
    temperature: 0.5,
    maxTokens: 2000,
  });

  let imageOpportunities: Array<{ prompt: string; section_start: string }> = [];

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      imageOpportunities = JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse AI response for images:', e);
    return { enhanced_content: content, images_added: 0 };
  }

  let enhancedContent = content;
  let imagesAdded = 0;

  // Generate and insert images
  for (const opportunity of imageOpportunities) {
    try {
      const imageUrl = await generateArticleImage(opportunity.prompt, 'photorealistic');

      if (imageUrl) {
        // Save to media table
        await supabase.from('media').insert({
          project_id,
          article_id,
          type: 'image',
          url: imageUrl,
          prompt: opportunity.prompt,
          model: 'aiml-flux-schnell',
          status: 'generated',
        });

        // Find insertion point
        const insertionIndex = enhancedContent.indexOf(opportunity.section_start);
        if (insertionIndex !== -1) {
          const imgTag = `\n<img src="${imageUrl}" alt="${opportunity.prompt}" class="article-image" />\n`;
          enhancedContent = enhancedContent.slice(0, insertionIndex) + imgTag + enhancedContent.slice(insertionIndex);
          imagesAdded++;
        }
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    }
  }

  return { enhanced_content: enhancedContent, images_added: imagesAdded };
}

/**
 * Full content enhancement (all features)
 */
async function fullEnhancement(content: string, article: any, project_id: string, article_id: string, supabase: any): Promise<any> {
  let enhancedContent = content;
  let totalStats = {
    affiliate_links: 0,
    internal_links: 0,
    images: 0,
  };

  // 1. Add affiliate links
  const affiliateResult = await addAffiliateLinks(enhancedContent, project_id, supabase);
  enhancedContent = affiliateResult.enhanced_content;
  totalStats.affiliate_links = affiliateResult.links_added;

  // 2. Add internal links
  const internalResult = await addInternalLinks(enhancedContent, article_id, project_id, supabase);
  enhancedContent = internalResult.enhanced_content;
  totalStats.internal_links = internalResult.links_added;

  // 3. Add images
  const imagesResult = await addImages(enhancedContent, article.title, article.focus_keyword, project_id, article_id, supabase);
  enhancedContent = imagesResult.enhanced_content;
  totalStats.images = imagesResult.images_added;

  return {
    enhanced_content: enhancedContent,
    stats: totalStats,
  };
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
