/**
 * SERP Research Module
 * Uses Perplexity to analyze top Google results for better content creation
 */

import { analyzeWithPerplexity } from './ai-client';

export interface SERPAnalysis {
  keyword: string;
  topResults: Array<{
    title: string;
    url: string;
    keyPoints: string[];
  }>;
  commonTopics: string[];
  contentGaps: string[];
  recommendedStructure: {
    headings: string[];
    sections: Array<{
      heading: string;
      suggestedContent: string;
    }>;
  };
  averageWordCount: number;
  contentType: string; // 'how-to', 'listicle', 'guide', 'comparison', etc.
}

/**
 * Analyze top 5 Google results for a keyword using Perplexity
 * Returns insights to create better content
 */
export async function analyzeSERPWithPerplexity(
  keyword: string,
  language: string = 'nl'
): Promise<SERPAnalysis> {
  try {
    console.log(`📊 Analyzing SERP for keyword: "${keyword}" (${language})`);

    const languageNames: Record<string, string> = {
      nl: 'Nederlands',
      en: 'English',
      de: 'Deutsch',
      fr: 'Français',
      es: 'Español',
    };

    const langName = languageNames[language] || 'Nederlands';

    const prompt = `Analyseer de TOP 5 Google resultaten voor de zoekopdracht: "${keyword}" in ${langName}.

BELANGRIJKE INSTRUCTIES:
1. Zoek op Google naar "${keyword}" in ${langName}
2. Analyseer de TOP 5 organische zoekresultaten (GEEN advertenties)
3. Bekijk de VOLLEDIGE CONTENT van elk artikel (niet alleen de titel)
4. Identificeer welke onderwerpen ALLE top 5 behandelen
5. Vind content gaps: wat ontbreekt er in de huidige top 5?

GEEF TERUG IN JSON FORMAAT:
\`\`\`json
{
  "keyword": "${keyword}",
  "topResults": [
    {
      "title": "Exacte titel van artikel 1",
      "url": "URL van artikel 1",
      "keyPoints": ["Hoofdpunt 1 uit dit artikel", "Hoofdpunt 2", "Hoofdpunt 3"]
    },
    {
      "title": "Exacte titel van artikel 2",
      "url": "URL van artikel 2",
      "keyPoints": ["Hoofdpunt 1 uit dit artikel", "Hoofdpunt 2", "Hoofdpunt 3"]
    }
    // ... tot 5 resultaten
  ],
  "commonTopics": [
    "Onderwerp dat in ALLE of MEESTE top 5 artikelen voorkomt",
    "Nog een gemeenschappelijk onderwerp",
    "Etc."
  ],
  "contentGaps": [
    "Onderwerp dat ONTBREEKT maar relevant zou zijn",
    "Nog een content gap",
    "Etc."
  ],
  "recommendedStructure": {
    "headings": [
      "Geadviseerde H2 heading 1 (gebaseerd op wat top 5 gebruikt)",
      "Geadviseerde H2 heading 2",
      "Etc."
    ],
    "sections": [
      {
        "heading": "Eerste sectie heading",
        "suggestedContent": "Korte samenvatting van wat deze sectie moet behandelen (2-3 zinnen)"
      }
    ]
  },
  "averageWordCount": 2500,
  "contentType": "how-to"
}
\`\`\`

CONTENT TYPE OPTIONS:
- "how-to": Stap-voor-stap handleiding
- "listicle": Top X lijst artikel
- "guide": Uitgebreide gids
- "comparison": Vergelijking van opties
- "definition": Definitie/uitleg artikel
- "tutorial": Technische tutorial

Geef ALLEEN de JSON terug, geen extra tekst.`;

    const result = await analyzeWithPerplexity(prompt, 90000); // 90 second timeout for thorough research

    // Parse JSON from response
    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error('No JSON found in Perplexity response');
      console.error('Raw response (first 500 chars):', result.substring(0, 500));
      throw new Error('Failed to parse SERP analysis from Perplexity');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const analysis: SERPAnalysis = JSON.parse(jsonStr);

    console.log(`✓ SERP analysis complete:`);
    console.log(`  - Found ${analysis.topResults?.length || 0} top results`);
    console.log(`  - Identified ${analysis.commonTopics?.length || 0} common topics`);
    console.log(`  - Found ${analysis.contentGaps?.length || 0} content gaps`);
    console.log(`  - Content type: ${analysis.contentType}`);
    console.log(`  - Average word count: ${analysis.averageWordCount}`);

    return analysis;
  } catch (error: any) {
    console.error('SERP analysis error:', error);

    // Return fallback analysis instead of failing completely
    console.warn('Returning fallback SERP analysis (no real data)');
    return {
      keyword,
      topResults: [],
      commonTopics: [],
      contentGaps: [],
      recommendedStructure: {
        headings: [],
        sections: [],
      },
      averageWordCount: 2000,
      contentType: 'guide',
    };
  }
}

/**
 * Format SERP analysis for inclusion in article generation prompt
 */
export function formatSERPAnalysisForPrompt(analysis: SERPAnalysis): string {
  if (!analysis || analysis.topResults.length === 0) {
    return '';
  }

  let prompt = `\n\n## 📊 GOOGLE TOP 5 ANALYSE (voor keyword: "${analysis.keyword}")

**Content Type:** ${analysis.contentType}
**Gemiddelde woordenaantal van top 5:** ${analysis.averageWordCount} woorden

### Top 5 Google Resultaten:
${analysis.topResults.map((result, i) => `
${i + 1}. **${result.title}**
   - URL: ${result.url}
   - Belangrijkste punten:
${result.keyPoints.map(point => `     * ${point}`).join('\n')}
`).join('\n')}

### Gemeenschappelijke Onderwerpen (behandel deze ZEKER):
${analysis.commonTopics.map(topic => `- ${topic}`).join('\n')}

### Content Gaps (behandel deze om te RANKEN):
${analysis.contentGaps.map(gap => `- ⭐ ${gap} (dit ontbreekt in de top 5!)`).join('\n')}

### Aanbevolen Structuur:
${analysis.recommendedStructure.headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}

**BELANGRIJK:**
- Behandel ALLE gemeenschappelijke onderwerpen (anders rank je niet)
- Voeg de CONTENT GAPS toe om je artikel beter te maken dan de top 5
- Gebruik de aanbevolen structuur als basis, maar maak het beter
- Streef naar minimaal ${Math.max(analysis.averageWordCount, 2000)} woorden
`;

  return prompt;
}

/**
 * Quick SERP check - just get content type and word count
 * Faster than full analysis
 */
export async function quickSERPCheck(
  keyword: string,
  language: string = 'nl'
): Promise<{ contentType: string; averageWordCount: number }> {
  try {
    const prompt = `Zoek op Google naar "${keyword}" in ${language}.

Bekijk de TOP 3 resultaten en geef terug:

JSON:
{
  "contentType": "how-to",
  "averageWordCount": 2500
}

Content type options: how-to, listicle, guide, comparison, definition, tutorial`;

    const result = await analyzeWithPerplexity(prompt, 30000); // 30s timeout
    const jsonMatch = result.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        contentType: data.contentType || 'guide',
        averageWordCount: data.averageWordCount || 2000,
      };
    }

    return { contentType: 'guide', averageWordCount: 2000 };
  } catch (error) {
    console.error('Quick SERP check error:', error);
    return { contentType: 'guide', averageWordCount: 2000 };
  }
}
