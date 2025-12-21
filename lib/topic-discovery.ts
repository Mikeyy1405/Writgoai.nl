/**
 * Topic Discovery System
 * Uses Google Trends + AI to find relevant article topics
 */

import { generateAICompletion } from './ai-client';

// Core topics for WritGo
const CORE_TOPICS = [
  'Google SEO updates',
  'AI tools for SEO',
  'WordPress SEO',
  'Content marketing',
  'ChatGPT for content',
  'Technical SEO',
  'Link building',
  'Keyword research'
];

interface TopicIdea {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  trending: boolean;
  searchVolume: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Discover trending topics using AI
 */
export async function discoverTopics(count: number = 5): Promise<TopicIdea[]> {
  const prompt = `Je bent een SEO content strategist voor WritGo.nl, een Nederlands AI-powered SEO platform.

Genereer ${count} actuele, trending artikel onderwerpen over:
- Google SEO updates en algoritme wijzigingen
- AI tools voor SEO en content (ChatGPT, Claude, Gemini)
- WordPress SEO optimalisatie
- Content marketing strategieën
- Technical SEO best practices

Vereisten:
- Onderwerpen moeten ACTUEEL zijn (december 2024)
- Focus op Nederlandse markt
- Praktisch en actionable
- Geschikt voor 2500+ woorden artikel
- Hoog zoekvolume potentieel

Geef ALLEEN een JSON array terug, geen extra tekst:
[
  {
    "title": "Exacte artikel titel in Nederlands",
    "description": "Korte beschrijving (1-2 zinnen)",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "category": "Google SEO" of "AI & SEO" of "WordPress SEO" of "Content Marketing",
    "trending": true of false,
    "searchVolume": "high" of "medium" of "low",
    "reason": "Waarom dit onderwerp nu relevant is"
  }
]`;

  try {
    const response = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een SEO content strategist die trending onderwerpen identificeert.',
      userPrompt: prompt,
      maxTokens: 2000,
      temperature: 0.8, // Higher temperature for creativity
    });

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in response');
    }

    const topics: TopicIdea[] = JSON.parse(jsonMatch[0]);
    return topics;
  } catch (error) {
    console.error('Error discovering topics:', error);
    // Fallback to predefined topics
    return getFallbackTopics(count);
  }
}

/**
 * Get fallback topics if AI fails
 */
function getFallbackTopics(count: number): TopicIdea[] {
  const fallbacks: TopicIdea[] = [
    {
      title: 'Google Core Update December 2024: Complete Gids voor WordPress Sites',
      description: 'Alles over de nieuwste Google algoritme update en hoe je jouw WordPress site optimaliseert.',
      keywords: ['google core update', 'seo 2024', 'wordpress seo'],
      category: 'Google SEO',
      trending: true,
      searchVolume: 'high',
      reason: 'Google core updates zijn altijd relevant en krijgen veel zoekverkeer'
    },
    {
      title: 'ChatGPT voor SEO Content: 10 Praktische Prompts die Werken',
      description: 'Ontdek hoe je ChatGPT effectief inzet voor SEO-geoptimaliseerde content creatie.',
      keywords: ['chatgpt seo', 'ai content', 'seo prompts'],
      category: 'AI & SEO',
      trending: true,
      searchVolume: 'high',
      reason: 'AI tools voor SEO zijn momenteel zeer populair'
    },
    {
      title: 'WordPress SEO Checklist 2025: 50 Essentiële Stappen',
      description: 'Complete WordPress SEO checklist om jouw site naar de top van Google te krijgen.',
      keywords: ['wordpress seo', 'seo checklist', 'wordpress optimalisatie'],
      category: 'WordPress SEO',
      trending: false,
      searchVolume: 'high',
      reason: 'Evergreen content met consistent zoekvolume'
    },
    {
      title: 'E-E-A-T in 2025: Hoe Google Expertise en Autoriteit Beoordeelt',
      description: 'Begrijp Google\'s E-E-A-T criteria en verbeter je content kwaliteit.',
      keywords: ['e-e-a-t', 'google ranking', 'content kwaliteit'],
      category: 'Google SEO',
      trending: true,
      searchVolume: 'medium',
      reason: 'E-E-A-T wordt steeds belangrijker voor rankings'
    },
    {
      title: 'AI Overview Optimalisatie: Rank in Google\'s AI Zoekresultaten',
      description: 'Leer hoe je content optimaliseert voor Google\'s nieuwe AI-powered zoekresultaten.',
      keywords: ['ai overview', 'google ai', 'seo 2025'],
      category: 'AI & SEO',
      trending: true,
      searchVolume: 'medium',
      reason: 'Google AI Overview is een nieuwe feature met veel interesse'
    }
  ];

  return fallbacks.slice(0, count);
}

/**
 * Generate a single topic on demand
 */
export async function generateSingleTopic(category?: string): Promise<TopicIdea> {
  const topics = await discoverTopics(1);
  return topics[0];
}

/**
 * Get topics for specific category
 */
export async function getTopicsByCategory(
  category: string,
  count: number = 3
): Promise<TopicIdea[]> {
  const allTopics = await discoverTopics(10);
  return allTopics
    .filter(t => t.category === category)
    .slice(0, count);
}

/**
 * Validate if topic is good for article generation
 */
export function validateTopic(topic: TopicIdea): {
  valid: boolean;
  reason: string;
} {
  // Check title length
  if (topic.title.length < 20 || topic.title.length > 100) {
    return {
      valid: false,
      reason: 'Title must be between 20-100 characters'
    };
  }

  // Check keywords
  if (!topic.keywords || topic.keywords.length < 2) {
    return {
      valid: false,
      reason: 'At least 2 keywords required'
    };
  }

  // Check category
  const validCategories = ['Google SEO', 'AI & SEO', 'WordPress SEO', 'Content Marketing', 'Technical SEO'];
  if (!validCategories.includes(topic.category)) {
    return {
      valid: false,
      reason: 'Invalid category'
    };
  }

  return {
    valid: true,
    reason: 'Topic is valid'
  };
}
