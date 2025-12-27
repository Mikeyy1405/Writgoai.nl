import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import type {
  ComprehensiveContentIdea,
  ContentOutline,
  ComprehensiveContentPlan,
} from '@/types/content-plan';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/content-plan/comprehensive
 *
 * Generate a COMPLETE content plan with all details needed to write articles
 */
export async function POST(request: Request) {
  try {
    const {
      niche,
      language = 'nl',
      website_url,
      target_count = 50,
      domain_authority = 20,
    } = await request.json();

    if (!niche || !website_url) {
      return NextResponse.json(
        { error: 'Niche and website_url are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Step 1: Generate pillar topics with detailed clustering
    console.log(`Generating comprehensive content plan for: ${niche}`);

    const topicsPrompt = `Je bent een SEO content strategie expert. Genereer 10 pillar topics voor de niche: "${niche}".

Website: ${website_url}
Taal: ${language}
Jaar: ${currentYear}

Voor elk pillar topic:
1. Kies een breed hoofdonderwerp dat 30-50 artikelen kan genereren
2. Identificeer 5-10 subtopics
3. Geef een schatting van aantal benodigde artikelen

Output als JSON array:
[
  {
    "pillarTopic": "SEO Basics",
    "estimatedArticles": 40,
    "subtopics": ["On-page SEO", "Off-page SEO", "Technical SEO", "Local SEO", "Content SEO"],
    "keywords": ["seo basics", "zoekmachine optimalisatie", "google ranking"],
    "targetAudience": "beginners"
  }
]`;

    const topicsResponse = await generateAICompletion({
      task: 'content',
      systemPrompt: `Je bent een SEO expert. Schrijf in het ${language}. Output alleen valide JSON.`,
      userPrompt: topicsPrompt,
      maxTokens: 2000,
      temperature: 0.7,
    });

    const topicsMatch = topicsResponse.match(/\[[\s\S]*\]/);
    if (!topicsMatch) {
      throw new Error('Failed to parse pillar topics');
    }

    const pillarTopics = JSON.parse(topicsMatch[0]);
    const articlesNeeded = Math.ceil(target_count / pillarTopics.length);

    // Step 2: Generate comprehensive articles for each pillar
    const allArticles: ComprehensiveContentIdea[] = [];

    for (const pillar of pillarTopics) {
      console.log(`Generating articles for pillar: ${pillar.pillarTopic}`);

      const articlePrompt = `Genereer ${articlesNeeded} COMPLETE artikel ideeën voor: "${pillar.pillarTopic}"

Niche: ${niche}
Subtopics: ${pillar.subtopics.join(', ')}
Taal: ${language}

Voor ELK artikel genereer:

1. BASIC INFO:
   - Titel (catchy en SEO-vriendelijk)
   - Meta titel (max 60 karakters)
   - Meta beschrijving (max 160 karakters)

2. SEO STRATEGIE:
   - Focus keyword (2-4 woorden)
   - 5 secundaire keywords
   - 5 semantische keywords
   - 3 longtail variaties
   - 5 "People Also Ask" vragen

3. CONTENT STRATEGIE:
   - Content angle: Wat maakt dit artikel uniek?
   - Target persona: Voor wie is dit?
   - Pain points: Welke problemen lost dit op?
   - Unique value: Wat leert de lezer?

4. WRITING GUIDELINES:
   - Tone: professional/conversational/educational
   - Minimum woorden: 1500-3000
   - Leesniveau: Flesch score 60-70
   - Include: voorbeelden, statistieken, visuals

5. DETAILED OUTLINE:
   a) Introductie (200-300 woorden):
      - Hook: Begin met impact
      - Probleem: Wat is het issue?
      - Solution preview: Wat gaat de lezer leren?

   b) Hoofd secties (3-5 secties):
      Voor elke sectie:
      - H2 heading
      - 2-4 H3 subheadings met specifieke keywords
      - Key points per sectie
      - Target woorden per sectie
      - Visual suggestie (image/infographic/table/chart)

   c) Conclusie (150-200 woorden):
      - Samenvatting
      - CTA (wat moet lezer nu doen?)
      - Next steps (3-5 concrete acties)

   d) FAQ (optioneel):
      - 5 veelgestelde vragen met antwoorden

6. INTERNAL LINKING:
   - 3-5 suggested internal links
   - Anchor text suggesties
   - Placement hints (intro/body/conclusion)

7. CONTENT SOURCES:
   - 3-5 primary sources (websites, studies)
   - 2-3 statistics to include
   - Expert quotes (optioneel)

8. COMPETITOR RESEARCH:
   - Wat doen concurrenten goed?
   - Content gaps: Wat missen zij?
   - Opportunities: Hoe kunnen wij beter?

Output als JSON array (ALLEEN JSON):
[
  {
    "title": "...",
    "slug": "...",
    "category": "${pillar.pillarTopic}",
    "cluster": "${pillar.pillarTopic}",
    "contentType": "pillar|how-to|guide|comparison|list",
    "searchIntent": "informational|commercial|transactional",
    "priority": "high|medium|low",

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
      "peopleAlsoAsk": ["..."]
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
      "painPoints": ["..."],
      "goals": ["..."],
      "searchBehavior": "..."
    },

    "writingGuidelines": {
      "tone": "professional|conversational|educational",
      "readingLevel": 65,
      "wordCountMin": 1500,
      "wordCountMax": 3000,
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
              "text": "H3 heading",
              "keywords": ["keyword1", "keyword2"],
              "wordCountTarget": 300,
              "contentHints": ["Leg X uit", "Geef Y voorbeeld"]
            }
          ],
          "keyPoints": ["point 1", "point 2"],
          "wordCount": 500,
          "includeVisual": true,
          "visualType": "image|infographic|table"
        }
      ],
      "conclusion": {
        "summary": "...",
        "cta": "...",
        "nextSteps": ["..."],
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
      "linkableKeywords": ["..."]
    },

    "sources": {
      "primarySources": ["https://..."],
      "statistics": ["Statistic 1...", "Statistic 2..."],
      "expertQuotes": ["Quote from expert..."],
      "tools": ["Tool 1", "Tool 2"]
    },

    "competitorInsights": {
      "strengths": ["What competitors do well"],
      "gaps": ["What competitors miss"],
      "opportunities": ["How we can do better"]
    },

    "estimatedWritingTime": 120,
    "complexity": "simple|moderate|complex"
  }
]`;

      const articlesResponse = await generateAICompletion({
        task: 'content',
        systemPrompt: `Je bent een SEO content expert. Maak ZEER GEDETAILLEERDE artikel plannen met complete outlines. Schrijf in het ${language}. Output ALLEEN valide JSON.`,
        userPrompt: articlePrompt,
        maxTokens: 16000,
        temperature: 0.8,
      });

      const articlesMatch = articlesResponse.match(/\[[\s\S]*\]/);
      if (articlesMatch) {
        try {
          const articles = JSON.parse(articlesMatch[0]);
          allArticles.push(...articles);
          console.log(`✓ Generated ${articles.length} comprehensive articles for ${pillar.pillarTopic}`);
        } catch (parseError) {
          console.error(`Failed to parse articles for ${pillar.pillarTopic}`);
        }
      }
    }

    // Step 3: Calculate comprehensive statistics
    const stats = {
      totalArticles: allArticles.length,
      pillarPages: allArticles.filter(a => a.contentType === 'pillar').length,
      clusterCount: pillarTopics.length,
      avgWordCount: Math.round(
        allArticles.reduce((sum, a) => sum + (a.writingGuidelines?.wordCountMin || 1500), 0) /
        (allArticles.length || 1)
      ),
      totalEstimatedSearchVolume: 0,
      avgKeywordDifficulty: 0,
      avgRankingPotential: 0,
      byContentType: {
        pillar: allArticles.filter(a => a.contentType === 'pillar').length,
        'how-to': allArticles.filter(a => a.contentType === 'how-to').length,
        guide: allArticles.filter(a => a.contentType === 'guide').length,
        comparison: allArticles.filter(a => a.contentType === 'comparison').length,
        list: allArticles.filter(a => a.contentType === 'list').length,
      },
      byPriority: {
        high: allArticles.filter(a => a.priority === 'high').length,
        medium: allArticles.filter(a => a.priority === 'medium').length,
        low: allArticles.filter(a => a.priority === 'low').length,
      },
      byStatus: {
        todo: allArticles.length,
        in_progress: 0,
        review: 0,
        published: 0,
        update_needed: 0,
      },
    };

    // Step 4: Create comprehensive plan
    const comprehensivePlan: Partial<ComprehensiveContentPlan> = {
      niche,
      nicheKeywords: pillarTopics.flatMap((p: any) => p.keywords || []),
      language,
      targetAudience: ['beginners', 'intermediate', 'advanced'],
      competitionLevel: domain_authority < 30 ? 'high' : domain_authority < 50 ? 'medium' : 'low',
      domainAuthority: domain_authority,
      targetArticleCount: target_count,
      estimatedMonths: Math.ceil(target_count / 20), // 20 articles per month
      articlesPerWeek: 5,
      priorityOrder: 'balanced',
      articles: allArticles,
      stats,
      reasoning: `Complete content plan gegenereerd voor ${niche} met ${allArticles.length} gedetailleerde artikelen verdeeld over ${pillarTopics.length} pillar topics. Elk artikel heeft een volledige outline, SEO strategie, en schrijfinstructies.`,
      opportunities: [
        'Topical authority opbouwen met ${pillarTopics.length} clusters',
        'Focus op long-tail keywords met lage concurrentie',
        'Internal linking structuur opzetten',
      ],
      recommendations: [
        'Start met pillar pages voor snelle authority',
        'Publiceer consistent 5 artikelen per week',
        'Update artikelen na 6 maanden voor freshness',
      ],
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({
      success: true,
      plan: comprehensivePlan,
      message: `✅ Comprehensive content plan generated with ${allArticles.length} detailed articles`,
    });
  } catch (error: any) {
    console.error('Comprehensive content plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate comprehensive content plan' },
      { status: 500 }
    );
  }
}
