
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion } from '@/lib/aiml-api';

// POST - Gebruik WritgoAI om blog content te genereren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { topic, keywords, tone, targetAudience } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is verplicht' }, { status: 400 });
    }

    // Genereer blog content met WritgoAI
    const prompt = `Schrijf een complete, SEO-geoptimaliseerde blog post over "${topic}".

VERPLICHTE ELEMENTEN:
1. Titel (H1) - pakkend en keyword-rijk
2. Inleiding (150-200 woorden) - hook de lezer
3. Minimaal 4 hoofdsecties met H2 headers
4. Subsecties met H3 headers waar relevant
5. Conclusie (100-150 woorden)
6. Call-to-action (probeer WritgoAI gratis)

SEO VEREISTEN:
${keywords ? `- Focus keywords: ${keywords}` : ''}
- Natuurlijke keyword integratie (geen stuffing)
- Informatieve, waardevolle content
- Leesbare zinnen en alinea's
${targetAudience ? `- Doelgroep: ${targetAudience}` : ''}
${tone ? `- Tone: ${tone}` : '- Tone: professioneel maar toegankelijk'}

CONTENT VEREISTEN:
- Minimaal 1500 woorden
- Gebruik praktische voorbeelden
- Voeg tips en best practices toe
- Schrijf in het Nederlands
- Geen marketing buzzwords of clichés
- Schrijf in HTML formaat met juiste tags (<p>, <h2>, <h3>, etc.)

BELANGRIJK:
- Begin direct met de content (geen markdown formatting)
- Gebruik alleen HTML tags
- Geen introductiezinnen zoals "Hier is je blog post"
- Start met <h1> titel en eindig met conclusie`;

    const response = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o',
      temperature: 0.7,
    });

    let content = response.choices[0]?.message?.content || '';
    
    // Remove any meta-text or markdown before the first HTML tag
    const htmlStart = content.search(/<h1|<p|<div/i);
    if (htmlStart > 0) {
      content = content.substring(htmlStart);
    }
    
    // Remove markdown code blocks if present
    content = content.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');

    // Extract titel uit content
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : topic;

    // Genereer slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Genereer excerpt (eerste 2 paragrafen)
    const paragraphs = content.match(/<p>(.*?)<\/p>/gi) || [];
    const excerpt = paragraphs
      .slice(0, 2)
      .join(' ')
      .replace(/<[^>]*>/g, '')
      .substring(0, 300);

    // Bereken leestijd (gemiddeld 200 woorden per minuut)
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    return NextResponse.json({
      title,
      slug,
      excerpt,
      content,
      readingTimeMinutes,
      metaTitle: title.substring(0, 60),
      metaDescription: excerpt.substring(0, 155),
      focusKeyword: keywords?.split(',')[0]?.trim() || '',
    });
  } catch (error) {
    console.error('Error generating blog content:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
