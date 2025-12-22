/**
 * Topic Discovery System
 * Uses AI to find relevant article topics
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

// Get current date info for dynamic prompts
function getCurrentDateInfo() {
  const now = new Date();
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 
                  'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  return {
    month: months[now.getMonth()],
    year: now.getFullYear(),
    nextYear: now.getFullYear() + 1,
    fullDate: now.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  };
}

/**
 * Discover trending topics using AI
 */
export async function discoverTopics(count: number = 5): Promise<TopicIdea[]> {
  const dateInfo = getCurrentDateInfo();
  
  const prompt = `Je bent een SEO content strategist voor WritGo.nl, een Nederlands AI-powered SEO platform.

Huidige datum: ${dateInfo.fullDate}

Genereer ${count} actuele, trending artikel onderwerpen over:
- Google SEO updates en algoritme wijzigingen
- AI tools voor SEO en content (ChatGPT, Claude, Gemini)
- WordPress SEO optimalisatie
- Content marketing strategieën
- Technical SEO best practices

Vereisten:
- Onderwerpen moeten ACTUEEL zijn (${dateInfo.month} ${dateInfo.year})
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
      systemPrompt: 'Je bent een SEO content strategist die trending onderwerpen identificeert. Geef alleen valide JSON terug.',
      userPrompt: prompt,
      maxTokens: 2000,
      temperature: 0.8, // Higher temperature for creativity
    });

    // Parse JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('No JSON array found in response, using fallback');
      return getFallbackTopics(count);
    }

    const topics: TopicIdea[] = JSON.parse(jsonMatch[0]);
    
    // Validate topics
    const validTopics = topics.filter(topic => 
      topic.title && 
      topic.description && 
      topic.keywords && 
      topic.keywords.length > 0
    );

    if (validTopics.length === 0) {
      return getFallbackTopics(count);
    }

    return validTopics.slice(0, count);
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
  const dateInfo = getCurrentDateInfo();
  
  const fallbacks: TopicIdea[] = [
    {
      title: `Google Core Update ${dateInfo.month} ${dateInfo.year}: Complete Gids voor WordPress Sites`,
      description: 'Alles over de nieuwste Google algoritme update en hoe je jouw WordPress site optimaliseert.',
      keywords: ['google core update', `seo ${dateInfo.year}`, 'wordpress seo'],
      category: 'Google SEO',
      trending: true,
      searchVolume: 'high',
      reason: 'Google core updates zijn altijd relevant en krijgen veel zoekverkeer'
    },
    {
      title: `ChatGPT voor SEO Content in ${dateInfo.year}: 10 Praktische Prompts die Werken`,
      description: 'Ontdek hoe je ChatGPT effectief inzet voor SEO-geoptimaliseerde content creatie.',
      keywords: ['chatgpt seo', 'ai content', 'seo prompts'],
      category: 'AI & SEO',
      trending: true,
      searchVolume: 'high',
      reason: 'AI tools voor SEO zijn momenteel zeer populair'
    },
    {
      title: `WordPress SEO Checklist ${dateInfo.nextYear}: 50 Essentiële Stappen`,
      description: 'Complete WordPress SEO checklist om jouw site naar de top van Google te krijgen.',
      keywords: ['wordpress seo', 'seo checklist', 'wordpress optimalisatie'],
      category: 'WordPress SEO',
      trending: false,
      searchVolume: 'high',
      reason: 'Evergreen content met consistent zoekvolume'
    },
    {
      title: `E-E-A-T in ${dateInfo.nextYear}: Hoe Google Expertise en Autoriteit Beoordeelt`,
      description: 'Begrijp Google\'s E-E-A-T criteria en verbeter je content kwaliteit.',
      keywords: ['e-e-a-t', 'google ranking', 'content kwaliteit'],
      category: 'Google SEO',
      trending: true,
      searchVolume: 'medium',
      reason: 'E-E-A-T wordt steeds belangrijker voor rankings'
    },
    {
      title: `AI Overview Optimalisatie: Rank in Google's AI Zoekresultaten ${dateInfo.year}`,
      description: 'Leer hoe je content optimaliseert voor Google\'s nieuwe AI-powered zoekresultaten.',
      keywords: ['ai overview', 'google ai', `seo ${dateInfo.nextYear}`],
      category: 'AI & SEO',
      trending: true,
      searchVolume: 'medium',
      reason: 'Google AI Overview is een nieuwe feature met veel interesse'
    },
    {
      title: `Content Marketing Trends ${dateInfo.nextYear}: Wat Werkt en Wat Niet`,
      description: 'De belangrijkste content marketing trends voor het komende jaar.',
      keywords: ['content marketing', `trends ${dateInfo.nextYear}`, 'content strategie'],
      category: 'Content Marketing',
      trending: true,
      searchVolume: 'high',
      reason: 'Jaarlijkse trends artikelen presteren altijd goed'
    },
    {
      title: `Technical SEO Audit: Complete Handleiding voor ${dateInfo.year}`,
      description: 'Stap-voor-stap handleiding voor een grondige technical SEO audit.',
      keywords: ['technical seo', 'seo audit', 'website optimalisatie'],
      category: 'Google SEO',
      trending: false,
      searchVolume: 'high',
      reason: 'Evergreen content met praktische waarde'
    },
    {
      title: `Claude AI vs ChatGPT voor SEO: Welke is Beter in ${dateInfo.year}?`,
      description: 'Vergelijking van de beste AI tools voor SEO content creatie.',
      keywords: ['claude ai', 'chatgpt', 'ai vergelijking'],
      category: 'AI & SEO',
      trending: true,
      searchVolume: 'medium',
      reason: 'Vergelijkingsartikelen presteren goed in zoekresultaten'
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
