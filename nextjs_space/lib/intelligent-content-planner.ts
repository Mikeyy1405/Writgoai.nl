
/**
 * Intelligent Content Planner
 * 
 * Comprehensive content planning system that:
 * 1. Analyzes your own website (what content exists)
 * 2. Analyzes competitors (what are they ranking for)
 * 3. Finds trending topics (real-time web search)
 * 4. Generates 20-25 high-quality content ideas
 */

import OpenAI from 'openai';

// Initialize AI/ML API with timeout
function getOpenAI() {
  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet gevonden');
  }
  return new OpenAI({ 
    apiKey,
    baseURL: 'https://api.aimlapi.com/v1',
    timeout: 180000, // 3 minutes timeout for AI calls
    maxRetries: 1, // Retry once if failed
  });
}

/**
 * Calculate similarity between two strings using word overlap
 * Returns a score between 0 (no similarity) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Split into words and remove short words (< 3 chars)
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  
  if (words1.length === 0 || words2.length === 0) {
    return 0;
  }
  
  // Count overlapping words
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  let overlapCount = 0;
  set1.forEach(word => {
    if (set2.has(word)) {
      overlapCount++;
    }
  });
  
  // Jaccard similarity: intersection / union
  const unionSize = set1.size + set2.size - overlapCount;
  const similarity = overlapCount / unionSize;
  
  return similarity;
}

// Types
export interface WebsiteAnalysis {
  existingTopics: string[];
  contentGaps: string[];
  topPerformingPages: Array<{ title: string; url: string }>;
  categories: string[];
  totalPages: number;
  lastScanned: Date;
}

export interface CompetitorAnalysis {
  competitors: Array<{
    domain: string;
    topContent: Array<{ title: string; url: string; topic: string }>;
    strength: 'high' | 'medium' | 'low';
  }>;
  competitorGaps: string[]; // Topics competitors haven't covered
  opportunities: string[]; // Topics where you can compete
  lastAnalyzed: Date;
}

export interface TrendingTopics {
  topics: Array<{
    topic: string;
    relevance: number;
    source: string;
    reasoning: string;
  }>;
  questions: string[];
  newsTopics: string[];
  lastUpdated: Date;
}

export interface ContentIdea {
  title: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  description: string;
  contentType: 
    | 'guide'           // Complete gids / uitgebreide handleiding
    | 'listicle'        // Top 10, Top 5, lijstje artikelen
    | 'howto'           // How-to / stap-voor-stap instructies
    | 'review'          // Product review / service review
    | 'comparison'      // X vs Y / vergelijking tussen producten/services
    | 'news'            // Nieuws / updates / actuele gebeurtenissen
    | 'opinion'         // Mening / perspective / thought leadership
    | 'tutorial'        // Tutorial / workshop / training
    | 'case-study'      // Case study / succesverhaal / voorbeeld
    | 'infographic'     // Visuele content / data-gedreven artikel
    | 'interview'       // Interview / Q&A / expert insights
    | 'checklist'       // Checklist / to-do lijst / stappenplan
    | 'definition'      // Wat is... / definitie / uitleg begrip
    | 'tools'           // Beste tools / software / resources
    | 'trends';         // Trends / voorspellingen / toekomst
  priority: 'high' | 'medium' | 'low';
  reasoning: string; // Why this topic is valuable
  estimatedDifficulty: number; // 0-100
  searchIntent: 'informational' | 'transactional' | 'commercial' | 'navigational';
  outline: string[]; // H2 suggestions
  internalLinkOpportunities: string[];
  competitorGap: boolean;
  trending: boolean;
  sources: string[];
}

export interface MasterContentPlan {
  websiteAnalysis: WebsiteAnalysis;
  competitorAnalysis: CompetitorAnalysis;
  trendingTopics: TrendingTopics;
  contentIdeas: ContentIdea[];
  summary: {
    totalIdeas: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    competitorGaps: number;
    trendingTopics: number;
  };
  generatedAt: Date;
}

/**
 * Step 1: COMPREHENSIVE Project-Specific Website Analysis
 * Deep scan of website to understand EXACTLY what content already exists
 * THIS IS ALWAYS RUN FOR PROJECTS - NO SKIPPING
 */
export async function analyzeWebsiteDeep(
  websiteUrl: string,
  niche: string,
  projectName: string
): Promise<WebsiteAnalysis> {
  // If no URL provided (keyword mode), skip and return empty
  if (!websiteUrl || websiteUrl.trim() === '') {
    console.log(`⏭️  [WEBSITE ANALYSE] Keyword modus - geen website analyse`);
    return {
      existingTopics: [],
      contentGaps: [],
      topPerformingPages: [],
      categories: [],
      totalPages: 0,
      lastScanned: new Date(),
    };
  }

  console.log(`\n🔍 [WEBSITE ANALYSE - ${projectName}] START voor ${websiteUrl}`);
  console.log(`   Niche: ${niche}`);
  
  const openai = getOpenAI();
  
  // Extract clean domain from URL
  let domain = websiteUrl;
  try {
    const url = new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
    domain = url.hostname;
  } catch (e) {
    domain = websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  
  try {
    // PHASE 1: Deep Website Content Scan
    console.log(`   📊 Fase 1: Scannen van alle content op ${domain}...`);
    
    const deepScanResponse = await openai.chat.completions.create({
      model: 'gpt-4o-search-preview',
      messages: [
        {
          role: 'system',
          content: `Je bent een expert website content auditor. Jouw taak is om DIEPGAAND te analyseren wat er AL op een website staat.
          
Gebruik web search met verschillende queries om een VOLLEDIG beeld te krijgen:
- site:${domain} blog
- site:${domain} artikel
- site:${domain} gids
- site:${domain} how to
- site:${domain} tips

Geef ALLEEN valide JSON terug, geen extra tekst.`
        },
        {
          role: 'user',
          content: `Voer een DIEPGAANDE content audit uit voor ${domain} (project: ${projectName}, niche: ${niche}).

OPDRACHT:
1. Scan ALLE bestaande content (blogs, artikelen, gidsen, reviews, etc.)
2. Identificeer WELKE SPECIFIEKE onderwerpen al behandeld zijn
3. Bepaal welke categorieën/thema's er zijn
4. Vind de meest zichtbare/belangrijke pagina's

ZOEK met meerdere queries om ALLES te vinden:
- site:${domain} (algemene content)
- site:${domain} ${niche} (niche-specifieke content)
- site:${domain} blog (blog posts)
- site:${domain} gids (gidsen)

BELANGRIJK:
- Wees SPECIFIEK in de topics (niet "content marketing" maar "hoe je SEO-vriendelijke blog titels schrijft")
- Lijst CONCRETE pagina's op die al bestaan
- Identificeer de content STRUCTUUR van de website

OUTPUT: JSON formaat
{
  "existingTopics": ["Zeer specifiek onderwerp 1", "Zeer specifiek onderwerp 2", ...],
  "topPerformingPages": [
    {"title": "Exacte titel", "url": "volledige url", "topic": "hoofdonderwerp"}
  ],
  "categories": ["categorie1", "categorie2", ...],
  "totalPages": aantal_gevonden_paginas,
  "contentTypes": ["blog", "gids", "review", ...],
  "lastPublished": "meest recente artikel datum indien beschikbaar"
}`
        }
      ],
      temperature: 0.2, // Low temp for accurate analysis
      max_tokens: 3000,
    });

    const scanContent = deepScanResponse.choices[0]?.message?.content || '{}';
    console.log(`   📄 AI response ontvangen (${scanContent.length} chars)`);
    
    let websiteData;
    try {
      const jsonMatch = scanContent.match(/\{[\s\S]*\}/);
      websiteData = JSON.parse(jsonMatch ? jsonMatch[0] : scanContent);
      console.log(`   ✅ JSON parsed: ${websiteData.existingTopics?.length || 0} topics gevonden`);
    } catch (parseError) {
      console.error('⚠️  Parse fout in website scan, gebruik fallback');
      websiteData = { 
        existingTopics: [], 
        topPerformingPages: [], 
        categories: [], 
        totalPages: 0,
        contentTypes: []
      };
    }

    // PHASE 2: Content Gap Analysis
    console.log(`   🔍 Fase 2: Content gap analyse...`);
    
    const existingList = websiteData.existingTopics?.length > 0 
      ? websiteData.existingTopics.slice(0, 50).join('\n- ') 
      : 'Geen bestaande content gevonden';
    
    const categoriesList = websiteData.categories?.length > 0
      ? websiteData.categories.join(', ')
      : 'Geen categorieën geïdentificeerd';
    
    const gapsResponse = await openai.chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: `Je bent een content strategie expert voor ${projectName} in de "${niche}" niche.

BESTAANDE CONTENT OP ${domain}:
- ${existingList}

CATEGORIEËN: ${categoriesList}
TOTAAL PAGINA'S: ${websiteData.totalPages || 0}

OPDRACHT:
Identificeer 15-20 SPECIFIEKE content gaps - onderwerpen die:
1. RELEVANT zijn voor de "${niche}" niche
2. ONTBREKEN op de website (check goed of het niet al bestaat!)
3. WAARDEVOL zijn voor bezoekers
4. LOGISCH passen bij de bestaande content

BELANGRIJK:
- Wees SPECIFIEK (niet "SEO tips" maar "hoe je long-tail keywords vindt met gratis tools")
- Vermijd DUPLICATEN van bestaande content
- Focus op PRAKTISCHE, ACTIONABLE onderwerpen

Geef ALLEEN een JSON array van strings terug:
["Specifieke content gap 1", "Specifieke content gap 2", ...]`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const gapsContent = gapsResponse.choices[0]?.message?.content || '[]';
    console.log(`   📄 Content gaps response ontvangen`);
    
    let contentGaps;
    try {
      const jsonMatch = gapsContent.match(/\[[\s\S]*\]/);
      contentGaps = JSON.parse(jsonMatch ? jsonMatch[0] : gapsContent);
      console.log(`   ✅ ${contentGaps.length} content gaps geïdentificeerd`);
    } catch (parseError) {
      console.error('⚠️  Parse fout in gaps analyse');
      contentGaps = [];
    }

    const result = {
      existingTopics: websiteData.existingTopics || [],
      contentGaps: contentGaps || [],
      topPerformingPages: websiteData.topPerformingPages || [],
      categories: websiteData.categories || [],
      totalPages: websiteData.totalPages || 0,
      lastScanned: new Date(),
    };

    console.log(`\n✅ [WEBSITE ANALYSE - ${projectName}] VOLTOOID`);
    console.log(`   📊 ${result.existingTopics.length} bestaande topics`);
    console.log(`   🔍 ${result.contentGaps.length} content gaps`);
    console.log(`   📄 ${result.topPerformingPages.length} top pagina's`);
    console.log(`   📁 ${result.categories.length} categorieën\n`);

    return result;
    
  } catch (error: any) {
    console.error(`❌ [WEBSITE ANALYSE - ${projectName}] FOUT:`, error.message);
    // Return basic fallback
    return {
      existingTopics: [],
      contentGaps: [],
      topPerformingPages: [],
      categories: [],
      totalPages: 0,
      lastScanned: new Date(),
    };
  }
}

/**
 * Step 2: Analyze competitors
 * Uses web search to find what competitors are ranking for
 */
export async function analyzeCompetitors(
  niche: string,
  primaryKeywords: string[]
): Promise<CompetitorAnalysis> {
  console.log(`🔍 [CONCURRENT ANALYSE] Start voor niche: ${niche}`);
  
  const openai = getOpenAI();
  
  try {
    // Search for top competitors
    const searchQuery = `top ${niche} blogs websites Nederlands`;
    
    const competitorResponse = await openai.chat.completions.create({
      model: 'gpt-4o-search-preview',
      messages: [
        {
          role: 'system',
          content: 'Je bent een concurrent analyse expert. Geef altijd valide JSON terug.'
        },
        {
          role: 'user',
          content: `Zoek de top 5 concurrerende websites/blogs in de "${niche}" niche in het Nederlands.

Voor elke concurrent, vind:
1. Domain naam
2. Hun top 3-5 meest populaire artikelen/content
3. Hun sterkte (hoog/medium/laag) gebaseerd op autoriteit

Geef resultaat in JSON formaat:
{
  "competitors": [
    {
      "domain": "example.nl",
      "topContent": [{"title": "...", "url": "...", "topic": "..."}],
      "strength": "high"
    }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2500,
    });

    let competitorData;
    try {
      const content = competitorResponse.choices[0]?.message?.content || '{"competitors": []}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      competitorData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('⚠️  Failed to parse competitor data JSON, using defaults');
      competitorData = { competitors: [] };
    }

    // Analyze gaps and opportunities
    const gapResponse = await openai.chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: `Gebaseerd op deze concurrent analyse in de "${niche}" niche:

CONCURRENTEN: ${JSON.stringify(competitorData.competitors, null, 2)}
JOUW KEYWORDS: ${primaryKeywords?.join(', ') || 'Geen keywords'}

Identificeer:
1. COMPETITOR GAPS: 10 onderwerpen die concurrenten NIET goed behandelen
2. OPPORTUNITIES: 10 onderwerpen waar jij gemakkelijk kunt concurreren

Antwoord in JSON formaat:
{
  "competitorGaps": ["gap1", "gap2", ...],
  "opportunities": ["opp1", "opp2", ...]
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    let gapData;
    try {
      const content = gapResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      gapData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('⚠️  Failed to parse gap data JSON, using defaults');
      gapData = { competitorGaps: [], opportunities: [] };
    }

    console.log(`✅ [CONCURRENT ANALYSE] ${competitorData.competitors?.length || 0} concurrenten, ${gapData.competitorGaps?.length || 0} gaps`);

    return {
      competitors: competitorData.competitors || [],
      competitorGaps: gapData.competitorGaps || [],
      opportunities: gapData.opportunities || [],
      lastAnalyzed: new Date(),
    };
  } catch (error) {
    console.error('❌ [CONCURRENT ANALYSE] Error:', error);
    return {
      competitors: [],
      competitorGaps: [],
      opportunities: [],
      lastAnalyzed: new Date(),
    };
  }
}

/**
 * Step 3: Find trending topics
 * Real-time web search for current trends in the niche
 */
export async function findTrendingTopics(niche: string): Promise<TrendingTopics> {
  console.log(`🔍 [TRENDING TOPICS] Start voor niche: ${niche}`);
  
  const openai = getOpenAI();
  
  try {
    // Search for current trends
    const trendResponse = await openai.chat.completions.create({
      model: 'gpt-4o-search-preview',
      messages: [
        {
          role: 'system',
          content: 'Je bent een trend analyse expert. Geef altijd valide JSON terug.'
        },
        {
          role: 'user',
          content: `Zoek de nieuwste trends en actuele onderwerpen in de "${niche}" niche in 2025.

Vind:
1. Top 10 trending topics (actueel, populair, relevant)
2. Veelgestelde vragen (people also ask)
3. Nieuws onderwerpen

Geef resultaat in JSON formaat:
{
  "topics": [
    {
      "topic": "...",
      "relevance": 0.9,
      "source": "...",
      "reasoning": "Waarom dit trending is"
    }
  ],
  "questions": ["vraag1", "vraag2", ...],
  "newsTopics": ["news1", "news2", ...]
}`
        }
      ],
      temperature: 0.4,
      max_tokens: 2500,
    });

    let trendData;
    try {
      const content = trendResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      trendData = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (parseError) {
      console.error('⚠️  Failed to parse trend data JSON, using defaults');
      trendData = { topics: [], questions: [], newsTopics: [] };
    }

    console.log(`✅ [TRENDING TOPICS] ${trendData.topics?.length || 0} trends gevonden`);

    return {
      topics: trendData.topics || [],
      questions: trendData.questions || [],
      newsTopics: trendData.newsTopics || [],
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('❌ [TRENDING TOPICS] Error:', error);
    return {
      topics: [],
      questions: [],
      newsTopics: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Step 4: Generate Master Content Plan
 * Combines all analysis to create 20-25 high-quality content ideas
 */
export async function generateMasterContentPlan(
  websiteAnalysis: WebsiteAnalysis,
  competitorAnalysis: CompetitorAnalysis,
  trendingTopics: TrendingTopics,
  niche: string,
  targetAudience: string
): Promise<ContentIdea[]> {
  console.log(`🔍 [CONTENT PLAN] Genereer master plan voor ${niche}`);
  console.log(`   Website topics: ${websiteAnalysis.existingTopics.length}`);
  console.log(`   Competitor gaps: ${competitorAnalysis.competitorGaps.length}`);
  console.log(`   Trending topics: ${trendingTopics.topics.length}`);
  
  const openai = getOpenAI();
  
  try {
    // Prepare existing topics list for better filtering
    const existingTopicsList = websiteAnalysis?.existingTopics || [];
    const existingTopicsFormatted = existingTopicsList.length > 0 
      ? existingTopicsList.map((topic, i) => `${i + 1}. ${topic}`).join('\n') 
      : 'Geen bestaande content gevonden';
    
    const promptContent = `Je bent een expert content strateeg. Genereer 40 krachtige content ideeën voor een website in de "${niche}" niche.

DOELGROEP: ${targetAudience}

⚠️ KRITIEKE REGEL - LEES DIT ZORGVULDIG:
De website heeft AL content over deze onderwerpen. Je MAG GEEN ideeën genereren die hier op lijken:

BESTAANDE CONTENT OP DE WEBSITE (VERMIJD DEZE TOPICS):
${existingTopicsFormatted}

${existingTopicsList.length > 0 ? `
🚫 VERBODEN:
- Genereer GEEN content die lijkt op bovenstaande ${existingTopicsList.length} topics
- Genereer GEEN herschreven versies van bestaande artikelen
- Genereer GEEN "deel 2" of variaties van bestaande content
- Check ELKE titel die je maakt tegen de bestaande lijst hierboven
` : ''}

CONTENT GAPS (wat de website MIST):
${websiteAnalysis?.contentGaps?.join(', ') || 'Geen specifieke gaps - genereer brede coverage van de niche'}

CONCURRENT ANALYSE:
- Concurrent gaps (wat zij NIET doen): ${competitorAnalysis?.competitorGaps?.join(', ') || 'Geen gaps'}
- Kansen (waar je kunt concurreren): ${competitorAnalysis?.opportunities?.join(', ') || 'Geen specifieke kansen'}

TRENDING TOPICS:
${trendingTopics?.topics?.length > 0 ? trendingTopics.topics.map(t => `- ${t.topic} (${t.reasoning})`).join('\n') : '- Geen trending topics beschikbaar, genereer algemene topics'}

VRAGEN VAN MENSEN:
${trendingTopics?.questions?.length > 0 ? trendingTopics.questions.join('\n') : '- Geen specifieke vragen, genereer relevante content'}

Genereer 25 high-quality content ideeën die:
1. **COMPLEET NIEUW** zijn en NIET lijken op bestaande content
2. Invullen wat ONTBREEKT op de website (gaps)
3. Profiteren van concurrent gaps
4. Inspelen op trending topics
5. Beantwoorden wat mensen willen weten
6. Strategisch gedistribueerd zijn over prioriteiten (10 high, 12 medium, 3 low)

CONTENT TYPE VERDELING (belangrijk - mix verschillende types):
- **Listicles** (20%): "Top 10 beste...", "5 manieren om...", "7 tips voor..."
- **How-to guides** (20%): "Hoe je...", "Stap-voor-stap...", "Handleiding voor..."
- **Product reviews** (15%): "Review: ...", "Beste ... voor ...", "Is ... het waard?"
- **Vergelijkingen** (15%): "X vs Y", "Vergelijking tussen...", "Wat is beter..."
- **Complete gidsen** (15%): "Ultieme gids...", "Alles over...", "Complete handleiding..."
- **Overige** (15%): checklists, tutorials, case studies, interviews, tools, trends

BELANGRIJKE REGELS:
- **DIVERSE CONTENT TYPES**: Gebruik minimaal 8 verschillende content types
- **KLIKBARE TITELS**: Wek nieuwsgierigheid, gebruik cijfers, stel vragen
- **NATUURLIJKE TAAL**: Nederlands, geen Engelstalige termen tenzij nodig
- **GEEN KEYWORDS STUFFING**: Focus op waarde, niet op SEO-trucjes
- **ACTUEEL & RELEVANT**: Trends en nieuws van 2025

TITEL FORMAAT VOORBEELDEN:
✅ GOED:
- "10 simpele manieren om meer omzet te genereren in 2025"
- "Review: Is deze marketingtool zijn geld waard?"
- "SEO vs SEA: wat werkt beter voor jouw bedrijf?"
- "Hoe je in 30 dagen je eerste 1000 volgers krijgt"
- "Ultieme gids voor contentmarketing in 2025"

❌ FOUT:
- "Niche Marketing: Hoe Je Je Positioneert Als Expert" (voorvoegsel + hoofdletters)
- "SEO: 10 Tips Voor Betere Rankings" (voorvoegsel)
- "Content Marketing Strategie 2025" (te algemeen, geen haak)

Geef ALLEEN een JSON array terug, geen extra tekst:
[
  {
    "title": "Natuurlijke, directe titel zonder voorvoegsel of overbodige hoofdletters",
    "focusKeyword": "primair keyword",
    "secondaryKeywords": ["keyword2", "keyword3"],
    "description": "Korte beschrijving wat het artikel behandelt",
    "contentType": "listicle",  // Gebruik: guide, listicle, howto, review, comparison, tutorial, checklist, tools, trends, case-study, interview, definition, infographic, news, opinion
    "priority": "high",
    "reasoning": "Waarom dit waardevol is (concurrent gap / trending / content gap)",
    "estimatedDifficulty": 45,
    "searchIntent": "informational",
    "outline": ["H2 suggestie 1", "H2 suggestie 2", "H2 suggestie 3"],
    "internalLinkOpportunities": ["Gerelateerd topic 1", "Gerelateerd topic 2"],
    "competitorGap": true,
    "trending": false,
    "sources": ["bron voor research"]
  }
]

BELANGRIJK - CONTENT TYPE KEUZE:
- **listicle**: Voor "Top X", "X beste", "X manieren", "X tips"
- **howto**: Voor "Hoe...", "Stap-voor-stap...", "Handleiding..."
- **review**: Voor "Review:", "Beste ... voor", "Is ... het waard"
- **comparison**: Voor "X vs Y", "Vergelijking", "Wat is beter"
- **guide**: Voor "Ultieme gids", "Complete handleiding", "Alles over"
- **checklist**: Voor "Checklist", "Controlelijst", "Stappenplan"
- **tools**: Voor "Beste tools", "Software voor", "Resources"
- **tutorial**: Voor "Tutorial", "Workshop", "Training"
- **trends**: Voor "Trends 2025", "Toekomst van", "Voorspellingen"
- **case-study**: Voor "Case study", "Succesverhaal", "Voorbeeld"
- **interview**: Voor "Interview met", "Q&A", "Expert insights"
- **definition**: Voor "Wat is...", "Definitie van", "Betekenis"
- **infographic**: Voor data-gedreven, visueel, statistieken
- **news**: Voor actuele gebeurtenissen, updates, nieuws
- **opinion**: Voor mening, perspectief, thought leadership`;

    console.log(`📤 [CONTENT PLAN] Sending request to Claude Sonnet 4-5...`);
    console.log(`   Prompt length: ${promptContent.length} chars`);

    // Create a timeout promise that will reject after 3 minutes
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI request timeout after 3 minutes')), 180000);
    });

    // Race between the API call and the timeout
    let response;
    try {
      response = await Promise.race([
        openai.chat.completions.create({
          model: 'claude-sonnet-4-5',
          messages: [
            {
              role: 'user',
              content: promptContent
            }
          ],
          temperature: 0.8,
          max_tokens: 16000,
        }),
        timeoutPromise
      ]);
      
      console.log(`📥 [CONTENT PLAN] Response received from AI`);
    } catch (timeoutError: any) {
      console.error('⏱️  [CONTENT PLAN] AI request timed out, falling back to GPT-4o...');
      
      // Fallback to faster model (GPT-4o)
      try {
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: promptContent
            }
          ],
          temperature: 0.8,
          max_tokens: 12000,
        });
        console.log(`📥 [CONTENT PLAN] Fallback response received from GPT-4o`);
      } catch (fallbackError: any) {
        console.error('❌ [CONTENT PLAN] Both AI models failed');
        throw new Error('AI content generation failed - please try again');
      }
    }

    const content = response.choices[0]?.message?.content || '[]';
    console.log(`   Raw response length: ${content.length} chars`);
    console.log(`   Raw response preview: ${content.substring(0, 200)}...`);
    
    let ideas: ContentIdea[] = [];
    
    try {
      // Clean JSON (remove markdown code blocks if present)
      const cleanContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      console.log(`   Cleaned content length: ${cleanContent.length} chars`);
      console.log(`   Parsing JSON...`);
      
      // Try to extract JSON array
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      } else {
        ideas = JSON.parse(cleanContent);
      }

      console.log(`✅ [CONTENT PLAN] ${ideas.length} content ideeën gegenereerd`);
      
      if (ideas.length === 0) {
        console.error('⚠️  [CONTENT PLAN] WARNING: JSON parsed successfully but array is empty!');
      }
    } catch (parseError) {
      console.error('⚠️  [CONTENT PLAN] Failed to parse JSON response:', parseError);
      console.error('   Raw content:', content.substring(0, 500));
      // Return empty array instead of crashing
      ideas = [];
    }

    // SERVER-SIDE DUPLICATE FILTER
    // Extra veiligheidslaag om te checken of gegenereerde ideeën niet lijken op bestaande content
    const existingTopics = websiteAnalysis?.existingTopics || [];
    if (existingTopics.length > 0) {
      console.log(`🔍 [DUPLICATE FILTER] Checking ${ideas.length} ideas against ${existingTopics.length} existing topics...`);
      
      const filteredIdeas = ideas.filter(idea => {
        // Normalize titles for comparison (lowercase, remove special chars)
        const normalizeText = (text: string) => {
          return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim();
        };
        
        const normalizedIdeaTitle = normalizeText(idea.title);
        const normalizedKeyword = normalizeText(idea.focusKeyword);
        
        // Check if title or focus keyword matches any existing topic
        const isDuplicate = existingTopics.some(existingTopic => {
          const normalizedExisting = normalizeText(existingTopic);
          
          // Check for exact match or very similar (>70% overlap)
          const titleSimilarity = calculateSimilarity(normalizedIdeaTitle, normalizedExisting);
          const keywordSimilarity = calculateSimilarity(normalizedKeyword, normalizedExisting);
          
          if (titleSimilarity > 0.7 || keywordSimilarity > 0.7) {
            console.log(`   🚫 Filtered duplicate: "${idea.title}" (${Math.round(Math.max(titleSimilarity, keywordSimilarity) * 100)}% match with "${existingTopic}")`);
            return true;
          }
          
          return false;
        });
        
        return !isDuplicate;
      });
      
      const removedCount = ideas.length - filteredIdeas.length;
      if (removedCount > 0) {
        console.log(`✅ [DUPLICATE FILTER] Removed ${removedCount} duplicates, ${filteredIdeas.length} unique ideas remaining`);
      } else {
        console.log(`✅ [DUPLICATE FILTER] No duplicates found - all ${ideas.length} ideas are unique!`);
      }
      
      return filteredIdeas;
    }

    return ideas;
  } catch (error: any) {
    console.error('❌ [CONTENT PLAN] Error generating content plan');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    return [];
  }
}

/**
 * Main function: Complete content research & planning
 * NOW WITH PROJECT-SPECIFIC DEEP ANALYSIS
 */
export async function performCompleteContentResearch(
  websiteUrl: string,
  niche: string,
  targetAudience: string,
  primaryKeywords: string[],
  projectName: string = 'Algemeen' // NEW: project name for logging
): Promise<MasterContentPlan> {
  const isKeywordMode = !websiteUrl || websiteUrl.trim() === '';
  
  console.log(`\n🚀 ========================================`);
  console.log(`🚀 [CONTENT RESEARCH - ${projectName}]`);
  console.log(`🚀 Mode: ${isKeywordMode ? '🔑 KEYWORD' : '📂 PROJECT'}`);
  console.log(`🚀 ========================================`);
  
  if (!isKeywordMode) {
    console.log(`   🌐 Website: ${websiteUrl}`);
  }
  console.log(`   🎯 Niche/Keyword: ${niche}`);
  console.log(`   👥 Doelgroep: ${targetAudience}`);
  console.log(`   🔑 Keywords: ${primaryKeywords?.join(', ') || 'Geen keywords'}\n`);
  
  const startTime = Date.now();

  // Step 1: DEEP Website Analysis (project-specific)
  console.log(`📊 STAP 1/4: DIEPGAANDE WEBSITE ANALYSE`);
  console.log(`   ${isKeywordMode ? '⏭️  Overgeslagen (keyword modus)' : `🔍 Scannen van ${websiteUrl}...`}`);
  const websiteAnalysis = await analyzeWebsiteDeep(websiteUrl, niche, projectName);

  // Step 2: Competitor Analysis
  console.log(`\n🎯 STAP 2/4: CONCURRENT ANALYSE`);
  const competitorAnalysis = await analyzeCompetitors(niche, primaryKeywords);

  // Step 3: Trending Topics
  console.log(`\n🔥 STAP 3/4: TRENDING TOPICS RESEARCH`);
  const trendingTopics = await findTrendingTopics(niche);

  // Step 4: Generate Master Content Plan
  console.log(`\n✨ STAP 4/4: CONTENT PLAN GENEREREN`);
  console.log(`   💡 Input voor AI:`);
  console.log(`      - ${websiteAnalysis.existingTopics.length} bestaande topics`);
  console.log(`      - ${websiteAnalysis.contentGaps.length} content gaps`);
  console.log(`      - ${competitorAnalysis.competitorGaps.length} concurrent gaps`);
  console.log(`      - ${trendingTopics.topics.length} trending topics`);
  
  const contentIdeas = await generateMasterContentPlan(
    websiteAnalysis,
    competitorAnalysis,
    trendingTopics,
    niche,
    targetAudience
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  
  const summary = {
    totalIdeas: contentIdeas.length,
    highPriority: contentIdeas.filter(i => i.priority === 'high').length,
    mediumPriority: contentIdeas.filter(i => i.priority === 'medium').length,
    lowPriority: contentIdeas.filter(i => i.priority === 'low').length,
    competitorGaps: contentIdeas.filter(i => i.competitorGap).length,
    trendingTopics: contentIdeas.filter(i => i.trending).length,
  };

  console.log(`\n✅ ========================================`);
  console.log(`✅ [${projectName}] RESEARCH VOLTOOID in ${elapsed}s`);
  console.log(`✅ ========================================`);
  console.log(`   📈 ${summary.totalIdeas} content ideeën`);
  console.log(`   🔥 ${summary.highPriority} high priority`);
  console.log(`   ⚖️  ${summary.mediumPriority} medium priority`);
  console.log(`   📉 ${summary.lowPriority} low priority`);
  console.log(`   ⚡ ${summary.competitorGaps} concurrent gaps`);
  console.log(`   📊 ${summary.trendingTopics} trending topics\n`);

  return {
    websiteAnalysis,
    competitorAnalysis,
    trendingTopics,
    contentIdeas,
    summary,
    generatedAt: new Date(),
  };
}

/**
 * Daily refresh: Add new insights to existing plan
 */
export async function refreshDailyInsights(
  existingPlan: MasterContentPlan,
  niche: string,
  targetAudience: string
): Promise<ContentIdea[]> {
  console.log(`🔄 [DAILY REFRESH] Nieuwe inzichten voor ${niche}`);
  
  const openai = getOpenAI();
  
  try {
    // Get new trending topics
    const newTrends = await findTrendingTopics(niche);
    
    // Ensure we have valid data
    const trendsList = newTrends?.topics?.length > 0 
      ? newTrends.topics.map(t => `- ${t.topic}: ${t.reasoning}`).join('\n')
      : 'Geen nieuwe trends beschikbaar';
    
    const questionsList = newTrends?.questions?.length > 0
      ? newTrends.questions.slice(0, 10).join('\n')
      : 'Geen nieuwe vragen beschikbaar';
    
    const existingIdeasList = existingPlan?.contentIdeas?.length > 0
      ? existingPlan.contentIdeas.map(i => i.title).slice(0, 20).join('\n')
      : 'Geen bestaande ideeën';
    
    // Generate 5-10 new ideas based on trends
    const response = await openai.chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: `Genereer 7 NIEUWE content ideeën voor "${niche}" gebaseerd op de nieuwste trends.

DOELGROEP: ${targetAudience}

BESTAANDE IDEEËN (vermijd duplicaten):
${existingIdeasList}

NIEUWE TRENDS:
${trendsList}

NIEUWE VRAGEN:
${questionsList}

Genereer 7 VERSE, UNIEKE content ideeën die:
1. Inspelen op de NIEUWSTE trends
2. NIET overlappen met bestaande ideeën
3. Actueel en relevant zijn voor VANDAAG

JSON array formaat (zelfde als eerder).`
        }
      ],
      temperature: 0.9,
      max_tokens: 8000,
    });

    let newIdeas: ContentIdea[] = [];
    
    try {
      const content = response.choices[0]?.message?.content || '[]';
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to extract JSON array
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        newIdeas = JSON.parse(jsonMatch[0]);
      } else {
        newIdeas = JSON.parse(cleanContent);
      }
    } catch (parseError) {
      console.error('⚠️  [DAILY REFRESH] Failed to parse JSON, using empty array');
      newIdeas = [];
    }

    console.log(`✅ [DAILY REFRESH] ${newIdeas.length} nieuwe ideeën toegevoegd`);

    return newIdeas;
  } catch (error) {
    console.error('❌ [DAILY REFRESH] Error:', error);
    return [];
  }
}

/**
 * Generate a single content idea from a title
 * AI fills in all the details: keywords, outline, search intent, etc.
 */
export async function generateContentIdea(
  title: string,
  niche: string,
  targetAudience: string
): Promise<ContentIdea> {
  console.log(`🤖 [SINGLE IDEA] Generating content idea for: "${title}"`);

  const response = await fetch('https://api.aimlapi.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'system',
          content: `Je bent een SEO content strategist. Werk een content idee volledig uit met alle SEO details.`
        },
        {
          role: 'user',
          content: `CONTENT TITEL: "${title}"
NICHE: ${niche}
DOELGROEP: ${targetAudience}

Werk dit content idee volledig uit met:
- Focus keyword (het belangrijkste zoekwoord)
- Secondary keywords (5-8 gerelateerde keywords)
- Content type (guide, listicle, howto, review, comparison, news, opinion)
- Search intent (informational, commercial, transactional, navigational)
- Prioriteit (high, medium, low)
- Beschrijving (1-2 zinnen over de inhoud)
- Outline (6-8 H2 koppen voor de structuur)
- Geschatte SEO moeilijkheid (0-100)

Return als JSON object met deze structuur:
{
  "title": "De exacte titel",
  "focusKeyword": "hoofd zoekwoord",
  "secondaryKeywords": ["keyword1", "keyword2", ...],
  "contentType": "guide",
  "searchIntent": "informational",
  "priority": "medium",
  "description": "Korte beschrijving",
  "outline": ["H2 kop 1", "H2 kop 2", ...],
  "estimatedDifficulty": 50
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  try {
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    const idea = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanContent);
    
    console.log(`✅ [SINGLE IDEA] Generated idea with ${idea.outline?.length || 0} sections`);
    
    // Map content type to valid type
    const validContentTypes = ['guide', 'listicle', 'howto', 'review', 'comparison', 'news', 'opinion'];
    let contentType: 'guide' | 'listicle' | 'howto' | 'review' | 'comparison' | 'news' | 'opinion' = 'guide';
    
    if (idea.contentType && validContentTypes.includes(idea.contentType)) {
      contentType = idea.contentType as any;
    }
    
    return {
      title: idea.title || title,
      focusKeyword: idea.focusKeyword || title.toLowerCase(),
      secondaryKeywords: idea.secondaryKeywords || [],
      contentType: contentType,
      searchIntent: (idea.searchIntent || 'informational') as any,
      priority: (idea.priority || 'medium') as any,
      description: idea.description || `Een artikel over ${title}`,
      outline: idea.outline || ['Inleiding', 'Belangrijkste punten', 'Conclusie'],
      estimatedDifficulty: idea.estimatedDifficulty || 50,
      reasoning: `Content idee toegevoegd door gebruiker voor ${niche}`,
      internalLinkOpportunities: [],
      sources: [],
      trending: false,
      competitorGap: false,
    };
  } catch (parseError) {
    console.error('⚠️  [SINGLE IDEA] Failed to parse AI response, using defaults');
    
    // Return default idea structure if parsing fails
    return {
      title: title,
      focusKeyword: title.toLowerCase(),
      secondaryKeywords: [],
      contentType: 'guide',
      searchIntent: 'informational',
      priority: 'medium',
      description: `Een artikel over ${title}`,
      outline: ['Inleiding', 'Belangrijkste punten', 'Conclusie'],
      estimatedDifficulty: 50,
      reasoning: `Content idee toegevoegd door gebruiker voor ${niche}`,
      internalLinkOpportunities: [],
      sources: [],
      trending: false,
      competitorGap: false,
    };
  }
}
