import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { website_url } = await request.json();

    if (!website_url) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Get current date dynamically
    const now = new Date();
    const currentMonth = now.toLocaleString('nl-NL', { month: 'long' });
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;

    // Step 1: AI analyzes website to detect niche
    const nichePrompt = `Analyseer deze website URL en bepaal de niche/onderwerp:

Website: ${website_url}

Geef een korte, specifieke niche beschrijving (max 5 woorden).
Bijvoorbeeld: "WordPress SEO", "AI Marketing Tools", "E-commerce Growth", etc.

Antwoord ALLEEN met de niche, geen extra tekst.`;

    let niche = 'SEO & Content Marketing'; // Default fallback
    
    try {
      const nicheResponse = await generateAICompletion({
        task: 'quick',
        systemPrompt: 'Je bent een expert in het identificeren van website niches. Geef alleen de niche terug, geen extra tekst.',
        userPrompt: nichePrompt,
        maxTokens: 100,
        temperature: 0.5,
      });
      
      niche = nicheResponse.trim().replace(/['"]/g, '') || niche;
    } catch (nicheError) {
      console.warn('Niche detection failed, using default:', nicheError);
    }

    // Step 2: Generate content plan based on detected niche
    const contentPrompt = `Huidige datum: ${currentMonth} ${currentYear}

Genereer een ACTUEEL content plan voor een SEO blog over: ${niche}

Website: ${website_url}

Maak een lijst van 30 artikel ideeën die zorgen voor topical authority in deze niche.

BELANGRIJK:
- Focus op ${currentYear}-${nextYear} trends en ontwikkelingen
- Gebruik actuele voorbeelden en updates uit ${currentYear}
- Vermijd verouderde informatie uit vorige jaren
- Denk aan toekomstige ontwikkelingen voor ${nextYear}

Verdeling:
- 40% Core niche topics (hoofdonderwerp)
- 30% Related tools en technieken
- 20% Practical how-to guides
- 10% Industry trends en updates

Elke artikel moet:
- Praktisch en actionable zijn
- Zoekwoord-geoptimaliseerd
- 1500-2500 woorden waard
- Relevant voor de niche: ${niche}

Output als JSON array (ALLEEN de array, geen markdown code blocks):
[
  {
    "title": "Artikel titel met keyword",
    "category": "Kies een relevante categorie voor ${niche}",
    "description": "Korte beschrijving wat het artikel behandelt",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]`;

    const contentResponse = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Je bent een SEO content strategist. Genereer alleen valide JSON arrays zonder markdown formatting.',
      userPrompt: contentPrompt,
      maxTokens: 4000,
      temperature: 0.7,
    });

    // Parse JSON with multiple fallback patterns
    let articles = [];
    
    try {
      // Try to find JSON array in response
      const jsonMatch = contentResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        contentResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                        contentResponse.match(/\[([\s\S]*)\]/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0];
        articles = JSON.parse(jsonString.trim());
      } else {
        // Try parsing the entire response as JSON
        articles = JSON.parse(contentResponse.trim());
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', contentResponse.substring(0, 500));
      
      // Return fallback content plan
      articles = generateFallbackPlan(niche, currentYear, nextYear);
    }

    // Validate and clean articles
    const validArticles = articles
      .filter((article: any) => 
        article && 
        article.title && 
        article.description && 
        article.keywords && 
        Array.isArray(article.keywords)
      )
      .map((article: any) => ({
        title: article.title,
        category: article.category || niche,
        description: article.description,
        keywords: article.keywords.slice(0, 5) // Limit to 5 keywords
      }));

    if (validArticles.length === 0) {
      // Use fallback if no valid articles
      articles = generateFallbackPlan(niche, currentYear, nextYear);
    }

    return NextResponse.json({
      success: true,
      niche: niche,
      plan: validArticles.length > 0 ? validArticles : articles,
      count: validArticles.length > 0 ? validArticles.length : articles.length
    });

  } catch (error: any) {
    console.error('Content plan error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}

// Fallback content plan generator
function generateFallbackPlan(niche: string, currentYear: number, nextYear: number) {
  const baseTopics = [
    { suffix: 'Complete Gids', category: 'Guides' },
    { suffix: 'Best Practices', category: 'Best Practices' },
    { suffix: 'Tips en Tricks', category: 'Tips' },
    { suffix: 'Beginners Handleiding', category: 'Beginners' },
    { suffix: 'Geavanceerde Strategieën', category: 'Advanced' },
    { suffix: 'Tools Vergelijking', category: 'Tools' },
    { suffix: 'Case Studies', category: 'Case Studies' },
    { suffix: 'Trends', category: 'Trends' },
    { suffix: 'Checklist', category: 'Checklists' },
    { suffix: 'Fouten om te Vermijden', category: 'Mistakes' },
  ];

  return baseTopics.map((topic, index) => ({
    title: `${niche} ${topic.suffix} ${nextYear}`,
    category: topic.category,
    description: `Uitgebreide gids over ${niche.toLowerCase()} ${topic.suffix.toLowerCase()} voor ${nextYear}.`,
    keywords: [
      niche.toLowerCase().replace(/\s+/g, ' '),
      topic.suffix.toLowerCase(),
      `${currentYear}`,
      `${nextYear}`
    ]
  }));
}
