
/**
 * Content Research Module
 * Performs AI-powered content research and analysis
 */

import OpenAI from 'openai';

function getOpenAI() {
  // Use AI/ML API with access to all models
  const apiKey = process.env.AIML_API_KEY;
  
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet gevonden in environment variables');
  }
  
  return new OpenAI({ 
    apiKey,
    baseURL: 'https://api.aimlapi.com/v1'
  });
}

export interface ResearchResult {
  topic: string;
  keyInsights: string[];
  topHeadings: string[];
  relatedKeywords: string[];
  contentSuggestions: string[];
  sources: string[];
}

/**
 * Perform AI-powered content research
 * Uses AI to generate strategic insights and content structure
 */
export async function performWebResearch(topic: string, keywords: string[]): Promise<ResearchResult> {
  console.log(`🔍 START: AI content research op "${topic}" met keywords: ${keywords.join(', ')}`);
  const startTime = Date.now();
  
  const openai = getOpenAI();
  
  console.log(`   📡 Aanroepen AI model (bagoodex/bagoodex-web-search-v1) voor web search research...`);
  
  const researchPrompt = `Als expert content strategie, genereer een uitgebreide content research voor een professioneel blog artikel over: "${topic}"

KEYWORDS: ${keywords.join(', ')}

Genereer:
1. KEY INSIGHTS (5 belangrijke inzichten en waardevolle informatie over dit onderwerp)
2. TOP HEADINGS (7-9 kopteksten voor een uitgebreid artikel van 1000+ woorden)
3. RELATED KEYWORDS (12-15 gerelateerde zoekwoorden en begrippen)
4. CONTENT SUGGESTIONS (6 specifieke content ideeën, tips of praktische adviezen)

Belangrijke vereisten:
- Maak de content relevant en actueel
- Focus op praktische waarde voor de lezer
- Gebruik professionele toon
- Zorg voor logische structuur
- Denk aan SEO optimalisatie

OUTPUT FORMAT (JSON):
{
  "keyInsights": [
    "Waardevol inzicht 1",
    "Waardevol inzicht 2",
    "Waardevol inzicht 3",
    "Waardevol inzicht 4",
    "Waardevol inzicht 5"
  ],
  "topHeadings": [
    "Koptekst 1: Introductie/Waarom belangrijk",
    "Koptekst 2: Kern concept",
    "Koptekst 3: Praktische tip 1",
    "Koptekst 4: Praktische tip 2",
    "Koptekst 5: Veelgemaakte fouten",
    "Koptekst 6: Best practices",
    "Koptekst 7: Geavanceerde strategie",
    "Koptekst 8: Tools en resources",
    "Koptekst 9: Conclusie/Actie"
  ],
  "relatedKeywords": [
    "keyword1", "keyword2", ...
  ],
  "contentSuggestions": [
    "Tip 1: Concrete actie",
    "Tip 2: Praktisch advies",
    "Tip 3: Veelvoorkomende fout vermijden",
    "Tip 4: Best practice",
    "Tip 5: Tool of resource",
    "Tip 6: Vervolgstap"
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'bagoodex/bagoodex-web-search-v1',
      messages: [
        { role: 'system', content: 'Je bent een expert content strategie die uitgebreide content research genereert voor professionele blog artikelen.' },
        { role: 'user', content: researchPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    });
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ⏱️  AI research ontvangen na ${elapsed}s`);
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No research response from AI');
    }
    
    const researchData = JSON.parse(content);
    
    console.log(`✅ KLAAR: Research voltooid in ${elapsed}s`);
    console.log(`   📊 ${researchData.keyInsights?.length || 0} insights, ${researchData.topHeadings?.length || 0} headings, ${researchData.relatedKeywords?.length || 0} keywords`);
    
    return {
      topic,
      keyInsights: researchData.keyInsights || [],
      topHeadings: researchData.topHeadings || [],
      relatedKeywords: researchData.relatedKeywords || [],
      contentSuggestions: researchData.contentSuggestions || [],
      sources: []
    };
    
  } catch (error) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ Research error na ${elapsed}s:`, error);
    console.warn('⚠️  FALLBACK: Gebruiken van basis research data...');
    
    return {
      topic,
      keyInsights: [
        `${topic} is een belangrijk onderwerp voor je doelgroep`,
        'Praktische tips en adviezen zijn essentieel',
        'Visuele content verhoogt de engagement',
        'Actuele trends en ontwikkelingen zijn relevant',
        'Focus op toegepaste waarde voor de lezer'
      ],
      topHeadings: [
        `Waarom ${topic} Belangrijk Is`,
        'De Basis Principes',
        'Praktische Tips en Adviezen',
        'Veelgemaakte Fouten',
        'Best Practices en Strategieën',
        'Tools en Resources',
        'Conclusie en Vervolgstappen'
      ],
      relatedKeywords: keywords,
      contentSuggestions: [
        'Bespreek de voordelen en impact',
        'Geef praktische, uitvoerbare tips',
        'Deel real-world voorbeelden',
        'Vermijd veel voorkomende valkuilen',
        'Geef concrete tools en resources',
        'Eindig met een call-to-action'
      ],
      sources: []
    };
  }
}
