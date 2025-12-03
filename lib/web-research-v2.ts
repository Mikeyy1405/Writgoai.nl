
/**
 * 🔍 Web Research Module V2
 * Gebruikt AIML API met native web search capabilities
 */

import { webSearch, TEXT_MODELS } from './aiml-api';

export interface ResearchResult {
  topic: string;
  keyInsights: string[];
  topHeadings: string[];
  relatedKeywords: string[];
  contentSuggestions: string[];
  sources: string[];
  rawContent?: string;
}

/**
 * Voer uitgebreide web research uit met AI
 * Gebruikt models met native web search voor actuele informatie
 */
export async function performWebResearch(
  topic: string,
  keywords: string[] = []
): Promise<ResearchResult> {
  console.log(`🔍 Web research voor: "${topic}"`);
  console.log(`📌 Keywords: ${keywords.join(', ')}`);
  
  try {
    // Stap 1: Web search voor actuele informatie
    const searchQuery = `${topic} ${keywords.join(' ')} recente trends nieuws tips 2025`;
    const searchResult = await webSearch(searchQuery);
    
    if (!searchResult.success || !searchResult.results) {
      throw new Error('Web search failed');
    }

    console.log(`✅ Web search completed: ${searchResult.results.length} characters`);

    // Stap 2: Analyseer en structureer de gevonden informatie
    const { chatCompletion, TEXT_MODELS } = await import('./aiml-api');
    
    const analysisPrompt = `Op basis van deze actuele web search resultaten, maak een uitgebreide content structuur:

WEB SEARCH RESULTATEN:
${searchResult.results}

ONDERWERP: ${topic}
KEYWORDS: ${keywords.join(', ')}

Creëer een complete content research structuur met:
1. KEY INSIGHTS (5 belangrijke inzichten op basis van actuele informatie)
2. TOP HEADINGS (7-9 kopteksten voor een uitgebreid artikel)
3. RELATED KEYWORDS (12-15 gerelateerde zoekwoorden)
4. CONTENT SUGGESTIONS (6 specifieke content ideeën)

Belangrijk:
- Gebruik alleen informatie uit de web search resultaten
- Focus op actuele trends en recente ontwikkelingen
- Zorg voor professionele en SEO-vriendelijke kopteksten
- Denk aan praktische waarde voor de lezer

OUTPUT FORMAT (JSON):
{
  "keyInsights": ["insight1", "insight2", ...],
  "topHeadings": ["heading1", "heading2", ...],
  "relatedKeywords": ["keyword1", "keyword2", ...],
  "contentSuggestions": ["suggestion1", "suggestion2", ...]
}`;

    const response = await chatCompletion({
      model: TEXT_MODELS.REASONING, // Gebruik GPT-4o voor analyse
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert content stratege die web research analyseert en omzet in professionele content structuren.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const analysisContent = response.choices?.[0]?.message?.content;
    
    if (!analysisContent) {
      throw new Error('No analysis content received');
    }

    // Parse JSON response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisContent.match(/```\n([\s\S]*?)\n```/) ||
                       [null, analysisContent];
      const jsonStr = jsonMatch[1] || analysisContent;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('Raw content:', analysisContent);
      
      // Fallback structuur
      analysis = {
        keyInsights: [
          `${topic} is een belangrijk onderwerp met actuele ontwikkelingen`,
          'Er zijn veel relevante trends en best practices',
          'Praktische tips zijn essentieel voor de doelgroep',
          'Actuele informatie verhoogt de waarde',
          'Focus op toegepaste kennis is cruciaal'
        ],
        topHeadings: [
          `Waarom ${topic} Nu Belangrijk Is`,
          'Recente Trends en Ontwikkelingen',
          'De Basis Principes Uitgelegd',
          'Praktische Tips en Best Practices',
          'Veelgemaakte Fouten Vermijden',
          'Geavanceerde Strategieën',
          'Tools en Resources',
          'Toekomstverwachtingen',
          'Conclusie en Actie'
        ],
        relatedKeywords: keywords.length > 0 ? keywords : [
          topic.toLowerCase(),
          `${topic} tips`,
          `${topic} strategie`,
          `${topic} 2025`
        ],
        contentSuggestions: [
          'Bespreek actuele trends en ontwikkelingen',
          'Geef concrete, praktische voorbeelden',
          'Deel expert tips en best practices',
          'Vermijd veelvoorkomende valkuilen',
          'Geef bruikbare tools en resources',
          'Eindig met een call-to-action'
        ]
      };
    }

    const result: ResearchResult = {
      topic,
      keyInsights: analysis.keyInsights || [],
      topHeadings: analysis.topHeadings || [],
      relatedKeywords: analysis.relatedKeywords || keywords,
      contentSuggestions: analysis.contentSuggestions || [],
      sources: searchResult.sources || [],
      rawContent: searchResult.results,
    };

    console.log(`✅ Research completed: ${result.keyInsights.length} insights, ${result.topHeadings.length} headings`);
    
    return result;
    
  } catch (error: any) {
    console.error('❌ Web research error:', error);
    
    // Fallback naar basis structuur
    console.warn('⚠️ Using fallback research structure...');
    
    return {
      topic,
      keyInsights: [
        `${topic} is een belangrijk onderwerp voor je doelgroep`,
        'Actuele informatie en trends zijn essentieel',
        'Praktische tips verhogen de waarde',
        'Visual content vergroot engagement',
        'Focus op toegepaste kennis is cruciaal'
      ],
      topHeadings: [
        `Waarom ${topic} Belangrijk Is`,
        'De Basis Principes',
        'Praktische Tips en Strategieën',
        'Veelgemaakte Fouten',
        'Best Practices',
        'Tools en Resources',
        'Conclusie'
      ],
      relatedKeywords: keywords.length > 0 ? keywords : [topic.toLowerCase()],
      contentSuggestions: [
        'Bespreek de voordelen en impact',
        'Geef praktische, uitvoerbare tips',
        'Deel real-world voorbeelden',
        'Vermijd veel voorkomende valkuilen',
        'Geef concrete tools en resources',
        'Eindig met een call-to-action'
      ],
      sources: [],
    };
  }
}

/**
 * Quick web search voor directe vragen
 */
export async function quickWebSearch(query: string): Promise<string> {
  console.log(`🔍 Quick search: "${query}"`);
  
  const result = await webSearch(query);
  
  if (result.success && result.results) {
    return result.results;
  }
  
  return 'Geen resultaten gevonden. Probeer een andere zoekopdracht.';
}

export default {
  performWebResearch,
  quickWebSearch,
};
