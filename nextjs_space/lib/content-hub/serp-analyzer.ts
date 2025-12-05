/**
 * SERP Analyzer for Content Hub
 * Analyzes Google search results to gather competitive intelligence
 * Uses real web search via AIML API for accurate SERP data
 */

import { sendChatCompletion } from '../aiml-chat-client';
import { TEXT_MODELS, webSearch } from '../aiml-api';

// Constants for SERP analysis
const SERP_ANALYSIS_TIMEOUT_MS = 45000; // 45 seconds (increased for web search)
const TIMEOUT_ERROR_MESSAGE = 'SERP_ANALYSIS_TIMEOUT';
const MIN_SUGGESTED_LENGTH = 1000; // Minimum word count for articles
const MAX_SUGGESTED_LENGTH = 2000; // Maximum word count for articles

/**
 * Helper function to wrap an async operation with a timeout
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Check if an error is a timeout error
 */
function isTimeoutError(error: any): boolean {
  return error?.message === TIMEOUT_ERROR_MESSAGE;
}

export interface SERPResult {
  title: string;
  url: string;
  snippet: string;
  wordCount?: number;
  headings?: string[];
}

export interface SERPAnalysis {
  keyword: string;
  topResults: SERPResult[];
  averageWordCount: number;
  commonHeadings: string[];
  contentGaps: string[];
  suggestedLength: number;
  topicsCovered: string[];
  questionsFound: string[];
  lsiKeywords: string[]; // NEW: LSI keywords
  paaQuestions: string[]; // NEW: People Also Ask questions
}

/**
 * Analyze SERP results for a given keyword using real web search
 */
export async function analyzeSERP(
  keyword: string,
  language: string = 'nl'
): Promise<SERPAnalysis> {
  // Default fallback values
  const defaultAnalysis: SERPAnalysis = {
    keyword,
    topResults: [],
    averageWordCount: 1500,
    commonHeadings: ['Introductie', 'Voordelen', 'Nadelen', 'Tips', 'Conclusie'],
    topicsCovered: [keyword],
    questionsFound: [`Wat is ${keyword}?`, `Waarom is ${keyword} belangrijk?`],
    contentGaps: ['Praktische voorbeelden', 'Actuele statistieken', 'Expert tips'],
    suggestedLength: 1400,
    lsiKeywords: [keyword, `${keyword} tips`, `${keyword} voordelen`, `beste ${keyword}`],
    paaQuestions: [
      `Wat is ${keyword}?`,
      `Hoe werkt ${keyword}?`,
      `Waarom is ${keyword} belangrijk?`,
      `Wat zijn de voordelen van ${keyword}?`
    ],
  };

  try {
    console.log(`[SERP Analyzer] Analyzing keyword with real web search: ${keyword}`);
    
    // Step 1: Perform real web search to get current SERP data
    let webSearchResults = '';
    try {
      const searchResult = await withTimeout(
        webSearch(`Top 10 Google resultaten analyse voor "${keyword}" in ${language.toUpperCase()}: woordenaantal, headings, topics, content structuur`),
        SERP_ANALYSIS_TIMEOUT_MS,
        TIMEOUT_ERROR_MESSAGE
      );
      
      if (searchResult.success && searchResult.results) {
        webSearchResults = searchResult.results;
        console.log(`[SERP Analyzer] Web search completed, ${searchResult.results.length} chars`);
      }
    } catch (searchError) {
      console.warn('[SERP Analyzer] Web search failed, continuing with AI analysis:', searchError);
    }

    // Step 2: Analyze the web search results with AI
    const analysisPrompt = `Je bent een SEO expert die SERP (Search Engine Results Page) analyseert.

${webSearchResults ? `ACTUELE WEB SEARCH RESULTATEN:\n${webSearchResults}\n\n` : ''}

KEYWORD: "${keyword}"
TAAL: ${language.toUpperCase()}

Maak een uitgebreide SERP analyse voor dit keyword. Analyseer de top 10 Google resultaten en geef:

1. **Gemiddeld woordenaantal** van top 10 artikelen (realistisch: 800-2500 woorden)
2. **Veelvoorkomende H2/H3 headings** die concurrenten gebruiken (6-8 headings)
3. **Topics die behandeld worden** (5-7 hoofdonderwerpen)
4. **LSI Keywords** (Latent Semantic Indexing - 15-20 gerelateerde zoekwoorden en variaties)
5. **People Also Ask vragen** (6-8 vragen die mensen stellen)
6. **Content gaps** (wat ontbreekt er in huidige content? 3-5 gaps)
7. **Aanbevolen woordenaantal** (gemiddelde + 20%, minimaal ${MIN_SUGGESTED_LENGTH}, maximaal ${MAX_SUGGESTED_LENGTH})

BELANGRIJK:
- Wees realistisch over woordenaantallen (niet te hoog inschatten)
- LSI keywords moeten natuurlijke variaties en synoniemen zijn
- PAA vragen moeten beginnen met vraagwoorden (Wat, Hoe, Waarom, etc.)
- Content gaps moeten concrete, actionable onderwerpen zijn

Respond in JSON format:
{
  "averageWordCount": number (realistisch: 800-2500),
  "commonHeadings": string[] (6-8 H2/H3 headings),
  "topicsCovered": string[] (5-7 topics),
  "lsiKeywords": string[] (15-20 LSI keywords),
  "paaQuestions": string[] (6-8 PAA vragen),
  "contentGaps": string[] (3-5 gaps),
  "suggestedLength": number (gemiddelde + 20%, min ${MIN_SUGGESTED_LENGTH}, max ${MAX_SUGGESTED_LENGTH})
}`;

    try {
      // Apply timeout to SERP analysis API call
      const response = await withTimeout(
        sendChatCompletion({
          model: TEXT_MODELS.REASONING, // Use GPT-4o for better analysis
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert SEO analist die SERP data analyseert en concrete, bruikbare insights geeft.',
            },
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
          temperature: 0.5, // Lower temperature for more consistent analysis
          max_tokens: 3000,
          stream: false,
        }),
        SERP_ANALYSIS_TIMEOUT_MS,
        TIMEOUT_ERROR_MESSAGE
      );

      const content = (response as any).choices[0]?.message?.content || '{}';
      
      // Parse JSON from response
      let analysis;
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) ||
                         [null, content];
        analysis = JSON.parse(jsonMatch[1] || content);
        
        // Validate and cap the suggested length
        if (analysis.suggestedLength) {
          analysis.suggestedLength = Math.min(Math.max(analysis.suggestedLength, MIN_SUGGESTED_LENGTH), MAX_SUGGESTED_LENGTH);
        }
        
        // Ensure we have LSI keywords
        if (!analysis.lsiKeywords || analysis.lsiKeywords.length === 0) {
          analysis.lsiKeywords = defaultAnalysis.lsiKeywords;
        }
        
        // Ensure we have PAA questions
        if (!analysis.paaQuestions || analysis.paaQuestions.length === 0) {
          analysis.paaQuestions = defaultAnalysis.paaQuestions;
        }
        
        console.log(`[SERP Analyzer] Analysis complete: ${analysis.suggestedLength} words target, ${analysis.lsiKeywords?.length || 0} LSI keywords, ${analysis.paaQuestions?.length || 0} PAA questions`);
      } catch (e) {
        console.error('[SERP Analyzer] Failed to parse JSON:', e);
        console.log('[SERP Analyzer] Raw response:', content.substring(0, 500));
        // Fallback to default values
        analysis = defaultAnalysis;
      }

      return {
        keyword,
        topResults: [],
        averageWordCount: analysis.averageWordCount || defaultAnalysis.averageWordCount,
        commonHeadings: analysis.commonHeadings || defaultAnalysis.commonHeadings,
        topicsCovered: analysis.topicsCovered || defaultAnalysis.topicsCovered,
        questionsFound: analysis.questionsFound || analysis.paaQuestions || defaultAnalysis.questionsFound,
        contentGaps: analysis.contentGaps || defaultAnalysis.contentGaps,
        suggestedLength: analysis.suggestedLength || defaultAnalysis.suggestedLength,
        lsiKeywords: analysis.lsiKeywords || defaultAnalysis.lsiKeywords,
        paaQuestions: analysis.paaQuestions || defaultAnalysis.paaQuestions,
      };
    } catch (apiError: any) {
      // Check if it was a timeout
      if (isTimeoutError(apiError)) {
        console.warn(`[SERP Analyzer] API call timed out after ${SERP_ANALYSIS_TIMEOUT_MS / 1000}s, using default values`);
        return defaultAnalysis;
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error('[SERP Analyzer] Error:', error);
    console.log('[SERP Analyzer] Fallback naar standaard waarden');
    
    // Return defaults instead of throwing - don't let SERP analysis block content generation
    return defaultAnalysis;
  }
}

/**
 * Gather sources and references for a topic
 */
export async function gatherSources(
  topic: string,
  language: string = 'nl'
): Promise<{ sources: string[]; insights: string[] }> {
  // Default fallback
  const defaultResult = { sources: [], insights: [] };
  
  try {
    console.log(`[SERP Analyzer] Gathering sources for: ${topic}`);
    
    const prompt = `For the topic "${topic}" in ${language.toUpperCase()}, list the most authoritative and credible sources that should be referenced.

Provide:
1. A list of 8-12 authoritative sources (websites, studies, experts)
2. Key insights or statistics from these sources

Respond in JSON format:
{
  "sources": string[],
  "insights": string[]
}`;

    try {
      // Apply timeout to source gathering API call
      const response = await withTimeout(
        sendChatCompletion({
          model: TEXT_MODELS.FAST,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
          stream: false,
        }),
        SERP_ANALYSIS_TIMEOUT_MS,
        TIMEOUT_ERROR_MESSAGE
      );

      const content = (response as any).choices[0]?.message?.content || '{}';
      
      let result;
      try {
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) ||
                         [null, content];
        result = JSON.parse(jsonMatch[1] || content);
      } catch (e) {
        console.warn('[SERP Analyzer] Failed to parse sources JSON, using defaults');
        result = defaultResult;
      }

      return result;
    } catch (apiError: any) {
      if (isTimeoutError(apiError)) {
        console.warn(`[SERP Analyzer] Source gathering timed out after ${SERP_ANALYSIS_TIMEOUT_MS / 1000}s`);
        return defaultResult;
      }
      
      throw apiError;
    }
  } catch (error: any) {
    console.error('[SERP Analyzer] Error gathering sources:', error);
    console.log('[SERP Analyzer] Doorgaan zonder bronnen');
    return defaultResult;
  }
}
