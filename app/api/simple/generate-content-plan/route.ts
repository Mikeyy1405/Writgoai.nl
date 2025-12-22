import { NextResponse } from 'next/server';
import { anthropicClient } from '@/lib/ai-client';

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

    // Step 1: AI analyzes website to detect niche
    const nichePrompt = `Analyseer deze website URL en bepaal de niche/onderwerp:

Website: ${website_url}

Geef een korte, specifieke niche beschrijving (max 5 woorden).
Bijvoorbeeld: "WordPress SEO", "AI Marketing Tools", "E-commerce Growth", etc.

Antwoord ALLEEN met de niche, geen extra tekst.`;

    const nicheMessage = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: nichePrompt,
        },
      ],
    });

    const nicheContent = nicheMessage.content.find((block) => block.type === 'text');
    const niche = nicheContent?.type === 'text' ? nicheContent.text.trim() : 'SEO & Content Marketing';

    // Step 2: Generate content plan based on detected niche
    const contentPrompt = `Genereer een content plan voor een SEO blog over: ${niche}

Website: ${website_url}

Maak een lijst van 30 artikel ideeën die zorgen voor topical authority in deze niche.

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

Output als JSON array:
[
  {
    "title": "Artikel titel met keyword",
    "category": "Kies een relevante categorie voor ${niche}",
    "description": "Korte beschrijving wat het artikel behandelt",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Genereer ALLEEN de JSON, geen extra tekst.`;

    const contentMessage = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: contentPrompt,
        },
      ],
    });

    const textContent = contentMessage.content.find((block) => block.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : '';

    // Parse JSON
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[([\s\S]*)\]/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const articles = JSON.parse(jsonString.trim());

    return NextResponse.json({
      success: true,
      niche: niche,
      plan: articles,
      count: articles.length
    });

  } catch (error: any) {
    console.error('Content plan error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
