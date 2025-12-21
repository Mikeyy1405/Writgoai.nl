import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { anthropicClient } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { title, category, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate article with AI
    const prompt = `Schrijf een volledig SEO-geoptimaliseerd artikel over: "${title}"

Categorie: ${category}
Context: ${description}

Vereisten:
- 1500-2500 woorden
- SEO-geoptimaliseerd
- Praktisch en actionable
- Nederlandse taal
- Professionele tone
- Gebruik headers (H2, H3)
- Voeg voorbeelden toe
- Eindig met conclusie

Genereer ALLEEN de HTML content (zonder <html>, <head>, <body> tags).
Begin met een intro paragraaf, gebruik <h2> voor secties, <p> voor tekst.`;

    const message = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === 'text');
    let content = textContent?.type === 'text' ? textContent.text : '';

    // Clean up
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    // Generate excerpt
    const excerptMatch = content.match(/<p>(.*?)<\/p>/);
    const excerpt = excerptMatch ? excerptMatch[1].substring(0, 160) + '...' : description;

    // Create slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Publish directly
    const { data: article, error: publishError } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        content,
        excerpt,
        featured_image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=630&fit=crop',
        status: 'published',
        published_at: new Date().toISOString(),
        meta_title: title,
        meta_description: excerpt,
        content_type: 'supporting',
        metadata: {
          category,
          generated_at: new Date().toISOString(),
          word_count: content.split(' ').length,
          method: 'simple_generator'
        }
      })
      .select()
      .single();

    if (publishError) {
      throw publishError;
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        url: `https://writgo.nl/${article.slug}`,
        word_count: content.split(' ').length
      }
    });

  } catch (error: any) {
    console.error('Generate and publish error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
