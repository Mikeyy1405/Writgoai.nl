
/**
 * Sitemap Loader - Laadt en parsed WordPress sitemap voor interne links
 */

import { prisma } from '@/lib/db';

export interface SitemapPage {
  url: string;
  title: string;
  description?: string;
  type: 'post' | 'page' | 'category' | 'tag' | 'other';
  lastModified?: Date;
}

export interface SitemapData {
  pages: SitemapPage[];
  categories: Array<{ name: string; url: string; count: number }>;
  tags: Array<{ name: string; url: string; count: number }>;
  lastScanned: Date;
  totalPages: number;
}

/**
 * Normaliseert een URL door automatisch https:// toe te voegen als het protocol ontbreekt
 */
function normalizeUrl(url: string): string {
  if (!url) return url;
  url = url.trim();
  if (url.match(/^https?:\/\//i)) {
    return url;
  }
  return `https://${url}`;
}

/**
 * Verwijdert /blog/ uit URLs voor WritgoAI.nl
 * Bijvoorbeeld: https://WritgoAI.nl/blog/keyword → https://WritgoAI.nl/keyword
 */
function normalizeBlogUrl(url: string, websiteUrl: string): string {
  if (!url) return url;
  
  // Check if this is a WritgoAI.nl URL with /blog/ in it
  if (websiteUrl.includes('WritgoAI.nl') && url.includes('/blog/')) {
    // Remove /blog/ from the URL
    url = url.replace('/blog/', '/');
    console.log(`✓ Normalized blog URL: ${url}`);
  }
  
  return url;
}

/**
 * Laadt de sitemap van een WordPress website en extract alle paginas/posts
 */
export async function loadWordPressSitemap(websiteUrl: string, wordpressApiUrl?: string): Promise<SitemapData> {
  // Normaliseer URLs
  websiteUrl = normalizeUrl(websiteUrl);
  if (wordpressApiUrl) {
    wordpressApiUrl = normalizeUrl(wordpressApiUrl);
  }
  
  console.log('Loading sitemap for:', websiteUrl);

  const pages: SitemapPage[] = [];
  const categories: Array<{ name: string; url: string; count: number }> = [];
  const tags: Array<{ name: string; url: string; count: number }> = [];

  try {
    // Method 1: WordPress REST API (preferred)
    if (wordpressApiUrl) {
      console.log('Using WordPress REST API:', wordpressApiUrl);
      
      try {
        // Fetch posts
        const postsResponse = await fetch(`${wordpressApiUrl}/wp-json/wp/v2/posts?per_page=100&_fields=id,link,title,excerpt,modified,categories,tags`, {
          headers: {
            'User-Agent': 'WritgoAI-SitemapBot/1.0',
          },
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });
        
        if (postsResponse.ok) {
          const posts = await postsResponse.json();
          console.log(`✅ Found ${posts.length} posts via REST API`);
          
          posts.forEach((post: any) => {
            pages.push({
              url: normalizeBlogUrl(post.link, websiteUrl),
              title: post.title?.rendered || 'Untitled',
              description: post.excerpt?.rendered?.replace(/<[^>]*>/g, '').slice(0, 200),
              type: 'post',
              lastModified: new Date(post.modified),
            });
          });
        } else {
          console.warn(`⚠️ WordPress API posts endpoint returned ${postsResponse.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch posts from WordPress API:', error);
      }

      try {
        // Fetch pages
        const pagesResponse = await fetch(`${wordpressApiUrl}/wp-json/wp/v2/pages?per_page=100&_fields=id,link,title,excerpt,modified`, {
          headers: {
            'User-Agent': 'WritgoAI-SitemapBot/1.0',
          },
          signal: AbortSignal.timeout(15000),
        });
        
        if (pagesResponse.ok) {
          const wpPages = await pagesResponse.json();
          console.log(`✅ Found ${wpPages.length} pages via REST API`);
          
          wpPages.forEach((page: any) => {
            pages.push({
              url: normalizeBlogUrl(page.link, websiteUrl),
              title: page.title?.rendered || 'Untitled',
              description: page.excerpt?.rendered?.replace(/<[^>]*>/g, '').slice(0, 200),
              type: 'page',
              lastModified: new Date(page.modified),
            });
          });
        } else {
          console.warn(`⚠️ WordPress API pages endpoint returned ${pagesResponse.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch pages from WordPress API:', error);
      }

      try {
        // Fetch categories
        const categoriesResponse = await fetch(`${wordpressApiUrl}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,link,count`, {
          headers: {
            'User-Agent': 'WritgoAI-SitemapBot/1.0',
          },
          signal: AbortSignal.timeout(15000),
        });
        
        if (categoriesResponse.ok) {
          const wpCategories = await categoriesResponse.json();
          console.log(`✅ Found ${wpCategories.length} categories via REST API`);
          
          wpCategories.forEach((cat: any) => {
            const normalizedUrl = normalizeBlogUrl(cat.link, websiteUrl);
            categories.push({
              name: cat.name,
              url: normalizedUrl,
              count: cat.count || 0,
            });
            
            pages.push({
              url: normalizedUrl,
              title: cat.name,
              type: 'category',
            });
          });
        } else {
          console.warn(`⚠️ WordPress API categories endpoint returned ${categoriesResponse.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch categories from WordPress API:', error);
      }

      try {
        // Fetch tags
        const tagsResponse = await fetch(`${wordpressApiUrl}/wp-json/wp/v2/tags?per_page=100&_fields=id,name,link,count`, {
          headers: {
            'User-Agent': 'WritgoAI-SitemapBot/1.0',
          },
          signal: AbortSignal.timeout(15000),
        });
        
        if (tagsResponse.ok) {
          const wpTags = await tagsResponse.json();
          console.log(`✅ Found ${wpTags.length} tags via REST API`);
          
          wpTags.forEach((tag: any) => {
            const normalizedUrl = normalizeBlogUrl(tag.link, websiteUrl);
            tags.push({
              name: tag.name,
              url: normalizedUrl,
              count: tag.count || 0,
            });
            
            pages.push({
              url: normalizedUrl,
              title: tag.name,
              type: 'tag',
            });
          });
        } else {
          console.warn(`⚠️ WordPress API tags endpoint returned ${tagsResponse.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch tags from WordPress API:', error);
      }
    }

    // Method 2: Fallback - Parse XML sitemap
    if (pages.length === 0) {
      console.log('📄 Falling back to XML sitemap parsing');
      
      // Try common sitemap URLs
      const sitemapUrls = [
        `${websiteUrl}/sitemap.xml`,
        `${websiteUrl}/sitemap_index.xml`,
        `${websiteUrl}/wp-sitemap.xml`,
        `${websiteUrl}/sitemap-index.xml`,
        `${websiteUrl}/post-sitemap.xml`,
        `${websiteUrl}/page-sitemap.xml`,
      ];

      for (const sitemapUrl of sitemapUrls) {
        try {
          console.log(`🔍 Trying sitemap URL: ${sitemapUrl}`);
          const response = await fetch(sitemapUrl, {
            headers: {
              'User-Agent': 'WritgoAI-SitemapBot/1.0',
            },
            signal: AbortSignal.timeout(15000),
          });

          if (response.ok) {
            const xml = await response.text();
            console.log(`✅ Found sitemap (${(xml.length / 1024).toFixed(1)}KB), parsing...`);
            
            // Check if this is a sitemap index
            if (xml.includes('<sitemapindex')) {
              console.log('📑 This is a sitemap index, extracting sub-sitemaps...');
              const subSitemapMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
              
              for (const subMatch of subSitemapMatches) {
                const subSitemapUrl = subMatch[1];
                console.log(`🔗 Loading sub-sitemap: ${subSitemapUrl}`);
                
                try {
                  const subResponse = await fetch(subSitemapUrl, {
                    headers: {
                      'User-Agent': 'WritgoAI-SitemapBot/1.0',
                    },
                    signal: AbortSignal.timeout(15000),
                  });
                  
                  if (subResponse.ok) {
                    const subXml = await subResponse.text();
                    const urlMatches = subXml.matchAll(/<url>(.*?)<\/url>/gs);
                    
                    for (const match of urlMatches) {
                      const urlBlock = match[1];
                      const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
                      const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
                      
                      if (locMatch) {
                        const url = locMatch[1];
                        
                        // Extract title from URL
                        const urlParts = url.split('/').filter(p => p);
                        const slug = urlParts[urlParts.length - 1] || '';
                        const title = slug
                          .replace(/-/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());

                        // Determine type from URL structure
                        let type: SitemapPage['type'] = 'other';
                        if (url.includes('/blog/') || url.includes('/artikel/') || url.match(/\/\d{4}\//)) {
                          type = 'post';
                        } else if (url.includes('/category/') || url.includes('/categorie/')) {
                          type = 'category';
                        } else if (url.includes('/tag/')) {
                          type = 'tag';
                        } else if (url !== websiteUrl && url !== websiteUrl + '/') {
                          type = 'page';
                        }

                        pages.push({
                          url: normalizeBlogUrl(url, websiteUrl),
                          title,
                          type,
                          lastModified: lastmodMatch ? new Date(lastmodMatch[1]) : undefined,
                        });
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`⚠️ Failed to load sub-sitemap ${subSitemapUrl}:`, error);
                }
              }
            } else {
              // Regular sitemap - parse directly
              const urlMatches = xml.matchAll(/<url>(.*?)<\/url>/gs);
              for (const match of urlMatches) {
                const urlBlock = match[1];
                const locMatch = urlBlock.match(/<loc>(.*?)<\/loc>/);
                const lastmodMatch = urlBlock.match(/<lastmod>(.*?)<\/lastmod>/);
                
                if (locMatch) {
                  const url = locMatch[1];
                  
                  // Extract title from URL
                  const urlParts = url.split('/').filter(p => p);
                  const slug = urlParts[urlParts.length - 1] || '';
                  const title = slug
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                  // Determine type from URL structure
                  let type: SitemapPage['type'] = 'other';
                  if (url.includes('/blog/') || url.includes('/artikel/') || url.match(/\/\d{4}\//)) {
                    type = 'post';
                  } else if (url.includes('/category/') || url.includes('/categorie/')) {
                    type = 'category';
                  } else if (url.includes('/tag/')) {
                    type = 'tag';
                  } else if (url !== websiteUrl && url !== websiteUrl + '/') {
                    type = 'page';
                  }

                  pages.push({
                    url: normalizeBlogUrl(url, websiteUrl),
                    title,
                    type,
                    lastModified: lastmodMatch ? new Date(lastmodMatch[1]) : undefined,
                  });
                }
              }
            }
            
            console.log(`✅ Parsed ${pages.length} URLs from sitemap(s)`);
            
            if (pages.length > 0) {
              break; // Stop after first successful sitemap with results
            }
          } else {
            console.log(`⚠️ Sitemap returned ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch sitemap from ${sitemapUrl}:`, error);
        }
      }
    }

    // Sort by type and title
    pages.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = { post: 0, page: 1, category: 2, tag: 3, other: 4 };
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.title.localeCompare(b.title);
    });

    const sitemapData: SitemapData = {
      pages,
      categories,
      tags,
      lastScanned: new Date(),
      totalPages: pages.length,
    };

    console.log('Sitemap loading complete:', {
      totalPages: pages.length,
      posts: pages.filter(p => p.type === 'post').length,
      pages: pages.filter(p => p.type === 'page').length,
      categories: categories.length,
      tags: tags.length,
    });

    return sitemapData;

  } catch (error) {
    console.error('Error loading sitemap:', error);
    throw new Error(`Sitemap laden mislukt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update de sitemap voor een project
 */
export async function updateProjectSitemap(projectId: string): Promise<SitemapData> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error('Project niet gevonden');
  }

  if (!project.websiteUrl) {
    throw new Error('Geen website URL geconfigureerd voor dit project');
  }

  console.log('Updating sitemap for project:', project.name);

  const sitemapData = await loadWordPressSitemap(
    project.websiteUrl,
    project.wordpressUrl || undefined
  );

  // Save to database
  await prisma.project.update({
    where: { id: projectId },
    data: {
      sitemap: sitemapData as any,
      sitemapScannedAt: new Date(),
    },
  });

  console.log('Sitemap saved to database');

  return sitemapData;
}

/**
 * Zoek relevante interne links voor een gegeven onderwerp (VERBETERDE keyword-based matching)
 */
export function findRelevantInternalLinks(
  sitemap: SitemapData,
  topic: string,
  maxLinks: number = 3
): Array<{ title: string; url: string; relevance: number }> {
  const searchTerms = topic.toLowerCase().split(/\s+/).filter(term => term.length > 3); // Alleen lange woorden
  
  if (searchTerms.length === 0) {
    return []; // Geen relevante zoektermen
  }
  
  const scoredPages = sitemap.pages.map(page => {
    let score = 0;
    const pageTitleLower = page.title.toLowerCase();
    const pageUrlLower = page.url.toLowerCase();
    const pageDescLower = page.description?.toLowerCase() || '';
    
    // Tel hoeveel zoektermen matchen
    let matchedTerms = 0;
    searchTerms.forEach(term => {
      // Exact match in titel = zeer hoog gewicht
      if (pageTitleLower.includes(term)) {
        score += 5;
        matchedTerms++;
      }
      // Match in URL = hoog gewicht
      if (pageUrlLower.includes(term)) {
        score += 3;
        matchedTerms++;
      }
      // Match in beschrijving = laag gewicht
      if (pageDescLower.includes(term)) {
        score += 1;
        matchedTerms++;
      }
    });
    
    // KRITISCHE FILTER: Minimaal 40% van de zoektermen moeten matchen
    const matchPercentage = matchedTerms / searchTerms.length;
    if (matchPercentage < 0.4) {
      score = 0; // Reset score als te weinig overlap
    }
    
    // Bonus voor posts (eerder dan pagina's)
    if (page.type === 'post' && score > 0) score += 2;
    
    return {
      title: page.title,
      url: page.url,
      relevance: score,
      matchPercentage, // Voor debugging
    };
  });

  // Filter en sorteer
  const filtered = scoredPages
    .filter(p => p.relevance > 5) // Minimaal score van 5 (= 1 exact title match)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxLinks);
  
  console.log(`🔍 Van ${sitemap.pages.length} pagina's, ${filtered.length} relevant gevonden voor "${topic}"`);
  
  return filtered;
}

/**
 * Zoek relevante interne links met AI-analyse (GEAVANCEERD)
 */
export async function findRelevantInternalLinksWithAI(
  sitemap: SitemapData,
  articleTitle: string,
  articleKeywords: string[],
  maxLinks: number = 5
): Promise<Array<{ title: string; url: string; relevance: string }>> {
  const { chatCompletion } = await import('@/lib/aiml-api');
  
  // Filter alleen relevante pagina types (posts en pages, geen tags/categories)
  const relevantPages = sitemap.pages
    .filter(page => page.type === 'post' || page.type === 'page')
    .slice(0, 100); // Limiteer tot 100 pagina's voor token efficiency
  
  if (relevantPages.length === 0) {
    console.log('⚠️ Geen relevante pagina\'s in sitemap gevonden');
    return [];
  }
  
  // Maak een compacte lijst van pagina's
  const pageList = relevantPages.map((page, idx) => 
    `${idx + 1}. "${page.title}" - ${page.url}${page.description ? ` (${page.description.slice(0, 80)}...)` : ''}`
  ).join('\n');
  
  const prompt = `Je bent een SEO-expert die interne links selecteert voor een artikel.

ARTIKEL INFORMATIE:
Titel: "${articleTitle}"
Keywords: ${articleKeywords.join(', ')}

BESCHIKBARE PAGINA'S VOOR INTERNE LINKS (${relevantPages.length} pagina's):
${pageList}

TAAK:
Selecteer de meest relevante pagina's (tussen 2 en ${maxLinks} links) uit bovenstaande lijst om naar te linken vanuit dit artikel.

BELANGRIJKE REGELS:
1. Selecteer pagina's die relevant zijn voor dit artikel of verwante onderwerpen behandelen
2. Als er MINDER dan 10 pagina's beschikbaar zijn: selecteer de beste beschikbare opties, ook als de match niet perfect is
3. Als er 10+ pagina's beschikbaar zijn: wees selectiever en kies alleen sterk gerelateerde content
4. Minimaal 2 links als er 4+ pagina's beschikbaar zijn
5. Geen links naar exact hetzelfde onderwerp (vermijd dubbele content)

SELECTIE CRITERIA (in volgorde van belangrijkheid):
- Topical relevantie: Overlappende thema's of keywords
- Verwante onderwerpen: Content die context toevoegt voor de lezer
- SEO waarde: Natuurlijke kansen voor interne linkbuilding
- User value: Nuttig voor de lezer om meer te leren

OUTPUT FORMAAT (JSON):
{
  "selectedLinks": [
    {"pageNumber": 1, "reason": "Behandelt gerelateerd onderwerp [keyword]"},
    {"pageNumber": 3, "reason": "Complementaire informatie over [aspect]"}
  ]
}

OPMERKING: Bij 4-10 pagina's selecteer minimaal 2 links, bij 10+ pagina's minimaal 3 links, tenzij echt geen enkele pagina enigszins relevant is.`;

  try {
    const completion = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      model: 'gpt-4o-mini',
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Strip markdown code blocks if present
    const cleanedText = responseText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
    
    const result = JSON.parse(cleanedText);
    
    if (!result.selectedLinks || !Array.isArray(result.selectedLinks)) {
      throw new Error('Ongeldige AI response structuur');
    }
    
    // Map de geselecteerde pagina nummers terug naar de eigenlijke pagina's
    const selectedLinks = result.selectedLinks
      .filter((link: any) => link.pageNumber && link.pageNumber > 0 && link.pageNumber <= relevantPages.length)
      .slice(0, maxLinks)
      .map((link: any) => {
        const page = relevantPages[link.pageNumber - 1];
        return {
          title: page.title,
          url: page.url,
          relevance: link.reason || 'Relevante content',
        };
      });
    
    console.log(`✅ AI selecteerde ${selectedLinks.length} relevante interne links`);
    return selectedLinks;
    
  } catch (error) {
    console.error('❌ Error bij AI link selectie:', error);
    // Fallback naar keyword-based selectie
    console.log('🔄 Fallback naar keyword-based link selectie...');
    const fallbackLinks = findRelevantInternalLinks(sitemap, articleTitle, maxLinks);
    return fallbackLinks.map(link => ({
      title: link.title,
      url: link.url,
      relevance: `Score: ${link.relevance}`,
    }));
  }
}

/**
 * Format interne links als markdown voor in de content
 */
export function formatInternalLinksForContent(
  links: Array<{ title: string; url: string; relevance: number }>,
  contextualText?: string
): string {
  if (links.length === 0) return '';

  const intro = contextualText || 'Lees ook:';
  
  const formatted = links.map(link => `- [${link.title}](${link.url})`).join('\n');
  
  return `\n\n### ${intro}\n\n${formatted}\n\n`;
}

/**
 * VOEG interne links toe in HTML content (post-processing)
 * Deze functie voegt strategisch interne links toe op logische plekken in de content
 * ALLEEN als er relevante links beschikbaar zijn uit de sitemap
 */
export async function insertInternalLinksIntoHTML(
  htmlContent: string,
  internalLinks: Array<{ title: string; url: string; relevance?: string }>,
  targetLinks: number = 3
): Promise<string> {
  if (!internalLinks || internalLinks.length === 0) {
    console.log('✅ Geen interne links beschikbaar - artikel wordt gepubliceerd zonder interne links');
    return htmlContent;
  }
  
  const { chatCompletion } = await import('@/lib/aiml-api');
  
  console.log(`🔗 Proberen ${internalLinks.length} interne links toe te voegen...`);
  
  // Maak een lijst van beschikbare links
  const linksList = internalLinks
    .map((link, idx) => 
      `${idx + 1}. "${link.title}" - ${link.url}${link.relevance ? ` (Relevantie: ${link.relevance})` : ''}`
    )
    .join('\n');
  
  // Scan meer content (eerste 6000 karakters ipv 2500)
  const contentSample = htmlContent.slice(0, 6000);
  
  const prompt = `Je bent een SEO-specialist die interne links NATUURLIJK integreert in blog content.

BESCHIKBARE INTERNE LINKS (ALLEEN DEZE MOGEN GEBRUIKT WORDEN):
${linksList}

HUIDIGE HTML CONTENT (eerste 6000 tekens):
${contentSample}...

TAAK:
Integreer ALLE beschikbare interne links ZO NATUURLIJK MOGELIJK in de content, alsof ze er altijd al waren.
DOEL: Voeg minimaal 5 links toe als de content dit toelaat.

🎯 KRITIEKE REGELS VOOR NATUURLIJKE INTEGRATIE:
1. Gebruik ALLEEN de bovenstaande links - verzin geen nieuwe links
2. GEEN standalone link-zinnen zoals "Lees meer over X" of "Bekijk ook Y" - dit is ONNATUURLIJK
3. Vervang een DEEL van een bestaande zin met een link, bijvoorbeeld:
   ✅ GOED: "De beste waterzuiveraars" → "De beste <a href="/url">waterzuiveraars</a>"
   ✅ GOED: "Voor optimale resultaten" → "Voor <a href="/url">optimale resultaten</a>"
   ❌ FOUT: Toevoegen van "Lees meer over waterzuiveraars." aan het einde van een alinea
   ❌ FOUT: Een aparte zin "Bekijk ook onze gids over filters."

4. De link moet PERFECT passen bij de context - de tekst moet logisch zijn
5. Kies een natuurlijk stukje tekst (2-6 woorden) dat PAST bij de link titel
6. Spread links door de HELE content (begin, midden, eind)
7. STREEF NAAR MINIMAAL 5 LINKS als de content dit toelaat
8. Wees CREATIEF in het vinden van natuurlijke plaatsen - zoek synoniemen en gerelateerde termen

PROCES:
1. Lees de content zorgvuldig
2. Voor elke link: zoek een zin waar het onderwerp al genoemd wordt of logisch past
3. Selecteer het meest passende tekstfragment in die zin
4. Vervang dat fragment met een <a> tag
5. De zin moet na toevoeging nog steeds natuurlijk lezen

OUTPUT FORMAAT (JSON):
{
  "insertions": [
    {
      "linkNumber": 1,
      "searchText": "Het EXACTE tekstfragment dat vervangen wordt (2-10 woorden)",
      "newText": "Hetzelfde tekstfragment maar dan met <a href='url'>fragment</a>",
      "reason": "Kort: waarom past deze link hier perfect?"
    }
  ]
}

⚠️ BELANGRIJK: searchText moet EXACT voorkomen in de content. Gebruik korte, unieke fragmenten.

VOORBEELD:
Als de content zegt: "Bij het kiezen van een waterfilter zijn er verschillende factoren..."
En je hebt een link: "Waterfilter Koopgids - /waterfilter-kopen"
Dan:
✅ GOED: 
  searchText: "waterfilter zijn er"
  newText: "<a href='/waterfilter-kopen'>waterfilter</a> zijn er"
❌ FOUT: Toevoegen van nieuwe zin "Lees meer over waterfilters."

DOEL: Links moeten zo natuurlijk zijn dat ze onzichtbaar geïntegreerd zijn in de tekst flow.`;

  try {
    const completion = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      model: 'gpt-4o-mini',
    });
    
    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Strip markdown code blocks
    const cleanedText = responseText
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '')
      .trim();
    
    const result = JSON.parse(cleanedText);
    
    if (!result.insertions || !Array.isArray(result.insertions)) {
      throw new Error('Ongeldige AI response structuur');
    }
    
    let modifiedContent = htmlContent;
    let successfulInsertions = 0;
    
    // Apply insertions
    for (const insertion of result.insertions) {
      if (!insertion.searchText || !insertion.newText) continue;
      
      // Check if searchText exists in content
      if (modifiedContent.includes(insertion.searchText)) {
        modifiedContent = modifiedContent.replace(insertion.searchText, insertion.newText);
        successfulInsertions++;
        console.log(`✅ Inserted link: "${internalLinks[insertion.linkNumber - 1]?.title}" | Reden: ${insertion.reason}`);
      } else {
        console.log(`⚠️ Kon searchText niet vinden voor link ${insertion.linkNumber}`);
      }
    }
    
    console.log(`✅ ${successfulInsertions} interne links succesvol toegevoegd (van ${internalLinks.length} beschikbaar)`);
    return modifiedContent;
    
  } catch (error) {
    console.error('❌ Error bij interne link insertie:', error);
    console.log('⚠️ Content wordt gepubliceerd zonder extra interne links');
    return htmlContent;
  }
}
