/**
 * Free Keyword Research Module (2025)
 * Using Google APIs + Claude AI - 100% FREE!
 */

import { generateAICompletion } from './ai-client';

export interface FreeKeywordMetrics {
  keyword: string;
  relatedKeywords: string[];
  trend: 'rising' | 'stable' | 'declining';
  estimatedVolume: 'low' | 'medium' | 'high' | 'very-high';
  difficulty: number; // 0-100 (AI estimated)
  rankingPotential: number; // 0-100 (AI calculated)
}

export interface FreeKeywordOpportunity {
  keyword: string;
  focusKeyword: string;
  difficulty: number;
  rankingPotential: number;
  recommendation: 'high-priority' | 'medium-priority' | 'low-priority' | 'skip';
  recommendationReason: string;
  peopleAlsoAsk: string[];
  relatedKeywords: string[];
  semanticKeywords: string[];
  estimatedVolume: string;
  trend: string;
  contentSuggestions: string[];
}

/**
 * Google Autocomplete API Integration (FREE)
 */
export class GoogleAutocompleteClient {
  /**
   * Get keyword suggestions from Google Autocomplete
   * This is the same API Google uses for search suggestions
   */
  async getSuggestions(keyword: string, language: string = 'nl'): Promise<string[]> {
    try {
      // Google Autocomplete API endpoint (public, no key needed)
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=${language}`;

      const response = await fetch(url);
      if (!response.ok) {
        console.warn('Google Autocomplete failed:', response.status);
        return [];
      }

      const data = await response.json();
      // Response format: [query, [suggestions]]
      return data[1] || [];
    } catch (error) {
      console.error('Google Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Generate keyword variations using modifiers
   */
  async getKeywordVariations(keyword: string, language: string = 'nl'): Promise<string[]> {
    const modifiers = [
      'hoe',
      'wat',
      'waarom',
      'beste',
      'goedkope',
      'gratis',
      'kopen',
      'tips',
      'voor beginners',
    ];

    const variations = new Set<string>();

    // Get suggestions for base keyword
    const baseSuggestions = await this.getSuggestions(keyword, language);
    baseSuggestions.forEach(s => variations.add(s));

    // Get suggestions for modified keywords
    for (const modifier of modifiers.slice(0, 5)) { // Limit to avoid too many requests
      const modifiedKeyword = `${modifier} ${keyword}`;
      const suggestions = await this.getSuggestions(modifiedKeyword, language);
      suggestions.slice(0, 3).forEach(s => variations.add(s));

      // Small delay to be nice to Google
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return Array.from(variations).slice(0, 20);
  }
}

/**
 * AI-Powered Keyword Analyzer (FREE - uses Claude)
 */
export class AIKeywordAnalyzer {
  /**
   * Analyze keyword using Claude AI
   * Generates PAA, difficulty estimates, semantic keywords
   */
  async analyzeKeyword(
    keyword: string,
    relatedKeywords: string[],
    yourDomainAuthority: number = 20,
    niche: string = ''
  ): Promise<FreeKeywordOpportunity> {
    const prompt = `Analyseer dit keyword voor SEO: "${keyword}"

CONTEXT:
- Niche: ${niche || 'algemeen'}
- Gerelateerde keywords: ${relatedKeywords.slice(0, 10).join(', ')}
- Domein Autoriteit van de website: ${yourDomainAuthority}/100

TAAK:
Genereer een complete keyword analyse met:

1. **People Also Ask (PAA) Vragen**
   - 5-10 vragen die mensen stellen over dit onderwerp
   - Zorg dat ze realistisch zijn en echt gezocht worden
   - Varieer in vraagtype (hoe, wat, waarom, wanneer, waar, wie)

2. **Semantic Keywords** (LSI keywords)
   - 10-15 gerelateerde termen en concepten
   - Denk aan synoniemen, variaties, gerelateerde topics

3. **Keyword Difficulty** (0-100)
   - Schat hoe moeilijk het is om voor dit keyword te ranken
   - Gebaseerd op je kennis van:
     * Hoe competitief is dit onderwerp?
     * Worden er grote merken/autoriteiten voor gerankt?
     * Is het een breed of niche keyword?

4. **Ranking Potential** (0-100) voor een site met DA ${yourDomainAuthority}
   - Schat de kans om top 10 te bereiken
   - Rekening houdend met:
     * Keyword difficulty vs domain authority
     * Search intent (kan je waarde toevoegen?)
     * Concurrentie niveau

5. **Geschat Zoekvolume**
   - "very-high" (>10K/maand)
   - "high" (1K-10K/maand)
   - "medium" (100-1K/maand)
   - "low" (<100/maand)

6. **Trend**
   - "rising" (trending up)
   - "stable" (consistent)
   - "declining" (trending down)

7. **Content Suggesties**
   - 3-5 specifieke H2/H3 koppen voor een artikel over dit keyword
   - Zorg dat ze praktisch en waardevol zijn

Output als JSON (zonder markdown):
{
  "peopleAlsoAsk": ["vraag 1", "vraag 2", ...],
  "semanticKeywords": ["keyword1", "keyword2", ...],
  "keywordDifficulty": 45,
  "rankingPotential": 65,
  "estimatedVolume": "medium",
  "trend": "stable",
  "contentSuggestions": ["H2 titel 1", "H2 titel 2", ...],
  "reasoning": "Korte uitleg waarom deze scores"
}`;

    try {
      const response = await generateAICompletion({
        task: 'quick',
        systemPrompt: 'Je bent een SEO expert met diepgaande kennis van keyword research, SERP analysis en content strategie. Geef alleen valide JSON terug.',
        userPrompt: prompt,
        maxTokens: 1500,
        temperature: 0.7,
      });

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      // Calculate recommendation based on difficulty and potential
      const { recommendation, reason } = this.calculateRecommendation(
        analysis.keywordDifficulty || 50,
        analysis.rankingPotential || 50,
        analysis.estimatedVolume || 'medium'
      );

      return {
        keyword,
        focusKeyword: keyword.toLowerCase(),
        difficulty: analysis.keywordDifficulty || 50,
        rankingPotential: analysis.rankingPotential || 50,
        recommendation,
        recommendationReason: reason,
        peopleAlsoAsk: analysis.peopleAlsoAsk || [],
        relatedKeywords: relatedKeywords.slice(0, 10),
        semanticKeywords: analysis.semanticKeywords || [],
        estimatedVolume: analysis.estimatedVolume || 'medium',
        trend: analysis.trend || 'stable',
        contentSuggestions: analysis.contentSuggestions || [],
      };
    } catch (error) {
      console.error('AI Keyword Analysis failed:', error);

      // Fallback to basic analysis
      return this.generateFallbackAnalysis(keyword, relatedKeywords, yourDomainAuthority);
    }
  }

  /**
   * Batch analyze multiple keywords
   */
  async analyzeBatch(
    keywords: string[],
    yourDomainAuthority: number = 20,
    niche: string = ''
  ): Promise<FreeKeywordOpportunity[]> {
    const opportunities: FreeKeywordOpportunity[] = [];
    const googleClient = new GoogleAutocompleteClient();

    // Process in batches to avoid overwhelming the AI
    const batchSize = 10;
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);

      for (const keyword of batch) {
        try {
          // Get related keywords from Google
          const related = await googleClient.getKeywordVariations(keyword);

          // Analyze with AI
          const opportunity = await this.analyzeKeyword(
            keyword,
            related,
            yourDomainAuthority,
            niche
          );

          opportunities.push(opportunity);

          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to analyze keyword: ${keyword}`, error);
        }
      }
    }

    return opportunities;
  }

  private calculateRecommendation(
    difficulty: number,
    potential: number,
    volume: string
  ): { recommendation: 'high-priority' | 'medium-priority' | 'low-priority' | 'skip'; reason: string } {
    // Volume score
    const volumeScore = {
      'very-high': 100,
      'high': 70,
      'medium': 40,
      'low': 20,
    }[volume] || 40;

    // High priority: Good potential, reasonable difficulty, decent volume
    if (potential > 60 && difficulty < 50 && volumeScore >= 40) {
      return {
        recommendation: 'high-priority',
        reason: `Hoge ranking kans (${potential}%), lage moeilijkheid (${difficulty}%), ${volume} volume`,
      };
    }

    // Medium priority
    if (potential > 40 && difficulty < 70 && volumeScore >= 20) {
      return {
        recommendation: 'medium-priority',
        reason: `Redelijke ranking kans (${potential}%), gemiddelde moeilijkheid (${difficulty}%)`,
      };
    }

    // Low priority: Easy but low volume
    if (difficulty < 40) {
      return {
        recommendation: 'low-priority',
        reason: `Makkelijk te ranken (${difficulty}%) maar ${volume} volume`,
      };
    }

    // Skip
    return {
      recommendation: 'skip',
      reason: difficulty > 70
        ? `Te moeilijk (${difficulty}%) voor huidige autoriteit`
        : `Te weinig potentieel (${potential}%)`,
    };
  }

  private generateFallbackAnalysis(
    keyword: string,
    relatedKeywords: string[],
    yourDA: number
  ): FreeKeywordOpportunity {
    // Basic heuristic-based analysis as fallback
    const wordCount = keyword.split(' ').length;

    // Longer keywords are usually easier
    const difficulty = Math.max(20, Math.min(80, 70 - (wordCount * 10)));

    // Potential based on DA and difficulty
    const potential = Math.max(20, Math.min(90, yourDA + (100 - difficulty) / 2));

    const { recommendation, reason } = this.calculateRecommendation(
      difficulty,
      potential,
      'medium'
    );

    return {
      keyword,
      focusKeyword: keyword.toLowerCase(),
      difficulty,
      rankingPotential: potential,
      recommendation,
      recommendationReason: reason,
      peopleAlsoAsk: [
        `Wat is ${keyword}?`,
        `Hoe werkt ${keyword}?`,
        `Waarom is ${keyword} belangrijk?`,
      ],
      relatedKeywords: relatedKeywords.slice(0, 10),
      semanticKeywords: relatedKeywords.slice(0, 10),
      estimatedVolume: 'medium',
      trend: 'stable',
      contentSuggestions: [
        `Wat je moet weten over ${keyword}`,
        `Hoe gebruik je ${keyword} effectief`,
        `Veelgemaakte fouten bij ${keyword}`,
      ],
    };
  }
}

/**
 * Main Free Research Analyzer
 * Combines Google + AI for complete keyword intelligence
 */
export class FreeKeywordResearch {
  private googleClient: GoogleAutocompleteClient;
  private aiAnalyzer: AIKeywordAnalyzer;

  constructor() {
    this.googleClient = new GoogleAutocompleteClient();
    this.aiAnalyzer = new AIKeywordAnalyzer();
  }

  /**
   * Full keyword opportunity analysis (FREE)
   */
  async analyzeKeywordOpportunity(
    keyword: string,
    yourDomainAuthority: number = 20,
    niche: string = ''
  ): Promise<FreeKeywordOpportunity> {
    console.log(`Analyzing keyword (FREE): ${keyword}`);

    // Step 1: Get related keywords from Google Autocomplete
    const relatedKeywords = await this.googleClient.getKeywordVariations(keyword);

    // Step 2: Analyze with AI
    const opportunity = await this.aiAnalyzer.analyzeKeyword(
      keyword,
      relatedKeywords,
      yourDomainAuthority,
      niche
    );

    return opportunity;
  }

  /**
   * Batch analyze multiple keywords
   */
  async analyzeBatch(
    keywords: string[],
    yourDomainAuthority: number = 20,
    niche: string = ''
  ): Promise<FreeKeywordOpportunity[]> {
    console.log(`Analyzing ${keywords.length} keywords (FREE mode)`);

    return this.aiAnalyzer.analyzeBatch(keywords, yourDomainAuthority, niche);
  }
}
