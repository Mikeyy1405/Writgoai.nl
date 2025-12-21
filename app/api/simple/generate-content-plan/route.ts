import { NextResponse } from 'next/server';
import { anthropicClient } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  try {
    const prompt = `Genereer een content plan voor een SEO blog over Google SEO, AI tools, en WordPress.

Maak een lijst van 30 artikel ideeën die zorgen voor topical authority.

Verdeling:
- 40% Google SEO updates en tips
- 30% AI tools voor SEO (ChatGPT, etc)
- 20% WordPress SEO
- 10% Content marketing

Elke artikel moet:
- Praktisch en actionable zijn
- Zoekwoord-geoptimaliseerd
- 1500-2500 woorden waard

Output als JSON array:
[
  {
    "title": "Artikel titel met keyword",
    "category": "Google SEO" | "AI & SEO" | "WordPress" | "Content Marketing",
    "description": "Korte beschrijving wat het artikel behandelt",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
]

Genereer ALLEEN de JSON, geen extra tekst.`;

    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    const content = textContent?.type === 'text' ? textContent.text : '';

    // Parse JSON
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[([\s\S]*)\]/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const articles = JSON.parse(jsonString.trim());

    return NextResponse.json({
      success: true,
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
