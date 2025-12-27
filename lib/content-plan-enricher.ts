/**
 * Content Plan Enricher
 *
 * Enriches basic content ideas with comprehensive details needed for writing
 */

import { generateAICompletion } from './ai-client';
import type {
  ComprehensiveContentIdea,
  ContentOutline,
  HeadingStructure,
} from '@/types/content-plan';

interface BasicContentIdea {
  title: string;
  description?: string;
  keywords?: string[];
  contentType?: string;
  cluster?: string;
  category?: string;
  priority?: string;
  searchIntent?: string;
}

/**
 * Enrich a basic content idea with comprehensive details
 */
export async function enrichContentIdea(
  basic: BasicContentIdea,
  niche: string,
  language: string = 'nl'
): Promise<ComprehensiveContentIdea> {
  const currentYear = new Date().getFullYear();

  const prompt = `Je bent een SEO content expert. Maak een COMPLETE artikel outline voor:

TITEL: "${basic.title}"
NICHE: ${niche}
CLUSTER: ${basic.cluster || basic.category}
CONTENT TYPE: ${basic.contentType || 'guide'}
TAAL: ${language}

Genereer een GEDETAILLEERD artikel plan met:

1. SEO STRATEGIE:
   - Focus keyword (2-4 woorden)
   - 5 secundaire keywords
   - 5 semantische keywords
   - 3 longtail variaties
   - 5 "People Also Ask" vragen

2. CONTENT STRATEGIE:
   - Hook: Hoe begin je het artikel (eerste zin die aandacht trekt)?
   - Unique value: Wat maakt dit artikel uniek?
   - Target pain: Welk probleem lost dit op voor de lezer?
   - Solution: Wat is de oplossing?

3. TARGET PERSONA:
   - Naam voor persona (bijv. "Beginnende Blogger", "Ervaren Marketeer")
   - Level: beginner/intermediate/advanced
   - 3 pain points
   - 3 goals
   - Zoekgedrag beschrijving

4. COMPLETE OUTLINE:

   a) Introductie (200-300 woorden):
      - Hook (opening sentence)
      - Probleem (wat is het issue?)
      - Solution preview (wat gaat lezer leren?)

   b) 4-6 Hoofd secties met H2 headings:
      Voor elke H2:
      - Heading text (met keywords)
      - 2-4 H3 subheadings (elk met keywords en content hints)
      - 3-5 key points
      - Target word count
      - Visual suggestie (image/infographic/table/chart/screenshot)

   c) Conclusie (150-200 woorden):
      - Samenvatting
      - CTA (concrete actie voor lezer)
      - 3 next steps

   d) FAQ sectie:
      - 5 veelgestelde vragen met antwoorden

5. INTERNAL LINKING (3-5 links):
   - Anchor text
   - Target topic (waar linkt het naartoe?)
   - Placement (intro/body/conclusion)
   - Reason (waarom deze link?)

6. CONTENT BRONNEN:
   - 3 primary sources (URLs of source types)
   - 2 statistics om te gebruiken
   - 2 tools/resources om te vermelden

Output als JSON (ALLEEN JSON, geen tekst ervoor of erna):
{
  "seoMetadata": {
    "metaTitle": "...",
    "metaDescription": "...",
    "focusKeyword": "...",
    "secondaryKeywords": ["..."],
    "semanticKeywords": ["..."],
    "longtailVariations": ["..."]
  },
  "keywordStrategy": {
    "primary": "...",
    "secondary": ["..."],
    "longtail": ["..."],
    "semantic": ["..."],
    "relatedSearches": ["..."],
    "peopleAlsoAsk": ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"]
  },
  "contentAngle": {
    "hook": "...",
    "uniqueValue": "...",
    "targetPain": "...",
    "solution": "..."
  },
  "targetPersona": {
    "name": "...",
    "level": "beginner|intermediate|advanced",
    "painPoints": ["...", "...", "..."],
    "goals": ["...", "...", "..."],
    "searchBehavior": "..."
  },
  "writingGuidelines": {
    "tone": "professional|conversational|educational",
    "readingLevel": 65,
    "wordCountMin": 1500,
    "wordCountMax": 2500,
    "paragraphLength": "medium",
    "includeExamples": true,
    "includeStatistics": true,
    "includeVisuals": true
  },
  "outline": {
    "introduction": {
      "hook": "...",
      "problem": "...",
      "solution": "...",
      "wordCount": 250
    },
    "mainSections": [
      {
        "heading": "H2 heading text",
        "subheadings": [
          {
            "level": 3,
            "text": "H3 text",
            "keywords": ["kw1", "kw2"],
            "wordCountTarget": 300,
            "contentHints": ["Uitleg over X", "Voorbeeld van Y"]
          }
        ],
        "keyPoints": ["Point 1", "Point 2", "Point 3"],
        "wordCount": 500,
        "includeVisual": true,
        "visualType": "image|infographic|table|chart"
      }
    ],
    "conclusion": {
      "summary": "...",
      "cta": "...",
      "nextSteps": ["Step 1", "Step 2", "Step 3"],
      "wordCount": 200
    },
    "faq": [
      {
        "question": "...",
        "answer": "..."
      }
    ]
  },
  "internalLinking": {
    "suggestedLinks": [
      {
        "anchorText": "...",
        "targetTopic": "...",
        "placement": "introduction|body|conclusion",
        "reason": "..."
      }
    ],
    "linkableKeywords": ["kw1", "kw2", "kw3"]
  },
  "sources": {
    "primarySources": ["Source 1", "Source 2", "Source 3"],
    "statistics": ["Stat 1", "Stat 2"],
    "tools": ["Tool 1", "Tool 2"]
  },
  "estimatedWritingTime": 90,
  "complexity": "simple|moderate|complex"
}`;

  try {
    const response = await generateAICompletion({
      task: 'content',
      systemPrompt: `Je bent een SEO content strategist. Maak ZEER GEDETAILLEERDE artikel outlines. Schrijf in het ${language}. Output ALLEEN valide JSON.`,
      userPrompt: prompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in AI response');
    }

    const enrichedData = JSON.parse(jsonMatch[0]);

    // Create comprehensive content idea
    const comprehensive: ComprehensiveContentIdea = {
      title: basic.title,
      slug: basic.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
      category: basic.category || basic.cluster || '',
      cluster: basic.cluster || basic.category || '',
      contentType: (basic.contentType as any) || 'guide',
      searchIntent: (basic.searchIntent as any) || 'informational',
      priority: (basic.priority as any) || 'medium',
      status: 'todo',

      // Enriched data from AI
      seoMetadata: enrichedData.seoMetadata || {
        metaTitle: basic.title,
        metaDescription: basic.description || '',
        focusKeyword: basic.keywords?.[0] || '',
        secondaryKeywords: basic.keywords?.slice(1, 4) || [],
        semanticKeywords: [],
        longtailVariations: [],
      },

      keywordStrategy: enrichedData.keywordStrategy || {
        primary: basic.keywords?.[0] || '',
        secondary: basic.keywords?.slice(1) || [],
        longtail: [],
        semantic: [],
        relatedSearches: [],
        peopleAlsoAsk: [],
      },

      contentAngle: enrichedData.contentAngle || {
        hook: '',
        uniqueValue: basic.description || '',
        targetPain: '',
        solution: '',
      },

      targetPersona: enrichedData.targetPersona || {
        name: 'Default Persona',
        level: 'intermediate',
        painPoints: [],
        goals: [],
        searchBehavior: 'Google search',
      },

      writingGuidelines: enrichedData.writingGuidelines || {
        tone: 'professional',
        readingLevel: 65,
        wordCountMin: 1500,
        wordCountMax: 2500,
        paragraphLength: 'medium',
        includeExamples: true,
        includeStatistics: true,
        includeVisuals: true,
      },

      outline: enrichedData.outline || {
        introduction: {
          hook: '',
          problem: '',
          solution: '',
          wordCount: 250,
        },
        mainSections: [],
        conclusion: {
          summary: '',
          cta: '',
          nextSteps: [],
          wordCount: 200,
        },
      },

      internalLinking: enrichedData.internalLinking || {
        suggestedLinks: [],
        linkableKeywords: basic.keywords || [],
      },

      sources: enrichedData.sources || {
        primarySources: [],
        statistics: [],
      },

      estimatedWritingTime: enrichedData.estimatedWritingTime || 90,
      complexity: enrichedData.complexity || 'moderate',
    };

    return comprehensive;
  } catch (error: any) {
    console.error('Failed to enrich content idea:', error);

    // Return basic comprehensive version without AI enrichment
    return {
      title: basic.title,
      slug: basic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: basic.category || basic.cluster || '',
      cluster: basic.cluster || basic.category || '',
      contentType: (basic.contentType as any) || 'guide',
      searchIntent: (basic.searchIntent as any) || 'informational',
      priority: (basic.priority as any) || 'medium',

      seoMetadata: {
        metaTitle: basic.title,
        metaDescription: basic.description || '',
        focusKeyword: basic.keywords?.[0] || '',
        secondaryKeywords: basic.keywords?.slice(1, 4) || [],
        semanticKeywords: [],
        longtailVariations: [],
      },

      keywordStrategy: {
        primary: basic.keywords?.[0] || '',
        secondary: basic.keywords?.slice(1) || [],
        longtail: [],
        semantic: [],
        relatedSearches: [],
        peopleAlsoAsk: [],
      },

      contentAngle: {
        hook: 'To be defined',
        uniqueValue: basic.description || '',
        targetPain: 'To be defined',
        solution: 'To be defined',
      },

      targetPersona: {
        name: 'Default Persona',
        level: 'intermediate',
        painPoints: [],
        goals: [],
        searchBehavior: 'Google search',
      },

      writingGuidelines: {
        tone: 'professional',
        readingLevel: 65,
        wordCountMin: 1500,
        wordCountMax: 2500,
        paragraphLength: 'medium',
        includeExamples: true,
        includeStatistics: true,
        includeVisuals: true,
      },

      outline: {
        introduction: {
          hook: 'To be defined',
          problem: 'To be defined',
          solution: 'To be defined',
          wordCount: 250,
        },
        mainSections: [],
        conclusion: {
          summary: 'To be defined',
          cta: 'To be defined',
          nextSteps: [],
          wordCount: 200,
        },
      },

      internalLinking: {
        suggestedLinks: [],
        linkableKeywords: basic.keywords || [],
      },

      sources: {
        primarySources: [],
        statistics: [],
      },

      estimatedWritingTime: 90,
      complexity: 'moderate',
    };
  }
}

/**
 * Enrich multiple articles in batch (parallel processing for speed)
 */
export async function enrichContentIdeasBatch(
  basics: BasicContentIdea[],
  niche: string,
  language: string = 'nl',
  batchSize: number = 5
): Promise<ComprehensiveContentIdea[]> {
  const results: ComprehensiveContentIdea[] = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < basics.length; i += batchSize) {
    const batch = basics.slice(i, i + batchSize);
    console.log(`Enriching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(basics.length / batchSize)} (${batch.length} articles)`);

    const batchPromises = batch.map(basic => enrichContentIdea(basic, niche, language));
    const batchResults = await Promise.allSettled(batchPromises);

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Enrichment failed:', result.reason);
      }
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < basics.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}
