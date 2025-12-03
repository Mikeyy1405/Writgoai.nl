/**
 * SERP Analyzer for Content Hub
 * Analyzes Google search results to gather competitive intelligence
 */

import { sendChatCompletion } from '../aiml-chat-client';
import { TEXT_MODELS } from '../aiml-api';

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
}

/**
 * Analyze SERP results for a given keyword
 */
export async function analyzeSERP(
  keyword: string,
  language: string = 'nl'
): Promise<SERPAnalysis> {
  try {
    console.log(`[SERP Analyzer] Analyzing keyword: ${keyword}`);
    
    // Use AI to generate SERP analysis based on keyword
    const prompt = `Analyze the top 10 Google search results for the keyword: "${keyword}" in ${language.toUpperCase()}.

Provide a comprehensive SERP analysis including:
1. Estimated average word count of top-ranking articles
2. Common headings and sections found across top results
3. Topics commonly covered
4. Questions frequently addressed
5. Content gaps or opportunities
6. Suggested optimal word count for a comprehensive article

Respond in JSON format:
{
  "averageWordCount": number,
  "commonHeadings": string[],
  "topicsCovered": string[],
  "questionsFound": string[],
  "contentGaps": string[],
  "suggestedLength": number
}`;

    const response = await sendChatCompletion({
      model: TEXT_MODELS.FAST,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    });

    const content = (response as any).choices[0]?.message?.content || '{}';
    
    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       [null, content];
      analysis = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error('[SERP Analyzer] Failed to parse JSON:', e);
      // Fallback to default values
      analysis = {
        averageWordCount: 2000,
        commonHeadings: [],
        topicsCovered: [],
        questionsFound: [],
        contentGaps: [],
        suggestedLength: 2400,
      };
    }

    return {
      keyword,
      topResults: [],
      ...analysis,
    };
  } catch (error: any) {
    console.error('[SERP Analyzer] Error:', error);
    throw new Error(`SERP analysis failed: ${error.message}`);
  }
}

/**
 * Gather sources and references for a topic
 */
export async function gatherSources(
  topic: string,
  language: string = 'nl'
): Promise<{ sources: string[]; insights: string[] }> {
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

    const response = await sendChatCompletion({
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
    });

    const content = (response as any).choices[0]?.message?.content || '{}';
    
    let result;
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/```\n([\s\S]*?)\n```/) ||
                       [null, content];
      result = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      result = { sources: [], insights: [] };
    }

    return result;
  } catch (error: any) {
    console.error('[SERP Analyzer] Error gathering sources:', error);
    return { sources: [], insights: [] };
  }
}
