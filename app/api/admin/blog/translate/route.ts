
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

const languageNames: Record<string, string> = {
  NL: 'Nederlands',
  EN: 'English',
  DE: 'Deutsch',
};

const languageCodes: Record<string, string> = {
  NL: 'nl',
  EN: 'en',
  DE: 'de',
};

export async function POST(req: NextRequest) {
  try {
    const { postId } = await req.json();

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is verplicht' },
        { status: 400 }
      );
    }

    // Haal de originele post op
    const originalPost = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!originalPost) {
      return NextResponse.json(
        { error: 'Blog post niet gevonden' },
        { status: 404 }
      );
    }

    const sourceLanguage = originalPost.language;
    const targetLanguages = ['NL', 'EN', 'DE'].filter((lang) => lang !== sourceLanguage);

    const translatedPosts = [];

    // Vertaal naar elke doeltaal
    for (const targetLang of targetLanguages) {
      try {
        const prompt = `Je bent een professionele vertaler voor blog content. Vertaal de volgende blog post van ${languageNames[sourceLanguage]} naar ${languageNames[targetLang]}.

BELANGRIJK:
- Behoud alle HTML tags en structuur exact
- Vertaal ALLEEN de tekst tussen de HTML tags
- Behoud alle links, afbeeldingen en formatting
- Zorg dat de vertaling natuurlijk klinkt in de doeltaal
- Behoud SEO keywords waar mogelijk
- Gebruik GEEN AI-woorden zoals: "revolutionair", "innovatief", "transformatief", "gamechanger", "next-level", "cutting-edge", "state-of-the-art", etc.

BLOG DETAILS:
Titel: ${originalPost.title}
Excerpt: ${originalPost.excerpt}
Content: ${originalPost.content}
Meta Title: ${originalPost.metaTitle || ''}
Meta Description: ${originalPost.metaDescription || ''}
Focus Keyword: ${originalPost.focusKeyword || ''}
Category: ${originalPost.category}
Tags: ${originalPost.tags.join(', ')}

Geef de vertaling terug in dit exacte JSON formaat:
{
  "title": "vertaalde titel",
  "excerpt": "vertaalde excerpt",
  "content": "vertaalde content met HTML",
  "metaTitle": "vertaalde meta titel",
  "metaDescription": "vertaalde meta beschrijving",
  "focusKeyword": "vertaalde focus keyword",
  "category": "vertaalde categorie",
  "tags": ["tag1", "tag2"]
}`;

        const response = await chatCompletion({
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert vertaler voor blog content. Je behoudt altijd de HTML structuur en vertaalt alleen de tekst. Je output is altijd valide JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: 'claude-sonnet-4-5',
          temperature: 0.3,
          max_tokens: 8000,
        });

        const translatedContent = response || '';
        
        // Parse de JSON response
        let translated;
        try {
          // Probeer de JSON uit de response te halen
          const jsonMatch = translatedContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            translated = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Geen JSON gevonden in response');
          }
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`Kon vertaling niet parsen voor ${targetLang}`);
        }

        // Genereer een unieke slug voor de vertaalde post
        const baseSlug = originalPost.slug.replace(/-nl$|-en$|-de$/i, '');
        const newSlug = `${baseSlug}-${languageCodes[targetLang]}`;

        // Check of deze vertaling al bestaat
        const existingTranslation = await prisma.blogPost.findFirst({
          where: {
            slug: newSlug,
          },
        });

        if (existingTranslation) {
          // Update bestaande vertaling
          const updatedPost = await prisma.blogPost.update({
            where: { id: existingTranslation.id },
            data: {
              title: translated.title,
              excerpt: translated.excerpt,
              content: translated.content,
              metaTitle: translated.metaTitle,
              metaDescription: translated.metaDescription,
              focusKeyword: translated.focusKeyword,
              category: translated.category,
              tags: Array.isArray(translated.tags) ? translated.tags : [],
              language: targetLang as any,
              featuredImage: originalPost.featuredImage, // Gebruik zelfde afbeelding
              status: 'draft', // Zet op draft zodat het gereviewd kan worden
              readingTimeMinutes: originalPost.readingTimeMinutes,
            },
          });
          translatedPosts.push(updatedPost);
        } else {
          // Maak nieuwe vertaling
          const newPost = await prisma.blogPost.create({
            data: {
              title: translated.title,
              slug: newSlug,
              excerpt: translated.excerpt,
              content: translated.content,
              metaTitle: translated.metaTitle,
              metaDescription: translated.metaDescription,
              focusKeyword: translated.focusKeyword,
              category: translated.category,
              tags: Array.isArray(translated.tags) ? translated.tags : [],
              language: targetLang as any,
              featuredImage: originalPost.featuredImage,
              status: 'draft',
              authorId: originalPost.authorId,
              authorName: originalPost.authorName,
              readingTimeMinutes: originalPost.readingTimeMinutes,
            },
          });
          translatedPosts.push(newPost);
        }
      } catch (error: any) {
        console.error(`Fout bij vertalen naar ${targetLang}:`, error);
        // Ga door naar volgende taal als één taal faalt
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Blog post succesvol vertaald naar ${translatedPosts.length} ${translatedPosts.length === 1 ? 'taal' : 'talen'}`,
      translatedPosts: translatedPosts.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        language: post.language,
      })),
    });
  } catch (error: any) {
    console.error('Error in translate endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij vertalen van blog post' },
      { status: 500 }
    );
  }
}
