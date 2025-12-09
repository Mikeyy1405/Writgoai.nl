import { prisma } from './db';

/**
 * SEO Automated Workflow Library
 * Voor geautomatiseerde blog generatie met website analyse, keyword research, 
 * afbeeldingen, en volledige SEO-geoptimaliseerde content
 */

import { chatCompletion } from './aiml-api';
import { getBannedWordsInstructions, detectBannedWords, removeBannedWords } from './banned-words';

// ============================================
// 1. WEBSITE ANALYSE
// ============================================

export interface WebsiteAnalysis {
  toneOfVoice: string;
  writingStyle: string;
  targetAudience: string;
  contentStructure: string;
  affiliatePartnerships: string[];
  keyThemes: string[];
}

export async function analyzeWebsite(
  websiteUrl: string,
  onProgress?: (step: string) => void
): Promise<WebsiteAnalysis> {
  console.log('🔍 Starting website analysis for:', websiteUrl);
  
  try {
    // Scrape homepage en enkele subpagina's
    onProgress?.('📡 Website content ophalen...');
    const scrapedContent = await scrapeWebsiteContent(websiteUrl);
    
    // Analyseer met Claude
    onProgress?.('🤖 AI analyseert schrijfstijl en tone of voice...');
    const analysis = await analyzeContentWithAI(scrapedContent, websiteUrl);
    
    onProgress?.('✅ Website analyse voltooid');
    return analysis;
  } catch (error) {
    console.error('❌ Website analysis error:', error);
    throw new Error('Kon website niet analyseren');
  }
}

async function scrapeWebsiteContent(url: string): Promise<string> {
  // Gebruik web scraping (bijvoorbeeld via Firecrawl of Puppeteer)
  // Voor nu: placeholder die je kunt vervangen met echte scraping
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WritgoAI-Bot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Extract text content (basic HTML parsing)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return textContent.substring(0, 5000); // Eerste 5000 karakters
  } catch (error) {
    console.error('Scraping error:', error);
    return '';
  }
}

async function analyzeContentWithAI(content: string, url: string): Promise<WebsiteAnalysis> {
  try {
    const prompt = `Je bent een expert content analist. Analyseer de schrijfstijl van deze website zeer grondig.

WEBSITE: ${url}

CONTENT (eerste 5000 karakters):
${content}

Analyseer de volgende aspecten ZEER PRECIES:

1. **Tone of Voice**: Hoe klinkt de schrijver? (formeel/informeel, enthousiast/zakelijk, persoonlijk/afstandelijk, etc.)
2. **Aanspreekstijl**: Gebruikt de site "je", "u", of "jij/jou"? Geef voorbeelden.
3. **Zinsbouw**: Lange of korte zinnen? Complexe of simpele structuur?
4. **Paragraaflengte**: Korte (2-3 zinnen) of lange (5+ zinnen) paragrafen?
5. **Stijlfiguren**: Gebruik van vragen, opsommingen, call-to-actions, emoji's?
6. **Taalgebruik**: Informeel (joh, he, toch?), formeel, of neutraal?

Geef een JSON response met:
{
  "toneOfVoice": "Zeer gedetailleerde beschrijving (min 2 zinnen) van hoe de tekst klinkt en aanvoelt. Geef concrete voorbeelden.",
  "writingStyle": "Zeer gedetailleerde beschrijving (min 2 zinnen) van hoe er geschreven wordt: aanspreekstijl (je/u), zinsbouw, paragraaflengte, en specifieke stijlkenmerken. Geef concrete voorbeelden.",
  "targetAudience": "Duidelijke beschrijving van voor wie deze content bedoeld is",
  "contentStructure": "Hoe is de content gestructureerd (H2/H3, lijsten, call-outs)",
  "affiliatePartnerships": [],
  "keyThemes": ["3-5 hoofdthema's van de website"]
}

BELANGRIJK: Maak de tone of voice en writing style ZEER SPECIFIEK zodat een schrijver deze exact kan navolgen.`;

    console.log('🤖 Calling AI for website analysis...');
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    });

    // Extract text from API response
    const responseText = response?.choices?.[0]?.message?.content || '';
    console.log('📄 AI Response received:', responseText.substring(0, 200));

    // Parse JSON response - meer robuust
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in response, using defaults');
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully parsed AI analysis');
    return parsed;
  } catch (error: any) {
    console.error('❌ AI analysis failed:', error.message);
    // Return default analysis
    return {
      toneOfVoice: 'Enthousiast maar niet overdreven, persoonlijk en toegankelijk',
      writingStyle: 'Gebruik van je vorm, korte alineas, scanbaar',
      targetAudience: 'Gezinnen op zoek naar vakantie in Nederland',
      contentStructure: 'H2/H3 headers, bullet points, praktische informatie',
      affiliatePartnerships: [],
      keyThemes: ['Vakantieparken', 'Activiteiten', 'Faciliteiten'],
    };
  }
}

// ============================================
// 2. SERP ANALYSE (Concurrent Content Analyse)
// ============================================

export interface SERPResult {
  url: string;
  title: string;
  snippet: string;
  content?: string;
}

export interface SERPAnalysis {
  topResults: SERPResult[];
  commonHeadings: string[];
  contentStructurePatterns: string[];
  averageWordCount: number;
  topicsToInclude: string[];
  contentGaps: string[];
  competitorStrengths: string[];
}

export async function performSERPAnalysis(
  topic: string,
  onProgress?: (step: string) => void
): Promise<SERPAnalysis> {
  console.log('🔍 Starting SERP analysis for:', topic);
  onProgress?.('🌐 Zoeken naar top-rankende content...');
  
  try {
    // Import web search functionality
    const { webSearch } = await import('./aiml-api');
    
    // Zoek naar relevante content over dit onderwerp
    const searchQuery = `${topic} beste tips informatie guide`;
    onProgress?.('🔎 Analyseren van concurrerende content...');
    
    const searchResult = await webSearch(searchQuery);
    
    if (!searchResult.success || !searchResult.results) {
      console.warn('⚠️ SERP search failed, using default analysis');
      return getDefaultSERPAnalysis();
    }

    console.log('✅ Web search completed, analyzing content...');
    onProgress?.('🤖 AI analyseert content structuren...');
    
    // Analyseer de gevonden content met AI
    const analysisPrompt = `Analyseer de volgende SERP resultaten voor het onderwerp "${topic}":

WEB SEARCH RESULTATEN:
${searchResult.results.substring(0, 8000)}

Geef een uitgebreide analyse van wat goed presteert in de zoekresultaten:

1. COMMON HEADINGS: Welke koppen komen vaak terug in top-rankende content (7-10 koppen)
2. CONTENT STRUCTURE PATTERNS: Welke structuren worden vaak gebruikt (bijv: "Start met definitie", "Bevat FAQ sectie", etc)
3. AVERAGE WORD COUNT: Geschatte gemiddelde lengte van top-rankende artikelen
4. TOPICS TO INCLUDE: Welke onderwerpen/topics behandelt de top-content altijd (8-12 onderwerpen)
5. CONTENT GAPS: Wat missen de meeste artikelen? Waar kun je je onderscheiden? (4-6 gaps)
6. COMPETITOR STRENGTHS: Wat doen concurrenten goed? (4-5 strengths)

OUTPUT FORMAT (JSON):
{
  "commonHeadings": ["heading1", "heading2", ...],
  "contentStructurePatterns": ["pattern1", "pattern2", ...],
  "averageWordCount": 2000,
  "topicsToInclude": ["topic1", "topic2", ...],
  "contentGaps": ["gap1", "gap2", ...],
  "competitorStrengths": ["strength1", "strength2", ...]
}`;

    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: analysisPrompt }],
      max_tokens: 2500,
    });

    const responseText = response?.choices?.[0]?.message?.content || '';
    console.log('📄 SERP analysis received');
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ Could not parse SERP analysis, using defaults');
      return getDefaultSERPAnalysis();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ SERP analysis completed');
    onProgress?.('✅ SERP analyse voltooid');
    
    return {
      topResults: [],
      ...parsed,
    };
  } catch (error: any) {
    console.error('❌ SERP analysis failed:', error.message);
    return getDefaultSERPAnalysis();
  }
}

function getDefaultSERPAnalysis(): SERPAnalysis {
  return {
    topResults: [],
    commonHeadings: [
      'Wat is...',
      'Voordelen',
      'Hoe werkt het?',
      'Tips en tricks',
      'Veelgestelde vragen',
    ],
    contentStructurePatterns: [
      'Begint met definitie/introductie',
      'Gebruikt genummerde lijsten',
      'Bevat FAQ sectie',
      'Eindigt met conclusie/samenvatting',
    ],
    averageWordCount: 1800,
    topicsToInclude: [
      'Definitie en uitleg',
      'Belangrijkste kenmerken',
      'Praktische tips',
      'Veelgemaakte fouten',
    ],
    contentGaps: [
      'Meer praktische voorbeelden',
      'Actuele statistieken',
      'Expert insights',
    ],
    competitorStrengths: [
      'Goede structuur met duidelijke koppen',
      'Visueel aantrekkelijk met afbeeldingen',
      'Praktische tips',
    ],
  };
}

// ============================================
// 3. KEYWORD & SEO RESEARCH
// ============================================

export interface KeywordResearch {
  focusKeyword: string;
  relatedKeywords: string[];
  lsiKeywords: string[];
  searchIntent: string;
  competition: 'low' | 'medium' | 'high';
  keywordDensity: number;
  suggestions: string[];
}

export async function performKeywordResearch(
  topic: string,
  providedKeyword?: string,
  onProgress?: (step: string) => void
): Promise<KeywordResearch> {
  console.log('🔎 Starting keyword research for:', topic);
  onProgress?.('🔍 Focus keywords bepalen...');
  
  try {
    const prompt = `Voer een uitgebreide keyword research uit voor het volgende onderwerp:

ONDERWERP: ${topic}
${providedKeyword ? `FOCUS KEYWORD (al opgegeven): ${providedKeyword}` : ''}

Bepaal:
1. Focus keyword (als niet opgegeven, selecteer de beste)
2. Gerelateerde zoekwoorden (10-15)
3. LSI keywords (Latent Semantic Indexing) - synoniemen en gerelateerde termen
4. Zoekintentie (informational, navigational, transactional, commercial)
5. Concurrentie niveau (low, medium, high)
6. Optimale keyword density (percentage)
7. SEO suggesties

Geef een JSON response:
{
  "focusKeyword": "beste focus keyword",
  "relatedKeywords": ["keyword1", "keyword2", ...],
  "lsiKeywords": ["lsi1", "lsi2", ...],
  "searchIntent": "informational/navigational/transactional/commercial",
  "competition": "low/medium/high",
  "keywordDensity": 1.5,
  "suggestions": ["SEO tip 1", "SEO tip 2", ...]
}`;

    console.log('🤖 Calling AI for keyword research...');
    onProgress?.('🤖 AI analyseert LSI keywords & zoek-intentie...');
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
    });

    // Extract text from API response
    const responseText = response?.choices?.[0]?.message?.content || '';
    console.log('📄 AI Response received');
    onProgress?.('📊 SEO data verwerken...');

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('⚠️ No JSON found in response, using defaults');
      throw new Error('Could not parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('✅ Successfully parsed keyword research');
    onProgress?.('✅ Keyword research voltooid');
    return parsed;
  } catch (error: any) {
    console.error('❌ Keyword research failed:', error.message);
    // Return default keyword research
    return {
      focusKeyword: providedKeyword || topic,
      relatedKeywords: [topic],
      lsiKeywords: [],
      searchIntent: 'informational',
      competition: 'medium',
      keywordDensity: 1.5,
      suggestions: ['Gebruik de focus keyword in de titel', 'Voeg afbeeldingen toe'],
    };
  }
}

// ============================================
// 4. AFBEELDINGEN VERZAMELEN
// ============================================

export interface CollectedImage {
  url: string;
  description: string;
  altText: string;
  placement: string; // "intro", "section-1", "section-2", etc.
}

export async function collectImages(
  topic: string,
  numberOfImages: number = 12,
  onProgress?: (step: string) => void
): Promise<CollectedImage[]> {
  console.log(`🖼️ Generating ${numberOfImages} AI images for:`, topic);
  onProgress?.(`🖼️ Genereren van ${numberOfImages} hoogwaardige AI afbeeldingen...`);
  
  try {
    // Generate specific image prompts using AI
    console.log('🤖 Generating image prompts...');
    const imagePromptsPrompt = `Gegeven dit onderwerp: "${topic}"

Genereer ${numberOfImages} SPECIFIEKE, GEDETAILLEERDE image prompts voor hoogwaardige fotorealistische afbeeldingen.
Elke prompt moet beschrijven wat er EXACT op de afbeelding te zien moet zijn.

BELANGRIJK:
- Prompts moeten in het ENGELS zijn
- Wees SPECIFIEK en CONCREET (geen algemene beschrijvingen)
- Beschrijf compositie, setting, lighting, stijl
- Voeg professionele fotografische termen toe (professional photography, high quality, 8k, detailed)

VOORBEELDEN:
Voor "beste robotstofzuigers 2024":
- "Modern robot vacuum cleaner on clean wooden floor, sleek black design, LED display, professional product photography, studio lighting, 8k quality"
- "Robot vacuum cleaning under furniture in modern living room, side view, realistic home setting, natural lighting, high detail"
- "Close-up of robot vacuum sensors and brushes, macro photography, technical details visible, professional lighting"

Voor "gezonde smoothie recepten":
- "Vibrant green smoothie bowl topped with fresh berries, chia seeds and mint leaves, overhead shot, natural daylight, food photography, 8k"
- "Hands blending colorful fruits in modern blender, kitchen setting, action shot, professional food photography, bright natural light"

Geef alleen de prompts als JSON array, geen uitleg:
["prompt1", "prompt2", "prompt3", ...]`;

    const aiResponse = await chatCompletion({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: imagePromptsPrompt }],
      max_tokens: 1500,
    });

    const responseText = aiResponse?.choices?.[0]?.message?.content || '';
    let imagePrompts: string[] = [];
    
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        imagePrompts = JSON.parse(jsonMatch[0]);
        console.log(`✅ Generated ${imagePrompts.length} image prompts`);
      }
    } catch (e) {
      console.warn('⚠️ Could not parse AI image prompts');
    }

    // Fallback prompts if AI fails
    if (imagePrompts.length === 0) {
      console.warn('⚠️ Using fallback prompts');
      imagePrompts = Array.from({ length: numberOfImages }, (_, i) => 
        `Professional photograph related to ${topic}, high quality, detailed, 8k, photorealistic, studio lighting, modern, clean composition`
      );
    }

    // Generate AI images using AIML API
    const generatedImages: CollectedImage[] = [];
    const imagesToGenerate = Math.min(imagePrompts.length, numberOfImages);
    
    console.log(`🎨 Generating ${imagesToGenerate} AI images...`);
    onProgress?.(`🎨 AI genereert ${imagesToGenerate} afbeeldingen...`);

    // Generate images in batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < imagesToGenerate; i += batchSize) {
      const batch = imagePrompts.slice(i, Math.min(i + batchSize, imagesToGenerate));
      
      const batchPromises = batch.map(async (prompt, batchIndex) => {
        const imageIndex = i + batchIndex;
        try {
          console.log(`  Generating image ${imageIndex + 1}/${imagesToGenerate}...`);
          
          const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'stable-diffusion-3',  // Cost-optimized: $0.037 vs $0.18 for GPT-image-1
              prompt: prompt,
              size: '1536x1024', // landscape format (supported size)
              style: 'realistic_image/studio_portrait', // professional photography style
              quality: 'high', // highest quality for blog articles
              n: 1,
            }),
          });

          if (!imageResponse.ok) {
            console.warn(`⚠️ Image generation failed for prompt ${imageIndex + 1}`);
            return null;
          }

          const imageData = await imageResponse.json();
          const imageUrl = imageData?.images?.[0]?.url || imageData?.data?.[0]?.url;
          
          if (imageUrl) {
            console.log(`  ✅ Image ${imageIndex + 1} generated successfully`);
            return {
              url: imageUrl,
              description: prompt.substring(0, 100),
              altText: `${topic} - afbeelding ${imageIndex + 1}`,
              placement: imageIndex === 0 ? 'featured' : `section-${Math.floor(imageIndex / 2)}`,
            };
          }
          
          return null;
        } catch (error) {
          console.warn(`⚠️ Error generating image ${imageIndex + 1}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      generatedImages.push(...batchResults.filter((img): img is CollectedImage => img !== null));
      
      // Small delay between batches
      if (i + batchSize < imagesToGenerate) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (generatedImages.length === 0) {
      console.warn('⚠️ No AI images generated, using placeholder images');
      return generatePlaceholderImages(topic, numberOfImages);
    }

    console.log(`✅ Successfully generated ${generatedImages.length} AI images`);
    onProgress?.(`✅ ${generatedImages.length} AI afbeeldingen gegenereerd`);
    
    return generatedImages;
  } catch (error) {
    console.error('❌ Image generation error:', error);
    console.warn('   Using placeholder images instead');
    return generatePlaceholderImages(topic, numberOfImages);
  }
}

function generatePlaceholderImages(topic: string, count: number): CollectedImage[] {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop`,
    description: `${topic} afbeelding ${i + 1}`,
    altText: `${topic} - afbeelding ${i + 1}`,
    placement: i === 0 ? 'featured' : `section-${Math.floor(i / 2)}`,
  }));
}

// ============================================
// 5. CONTENT STRUCTUUR BEPALEN
// ============================================

export interface ContentOutline {
  h1: string;
  introduction: string[];
  sections: OutlineSection[];
  faq: FAQItem[];
  conclusion: string[];
}

export interface OutlineSection {
  h2: string;
  subsections?: string[]; // H3 headings
  contentPoints: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export async function generateContentStructure(
  topic: string,
  keywords: string[],
  websiteAnalysis: WebsiteAnalysis,
  keywordResearch: KeywordResearch,
  serpAnalysis: SERPAnalysis | null,
  wordCount: number
): Promise<ContentOutline> {
  console.log('📋 Generating content structure for:', topic);
  
  try {
    // Build SERP insights section if available
    let serpInsights = '';
    if (serpAnalysis) {
      serpInsights = `
SERP ANALYSE (Wat werkt goed bij concurrenten):
- Gemiddelde woordenaantal top-content: ${serpAnalysis.averageWordCount}
- Vaak voorkomende koppen: ${serpAnalysis.commonHeadings.join(', ')}
- Belangrijke onderwerpen om te behandelen: ${serpAnalysis.topicsToInclude.join(', ')}
- Content gaps (kansen om te onderscheiden): ${serpAnalysis.contentGaps.join(', ')}
- Wat concurrenten goed doen: ${serpAnalysis.competitorStrengths.join(', ')}

Gebruik deze inzichten om je content structuur te optimaliseren en beter te presteren dan de concurrentie.`;
    }

    const prompt = `Maak een complete blog outline voor het volgende onderwerp:

ONDERWERP: ${topic}
WOORDEN: ${wordCount}
FOCUS KEYWORD: ${keywordResearch.focusKeyword}
GERELATEERDE KEYWORDS: ${keywords.join(', ')}

TONE OF VOICE: ${websiteAnalysis.toneOfVoice}
SCHRIJFSTIJL: ${websiteAnalysis.writingStyle}
DOELGROEP: ${websiteAnalysis.targetAudience}
${serpInsights}

${getBannedWordsInstructions()}

Maak een outline met:
1. H1 titel (max 60 tekens, met focus keyword)
2. Inleiding (3-4 punten, 150-200 woorden totaal)
3. 5-7 H2 secties met H3 subsecties en content punten
   ${serpAnalysis ? '(Gebruik inzichten van SERP analyse om relevante topics te behandelen)' : ''}
4. Top 5 lijst met specifieke items (bijv. "Top 5 Vakantieparken met X")
5. FAQ sectie (minimaal 5 vragen met antwoorden)
6. Conclusie (3-4 punten met call-to-action)

Geef een JSON response:
{
  "h1": "Pakkende titel met focus keyword",
  "introduction": ["punt 1", "punt 2", "punt 3"],
  "sections": [
    {
      "h2": "Sectie titel",
      "subsections": ["H3 subsectie 1", "H3 subsectie 2"],
      "contentPoints": ["punt 1", "punt 2", "punt 3"]
    }
  ],
  "faq": [
    { "question": "Vraag met keyword variatie?", "answer": "Direct antwoord" }
  ],
  "conclusion": ["punt 1", "punt 2", "call-to-action"]
}`;

    console.log('🤖 Calling AI for content structure...');
    let response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000, // Increased significantly for complex outlines
    });

    // Check if response was cut off
    const finishReason = response?.choices?.[0]?.finish_reason;
    console.log('🏁 Finish reason:', finishReason);
    
    // Extract text from API response
    let responseText = response?.choices?.[0]?.message?.content || '';
    console.log('📄 AI Response received:', responseText.length, 'characters');

    // If response was cut off at max_tokens, try again with simpler prompt
    if (finishReason === 'max_tokens' || finishReason === 'length') {
      console.warn('⚠️ Response was cut off at max_tokens, retrying with simpler structure...');
      
      const simplerPrompt = `Maak een beknopte blog outline voor: ${topic}

WOORDEN: ${wordCount}
FOCUS KEYWORD: ${keywordResearch.focusKeyword}

Geef een compacte JSON response met:
{
  "h1": "Titel met focus keyword (max 60 tekens)",
  "introduction": ["punt 1", "punt 2", "punt 3"],
  "sections": [
    {
      "h2": "Sectie titel",
      "subsections": ["H3 subsectie 1", "H3 subsectie 2"],
      "contentPoints": ["punt 1", "punt 2"]
    }
  ],
  "faq": [
    { "question": "Vraag?", "answer": "Antwoord" }
  ],
  "conclusion": ["punt 1", "punt 2"]
}

BELANGRIJK: Houd de response compact, max 5 sections, max 5 FAQ items.`;

      response = await chatCompletion({
        model: 'claude-sonnet-4-5',
        messages: [{ role: 'user', content: simplerPrompt }],
        max_tokens: 6000,
      });
      
      responseText = response?.choices?.[0]?.message?.content || '';
      console.log('📄 Retry response received:', responseText.length, 'characters');
    }

    // Try to extract JSON from markdown code blocks or plain response
    let jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }
    
    if (!jsonMatch) {
      console.error('⚠️ No JSON found in response. First 500 chars:', responseText.substring(0, 500));
      throw new Error('AI response bevatte geen geldige JSON structuur');
    }

    const jsonString = jsonMatch[1] || jsonMatch[0];
    console.log('📦 JSON string extracted:', jsonString.substring(0, 200) + '...');
    
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError.message);
      console.error('   JSON string length:', jsonString.length);
      console.error('   First 500 chars:', jsonString.substring(0, 500));
      console.error('   Last 500 chars:', jsonString.substring(jsonString.length - 500));
      throw new Error(`JSON parsing mislukt: ${parseError.message}`);
    }
    
    // Validate structure
    if (!parsed.h1 || !parsed.sections || !Array.isArray(parsed.sections)) {
      console.error('⚠️ Invalid structure:', parsed);
      throw new Error('AI response heeft ongeldige structuur');
    }
    
    console.log('✅ Successfully parsed content structure');
    console.log(`   - H1: ${parsed.h1}`);
    console.log(`   - Sections: ${parsed.sections?.length || 0}`);
    console.log(`   - FAQ items: ${parsed.faq?.length || 0}`);
    
    return parsed;
  } catch (error: any) {
    console.error('❌ Content structure generation failed:', error.message);
    console.error('   Error details:', error.stack);
    throw error; // Cannot continue without outline
  }
}

// ============================================
// 6. BLOG CONTENT GENEREREN
// ============================================

export interface GeneratedBlog {
  title: string;
  content: string; // Markdown formatted
  metaTitle: string;
  metaDescription: string;
  slug: string;
  images: CollectedImage[];
  wordCount: number;
  bannedWordsFound: string[];
}

export async function generateBlogContent(
  outline: ContentOutline,
  topic: string,
  wordCount: number,
  websiteAnalysis: WebsiteAnalysis,
  keywordResearch: KeywordResearch,
  images: CollectedImage[],
  options: {
    includeFAQ?: boolean;
    includeTables?: boolean;
    includeYouTube?: boolean;
    includeDirectAnswer?: boolean;
    generateFeaturedImage?: boolean;
    // Bol.com Integration
    useBolcomIntegration?: boolean;
    numberOfProducts?: number;
    projectId?: string | null; // Add projectId for Bol.com integration
    // Partner Link
    includePartnerLink?: boolean;
    partnerLinkText?: string;
    partnerLinkUrl?: string;
  } = {}
): Promise<GeneratedBlog> {
  console.log('✍️ Generating blog content...');
  console.log(`📊 Parameters: ${wordCount} words, ${images.length} images`);
  console.log(`📝 Topic: ${topic}`);
  console.log(`🎯 Focus keyword: ${keywordResearch.focusKeyword}`);
  console.log(`⚙️ Options:`, options);
  
  // Destructure options met defaults
  const {
    includeFAQ = false,
    includeTables = false,
    includeYouTube = false,
    includeDirectAnswer = true,
    generateFeaturedImage = true,
    // Bol.com Integration
    useBolcomIntegration = false,
    numberOfProducts = 3,
    projectId = null, // Add projectId
    // Partner Link
    includePartnerLink = false,
    partnerLinkText = '',
    partnerLinkUrl = '',
  } = options;
  
  try {
    // STAP 0: Zoek Bol.com producten als integratie is ingeschakeld
    let bolcomProducts: any[] = [];
    if (useBolcomIntegration) {
      try {
        console.log('🛍️ Bol.com producten zoeken...');
        
        // Import bol.com modules
        const { findBestProducts } = await import('./bolcom-product-finder');
        const { prisma } = await import('./db');
        const fs = require('fs');
        const path = require('path');
        
        // Lees credentials - eerst project-specifiek, dan globaal
        const authSecretsPath = '/home/ubuntu/.config/abacusai_auth_secrets.json';
        let credentials: any = { clientId: '', clientSecret: '' };
        
        // Als projectId is meegegeven, probeer eerst project-specifieke integratie
        if (projectId) {
          console.log(`📦 Project ${projectId} geselecteerd, checken op Bol.com integratie...`);
          try {
            const project = await prisma.project.findUnique({
              where: { id: projectId },
              select: {
                bolcomEnabled: true,
                bolcomClientId: true,
                bolcomClientSecret: true,
                bolcomAffiliateId: true,
              },
            });
            
            if (project?.bolcomEnabled && project.bolcomClientId && project.bolcomClientSecret) {
              console.log('✅ Project heeft Bol.com integratie met affiliate link!');
              
              // Gebruik project-specifieke credentials met affiliate ID
              credentials = {
                clientId: project.bolcomClientId,
                clientSecret: project.bolcomClientSecret,
                affiliateId: project.bolcomAffiliateId || '', // Voor affiliate links
              };
            } else {
              console.log('ℹ️ Project heeft geen Bol.com integratie, gebruik globale credentials');
            }
          } catch (error) {
            console.warn('⚠️ Fout bij ophalen project Bol.com integratie:', error);
          }
        }
        
        // Als geen project-specifieke credentials, gebruik globale
        if (!credentials.clientId || !credentials.clientSecret) {
          if (fs.existsSync(authSecretsPath)) {
            const authSecrets = JSON.parse(fs.readFileSync(authSecretsPath, 'utf8'));
            if (authSecrets['bol.com']?.secrets) {
              credentials = {
                clientId: authSecrets['bol.com'].secrets.client_id?.value || '',
                clientSecret: authSecrets['bol.com'].secrets.client_secret?.value || '',
                // Geen affiliateId bij globale credentials = geen affiliate links
              };
              console.log('ℹ️ Gebruik globale Bol.com credentials (zonder affiliate links)');
            }
          }
        }
        
        if (!credentials.clientId || !credentials.clientSecret) {
          console.warn('⚠️ Geen Bol.com credentials gevonden, producten worden overgeslagen');
        } else {
          // Zoek producten met timeout van 45 seconden
          const productSearchPromise = findBestProducts(
            {
              query: topic,
              keywords: keywordResearch.relatedKeywords.slice(0, 3), // Limiteer keywords voor snelheid
              maxProducts: Math.min(numberOfProducts || 3, 3), // Max 3 producten voor snelheid
            },
            credentials,
            (step) => console.log(`  ${step}`)
          );
          
          // Timeout van 45 seconden
          const timeoutPromise = new Promise<{ products: any[] }>((_, reject) => {
            setTimeout(() => reject(new Error('Bol.com timeout')), 45000);
          });
          
          const productResult = await Promise.race([
            productSearchPromise,
            timeoutPromise
          ]);
          
          bolcomProducts = productResult.products || [];
          console.log(`✅ ${bolcomProducts.length} Bol.com producten gevonden`);
        }
      } catch (error: any) {
        if (error.message === 'Bol.com timeout') {
          console.warn('⚠️ Bol.com producten zoeken duurde te lang, doorgaan zonder producten');
        } else {
          console.error('❌ Error bij Bol.com producten:', error);
        }
        // Continue zonder producten - dit is niet kritiek voor de workflow
        bolcomProducts = [];
      }
    }
    
    // Build conditionale prompt secties
    let contentInstructions = '';
    
    if (includeDirectAnswer) {
      contentInstructions += `\n\nDIRECT ANSWER SNIPPET:
Voeg bovenaan een kort, direct antwoord toe (2-3 zinnen) dat de hoofdvraag beantwoordt.
<div class="direct-answer">
<p><strong>Direct Antwoord:</strong> Kort, duidelijk antwoord op de hoofdvraag...</p>
</div>`;
    }
    
    if (includeTables) {
      contentInstructions += `\n\nVERGELIJKINGSTABELLEN:
Voeg waar relevant HTML tabellen toe om producten/opties te vergelijken:
<table class="comparison-table">
  <thead>
    <tr>
      <th>Product/Optie</th>
      <th>Voordelen</th>
      <th>Nadelen</th>
      <th>Prijs</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Product 1</td>
      <td>Voordeel 1, 2, 3</td>
      <td>Nadeel 1, 2</td>
      <td>€XX</td>
    </tr>
  </tbody>
</table>`;
    }
    
    if (includeYouTube) {
      contentInstructions += `\n\nYOUTUBE VIDEO'S:
Voeg relevante YouTube video embeds toe:
<div class="video-container">
<iframe src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>
<p class="text-sm text-gray-600 mt-2">Video beschrijving</p>
</div>`;
    }
    
    const faqSection = includeFAQ ? `\n\nVEELGESTELDE VRAGEN (FAQ):
<h2>Veelgestelde Vragen</h2>

<h3>Vraag 1 hier?</h3>
<p>Uitgebreid antwoord met praktische informatie.</p>

<h3>Vraag 2 hier?</h3>
<p>Uitgebreid antwoord...</p>

<h3>Vraag 3 hier?</h3>
<p>Uitgebreid antwoord...</p>` : '';

    // Bol.com product instructies
    let bolcomInstructions = '';
    if (bolcomProducts.length > 0) {
      bolcomInstructions = `\n\nBOL.COM PRODUCTEN:
Je hebt toegang tot ${bolcomProducts.length} relevante producten van Bol.com. Voeg deze toe op logische plekken in de blog:
${bolcomProducts.map((p, i) => `[BOLCOM_PRODUCT_${i}] - ${p.title} (${p.summary})`).join('\n')}

Gebruik [BOLCOM_PRODUCT_X] placeholders waar je een product wilt tonen. Voorbeelden:
- Na een uitleg over een product: schrijf over het product en voeg [BOLCOM_PRODUCT_0] toe
- In een vergelijkingssectie: voeg meerdere producten toe met hun placeholders
- Aan het einde van een sectie als aanbeveling

Integreer de producten NATUURLIJK in de tekst, niet geforceerd!`;
    }
    
    // Partner link instructies
    let partnerLinkInstructions = '';
    if (includePartnerLink && partnerLinkText && partnerLinkUrl) {
      partnerLinkInstructions = `\n\nPARTNER LINK:
Voeg aan het EINDE van de blog (na de conclusie) de volgende partner link toe:
<div class="partner-link-box">
<a href="${partnerLinkUrl}" target="_blank" rel="noopener noreferrer" class="partner-link-button">
${partnerLinkText}
</a>
</div>`;
    }
    
    const prompt = `Je bent een expert contentschrijver die blogs schrijft in de exacte stijl en tone of voice van de website.

OPDRACHT: Schrijf een complete, SEO-geoptimaliseerde blog op basis van de volgende outline.

ONDERWERP: ${topic}
WOORDAANTAL: PRECIES ${wordCount} woorden (dit is CRUCIAAL - tel mee tijdens het schrijven!)
FOCUS KEYWORD: ${keywordResearch.focusKeyword}

SCHRIJFSTIJL VAN DE WEBSITE (MATCH DIT PRECIES):
Tone of Voice: ${websiteAnalysis.toneOfVoice}
Schrijfstijl: ${websiteAnalysis.writingStyle}
Doelgroep: ${websiteAnalysis.targetAudience}

${getBannedWordsInstructions()}

OUTLINE:
${JSON.stringify(outline, null, 2)}

BELANGRIJKE SCHRIJFREGELS:
1. **Match de tone of voice** - Volg EXACT de schrijfstijl van de website hierboven
2. **WOORDAANTAL**: Schrijf PRECIES ${wordCount} woorden (± 50 woorden). Tel mee tijdens het schrijven!
3. Gebruik ${websiteAnalysis.writingStyle.includes('je') || websiteAnalysis.writingStyle.includes('jij') ? "'je' vorm (niet 'u')" : "de vorm zoals de website gebruikt"}
4. Korte, scanbare alinea's (max 3-4 zinnen per paragraaf)
5. Gebruik bullet points en genummerde lijsten voor overzichtelijkheid
6. Integreer keywords NATUURLIJK (niet geforceerd)
7. Gebruik LSI keywords waar relevant: ${keywordResearch.lsiKeywords.join(', ')}
8. Voeg afbeeldingen toe met [IMAGE_PLACEHOLDER_X] waar visueel passend
9. Flesch Reading Ease score > 60 (begrijpelijk Nederlands)
10. Vermijd AI-detecteerbare patronen en clichés

FORMATTING (GEBRUIK HTML, NIET MARKDOWN):
<h2>Hoofdsectie Titel</h2>
<p>Inleidende paragraaf met natuurlijke keyword integratie.</p>

<h3>Subsectie Titel</h3>
<p>Content met praktische informatie en voorbeelden.</p>

<ul>
  <li>Lijstitem met concrete informatie</li>
  <li>Nog een praktisch punt</li>
</ul>

[IMAGE_PLACEHOLDER_1]

<p>Vervolg content met call-to-action of praktische tips.</p>

<h2>Volgende Sectie</h2>
<p>Continue met dezelfde structuur...</p>
${contentInstructions}
${bolcomInstructions}
${faqSection}

CONCLUSIE:
<h2>Conclusie</h2>
<p>Samenvattende paragraaf met belangrijkste punten en call-to-action.</p>
${partnerLinkInstructions}

BELANGRIJK: Schrijf nu de VOLLEDIGE blog in HTML formaat met PRECIES ${wordCount} woorden (tel mee!). Wees compleet en uitgebreid.`;

    console.log('🤖 Calling AI for blog content generation...');
    console.log(`📏 Prompt length: ${prompt.length} characters`);
    
    const startTime = Date.now();
    
    const response = await chatCompletion({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 16000, // Verhoogd naar 16k voor langere blogs
    });

    const elapsedTime = Date.now() - startTime;
    console.log(`⏱️ AI response received in ${elapsedTime}ms`);

    // Extract text from API response
    const responseText = response?.choices?.[0]?.message?.content || '';
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('❌ Empty response from AI');
      throw new Error('AI gaf een lege response - probeer het opnieuw');
    }
    
    console.log(`📄 AI Response received: ${responseText.length} characters`);
    console.log(`📄 First 200 chars: ${responseText.substring(0, 200)}`);

    let content = responseText;
    
    // Vervang image placeholders met echte URLs (HTML img tags)
    console.log(`🖼️ Replacing ${images.length} image placeholders...`);
    images.forEach((img, index) => {
      const placeholder = `[IMAGE_PLACEHOLDER_${index}]`;
      const htmlImage = `<img src="${img.url}" alt="${img.altText}" class="w-full rounded-lg my-4" />`;
      const replaced = content.includes(placeholder);
      content = content.replace(new RegExp(`\\[IMAGE_PLACEHOLDER_${index}\\]`, 'g'), htmlImage);
      if (replaced) {
        console.log(`✅ Replaced ${placeholder} with image tag`);
      }
    });
    
    // Vervang Bol.com product placeholders met product boxes
    if (bolcomProducts.length > 0) {
      console.log(`🛍️ Replacing ${bolcomProducts.length} Bol.com product placeholders...`);
      bolcomProducts.forEach((product, index) => {
        const placeholder = `[BOLCOM_PRODUCT_${index}]`;
        
        // Genereer product box HTML met bol.com productafbeelding
        const productBox = `
<div class="bolcom-product-box" style="border: 2px solid #0000A4; border-radius: 12px; padding: 20px; margin: 24px 0; background: linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%);">
  <div style="display: flex; gap: 20px; flex-direction: row; align-items: center;">
    <div style="flex-shrink: 0;">
      <img src="${product.image.url}" alt="${product.title}" style="width: 180px; height: 180px; object-fit: contain; border-radius: 8px;" />
    </div>
    <div style="flex-grow: 1;">
      <h4 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #0000A4;">${product.title}</h4>
      <p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #333;">${product.summary}</p>
      ${product.pros && product.pros.length > 0 ? `
      <div style="margin: 12px 0;">
        <strong style="color: #0000A4; font-size: 13px;">Voordelen:</strong>
        <ul style="margin: 4px 0; padding-left: 20px; font-size: 13px;">
          ${product.pros.slice(0, 3).map((pro: string) => `<li>${pro}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      <div style="display: flex; align-items: center; gap: 16px; margin-top: 16px;">
        <span style="font-size: 24px; font-weight: 700; color: #0000A4;">€${product.price.toFixed(2)}</span>
        ${product.strikethroughPrice ? `<span style="font-size: 16px; text-decoration: line-through; color: #999;">€${product.strikethroughPrice.toFixed(2)}</span>` : ''}
        ${product.rating ? `
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="color: #FFB800;">★</span>
          <span style="font-size: 14px; font-weight: 600;">${product.rating.toFixed(1)}</span>
          ${product.ratingCount ? `<span style="font-size: 12px; color: #666;">(${product.ratingCount})</span>` : ''}
        </div>
        ` : ''}
      </div>
      <a href="${product.affiliateUrl}" target="_blank" rel="noopener noreferrer nofollow" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #0000A4; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; transition: background 0.3s;">
        Bekijk op Bol.com →
      </a>
    </div>
  </div>
</div>`;
        
        const replaced = content.includes(placeholder);
        content = content.replace(new RegExp(`\\[BOLCOM_PRODUCT_${index}\\]`, 'g'), productBox);
        if (replaced) {
          console.log(`✅ Replaced ${placeholder} with Bol.com product box`);
        }
      });
    }
    
    // Check voor verboden woorden
    const bannedWordsFound = detectBannedWords(content);
    
    // Als verboden woorden gevonden, verwijder ze
    if (bannedWordsFound.length > 0) {
      console.warn('⚠️ Verboden woorden gevonden:', bannedWordsFound);
      content = removeBannedWords(content);
    }
    
    // Genereer metadata
    const metaTitle = outline.h1.length <= 60 
      ? outline.h1 
      : outline.h1.substring(0, 57) + '...';
    
    const metaDescription = generateMetaDescription(content, keywordResearch.focusKeyword);
    const slug = generateSlug(outline.h1);
    
    const actualWordCount = content.split(/\s+/).length;
    
    console.log(`✅ Blog content generated successfully`);
    console.log(`📊 Final stats: ${actualWordCount} words, ${content.length} characters`);
    console.log(`🚫 Banned words found: ${bannedWordsFound.length}`);
    
    return {
      title: outline.h1,
      content,
      metaTitle,
      metaDescription,
      slug,
      images,
      wordCount: actualWordCount,
      bannedWordsFound,
    };
  } catch (error: any) {
    console.error('❌ Blog content generation failed:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    throw new Error(`Content generatie mislukt: ${error.message || 'Onbekende fout'}`);
  }
}

function generateMetaDescription(content: string, keyword: string): string {
  // Strip HTML tags first voor plain text extractie
  const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract eerste 2-3 zinnen en zorg dat keyword erin staat
  const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let description = sentences.slice(0, 2).join('. ') + '.';
  
  if (description.length > 155) {
    description = description.substring(0, 152) + '...';
  }
  
  // Zorg dat keyword erin staat
  if (!description.toLowerCase().includes(keyword.toLowerCase())) {
    description = `${keyword}: ${description}`;
    if (description.length > 155) {
      description = description.substring(0, 152) + '...';
    }
  }
  
  return description;
}

function generateSlug(title: string): string {
  // Extract first few meaningful words (usually the focus keyword)
  const words = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2) // Skip small words like "de", "en", "in"
    .slice(0, 3); // Max 3 woorden voor korte slug
  
  return words.join('-').substring(0, 60);
}

// ============================================
// 7. MARKDOWN EXPORT
// ============================================

export function generateMarkdownFile(blog: GeneratedBlog, keywordResearch: KeywordResearch): string {
  const markdown = `---
title: "${blog.metaTitle}"
description: "${blog.metaDescription}"
slug: "${blog.slug}"
keywords: "${keywordResearch.focusKeyword}, ${keywordResearch.relatedKeywords.slice(0, 5).join(', ')}"
date: "${new Date().toISOString().split('T')[0]}"
---

${blog.content}

---
**Metadata**
- Woordenaantal: ${blog.wordCount}
- Focus Keyword: ${keywordResearch.focusKeyword}
- SEO Score: ${calculateSEOScore(blog, keywordResearch)}/100
- Verboden woorden: ${blog.bannedWordsFound.length > 0 ? blog.bannedWordsFound.join(', ') : 'Geen'}
`;

  return markdown;
}

function calculateSEOScore(blog: GeneratedBlog, keywordResearch: KeywordResearch): number {
  let score = 100;
  
  // Check title length
  if (blog.metaTitle.length > 60 || blog.metaTitle.length < 30) score -= 10;
  
  // Check description length
  if (blog.metaDescription.length > 155 || blog.metaDescription.length < 120) score -= 10;
  
  // Check keyword in title
  if (!blog.title.toLowerCase().includes(keywordResearch.focusKeyword.toLowerCase())) score -= 15;
  
  // Check keyword density
  const keywordCount = (blog.content.toLowerCase().match(
    new RegExp(keywordResearch.focusKeyword.toLowerCase(), 'g')
  ) || []).length;
  const totalWords = blog.wordCount;
  const density = (keywordCount / totalWords) * 100;
  
  if (density < 0.5 || density > 2.5) score -= 15;
  
  // Check for banned words
  if (blog.bannedWordsFound.length > 0) score -= blog.bannedWordsFound.length * 5;
  
  // Check word count
  if (blog.wordCount < 1000) score -= 10;
  
  // Check for images
  if (blog.images.length < 3) score -= 10;
  
  return Math.max(0, score);
}