
/**
 * Advanced Keyword Research met AI & Web Scraping
 * Genereert waardevolle keyword data voor SEO optimalisatie
 * Nu met concurrentieanalyse en uitgebreide website scan
 */

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';
const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY || '';

/**
 * Normaliseert een URL door automatisch https:// toe te voegen als het protocol ontbreekt
 * en trailing dots te verwijderen (die certificaat problemen veroorzaken)
 */
function normalizeUrl(url: string): string {
  if (!url) return url;
  
  // Trim whitespace
  url = url.trim();
  
  // Verwijder trailing dots van de hostname (certificaat probleem fix)
  url = url.replace(/\.+\//g, '/'); // Remove dots before slashes
  url = url.replace(/\.$/, ''); // Remove trailing dot at end
  
  // Als het al een protocol heeft, clean hostname en return
  if (url.match(/^https?:\/\//i)) {
    try {
      const urlObj = new URL(url);
      // Remove trailing dots from hostname
      urlObj.hostname = urlObj.hostname.replace(/\.+$/, '');
      return urlObj.toString();
    } catch {
      return url;
    }
  }
  
  // Anders, voeg https:// toe
  return `https://${url}`;
}

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  intent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  potentialScore: number;
  relevance: string;
  category: string;
  relatedKeywords: string[];
  questions: string[];
  contentIdeas: string[];
  // NIEUW: Strategische velden
  keywordTier?: 'primary' | 'secondary' | 'lsi'; // Hiërarchie
  cluster?: string; // Welk onderwerp cluster
  buyerJourneyStage?: 'awareness' | 'consideration' | 'decision'; // Buyer journey fase
  conversionPotential?: number; // Score 0-100 voor conversie kans
}

export interface WebsiteStructure {
  pages: string[];
  blogs: string[];
  totalPages: number;
  totalBlogs: number;
  mainTopics: string[];
}

export interface CompetitorData {
  name: string;
  url: string;
  description: string;
  topKeywords: string[];
  contentFocus: string[];
  estimatedTraffic: number;
}

export interface KeywordGap {
  keyword: string;
  usedByCompetitors: string[];
  missingInOwnSite: boolean;
  opportunity: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Analyseer een website en vind bestaande keywords
 */
export async function scanWebsiteForKeywords(url: string): Promise<string[]> {
  try {
    // Normaliseer de URL eerst
    url = normalizeUrl(url);
    console.log('🔍 Scanning website for existing keywords:', url);
    
    // Fetch website content with error handling for SSL/TLS issues
    let html = '';
    try {
      // IMPROVED: Better headers to bypass bot protection
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
        },
        // Add timeout - verlaagd naar 10s voor snellere feedback
        signal: AbortSignal.timeout(10000), // 10s timeout voor betere UX
        redirect: 'follow',
      });
      
      if (!response.ok) {
        console.log(`⚠️ HTTP ${response.status}: ${response.statusText} - falling back to AI analysis`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      html = await response.text();
      console.log(`✅ Successfully fetched ${html.length} bytes from website`);
    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError);
      
      // Check if it's a certificate error
      if (fetchError.cause?.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
        console.log('⚠️ TLS Certificate validation failed - domain mismatch');
      } else if (fetchError.name === 'AbortError') {
        console.log('⚠️ Request timeout - website took too long to respond');
      }
      
      // If website fetch fails, use AI with just the URL
      console.log('⚠️ Could not fetch website, using AI analysis of URL only');
      
      let domain: string;
      try {
        domain = new URL(url).hostname.replace('www.', '').replace(/\.+$/, '');
      } catch (urlError) {
        // If URL parsing fails, extract domain manually
        domain = url.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('/')[0].replace(/\.+$/, '');
      }
      
      // IMPROVED: Better AI prompt for domain-based keyword analysis
      const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5', // Claude 4.5 Sonnet voor superieure agentic tasks
          messages: [
            {
              role: 'user',
              content: `Je bent een SEO expert met kennis van Nederlandse en internationale websites. Analyseer het domein en geef relevante keywords op basis van de domeinnaam en de sector waarin deze website actief is. Focus op populaire zoektermen die mensen gebruiken om dit soort websites te vinden.

Analyseer dit domein en geef 20-25 belangrijke SEO keywords die passen bij deze website:

Domein: ${domain}
URL: ${url}

Geef keywords die:
1. Relevant zijn voor wat deze website vermoedelijk aanbiedt
2. In het Nederlands zijn (tenzij het een internationale site is)
3. Realistische zoektermen zijn die mensen gebruiken
4. Verschillende intenties dekken (informatief, commercieel, transactioneel)
5. Long-tail en short-tail variaties bevatten

Geef alleen de keywords, gescheiden door komma's. Geen nummering of bullets.`
            }
          ],
          temperature: 0.4,
          max_tokens: 500,
        }),
      });
      
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        const keywordsText = data.choices[0].message.content.trim();
        let keywords = keywordsText
          .split(/[,\n]/)
          .map((kw: string) => kw.trim())
          .filter((kw: string) => kw.length > 0 && kw.length < 100)
          .filter(filterOldYears)
          .map(normalizeKeyword);
        
        console.log(`✅ Found ${keywords.length} estimated keywords (website not accessible)`);
        return keywords;
      }
      
      console.log('❌ Both direct fetch and AI analysis failed');
      return [];
    }
    
    // Extract text content (simple approach)
    const text = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Use AI to extract keywords
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: `Je bent een SEO expert. Analyseer de tekst en extracteer de belangrijkste keywords en zoektermen. Geef alleen de keywords terug, gescheiden door komma's. Focus op 2-4 woord zinnen die mensen zouden zoeken. Keywords moeten beginnen met kleine letters, tenzij het eigennamen zijn.

Analyseer deze website content en geef de belangrijkste SEO keywords:

${text.substring(0, 4000)}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error('Failed to analyze website content');
    }
    
    const data = await aiResponse.json();
    const keywordsText = data.choices[0].message.content.trim();
    let keywords = keywordsText
      .split(/[,\n]/)
      .map((kw: string) => kw.trim())
      .filter((kw: string) => kw.length > 0 && kw.length < 100);
    
    // Filter oude jaartallen en normaliseer
    keywords = keywords
      .filter(filterOldYears)
      .map(normalizeKeyword);
    
    console.log(`✅ Found ${keywords.length} existing keywords`);
    return keywords;
    
  } catch (error) {
    console.error('Error scanning website:', error);
    return [];
  }
}

/**
 * Filter oude jaartallen uit keywords
 */
function filterOldYears(text: string): boolean {
  const currentYear = new Date().getFullYear();
  const oldYears = ['2020', '2021', '2022', '2023', '2024'];
  return !oldYears.some(year => text.includes(year));
}

/**
 * Normaliseer keyword naar lowercase (eerste letter)
 */
function normalizeKeyword(keyword: string): string {
  if (!keyword) return keyword;
  return keyword.charAt(0).toLowerCase() + keyword.slice(1);
}

/**
 * Progress callback type
 */
export type ProgressCallback = (step: string, progress: number) => void;

/**
 * Genereer nieuwe keyword kansen gebaseerd op de website
 * VERBETERD: Beter error handling en retry logic
 */
export async function generateKeywordOpportunities(
  websiteUrl: string,
  existingKeywords: string[],
  niche?: string,
  onProgress?: ProgressCallback
): Promise<KeywordData[]> {
  return retryKeywordGeneration(async () => {
    console.log('🚀 Generating keyword opportunities...');
    onProgress?.(`📊 Website analyse gestart voor ${websiteUrl}`, 2);
    onProgress?.(`✓ ${existingKeywords.length} bestaande keywords gevonden`, 5);
    
    // GEOPTIMALISEERD: 1 batch van 40 keywords voor betrouwbaarheid
    const allKeywords: KeywordData[] = [];
    const batchSize = 40; // Verlaagd voor betere success rate
    
    onProgress?.('🤖 AI model wordt geïnitialiseerd...', 8);
    onProgress?.('🔍 Genereren van 40 keyword kansen met AI...', 10);
    
    const batchProgress = 10;
    onProgress?.(`⚡ ${batchSize} keywords genereren...`, batchProgress);
    
    // Diverse keyword types in één batch
    const batchFocus = 'gericht op commercial intent en buyer journey';
    
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4o voor snellere response
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO keyword research expert met focus op commercial keywords. Geef ALLEEN een valide JSON array terug, geen extra tekst. Zorg dat alle strings compleet zijn.'
          },
          {
            role: 'user',
            content: `Genereer ${batchSize} STRATEGISCHE keyword mogelijkheden voor deze website.

FOCUS: ${batchFocus}

PRIORITEIT (verdeling over ${batchSize} keywords):
1. **Commercial Intent (40%)** - Keywords met koopintentie:
   - "beste [product/service]"
   - "[product] review"
   - "[product] vergelijking"
   - "top [nummer] [product]"
   - "[product] kopen"
   - "[product] prijs"
   - "goedkope [product]"

2. **Long-tail Commercial (30%)** - Specifieke buyer keywords:
   - "beste [product] voor [use case]"
   - "[product] met [feature]"
   - "[brand] vs [brand]"
   - "waar [product] kopen"
   - "[product] aanbieding"

3. **Question-based Commercial (20%)** - Commercial vragen:
   - "welke [product] is het beste"
   - "hoe kies je [product]"
   - "wat is de beste [product]"
   - "waarom [product] kopen"

4. **Informational met Intent (10%)** - Informatief maar met commercial link:
   - "[product] uitleg"
   - "[product] gids"
   - "hoe werkt [product]"
   - "[product] tips"

BELANGRIJK VOOR BETERE FOCUS:
- Maximaal 30% pure informational keywords
- Minimaal 70% keywords met commercial/buyer intent
- Long-tail keywords (3-6 woorden) hebben prioriteit
- Focus op decision & consideration stage van buyer journey
- Keywords moeten ACTIONABLE zijn (leiden tot conversie)

BELANGRIJK: 
- Keywords beginnen lowercase (tenzij eigennaam)
- GEEN jaartallen 2020-2024
- Realistische search volumes (100-50000)
- Difficulty 1-100
- CPC in euro's
- Zorg dat JSON compleet en valide is

JSON format:
[{
  "keyword": "keyword phrase",
  "searchVolume": 1200,
  "difficulty": 35,
  "cpc": 0.85,
  "competition": "low|medium|high",
  "intent": "informational|commercial|transactional",
  "category": "category name",
  "relatedKeywords": ["keyword1", "keyword2"],
  "questions": ["Question?"],
  "contentIdeas": ["Content idea"]
}]

---

Website: ${websiteUrl}
Niche: ${niche || 'algemeen'}

Bestaande keywords (vermijd duplicaten):
${existingKeywords.slice(0, 20).join(', ')}

Genereer ${batchSize} NIEUWE, UNIEKE keywords.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4500,
      }),
      signal: AbortSignal.timeout(55000), // 55 seconden timeout - VERHOOGD
    });
  
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`API error:`, errorText);
      throw new Error('AI API request failed');
    }
    
    const data = await aiResponse.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse JSON safely
    let batchKeywords = parseKeywordJSON(content);
    
    if (batchKeywords.length === 0) {
      throw new Error('No valid keywords generated');
    }
    
    // Filter en normaliseer
    batchKeywords = batchKeywords
      .filter(kw => filterOldYears(kw.keyword))
      .map(kw => ({
        ...kw,
        keyword: normalizeKeyword(kw.keyword),
        relatedKeywords: (kw.relatedKeywords || [])
          .filter(filterOldYears)
          .map(normalizeKeyword),
        questions: (kw.questions || []).map(q => 
          q.charAt(0).toUpperCase() + q.slice(1)
        ),
        contentIdeas: (kw.contentIdeas || []).map(idea =>
          idea.charAt(0).toUpperCase() + idea.slice(1)
        )
      }));
    
    // Filter duplicaten
    const existingSet = new Set(existingKeywords.map(k => k.toLowerCase()));
    batchKeywords = batchKeywords.filter(kw => 
      !existingSet.has(kw.keyword.toLowerCase())
    );
    
    allKeywords.push(...batchKeywords);
    onProgress?.(`✓ ${batchKeywords.length} nieuwe keywords gegenereerd`, 50);
    
    onProgress?.('📊 Potentie scores berekenen...', 75);
    
    // Calculate potential score voor ALLE keywords
    allKeywords.forEach((kw, index) => {
      const volumeScore = Math.min(kw.searchVolume / 100, 40); // Max 40 points
      const difficultyScore = (100 - kw.difficulty) * 0.3; // Max 30 points
      const competitionScore = {
        'low': 30,
        'medium': 20,
        'high': 10
      }[kw.competition] || 20;
      
      kw.potentialScore = Math.round(volumeScore + difficultyScore + competitionScore);
      kw.relevance = kw.potentialScore > 70 ? 'excellent' : 
                     kw.potentialScore > 50 ? 'good' : 'moderate';
      
      // Update progress
      if (index % 10 === 0) {
        const calcProgress = 75 + Math.round((index / allKeywords.length) * 15);
        onProgress?.(`⚡ Analyseren: ${index + 1}/${allKeywords.length} keywords`, calcProgress);
      }
    });
    
    onProgress?.(`✓ ${allKeywords.length} keywords geanalyseerd`, 90);
    onProgress?.('🎯 Resultaten sorteren op potentie...', 95);
    
    // Sort by potential score
    allKeywords.sort((a, b) => b.potentialScore - a.potentialScore);
    
    // Count keywords by category
    const excellentCount = allKeywords.filter(k => k.potentialScore > 70).length;
    const goodCount = allKeywords.filter(k => k.potentialScore > 50 && k.potentialScore <= 70).length;
    const moderateCount = allKeywords.filter(k => k.potentialScore <= 50).length;
    
    onProgress?.(`✓ ${allKeywords.length} totaal: ${excellentCount} excellent, ${goodCount} goed, ${moderateCount} moderate`, 98);
    onProgress?.('✨ Klaar! Keywords zijn gesorteerd en klaar voor gebruik', 100);
    
    console.log(`✅ Generated ${allKeywords.length} keyword opportunities`);
    console.log(`   - ${excellentCount} excellent (70+ score)`);
    console.log(`   - ${goodCount} good (50-70 score)`);
    console.log(`   - ${moderateCount} moderate (< 50 score)`);
    
    return allKeywords;
  });
}

/**
 * Analyseer een specifiek keyword in detail
 */
export async function analyzeKeyword(keyword: string, niche?: string): Promise<KeywordData> {
  try {
    console.log('🔍 Analyzing keyword:', keyword);
    
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: `Je bent een SEO analyst. Analyseer het keyword en geef gedetailleerde SEO data terug.

Geef ALLEEN een JSON object terug met dit formaat:
{
  "keyword": "exact keyword",
  "searchVolume": 1500,
  "difficulty": 45,
  "cpc": 1.2,
  "competition": "medium",
  "intent": "informational",
  "category": "category name",
  "relatedKeywords": ["keyword 1", "keyword 2"],
  "questions": ["question 1?", "question 2?"],
  "contentIdeas": ["idea 1", "idea 2"]
}

Geen extra tekst, alleen JSON.`
          },
          {
            role: 'user',
            content: `Analyseer dit keyword: "${keyword}"
${niche ? `Niche: ${niche}` : ''}`
          }
        ],
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error('Failed to analyze keyword');
    }
    
    const data = await aiResponse.json();
    let content = data.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const keywordData: KeywordData = JSON.parse(content);
    
    // Calculate potential score
    const volumeScore = Math.min(keywordData.searchVolume / 100, 40);
    const difficultyScore = (100 - keywordData.difficulty) * 0.3;
    const competitionScore = {
      'low': 30,
      'medium': 20,
      'high': 10
    }[keywordData.competition] || 20;
    
    keywordData.potentialScore = Math.round(volumeScore + difficultyScore + competitionScore);
    keywordData.relevance = keywordData.potentialScore > 70 ? 'excellent' : 
                            keywordData.potentialScore > 50 ? 'good' : 'moderate';
    
    return keywordData;
    
  } catch (error) {
    console.error('Error analyzing keyword:', error);
    throw error;
  }
}

/**
 * Genereer content ideeën voor een keyword
 */
export async function generateContentIdeas(keyword: string, count: number = 5): Promise<string[]> {
  try {
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: 'Je bent een content strategist. Genereer creatieve en SEO-geoptimaliseerde content titels. Geef alleen de titels, één per regel.'
          },
          {
            role: 'user',
            content: `Genereer ${count} pakkende blog/artikel titels voor het keyword: "${keyword}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error('Failed to generate content ideas');
    }
    
    const data = await aiResponse.json();
    const content = data.choices[0].message.content.trim();
    const ideas = content
      .split('\n')
      .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').trim())
      .filter((line: string) => line.length > 0);
    
    return ideas;
    
  } catch (error) {
    console.error('Error generating content ideas:', error);
    return [];
  }
}

/**
 * ========================================
 * NIEUWE FUNCTIES: CONCURRENTIE ANALYSE
 * ========================================
 */

/**
 * Analyseer de volledige structuur van een website
 * Inclusief alle pagina's en blogs
 */
export async function analyzeWebsiteStructure(
  url: string,
  onProgress?: ProgressCallback
): Promise<WebsiteStructure> {
  try {
    // Normaliseer de URL eerst
    url = normalizeUrl(url);
    onProgress?.('🔍 Website structuur analyseren...', 5);
    
    // Try to fetch sitemap first
    let pages: string[] = [];
    let blogs: string[] = [];
    
    try {
      const sitemapUrl = new URL('/sitemap.xml', url).toString();
      const sitemapResponse = await fetch(sitemapUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml,text/xml,*/*',
          'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://www.google.com/',
        },
        signal: AbortSignal.timeout(10000),
        redirect: 'follow',
      });
      
      if (sitemapResponse.ok) {
        onProgress?.('📄 Sitemap gevonden - URLs extracteren...', 10);
        const sitemapText = await sitemapResponse.text();
        
        // Extract URLs from sitemap
        const urlMatches = sitemapText.match(/<loc>(.*?)<\/loc>/g) || [];
        const allUrls = urlMatches.map(match => 
          match.replace('<loc>', '').replace('</loc>', '').trim()
        );
        
        // Categorize URLs
        for (const pageUrl of allUrls) {
          const lowerUrl = pageUrl.toLowerCase();
          if (lowerUrl.includes('/blog') || lowerUrl.includes('/artikel') || 
              lowerUrl.includes('/nieuws') || lowerUrl.includes('/post')) {
            blogs.push(pageUrl);
          } else {
            pages.push(pageUrl);
          }
        }
        
        onProgress?.(`✓ ${allUrls.length} URLs gevonden in sitemap`, 20);
      }
    } catch (sitemapError) {
      onProgress?.('⚠️ Geen sitemap gevonden - alternatieve methode...', 15);
    }
    
    // If no sitemap, use AI to analyze the website
    if (pages.length === 0 && blogs.length === 0) {
      onProgress?.('🤖 AI analyseren van website structuur...', 25);
      
      // Use improved headers for fetching
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Referer': 'https://www.google.com/',
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [
            {
              role: 'user',
              content: `Analyseer de HTML en identificeer alle belangrijke pagina's en blog artikelen.
              
Geef ALLEEN een JSON object terug met dit formaat:
{
  "pages": ["Homepage", "Over Ons", "Diensten", "Contact"],
  "blogs": ["Blog titel 1", "Blog titel 2"],
  "mainTopics": ["topic 1", "topic 2"]
}

Geen extra tekst, alleen JSON.

---

Analyseer deze website structuur:\n\nURL: ${url}\n\nHTML:\n${html.substring(0, 8000)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });
      
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        let content = data.choices[0].message.content.trim();
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        const structure = JSON.parse(content);
        
        pages = structure.pages || [];
        blogs = structure.blogs || [];
        
        onProgress?.(`✓ ${pages.length} pagina's en ${blogs.length} blogs gevonden`, 35);
      }
    }
    
    // Analyze main topics from all content
    onProgress?.('📊 Hoofdonderwerpen identificeren...', 40);
    
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: 'Identificeer de hoofdonderwerpen van deze website op basis van de pagina titels en blog onderwerpen. Geef alleen een lijst met onderwerpen, gescheiden door komma\'s.'
          },
          {
            role: 'user',
            content: `Website: ${url}\n\nPagina's: ${pages.join(', ')}\n\nBlogs: ${blogs.join(', ')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });
    
    let mainTopics: string[] = [];
    if (aiResponse.ok) {
      const data = await aiResponse.json();
      const topicsText = data.choices[0].message.content.trim();
      mainTopics = topicsText.split(/[,\n]/).map((t: string) => t.trim()).filter((t: string) => t.length > 0);
    }
    
    onProgress?.(`✓ ${mainTopics.length} hoofdonderwerpen gevonden`, 50);
    
    return {
      pages,
      blogs,
      totalPages: pages.length,
      totalBlogs: blogs.length,
      mainTopics: mainTopics.slice(0, 10), // Max 10 topics
    };
    
  } catch (error) {
    console.error('Error analyzing website structure:', error);
    return {
      pages: [],
      blogs: [],
      totalPages: 0,
      totalBlogs: 0,
      mainTopics: [],
    };
  }
}

/**
 * Vind concurrenten via web search en AI analyse
 */
export async function findCompetitors(
  websiteUrl: string,
  niche: string,
  onProgress?: ProgressCallback
): Promise<CompetitorData[]> {
  try {
    // Normaliseer de URL eerst
    websiteUrl = normalizeUrl(websiteUrl);
    onProgress?.('🔍 Concurrenten zoeken via AI analyse...', 5);
    
    // Extract domain for better analysis
    const domain = new URL(websiteUrl).hostname.replace('www.', '');
    
    // Use AIML API with direct competitor analysis (no web search needed for basic analysis)
    const searchResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: `Je bent een marktonderzoek expert. Identificeer de top concurrenten in de gegeven niche op basis van je kennis van de markt.
            
Geef ALLEEN een JSON array terug met dit EXACTE formaat:
[
  {
    "name": "Concurrent Naam",
    "url": "https://concurrent.nl",
    "description": "Korte beschrijving",
    "estimatedTraffic": 50000
  }
]

BELANGRIJK:
- Gebruik alleen ECHTE, BESTAANDE websites
- Geef maximaal 5 concurrenten
- Alle strings moeten proper escaped zijn (gebruik \\" voor quotes in tekst)
- Geen extra tekst buiten de JSON
- Zorg dat de JSON COMPLEET en VALIDE is`
          },
          {
            role: 'user',
            content: `Identificeer de top 5 concurrenten voor deze website:

Website: ${websiteUrl} (${domain})
Niche: ${niche}

Geef me Nederlandse of internationale concurrenten die vergelijkbare diensten/producten aanbieden in dezelfde niche.
Focus op bekende, gevestigde spelers in de markt.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });
    
    onProgress?.('📊 Concurrent data verwerken...', 30);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('API error:', errorText);
      throw new Error('Failed to find competitors');
    }
    
    const data = await searchResponse.json();
    let content = data.choices[0].message.content.trim();
    
    // Clean up the JSON response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Remove any text before the first [ or after the last ]
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    let competitors: CompetitorData[];
    try {
      competitors = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content:', content.substring(0, 500));
      
      // Return empty array instead of throwing
      console.log('⚠️ Could not parse competitors, returning empty array');
      return [];
    }
    
    // Validate competitors array
    if (!Array.isArray(competitors) || competitors.length === 0) {
      console.log('⚠️ No valid competitors found');
      return [];
    }
    
    // Ensure all required fields exist
    competitors = competitors.filter(c => c.name && c.url).slice(0, 5);
    
    onProgress?.(`✓ ${competitors.length} concurrenten gevonden`, 50);
    
    // Analyze each competitor for keywords and content focus (with error handling)
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      onProgress?.(`🔍 Analyseren: ${competitor.name}...`, 50 + (i * 8));
      
      try {
        // Try to scan competitor website (with timeout)
        const keywords = await Promise.race([
          scanWebsiteForKeywords(competitor.url),
          new Promise<string[]>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ]);
        
        competitor.topKeywords = keywords.slice(0, 15); // Top 15 keywords
        
        // Get content focus
        if (competitor.topKeywords.length > 0) {
          const focusResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AIML_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4.5',
              messages: [
                {
                  role: 'user',
                  content: 'Analyseer de keywords en geef 3-5 hoofdonderwerpen waar deze website zich op focust. Geef alleen de onderwerpen, gescheiden door komma\'s.'
                },
                {
                  role: 'user',
                  content: `Website: ${competitor.name}\nKeywords: ${competitor.topKeywords.slice(0, 20).join(', ')}`
                }
              ],
              temperature: 0.3,
              max_tokens: 300,
            }),
          });
          
          if (focusResponse.ok) {
            const focusData = await focusResponse.json();
            const focusText = focusData.choices[0].message.content.trim();
            competitor.contentFocus = focusText.split(/[,\n]/).map((f: string) => f.trim()).filter((f: string) => f.length > 0);
          } else {
            competitor.contentFocus = [];
          }
        } else {
          competitor.contentFocus = [];
        }
        
      } catch (error) {
        console.log(`⚠️ Could not analyze competitor ${competitor.name}:`, error);
        competitor.topKeywords = [];
        competitor.contentFocus = [];
      }
    }
    
    onProgress?.(`✓ Alle ${competitors.length} concurrenten geanalyseerd`, 90);
    
    return competitors;
    
  } catch (error) {
    console.error('Error finding competitors:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Vergelijk eigen keywords met concurrent keywords (gap analyse)
 */
export async function analyzeKeywordGaps(
  ownKeywords: string[],
  competitors: CompetitorData[],
  onProgress?: ProgressCallback
): Promise<KeywordGap[]> {
  try {
    onProgress?.('🔍 Keyword gap analyse starten...', 5);
    
    // Collect all competitor keywords
    const competitorKeywords = new Map<string, string[]>();
    
    for (const competitor of competitors) {
      for (const keyword of competitor.topKeywords) {
        const normalizedKeyword = normalizeKeyword(keyword);
        if (!competitorKeywords.has(normalizedKeyword)) {
          competitorKeywords.set(normalizedKeyword, []);
        }
        competitorKeywords.get(normalizedKeyword)?.push(competitor.name);
      }
    }
    
    onProgress?.(`📊 ${competitorKeywords.size} unieke concurrent keywords gevonden`, 20);
    
    // Find gaps
    const gaps: KeywordGap[] = [];
    const ownKeywordsNormalized = new Set(ownKeywords.map(normalizeKeyword));
    
    let processed = 0;
    for (const [keyword, usedBy] of competitorKeywords.entries()) {
      processed++;
      
      if (processed % 10 === 0) {
        const progress = 20 + Math.round((processed / competitorKeywords.size) * 60);
        onProgress?.(`⚡ Analyseren: ${processed}/${competitorKeywords.size}`, progress);
      }
      
      const missingInOwnSite = !ownKeywordsNormalized.has(keyword);
      
      if (missingInOwnSite && usedBy.length >= 2) {
        // Only include if 2+ competitors use it
        gaps.push({
          keyword,
          usedByCompetitors: usedBy,
          missingInOwnSite: true,
          opportunity: usedBy.length >= 4 ? 'high' : usedBy.length >= 3 ? 'medium' : 'low',
          reason: `${usedBy.length} concurrenten gebruiken dit keyword, maar jij niet`,
        });
      }
    }
    
    onProgress?.(`✓ ${gaps.length} keyword kansen gevonden`, 85);
    
    // Sort by opportunity level
    gaps.sort((a, b) => {
      const opportunityScore = { high: 3, medium: 2, low: 1 };
      return opportunityScore[b.opportunity] - opportunityScore[a.opportunity];
    });
    
    onProgress?.('✨ Gap analyse compleet!', 100);
    
    return gaps.slice(0, 50); // Top 50 gaps
    
  } catch (error) {
    console.error('Error analyzing keyword gaps:', error);
    return [];
  }
}

/**
 * ===========================
 * NIEUWE FUNCTIONALITEIT: KEYWORD-BASED RESEARCH & CONTENT SILOS
 * ===========================
 */

export interface ContentSilo {
  pillarTopic: string;
  pillarKeyword: string;
  description: string;
  estimatedSearchVolume: number;
  subTopics: {
    topic: string;
    keyword: string;
    contentType: 'blog' | 'guide' | 'tutorial' | 'comparison' | 'listicle';
    priority: 'high' | 'medium' | 'low';
    estimatedSearchVolume: number;
  }[];
  internalLinkingStrategy: string;
  totalPotentialTraffic: number;
}

export interface SitePlan {
  mainKeyword: string;
  niche: string;
  targetAudience: string;
  contentSilos: ContentSilo[];
  totalArticles: number;
  estimatedTotalTraffic: number;
  implementationPhases: {
    phase: number;
    title: string;
    articles: string[];
    estimatedDuration: string;
    focus: string;
  }[];
  longTermStrategy: string;
}

/**
 * Helper: Retry logic voor keyword generation
 */
async function retryKeywordGeneration<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`⚠️ Keyword generation attempt ${i + 1} failed, ${i < maxRetries - 1 ? 'retrying...' : 'giving up'}`);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      }
    }
  }
  
  throw lastError;
}

/**
 * Helper: Parse JSON safely with error recovery
 */
function parseKeywordJSON(content: string): KeywordData[] {
  try {
    // Clean JSON
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Content preview:', content.substring(0, 500));
    
    // Try to fix common issues
    try {
      // Remove trailing commas
      content = content.replace(/,(\s*[}\]])/g, '$1');
      // Try parsing again
      return JSON.parse(content);
    } catch (retryError) {
      console.error('JSON recovery failed');
      return [];
    }
  }
}

/**
 * ===========================
 * NIEUWE STRATEGISCHE KEYWORD ANALYSE
 * ===========================
 */

/**
 * Analyseer keywords strategisch en identificeer focus keywords
 */
export async function strategicallyAnalyzeKeywords(
  keywords: KeywordData[],
  mainTopic: string,
  onProgress?: ProgressCallback
): Promise<KeywordData[]> {
  try {
    onProgress?.('🎯 Strategische keyword analyse starten...', 5);
    
    // STAP 1: Gebruik AI om keywords te clusteren en strategisch te analyseren
    onProgress?.('🤖 AI analyseren van keyword intent en clusters...', 10);
    
    const keywordList = keywords.map(k => k.keyword).join(', ');
    
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5', // Claude 4.5 voor superieure analyse
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO strategie expert. Analyseer keywords en geef een strategische classificatie. Geef ALLEEN JSON terug, geen extra tekst.'
          },
          {
            role: 'user',
            content: `Analyseer deze keywords strategisch voor het onderwerp "${mainTopic}".

Voor elk keyword bepaal je:
1. **keywordTier**: 
   - "primary" = Top focus keywords (1-3 beste keywords met hoogste potentie en relevantie)
   - "secondary" = Ondersteunende keywords (5-10 belangrijke variaties)
   - "lsi" = LSI/semantische keywords (rest)

2. **cluster**: Groepeer in onderwerp clusters (bijv. "productreview", "koopgids", "vergelijking", "tips")

3. **buyerJourneyStage**:
   - "awareness" = Informatief, kennis zoeken (wat is, hoe werkt, waarom)
   - "consideration" = Vergelijken, evalueren (beste, top, vergelijking, review)
   - "decision" = Klaar om te kopen (kopen, prijs, aanbieding, waar te koop)

4. **conversionPotential**: Score 0-100 voor conversie kans
   - Hoge intent keywords (kopen, prijs) = 80-100
   - Commercial keywords (beste, review) = 60-80  
   - Informational keywords = 20-40

BELANGRIJK:
- Identificeer maximaal 3 PRIMARY keywords
- Kies 5-10 SECONDARY keywords
- Rest zijn LSI keywords
- Focus op commercial intent voor betere ROI

Keywords: ${keywordList.substring(0, 3000)}

Geef JSON array terug met dit formaat:
[{
  "keyword": "exact keyword",
  "keywordTier": "primary|secondary|lsi",
  "cluster": "cluster naam",
  "buyerJourneyStage": "awareness|consideration|decision",
  "conversionPotential": 75
}]

Geen extra tekst, alleen JSON array.`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });
    
    if (!aiResponse.ok) {
      throw new Error('Strategic analysis failed');
    }
    
    const data = await aiResponse.json();
    let content = data.choices[0].message.content.trim();
    
    // Parse JSON
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonStart = content.indexOf('[');
    const jsonEnd = content.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      content = content.substring(jsonStart, jsonEnd + 1);
    }
    
    const strategicData: Array<{
      keyword: string;
      keywordTier: 'primary' | 'secondary' | 'lsi';
      cluster: string;
      buyerJourneyStage: 'awareness' | 'consideration' | 'decision';
      conversionPotential: number;
    }> = JSON.parse(content);
    
    onProgress?.('✓ Keywords strategisch geanalyseerd', 50);
    
    // STAP 2: Merge strategische data met bestaande keywords
    onProgress?.('🔄 Strategische data toepassen...', 60);
    
    const strategicMap = new Map(
      strategicData.map(s => [s.keyword.toLowerCase(), s])
    );
    
    keywords.forEach(kw => {
      const strategic = strategicMap.get(kw.keyword.toLowerCase());
      if (strategic) {
        kw.keywordTier = strategic.keywordTier;
        kw.cluster = strategic.cluster;
        kw.buyerJourneyStage = strategic.buyerJourneyStage;
        kw.conversionPotential = strategic.conversionPotential;
      } else {
        // Fallback: bepaal tier op basis van potentialScore
        if (kw.potentialScore >= 75) kw.keywordTier = 'primary';
        else if (kw.potentialScore >= 50) kw.keywordTier = 'secondary';
        else kw.keywordTier = 'lsi';
        
        kw.cluster = kw.category || 'algemeen';
        kw.buyerJourneyStage = kw.intent === 'transactional' ? 'decision' : 
                                kw.intent === 'commercial' ? 'consideration' : 'awareness';
        kw.conversionPotential = kw.intent === 'transactional' ? 85 : 
                                 kw.intent === 'commercial' ? 65 : 30;
      }
    });
    
    onProgress?.('📊 Keywords sorteren op strategie...', 80);
    
    // STAP 3: Sort strategisch
    // Eerst primary, dan secondary, dan lsi
    // Binnen elke tier: hoogste potentialScore eerst
    keywords.sort((a, b) => {
      const tierOrder = { 'primary': 0, 'secondary': 1, 'lsi': 2 };
      const aTier = tierOrder[a.keywordTier || 'lsi'];
      const bTier = tierOrder[b.keywordTier || 'lsi'];
      
      if (aTier !== bTier) return aTier - bTier;
      return b.potentialScore - a.potentialScore;
    });
    
    // Count stats
    const primaryCount = keywords.filter(k => k.keywordTier === 'primary').length;
    const secondaryCount = keywords.filter(k => k.keywordTier === 'secondary').length;
    const lsiCount = keywords.filter(k => k.keywordTier === 'lsi').length;
    
    const clusters = [...new Set(keywords.map(k => k.cluster).filter(Boolean))];
    
    onProgress?.(`✓ ${primaryCount} primary, ${secondaryCount} secondary, ${lsiCount} LSI keywords`, 95);
    onProgress?.(`✓ ${clusters.length} onderwerp clusters: ${clusters.slice(0, 3).join(', ')}...`, 98);
    onProgress?.('✨ Strategische analyse compleet!', 100);
    
    console.log('📊 Strategic keyword analysis:');
    console.log(`   - ${primaryCount} primary focus keywords`);
    console.log(`   - ${secondaryCount} secondary keywords`);
    console.log(`   - ${lsiCount} LSI keywords`);
    console.log(`   - ${clusters.length} clusters: ${clusters.join(', ')}`);
    
    return keywords;
    
  } catch (error) {
    console.error('Strategic analysis error:', error);
    // Return original keywords zonder strategic data
    return keywords;
  }
}

/**
 * Genereer keyword opportunities vanuit een keyword (ipv URL)
 * VERBETERD: Beter error handling en retry logic
 */
export async function generateKeywordOpportunitiesFromKeyword(
  seedKeyword: string,
  niche?: string,
  onProgress?: ProgressCallback
): Promise<KeywordData[]> {
  return retryKeywordGeneration(async () => {
    console.log('🌱 Starting keyword-based research for:', seedKeyword);
    onProgress?.(`🌱 Keyword research starten voor: ${seedKeyword}`, 3);
    
    // GEOPTIMALISEERD: 1 batch van 40 keywords voor betrouwbaarheid
    const allKeywords: KeywordData[] = [];
    const batchSize = 40; // Verlaagd voor betere success rate
    
    onProgress?.('🤖 AI model initialiseren...', 5);
    onProgress?.('🔍 Genereren van 40 keyword variaties...', 10);
    
    const batchProgress = 15;
    onProgress?.(`⚡ ${batchSize} keyword kansen genereren met AI...`, batchProgress);
    
    // Focus op commercial intent en buyer journey
    const batchFocus = 'strategisch gericht op commercial keywords en conversie';
    
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Gebruik GPT-4o voor snellere response
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO keyword research expert gespecialiseerd in commercial keywords. Geef ALLEEN een valide JSON array terug, geen extra tekst. Zorg dat alle strings compleet zijn en geen ontbrekende komma\'s.'
          },
          {
            role: 'user',
            content: `Genereer ${batchSize} STRATEGISCHE keyword variaties voor: "${seedKeyword}"
${niche ? `Niche: ${niche}` : ''}

FOCUS: ${batchFocus}

PRIORITEIT (verdeling over ${batchSize} keywords):
1. **Commercial Intent (40%)** - Keywords met directe koopintentie:
   - "beste ${seedKeyword}"
   - "${seedKeyword} review"
   - "${seedKeyword} vergelijking"
   - "top [nummer] ${seedKeyword}"
   - "${seedKeyword} kopen"
   - "${seedKeyword} prijs"
   - "goedkope ${seedKeyword}"
   - "${seedKeyword} aanbieding"

2. **Long-tail Commercial (30%)** - Specifieke, gerichte keywords:
   - "beste ${seedKeyword} voor [specifiek doel]"
   - "${seedKeyword} met [feature]"
   - "[merk/type] ${seedKeyword}"
   - "waar ${seedKeyword} kopen"
   - "${seedKeyword} online bestellen"

3. **Question-based Commercial (20%)** - Vragen met koopintent:
   - "welke ${seedKeyword} is het beste"
   - "hoe kies je ${seedKeyword}"
   - "wat is de beste ${seedKeyword}"
   - "welke ${seedKeyword} kopen"

4. **Informational met Intent (10%)** - Informatief maar relevant:
   - "${seedKeyword} gids"
   - "${seedKeyword} tips"
   - "hoe werkt ${seedKeyword}"

BELANGRIJK VOOR BETERE FOCUS:
- Minimaal 70% commercial/buyer intent keywords
- Maximaal 30% pure informational keywords
- Long-tail keywords (3-6 woorden) prioriteit
- Focus op "consideration" en "decision" buyer stages
- Keywords moeten conversie-gericht zijn
- Vermijd te generieke keywords

BELANGRIJK:
- Keywords beginnen lowercase
- GEEN jaartallen 2020-2024
- Realistische search volumes (100-50000)
- Difficulty 1-100
- CPC in euro's
- Zorg dat JSON compleet en valide is

JSON format:
[{
  "keyword": "keyword phrase",
  "searchVolume": 1200,
  "difficulty": 35,
  "cpc": 0.85,
  "competition": "low|medium|high",
  "intent": "informational|commercial|transactional",
  "category": "category name",
  "relatedKeywords": ["keyword1", "keyword2"],
  "questions": ["Question 1?", "Question 2?"],
  "contentIdeas": ["Content idea 1", "Content idea 2"]
}]`
          }
        ],
        temperature: 0.7,
        max_tokens: 4500,
      }),
      signal: AbortSignal.timeout(55000), // 55 seconden timeout - VERHOOGD
    });
    
    onProgress?.('📥 AI response ontvangen, keywords verwerken...', 40);
    
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error(`AI API failed:`, errorText);
      throw new Error('AI model response error');
    }
    
    const data = await aiResponse.json();
    const content = data.choices[0].message.content.trim();
    
    // Parse JSON safely
    let batchKeywords = parseKeywordJSON(content);
    
    if (batchKeywords.length === 0) {
      throw new Error('No valid keywords generated');
    }
    
    // Filter en normaliseer
    batchKeywords = batchKeywords
      .filter(kw => filterOldYears(kw.keyword))
      .map(kw => ({
        ...kw,
        keyword: normalizeKeyword(kw.keyword),
        relatedKeywords: (kw.relatedKeywords || [])
          .filter(filterOldYears)
          .map(normalizeKeyword),
        questions: (kw.questions || []).map(q => 
          q.charAt(0).toUpperCase() + q.slice(1)
        ),
        contentIdeas: (kw.contentIdeas || []).map(idea =>
          idea.charAt(0).toUpperCase() + idea.slice(1)
        )
      }));
    
    allKeywords.push(...batchKeywords);
    onProgress?.(`✓ ${batchKeywords.length} keywords succesvol gegenereerd!`, 65);
    
    onProgress?.('📊 Potentie scores berekenen...', 75);
    
    // Calculate scores
    onProgress?.('⚡ Zoekvolume en moeilijkheidsgraad analyseren...', 80);
    
    allKeywords.forEach((kw, index) => {
      const volumeScore = Math.min(kw.searchVolume / 100, 40);
      const difficultyScore = (100 - kw.difficulty) * 0.3;
      const competitionScore = { 'low': 30, 'medium': 20, 'high': 10 }[kw.competition] || 20;
      
      kw.potentialScore = Math.round(volumeScore + difficultyScore + competitionScore);
      kw.relevance = kw.potentialScore > 70 ? 'excellent' : 
                     kw.potentialScore > 50 ? 'good' : 'moderate';
    });
    
    onProgress?.('🎯 Keywords sorteren op potentie...', 90);
    
    // Sort
    allKeywords.sort((a, b) => b.potentialScore - a.potentialScore);
    
    const excellentCount = allKeywords.filter(k => k.potentialScore > 70).length;
    const goodCount = allKeywords.filter(k => k.potentialScore > 50 && k.potentialScore <= 70).length;
    
    onProgress?.('✨ Keyword research afgerond!', 98);
    
    onProgress?.(`✓ ${allKeywords.length} keywords: ${excellentCount} excellent, ${goodCount} goed`, 98);
    onProgress?.('✨ Keyword research compleet!', 100);
    
    console.log(`✅ Generated ${allKeywords.length} keywords from seed`);
    console.log(`   - ${excellentCount} excellent (70+)`);
    console.log(`   - ${goodCount} good (50-70)`);
    
    return allKeywords;
  });
}

/**
 * Genereer content silos voor topical authority
 * UITGEBREID: Nu met 10-15 sub-topics per silo en veel meer detail
 */
export async function generateContentSilos(
  mainKeyword: string,
  niche?: string,
  numberOfSilos: number = 5,
  onProgress?: ProgressCallback
): Promise<ContentSilo[]> {
  try {
    onProgress?.(`🏗️ Content silos genereren voor: ${mainKeyword}`, 5);
    
    // STAP 1: Genereer de hoofdstructuur van silos
    onProgress?.('🧠 AI genereert pillar topics...', 10);
    
    const siloResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: `Je bent een SEO content strategie expert. Creëer VOLLEDIGE content silos voor topical authority.

Een content silo bestaat uit:
1. Een pillar topic (hoofdonderwerp) - Het centrale thema
2. Een pillar keyword - Het hoofdkeyword
3. Een duidelijke beschrijving
4. 10-12 sub-topics die elk een specifiek aspect behandelen
5. Internal linking strategie

BELANGRIJK voor sub-topics:
- Elk sub-topic moet een specifiek onderwerp zijn
- Elk sub-topic heeft een eigen keyword
- Mix van content types: blog, guide, tutorial, comparison, listicle, how-to
- Prioritering: high (meteen doen), medium (fase 2), low (later)
- Realistische search volumes

Geef ALLEEN valide JSON terug met deze EXACTE structuur:
{
  "silos": [{
    "pillarTopic": "Hoofdonderwerp",
    "pillarKeyword": "hoofd keyword",
    "description": "Wat deze silo behandelt en waarom het belangrijk is",
    "estimatedSearchVolume": 5000,
    "subTopics": [{
      "topic": "Specifiek sub-onderwerp",
      "keyword": "sub keyword phrase",
      "contentType": "blog",
      "priority": "high",
      "estimatedSearchVolume": 800
    }],
    "internalLinkingStrategy": "Hoe alle content in deze silo naar elkaar linkt",
    "totalPotentialTraffic": 25000
  }]
}

VEREISTEN:
- Minimaal 10 sub-topics per silo (max 12)
- Elk sub-topic moet uniek en specifiek zijn
- Keywords moeten lowercase beginnen
- Realistische cijfers`
          },
          {
            role: 'user',
            content: `Hoofdkeyword: "${mainKeyword}"
Niche: ${niche || 'algemeen'}

Creëer ${numberOfSilos} COMPLETE content silos met elk 10-12 sub-topics.
Dit wordt de basis voor een volledig SEO content plan voor topical authority.`
          }
        ],
        temperature: 0.7,
        max_tokens: 6000, // Verlaagd voor snellere response
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(50000), // 50 seconden timeout voor AI call
    });
    
    if (!siloResponse.ok) {
      const errorText = await siloResponse.text();
      console.error('Failed to generate silos:', errorText);
      throw new Error('Failed to generate content silos');
    }
    
    onProgress?.('📊 Silo structuur ophalen en valideren...', 40);
    
    const siloData = await siloResponse.json();
    let content = siloData.choices[0].message.content;
    
    // Parse JSON
    let silos: ContentSilo[];
    try {
      const parsedData = JSON.parse(content);
      // Extract silos array
      silos = parsedData.silos || parsedData.contentSilos || parsedData;
      
      if (!Array.isArray(silos) || silos.length === 0) {
        throw new Error('No silos in response');
      }
      
      onProgress?.(`✓ ${silos.length} pillar topics gegenereerd`, 50);
      
    } catch (parseError) {
      console.error('Error parsing silo JSON:', parseError);
      console.error('Content preview:', content.substring(0, 500));
      throw new Error('Failed to parse silo data');
    }
    
    // STAP 2: Voor elke silo, genereer extra sub-topics als er te weinig zijn
    onProgress?.('🔍 Sub-topics uitbreiden en verrijken...', 55);
    
    for (let i = 0; i < silos.length; i++) {
      const silo = silos[i];
      const siloProgress = 55 + Math.round((i / silos.length) * 35);
      
      onProgress?.(`📦 Silo ${i + 1}/${silos.length}: ${silo.pillarTopic}`, siloProgress);
      
      // Als deze silo minder dan 12 sub-topics heeft, genereer er meer
      if (silo.subTopics.length < 12) {
        const needed = 12 - silo.subTopics.length;
        onProgress?.(`  ⚡ ${needed} extra sub-topics genereren...`, siloProgress);
        
        try {
          const extraResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AIML_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-sonnet-4.5',
              messages: [
                {
                  role: 'user',
                  content: `Genereer extra sub-topics voor een content silo.

Geef ALLEEN JSON array terug:
[{
  "topic": "Specifiek onderwerp",
  "keyword": "keyword phrase",
  "contentType": "blog|guide|tutorial|comparison|listicle",
  "priority": "high|medium|low",
  "estimatedSearchVolume": 500
}]`
                },
                {
                  role: 'user',
                  content: `Pillar Topic: "${silo.pillarTopic}"
Pillar Keyword: "${silo.pillarKeyword}"

Bestaande sub-topics: ${silo.subTopics.map(st => st.topic).join(', ')}

Genereer ${needed} NIEUWE, UNIEKE sub-topics die de bestaande aanvullen.`
                }
              ],
              temperature: 0.7,
              max_tokens: 2000,
            }),
          });
          
          if (extraResponse.ok) {
            const extraData = await extraResponse.json();
            let extraContent = extraData.choices[0].message.content.trim();
            extraContent = extraContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            
            // Try to extract array
            const arrayStart = extraContent.indexOf('[');
            const arrayEnd = extraContent.lastIndexOf(']');
            if (arrayStart !== -1 && arrayEnd !== -1) {
              extraContent = extraContent.substring(arrayStart, arrayEnd + 1);
            }
            
            const extraTopics = JSON.parse(extraContent);
            if (Array.isArray(extraTopics)) {
              silo.subTopics.push(...extraTopics);
              onProgress?.(`  ✓ ${extraTopics.length} sub-topics toegevoegd`, siloProgress);
            }
          }
        } catch (extraError) {
          console.error('Error generating extra sub-topics:', extraError);
          // Continue zonder extra topics
        }
        
        // Kleine delay
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Normaliseer keywords
      silo.pillarKeyword = normalizeKeyword(silo.pillarKeyword);
      silo.subTopics = silo.subTopics.map(st => ({
        ...st,
        keyword: normalizeKeyword(st.keyword)
      }));
      
      // Bereken total potential traffic
      silo.totalPotentialTraffic = silo.estimatedSearchVolume + 
        silo.subTopics.reduce((sum, st) => sum + (st.estimatedSearchVolume || 0), 0);
    }
    
    onProgress?.(`✓ ${silos.length} complete silos met ${silos.reduce((sum, s) => sum + s.subTopics.length, 0)} sub-topics`, 92);
    onProgress?.('✨ Content silos compleet!', 100);
    
    console.log(`✅ Generated ${silos.length} content silos`);
    silos.forEach((silo, idx) => {
      console.log(`   Silo ${idx + 1}: ${silo.pillarTopic} - ${silo.subTopics.length} sub-topics`);
    });
    
    return silos;
    
  } catch (error) {
    console.error('Error generating content silos:', error);
    throw error;
  }
}

/**
 * Genereer een complete site planning
 * UITGEBREID: Met URL-analyse, competitie-analyse, en prioritering
 */
export async function generateCompleteSitePlan(
  urlOrKeyword: string,
  niche?: string,
  targetAudience?: string,
  onProgress?: ProgressCallback
): Promise<SitePlan> {
  try {
    onProgress?.(`🗺️ Complete site planning maken voor: ${urlOrKeyword}`, 3);
    
    // Check of het een URL of keyword is
    const isUrl = urlOrKeyword.includes('.') || urlOrKeyword.startsWith('http');
    let mainKeyword = urlOrKeyword;
    let websiteUrl = '';
    let existingKeywords: string[] = [];
    
    if (isUrl) {
      websiteUrl = normalizeUrl(urlOrKeyword);
      onProgress?.('🔍 Website analyseren voor bestaande content...', 5);
      
      // Scan website voor bestaande keywords
      existingKeywords = await scanWebsiteForKeywords(websiteUrl);
      
      // Genereer hoofdkeyword op basis van de website
      onProgress?.('🎯 Hoofdkeyword bepalen...', 10);
      const keywordResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4.5',
          messages: [
            {
              role: 'user',
              content: `Bepaal het hoofdkeyword voor deze website op basis van de URL en bestaande keywords. Geef alleen het keyword terug, geen extra tekst.\n\nWebsite: ${websiteUrl}\nBestaande keywords: ${existingKeywords.slice(0, 10).join(', ')}\n\nWat is het hoofdkeyword?`
            }
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });
      
      if (keywordResponse.ok) {
        const keywordData = await keywordResponse.json();
        mainKeyword = keywordData.choices[0].message.content.trim();
      }
      
      onProgress?.(`✓ Hoofdkeyword: "${mainKeyword}"`, 12);
    }
    
    // Step 1: Generate content silos (uitgebreid)
    onProgress?.('🏗️ Content silos genereren (dit kan even duren)...', 15);
    const contentSilos = await generateContentSilos(mainKeyword, niche, 5, (step, progress) => {
      const scaledProgress = 15 + Math.round(progress * 0.45);
      onProgress?.(step, scaledProgress);
    });
    
    onProgress?.('📊 Implementatie strategie ontwikkelen...', 60);
    
    // Step 2: Genereer volledige implementatie roadmap met prioritering
    const strategyResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: `Je bent een SEO content planning expert. Creëer een VOLLEDIGE implementatie roadmap met 4 fasen.

Elke fase moet bevatten:
1. Fase nummer (1-4)
2. Duidelijke titel
3. Lijst met specifieke artikelen/content die in deze fase gemaakt moeten worden
4. Geschatte duur (realistisch)
5. Focus en doelen van de fase
6. Verwachte resultaten

De fasen moeten logisch opgebouwd zijn:
- Fase 1: Fundament leggen (pillar content + basis sub-topics)
- Fase 2: Uitbreiden (meer sub-topics en diepgang)
- Fase 3: Optimaliseren (long-tail keywords en niche content)
- Fase 4: Domineren (complete topical coverage)

Geef ALLEEN valide JSON terug met deze structuur:
{
  "targetAudience": "Gedetailleerde beschrijving van de doelgroep",
  "implementationPhases": [{
    "phase": 1,
    "title": "Fase titel (bv. Fundament Leggen)",
    "articles": ["Specifiek artikel 1", "Specifiek artikel 2", ...],
    "estimatedDuration": "3-4 weken",
    "focus": "Wat de focus van deze fase is en waarom",
    "priority": ["high", "medium", "low"],
    "expectedResults": "Wat je aan traffic/autoriteit kunt verwachten"
  }],
  "longTermStrategy": "Uitgebreide lange termijn visie voor SEO dominantie"
}`
          },
          {
            role: 'user',
            content: `Hoofdkeyword: "${mainKeyword}"
Niche: ${niche || 'algemeen'}
Target Audience: ${targetAudience || 'algemeen publiek'}

Content Silos (${contentSilos.length} totaal):
${contentSilos.map((silo, idx) => `
${idx + 1}. ${silo.pillarTopic} (${silo.subTopics.length} sub-topics)
   - Pillar Keyword: ${silo.pillarKeyword}
   - Sub-topics: ${silo.subTopics.slice(0, 5).map(st => st.keyword).join(', ')}...
`).join('')}

Totaal aantal artikelen: ${contentSilos.reduce((sum, s) => sum + s.subTopics.length + 1, 0)}

Creëer een complete, realistische implementatie roadmap die:
1. Logisch opgebouwd is (fundament eerst, dan uitbreiden)
2. Prioriteiten duidelijk maakt
3. Realistische tijdlijnen heeft
4. Specifieke artikelen per fase geeft
5. Verwachte resultaten schetst`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
    });
    
    if (!strategyResponse.ok) {
      const errorText = await strategyResponse.text();
      console.error('Failed to generate strategy:', errorText);
      throw new Error('Failed to generate strategy');
    }
    
    onProgress?.('📋 Roadmap data verwerken...', 75);
    
    const strategyData = await strategyResponse.json();
    const strategyContent = strategyData.choices[0].message.content;
    const parsedStrategy = JSON.parse(strategyContent);
    
    // Calculate totals
    const totalArticles = contentSilos.reduce((sum, silo) => sum + (silo.subTopics?.length || 0) + 1, 0);
    const estimatedTotalTraffic = contentSilos.reduce((sum, silo) => sum + (silo.totalPotentialTraffic || 0), 0);
    
    onProgress?.('🎯 Competitie-analyse en prioritering...', 85);
    
    // Als we een URL hebben, voeg competitie-data toe
    if (isUrl && websiteUrl) {
      try {
        // Vind concurrenten (met timeout)
        const competitors = await Promise.race([
          findCompetitors(websiteUrl, niche || 'algemeen', (step, progress) => {
            onProgress?.(step, 85 + Math.round(progress * 0.1));
          }),
          new Promise<CompetitorData[]>((resolve) => 
            setTimeout(() => resolve([]), 15000) // 15s timeout
          )
        ]);
        
        if (competitors.length > 0) {
          onProgress?.(`✓ ${competitors.length} concurrenten geanalyseerd`, 95);
          
          // Voeg competitor insights toe aan strategy
          parsedStrategy.competitorInsights = competitors.map(c => ({
            name: c.name,
            focus: c.contentFocus?.slice(0, 3) || []
          }));
        }
      } catch (compError) {
        console.log('⚠️ Competitie-analyse overgeslagen:', compError);
        // Continue zonder competitor data
      }
    }
    
    onProgress?.('✨ Complete site planning klaar!', 100);
    
    console.log(`✅ Generated complete site plan:`);
    console.log(`   - ${contentSilos.length} content silos`);
    console.log(`   - ${totalArticles} total articles`);
    console.log(`   - ${estimatedTotalTraffic.toLocaleString()} estimated traffic`);
    console.log(`   - ${parsedStrategy.implementationPhases?.length || 0} implementation phases`);
    
    const sitePlan: SitePlan = {
      mainKeyword,
      niche: niche || 'algemeen',
      targetAudience: parsedStrategy.targetAudience || targetAudience || 'algemeen publiek',
      contentSilos,
      totalArticles,
      estimatedTotalTraffic,
      implementationPhases: parsedStrategy.implementationPhases || [],
      longTermStrategy: parsedStrategy.longTermStrategy || '',
    };
    
    return sitePlan;
    
  } catch (error) {
    console.error('Error generating site plan:', error);
    throw error;
  }
}

