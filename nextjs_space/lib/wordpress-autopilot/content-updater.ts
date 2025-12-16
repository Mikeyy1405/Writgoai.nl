/**
 * AI Content Updater
 * Analyseert bestaande WordPress content en suggereert verbeteringen
 */

import { chatCompletion } from '@/lib/aiml-api';
import type { ContentUpdateSuggestion } from './types';

/**
 * Analyze existing content and generate update suggestions
 */
export async function analyzeContentForUpdates(
  content: {
    id: string;
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    lastUpdated?: Date;
  },
  clientId: string
): Promise<ContentUpdateSuggestion> {
  console.log('🔍 Analyzing content for updates:', content.title);
  
  // Calculate content age
  const now = new Date();
  const ageInDays = Math.floor(
    (now.getTime() - (content.lastUpdated || content.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Extract text from HTML
  const textContent = content.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(/\s+/).length;
  
  const analysisPrompt = `Je bent een SEO en content optimization expert. Analyseer dit artikel en genereer concrete verbeter suggesties.

ARTIKEL:
Titel: ${content.title}
URL: ${content.url}
Gepubliceerd: ${content.publishedAt.toLocaleDateString('nl-NL')}
Laatst bijgewerkt: ${content.lastUpdated?.toLocaleDateString('nl-NL') || 'Nooit'}
Leeftijd: ${ageInDays} dagen
Woorden: ${wordCount}

CONTENT SAMPLE:
${textContent.substring(0, 2000)}...

Analyseer op:
1. **SEO**: Keywords, meta descriptions, headers, internal linking
2. **Content Quality**: Diepgang, accuraatheid, volledigheid
3. **Readability**: Structuur, paragraaf lengte, bullets/lists
4. **Freshness**: Verouderde informatie, nieuwe trends, statistieken

Return JSON:
{
  "suggestions": [
    {
      "type": "seo" | "content" | "readability" | "freshness",
      "priority": "low" | "medium" | "high",
      "description": "Concrete beschrijving van de verbetering",
      "estimatedImpact": "Verwachte impact op rankings/traffic"
    }
  ],
  "currentScore": {
    "seo": 75,
    "readability": 80,
    "freshness": 60
  },
  "potentialScore": {
    "seo": 90,
    "readability": 85,
    "freshness": 95
  }
}

Geef alleen HIGH priority suggesties die echte impact hebben.`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: analysisPrompt }],
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2000,
    trackUsage: {
      clientId,
      feature: 'autopilot_content_analysis',
    },
  });
  
  const contentStr = response.choices[0]?.message?.content || '{}';
  const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    throw new Error('Failed to parse content analysis');
  }
  
  const analysis = JSON.parse(jsonMatch[0]);
  
  const suggestion: ContentUpdateSuggestion = {
    contentId: content.id,
    title: content.title,
    url: content.url,
    publishedAt: content.publishedAt,
    lastUpdated: content.lastUpdated,
    suggestions: analysis.suggestions || [],
    currentScore: analysis.currentScore || { seo: 70, readability: 70, freshness: 50 },
    potentialScore: analysis.potentialScore || { seo: 85, readability: 80, freshness: 90 },
  };
  
  console.log(`✅ Analysis complete: ${suggestion.suggestions.length} suggestions`);
  
  return suggestion;
}

/**
 * Apply AI updates to content
 */
export async function updateContentWithAI(
  content: string,
  suggestions: ContentUpdateSuggestion['suggestions'],
  clientId: string
): Promise<string> {
  console.log('✨ Applying AI updates to content...');
  
  const updatePrompt = `Je bent een content editor. Update dit artikel op basis van de suggesties.

ORIGINELE CONTENT:
${content}

VERBETER SUGGESTIES:
${suggestions.map((s, i) => `${i + 1}. [${s.type.toUpperCase()}] ${s.description}`).join('\n')}

TAAK:
1. Behoud de originele HTML structuur
2. Implementeer ALLE suggesties
3. Verbeter SEO zonder de leesbaarheid te verminderen
4. Update verouderde informatie met actuele data
5. Voeg extra waarde toe waar mogelijk

Return ALLEEN de updated HTML content (geen uitleg).`;

  const response = await chatCompletion({
    messages: [{ role: 'user', content: updatePrompt }],
    model: 'claude-sonnet-4',
    temperature: 0.4,
    max_tokens: 8000,
    trackUsage: {
      clientId,
      feature: 'autopilot_content_update',
    },
  });
  
  const updatedContent = response.choices[0]?.message?.content || content;
  
  console.log('✅ Content updated');
  
  return updatedContent;
}

/**
 * Bulk analyze multiple content items
 */
export async function bulkAnalyzeContent(
  contents: Array<{
    id: string;
    title: string;
    content: string;
    url: string;
    publishedAt: Date;
    lastUpdated?: Date;
  }>,
  clientId: string
): Promise<ContentUpdateSuggestion[]> {
  console.log(`🔄 Bulk analyzing ${contents.length} content items...`);
  
  const suggestions = await Promise.all(
    contents.map(content => analyzeContentForUpdates(content, clientId))
  );
  
  // Sort by potential impact (high priority first)
  const sorted = suggestions.sort((a, b) => {
    const aHighPriority = a.suggestions.filter(s => s.priority === 'high').length;
    const bHighPriority = b.suggestions.filter(s => s.priority === 'high').length;
    return bHighPriority - aHighPriority;
  });
  
  console.log(`✅ Bulk analysis complete`);
  
  return sorted;
}
