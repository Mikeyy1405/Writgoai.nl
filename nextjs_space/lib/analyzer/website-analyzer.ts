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
  console.log(`[Website Analyzer] Starting analysis for client ${clientId}`);
  
  // Step 1: Collect data
  const data = await collectWebsiteData(clientId);
  
  // Step 2: Analyze with AI
  const analysis = await analyzeWithAI(data);
  
  // Step 3: Save analysis to database
  await saveAnalysis(clientId, analysis, data);
  
  console.log(`[Website Analyzer] Analysis complete:`, {
    niche: analysis.niche,
    audience: analysis.targetAudience,
    tone: analysis.tone,
    keywordsCount: analysis.keywords.length,
  });
  
  return analysis;
}

/**
 * Collect all relevant data about the client
 */
async function collectWebsiteData(clientId: string): Promise<WebsiteData> {
  console.log(`[Website Analyzer] Collecting data for client ${clientId}`);
  
  // Get client with related content
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: true,
    },
  });

  if (!client) {
    throw new Error('Client niet gevonden');
  }

  // Get recent blog posts
  const blogPosts = await prisma.blogPost.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      title: true,
      excerpt: true,
      content: true,
      keywords: true,
      metaDescription: true,
    },
  });

  // Get recent social media posts
  const socialPosts = await prisma.socialMediaPost.findMany({
    where: { 
      strategyId: {
        in: (await prisma.socialMediaStrategy.findMany({
          where: { clientId },
          select: { id: true },
        })).map(s => s.id),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      content: true,
      platform: true,
    },
  });

  console.log(`[Website Analyzer] Collected data:`, {
    blogPosts: blogPosts.length,
    socialPosts: socialPosts.length,
    hasWebsite: !!client.website,
  });

  return {
    client,
    blogPosts,
    socialPosts,
  };
}

/**
 * Analyze data using AI
 */
async function analyzeWithAI(data: WebsiteData): Promise<WebsiteAnalysis> {
  console.log(`[Website Analyzer] Analyzing data with AI...`);
  
  const prompt = `
Je bent een expert in content marketing en doelgroep analyse. Analyseer de volgende informatie om de niche, doelgroep, tone of voice en keywords te bepalen.

BEDRIJFSINFORMATIE:
- Bedrijfsnaam: ${data.client.companyName || data.client.name}
- Website: ${data.client.website || 'Niet beschikbaar'}
- Beschrijving: ${data.client.description || 'Niet beschikbaar'}

BLOG CONTENT (laatste ${data.blogPosts.length} posts):
${data.blogPosts.map((p, i) => `
${i + 1}. "${p.title}"
   Samenvatting: ${p.excerpt || 'N/A'}
   Keywords: ${Array.isArray(p.keywords) ? p.keywords.join(', ') : 'N/A'}
`).join('\n')}

SOCIAL MEDIA POSTS (laatste ${data.socialPosts.length}):
${data.socialPosts.slice(0, 20).map((p, i) => `
${i + 1}. [${p.platform || 'Unknown'}]: ${p.content?.substring(0, 150) || 'N/A'}...
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
    const aimlApiKey = process.env.AIML_API_KEY;
    if (!aimlApiKey) {
      throw new Error('AIML_API_KEY niet geconfigureerd');
    }

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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Geen response van AI API');
    }

    // Parse JSON response (handle potential markdown wrapping)
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const analysis: WebsiteAnalysis = JSON.parse(cleanedContent);

    // Validate response structure
    if (!analysis.niche || !analysis.targetAudience || !analysis.tone) {
      throw new Error('Incomplete AI response');
    }

    console.log(`[Website Analyzer] AI analysis successful`);
    return analysis;
  } catch (error: any) {
    console.error('[Website Analyzer] AI analysis error:', error);
    
    // Return fallback analysis if AI fails
    return {
      niche: data.client.description || 'Algemene business services',
      nicheConfidence: 50,
      targetAudience: 'Zakelijke klanten en consumenten',
      audienceConfidence: 50,
      tone: 'Professioneel en Informatief',
      toneConfidence: 50,
      keywords: extractKeywordsFromContent(data),
      themes: extractThemesFromContent(data),
      reasoning: `Fallback analyse: ${error.message}. Gebaseerd op beschikbare content metadata.`,
    };
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
    await prisma.websiteAnalysis.create({
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
        socialPostsAnalyzed: data.socialPosts.length,
        analyzedAt: new Date(),
      },
    });
    console.log(`[Website Analyzer] Analysis saved to database`);
  } catch (error: any) {
    console.error('[Website Analyzer] Error saving analysis:', error);
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
