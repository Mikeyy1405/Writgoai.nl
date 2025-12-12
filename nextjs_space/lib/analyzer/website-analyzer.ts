/**
 * AI WEBSITE ANALYZER SERVICE
 * 
 * Analyzes client website, blog posts, and social media to automatically detect:
 * - Niche/Topic
 * - Target Audience
 * - Tone of Voice
 * - Top Keywords
 * - Content Themes
 */

import { prisma } from '@/lib/prisma-shim';

interface WebsiteData {
  client: any;
  blogPosts: any[];
  socialPosts: any[];
  wordpressContent?: any;
  socialProfiles?: any;
}

interface WebsiteAnalysis {
  niche: string;
  nicheConfidence: number;
  targetAudience: string;
  audienceConfidence: number;
  tone: string;
  toneConfidence: number;
  keywords: string[];
  themes: string[];
  reasoning: string;
}

/**
 * Main function to analyze a client's website and content
 */
export async function analyzeWebsite(clientId: string): Promise<WebsiteAnalysis> {
  console.log(`\n🔵 ========================================`);
  console.log(`🔵 [Website Analyzer] Starting analysis for client ${clientId}`);
  console.log(`🔵 ========================================\n`);
  
  // Step 1: Collect data
  console.log(`🔵 STEP 1: Collecting website data...`);
  const data = await collectWebsiteData(clientId);
  console.log(`✅ Data collection complete`);
  
  // Step 2: Analyze with AI
  console.log(`\n🔵 STEP 2: Analyzing with AI...`);
  const analysis = await analyzeWithAI(data);
  console.log(`✅ AI analysis complete`);
  console.log(`📊 Analysis preview:`, {
    niche: analysis.niche.substring(0, 50) + '...',
    audience: analysis.targetAudience.substring(0, 50) + '...',
    tone: analysis.tone,
    keywordsCount: analysis.keywords.length,
    themesCount: analysis.themes.length,
    hasReasoning: !!analysis.reasoning,
  });
  
  // Step 3: Save analysis to database
  console.log(`\n🔵 STEP 3: Saving to database...`);
  await saveAnalysis(clientId, analysis, data);
  console.log(`✅ Database save complete`);
  
  console.log(`\n✅ ========================================`);
  console.log(`✅ [Website Analyzer] ANALYSIS COMPLETE!`);
  console.log(`✅ ========================================`);
  console.log(`📊 Final Results:`, {
    niche: analysis.niche,
    nicheConfidence: analysis.nicheConfidence,
    targetAudience: analysis.targetAudience,
    audienceConfidence: analysis.audienceConfidence,
    tone: analysis.tone,
    toneConfidence: analysis.toneConfidence,
    keywords: analysis.keywords,
    themes: analysis.themes,
  });
  console.log(`\n`);
  
  return analysis;
}

/**
 * Collect all relevant data about the client
 */
async function collectWebsiteData(clientId: string): Promise<WebsiteData> {
  console.log(`   📂 Collecting data for client ${clientId}...`);
  
  // Get client with related content
  console.log(`   📂 Fetching client info...`);
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        where: { status: 'active' },
        take: 1,
      },
    },
  });

  if (!client) {
    console.error(`   ❌ Client not found: ${clientId}`);
    throw new Error('Client niet gevonden');
  }
  
  console.log(`   ✅ Client found:`, {
    name: client.name,
    companyName: client.companyName,
    website: client.website,
    hasDescription: !!client.description,
    projectsCount: client.projects?.length || 0,
  });

  // Get WordPress URL from project or client
  const project = client.projects?.[0];
  const websiteUrl = project?.wordpressUrl || project?.websiteUrl || client.website;

  console.log(`   🌐 Website URL:`, websiteUrl || 'NOT FOUND');

  if (!websiteUrl) {
    console.error(`   ❌ No website URL found for this client!`);
    throw new Error('Geen website URL gevonden. Voeg eerst een WordPress URL toe aan het project.');
  }

  // Scrape public WordPress website
  console.log(`   🌐 Scraping public WordPress website: ${websiteUrl}`);
  const scrapedContent = await scrapePublicWordPressSite(websiteUrl);

  console.log(`\n   📊 Data collection summary:`, {
    clientName: client.name,
    website: websiteUrl,
    homepageLength: scrapedContent.homepage?.length || 0,
    blogPostsCount: scrapedContent.blogPosts?.length || 0,
    aboutPageLength: scrapedContent.aboutPage?.length || 0,
    totalContentLength: (scrapedContent.homepage?.length || 0) + 
                        (scrapedContent.aboutPage?.length || 0) +
                        (scrapedContent.blogPosts?.reduce((sum, p) => sum + (p.content?.length || 0), 0) || 0),
  });

  if (!scrapedContent.homepage && scrapedContent.blogPosts.length === 0) {
    console.warn(`   ⚠️  WARNING: Could not scrape any content from the website!`);
    console.warn(`   ⚠️  The website may be protected, offline, or inaccessible`);
  }

  return {
    client,
    blogPosts: scrapedContent.blogPosts,
    socialPosts: [],
    wordpressContent: scrapedContent,
  };
}

/**
 * Scrape public WordPress website
 */
async function scrapePublicWordPressSite(websiteUrl: string): Promise<any> {
  console.log(`   🌐 Starting WordPress website scrape...`);
  
  const content = {
    homepage: '',
    blogPosts: [] as any[],
    aboutPage: '',
  };

  try {
    // Normalize URL
    const baseUrl = websiteUrl.replace(/\/$/, '');
    console.log(`   🌐 Base URL: ${baseUrl}`);

    // 1. Scrape homepage
    console.log(`   📄 Fetching homepage...`);
    try {
      const homepageResponse = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (homepageResponse.ok) {
        const html = await homepageResponse.text();
        content.homepage = extractTextFromHTML(html);
        console.log(`   ✅ Homepage scraped: ${content.homepage.length} chars`);
      } else {
        console.warn(`   ⚠️  Homepage fetch failed: ${homepageResponse.status}`);
      }
    } catch (error: any) {
      console.warn(`   ⚠️  Homepage fetch error: ${error.message}`);
    }

    // 2. Try to fetch blog posts via WordPress REST API
    console.log(`   📝 Fetching blog posts via WP REST API...`);
    try {
      const postsUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=10&_embed`;
      console.log(`   📝 Posts URL: ${postsUrl}`);
      
      const postsResponse = await fetch(postsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      if (postsResponse.ok) {
        const posts = await postsResponse.json();
        console.log(`   ✅ Found ${posts.length} blog posts via REST API`);
        
        content.blogPosts = posts.map((post: any) => ({
          title: stripHTMLTags(post.title?.rendered || ''),
          excerpt: stripHTMLTags(post.excerpt?.rendered || ''),
          content: stripHTMLTags(post.content?.rendered || '').substring(0, 2000), // Limit content length
        }));
      } else {
        console.warn(`   ⚠️  WP REST API not available: ${postsResponse.status}`);
      }
    } catch (error: any) {
      console.warn(`   ⚠️  WP REST API error: ${error.message}`);
    }

    // 3. Try to scrape about/over page
    console.log(`   📄 Fetching about page...`);
    const aboutUrls = [
      `${baseUrl}/over-ons`,
      `${baseUrl}/over-mij`,
      `${baseUrl}/about`,
      `${baseUrl}/about-us`,
      `${baseUrl}/over`,
    ];

    for (const aboutUrl of aboutUrls) {
      try {
        console.log(`   📄 Trying: ${aboutUrl}`);
        const aboutResponse = await fetch(aboutUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        
        if (aboutResponse.ok) {
          const html = await aboutResponse.text();
          content.aboutPage = extractTextFromHTML(html);
          console.log(`   ✅ About page scraped: ${content.aboutPage.length} chars from ${aboutUrl}`);
          break;
        }
      } catch (error: any) {
        // Try next URL
        console.log(`   ⚠️  Failed: ${error.message}`);
      }
    }

  } catch (error: any) {
    console.error(`   ❌ Scraping error:`, error.message);
  }

  console.log(`   ✅ Scraping complete`);
  return content;
}

/**
 * Extract clean text from HTML
 */
function extractTextFromHTML(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#\d+;/g, ' ');
  text = text.replace(/&[a-z]+;/gi, ' ');
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Limit length
  return text.substring(0, 10000);
}

/**
 * Strip HTML tags from text
 */
function stripHTMLTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Analyze data using AI
 */
async function analyzeWithAI(data: WebsiteData): Promise<WebsiteAnalysis> {
  console.log(`   🤖 Preparing AI analysis prompt...`);
  console.log(`   📝 Content to analyze:`, {
    hasHomepage: !!data.wordpressContent?.homepage,
    blogPostsCount: data.blogPosts.length,
    hasAboutPage: !!data.wordpressContent?.aboutPage,
    blogPostTitles: data.blogPosts.slice(0, 3).map(p => p.title),
  });
  
  const prompt = `
Je bent een expert in content marketing en doelgroep analyse. Analyseer de volgende WordPress website content om de niche, doelgroep, tone of voice en keywords te bepalen.

BEDRIJFSINFORMATIE:
- Bedrijfsnaam: ${data.client.companyName || data.client.name}
- Website: ${data.client.website || 'Niet beschikbaar'}
- Beschrijving: ${data.client.description || 'Niet beschikbaar'}

HOMEPAGE CONTENT:
${data.wordpressContent?.homepage ? data.wordpressContent.homepage.substring(0, 3000) : 'Niet beschikbaar'}

OVER/ABOUT PAGINA:
${data.wordpressContent?.aboutPage ? data.wordpressContent.aboutPage.substring(0, 2000) : 'Niet beschikbaar'}

BLOG POSTS (${data.blogPosts.length} recente posts van WordPress):
${data.blogPosts.map((p, i) => `
${i + 1}. "${p.title}"
   Samenvatting: ${p.excerpt || 'N/A'}
   Content preview: ${p.content?.substring(0, 200) || 'N/A'}...
`).join('\n')}

INSTRUCTIES:
Analyseer deze informatie grondig en bepaal:

1. **Niche/Onderwerp** (zeer specifiek!)
   - Niet alleen "Marketing" maar bijvoorbeeld "B2B LinkedIn Marketing voor Tech Startups"
   - Niet alleen "Fitness" maar bijvoorbeeld "Yoga voor beginners boven 40 jaar"
   - Wees zo specifiek mogelijk op basis van de content
   - Geef confidence score (0-100%)

2. **Doelgroep** (wie zijn de ideale klanten/lezers?)
   - Demografisch (leeftijd, geslacht, locatie indien relevant)
   - Professioneel (functie, bedrijfsgrootte, industrie indien B2B)
   - Psychografisch (waarden, interesses, uitdagingen)
   - Geef confidence score (0-100%)

3. **Tone of Voice**
   - Kies uit: Professioneel, Casual, Informatief, Inspirerend, Grappig, Serieus, Vriendelijk, Formeel
   - Of combinatie hiervan
   - Geef confidence score (0-100%)

4. **Top 10-15 Keywords**
   - Meest relevante zoekwoorden op basis van content
   - Mix van short-tail en long-tail keywords
   - Gesorteerd op relevantie

5. **Content Thema's** (5-10 hoofdthema's)
   - Welke onderwerpen komen het meest terug?
   - Wat zijn de pillar topics?

6. **Reasoning**
   - Waarom deze conclusies?
   - Welke patronen zie je in de content?
   - Wat valt het meest op?

Antwoord ALLEEN met valid JSON in dit exacte format (geen markdown, geen extra tekst):
{
  "niche": "Zeer specifieke niche beschrijving",
  "nicheConfidence": 95,
  "targetAudience": "Gedetailleerde doelgroep beschrijving",
  "audienceConfidence": 90,
  "tone": "Primary tone + Secondary tone",
  "toneConfidence": 85,
  "keywords": ["keyword1", "keyword2", "keyword3", ...],
  "themes": ["theme1", "theme2", "theme3", ...],
  "reasoning": "Gedetailleerde uitleg van de analyse en conclusies"
}
`;

  try {
    // Call AI API (using environment variable for API key)
    console.log(`   🔑 Checking API key...`);
    const aimlApiKey = process.env.AIML_API_KEY;
    if (!aimlApiKey) {
      console.error(`   ❌ AIML_API_KEY not configured`);
      throw new Error('AIML_API_KEY niet geconfigureerd');
    }
    console.log(`   ✅ API key found (${aimlApiKey.substring(0, 10)}...)`);

    console.log(`   🌐 Calling AI API (model: gpt-4o)...`);
    const response = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aimlApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert content marketing analist. Antwoord ALLEEN met valid JSON, geen extra tekst of markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log(`   📡 AI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ AI API error:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200),
      });
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log(`   ✅ AI API response received`);
    
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error(`   ❌ No content in AI response:`, aiResponse);
      throw new Error('Geen response van AI API');
    }

    console.log(`   📄 Raw AI response (first 200 chars):`, content.substring(0, 200));

    // Parse JSON response (handle potential markdown wrapping)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      console.log(`   🧹 Removing markdown JSON wrapper...`);
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      console.log(`   🧹 Removing markdown wrapper...`);
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    console.log(`   🔄 Parsing JSON response...`);
    const analysis: WebsiteAnalysis = JSON.parse(cleanedContent);

    // Validate response structure
    console.log(`   ✅ JSON parsed successfully`);
    console.log(`   🔍 Validating response structure...`);
    
    if (!analysis.niche || !analysis.targetAudience || !analysis.tone) {
      console.error(`   ❌ Incomplete AI response:`, {
        hasNiche: !!analysis.niche,
        hasTargetAudience: !!analysis.targetAudience,
        hasTone: !!analysis.tone,
      });
      throw new Error('Incomplete AI response');
    }

    console.log(`   ✅ Response structure validated`);
    console.log(`   ✅ AI analysis successful!`);
    return analysis;
  } catch (error: any) {
    console.error(`   ❌ AI analysis error:`, error.message);
    console.error(`   ❌ Full error:`, error);
    console.log(`   🔄 Using fallback analysis...`);
    
    // Return fallback analysis if AI fails
    const fallbackAnalysis = {
      niche: data.client.description || 'Algemene business services',
      nicheConfidence: 50,
      targetAudience: 'Zakelijke klanten en consumenten',
      audienceConfidence: 50,
      tone: 'Professioneel en Informatief',
      toneConfidence: 50,
      keywords: extractKeywordsFromContent(data),
      themes: extractThemesFromContent(data),
      reasoning: `⚠️ Fallback analyse gebruikt (AI fout: ${error.message}). Gebaseerd op beschikbare content metadata.`,
    };
    
    console.log(`   ✅ Fallback analysis created:`, {
      niche: fallbackAnalysis.niche,
      keywordsCount: fallbackAnalysis.keywords.length,
      themesCount: fallbackAnalysis.themes.length,
    });
    
    return fallbackAnalysis;
  }
}

/**
 * Save analysis to database
 */
async function saveAnalysis(
  clientId: string,
  analysis: WebsiteAnalysis,
  data: WebsiteData
): Promise<void> {
  try {
    console.log(`   💾 Saving analysis to database...`);
    console.log(`   💾 Data to save:`, {
      clientId,
      niche: analysis.niche.substring(0, 50),
      nicheConfidence: analysis.nicheConfidence,
      keywordsCount: analysis.keywords.length,
      themesCount: analysis.themes.length,
    });
    
    const saved = await prisma.websiteAnalysis.create({
      data: {
        clientId,
        niche: analysis.niche,
        nicheConfidence: analysis.nicheConfidence,
        targetAudience: analysis.targetAudience,
        audienceConfidence: analysis.audienceConfidence,
        tone: analysis.tone,
        toneConfidence: analysis.toneConfidence,
        keywords: analysis.keywords,
        themes: analysis.themes,
        reasoning: analysis.reasoning,
        websiteUrl: data.client.website || null,
        blogPostsAnalyzed: data.blogPosts.length,
        socialPostsAnalyzed: 0, // No social posts from scraping
        analyzedAt: new Date(),
      },
    });
    
    console.log(`   ✅ Analysis saved to database (ID: ${saved.id})`);
  } catch (error: any) {
    console.error(`   ❌ Error saving analysis to database:`, {
      error: error.message,
      code: error.code,
      meta: error.meta,
    });
    console.error(`   ❌ Full error:`, error);
    console.warn(`   ⚠️  Analysis will be returned but not saved to database`);
    // Don't throw - analysis is still valid even if save fails
  }
}

/**
 * Fallback: Extract keywords from content
 */
function extractKeywordsFromContent(data: WebsiteData): string[] {
  const keywords = new Set<string>();
  
  // From blog posts
  data.blogPosts.forEach(post => {
    if (Array.isArray(post.keywords)) {
      post.keywords.forEach((kw: string) => keywords.add(kw));
    }
  });
  
  // If no keywords found, return generic ones
  if (keywords.size === 0) {
    return ['marketing', 'content', 'business', 'strategy', 'growth'];
  }
  
  return Array.from(keywords).slice(0, 15);
}

/**
 * Fallback: Extract themes from content
 */
function extractThemesFromContent(data: WebsiteData): string[] {
  const themes = new Set<string>();
  
  // Extract from blog post titles
  data.blogPosts.forEach(post => {
    if (post.title) {
      // Simple theme extraction from titles
      const words = post.title.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 5) {
          themes.add(word);
        }
      });
    }
  });
  
  // If no themes found, return generic ones
  if (themes.size === 0) {
    return ['Content Marketing', 'Business Growth', 'Digital Strategy'];
  }
  
  return Array.from(themes).slice(0, 10);
}

/**
 * Get most recent analysis for a client
 */
export async function getLatestAnalysis(clientId: string): Promise<WebsiteAnalysis | null> {
  try {
    const analysis = await prisma.websiteAnalysis.findFirst({
      where: { clientId },
      orderBy: { analyzedAt: 'desc' },
    });

    if (!analysis) {
      return null;
    }

    return {
      niche: analysis.niche,
      nicheConfidence: analysis.nicheConfidence || 0,
      targetAudience: analysis.targetAudience,
      audienceConfidence: analysis.audienceConfidence || 0,
      tone: analysis.tone,
      toneConfidence: analysis.toneConfidence || 0,
      keywords: analysis.keywords || [],
      themes: analysis.themes || [],
      reasoning: analysis.reasoning || '',
    };
  } catch (error) {
    console.error('[Website Analyzer] Error fetching latest analysis:', error);
    return null;
  }
}
