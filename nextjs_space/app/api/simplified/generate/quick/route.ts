import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createClient } from '@supabase/supabase-js';
import { generateWritgoPrompt, generateImagePrompt } from '@/lib/writgo-prompt';

export const dynamic = 'force-dynamic';

// ✅ ONLY SUPABASE - NO PRISMA
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * POST /api/simplified/generate/quick
 * Quick Generate - Genereer een volledig artikel met Writgo regels, Flux Pro afbeeldingen, en interne links
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, projectId, toneOfVoice = 'professioneel' } = body;

    if (!keyword?.trim()) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    console.log('[Quick Generate] Starting...');
    console.log('[Quick Generate] Keyword:', keyword);
    console.log('[Quick Generate] Tone:', toneOfVoice);

    // ✅ Haal client op via SUPABASE
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[Quick Generate] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ✅ Optioneel: Haal project op via SUPABASE
    let project = null;
    if (projectId) {
      const { data: projectData, error: projectError } = await supabase
        .from('Project')
        .select('*')
        .eq('id', projectId)
        .eq('clientId', client.id)
        .single();
      
      if (projectData && !projectError) {
        project = projectData;
      }
    }

    // ✅ Haal bestaande artikelen op voor interne links
    const { data: existingArticles } = await supabase
      .from('BlogPost')
      .select('id, title, slug, content')
      .eq('clientId', client.id)
      .eq('status', 'published')
      .limit(20);

    console.log('[Quick Generate] Found', existingArticles?.length || 0, 'existing articles for internal links');

    // STEP 1: Genereer artikel met Writgo prompt
    console.log('[Quick Generate] Generating article with Writgo rules...');

    const writgoPrompt = generateWritgoPrompt(keyword, toneOfVoice);

    const articleResponse = await fetch('https://api.aimlapi.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        messages: [{ role: 'user', content: writgoPrompt }],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!articleResponse.ok) {
      throw new Error(`AIML API error: ${articleResponse.statusText}`);
    }

    const articleData = await articleResponse.json();
    let articleContent = articleData.choices?.[0]?.message?.content || '';

    console.log('[Quick Generate] Article generated, length:', articleContent.length);

    // Clean HTML (remove code blocks if present)
    articleContent = articleContent
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Extract title from H1
    const titleMatch = articleContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : keyword;

    // STEP 2: Genereer afbeeldingen (1 per 500 woorden met Flux Pro)
    console.log('[Quick Generate] Generating images with Flux Pro...');

    const wordCount = articleContent.split(/\s+/).length;
    const imageCount = Math.ceil(wordCount / 500);
    const images: string[] = [];

    // Extract H2 sections voor image context
    const h2Matches = articleContent.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi);
    const sections = Array.from(h2Matches).map(m => m[1].replace(/<[^>]*>/g, '').trim());

    for (let i = 0; i < Math.min(imageCount, 3); i++) {
      const section = sections[i] || keyword;
      const imagePrompt = generateImagePrompt(section, keyword);

      try {
        const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'flux-pro',
            prompt: imagePrompt,
            width: 1024,
            height: 576,
            num_inference_steps: 30
          })
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          const imageUrl = imageData.data?.[0]?.url;
          if (imageUrl) {
            images.push(imageUrl);
            console.log('[Quick Generate] Image', i + 1, 'generated');
          }
        }
      } catch (imageError) {
        console.error('[Quick Generate] Image generation failed:', imageError);
      }
    }

    // STEP 3: Insert afbeeldingen in content
    if (images.length > 0) {
      const paragraphs = articleContent.split('</p>');
      const insertInterval = Math.floor(paragraphs.length / images.length);

      images.forEach((imageUrl, index) => {
        const insertIndex = (index + 1) * insertInterval;
        if (insertIndex < paragraphs.length) {
          paragraphs[insertIndex] += `\n<figure><img src="${imageUrl}" alt="${keyword} - afbeelding ${index + 1}" /><figcaption>Afbeelding ${index + 1}: ${sections[index] || keyword}</figcaption></figure>\n`;
        }
      });

      articleContent = paragraphs.join('</p>');
    }

    // STEP 4: Voeg interne links toe
    let internalLinksCount = 0;
    if (existingArticles && existingArticles.length > 0) {
      // Vind relevante artikelen en voeg links toe
      existingArticles.slice(0, 3).forEach(article => {
        if (article.slug) {
          const linkText = article.title.split(' ').slice(0, 3).join(' ');
          const regex = new RegExp(`\\b${linkText}\\b`, 'i');
          if (regex.test(articleContent)) {
            articleContent = articleContent.replace(
              regex,
              `<a href="/${article.slug}">${linkText}</a>`
            );
            internalLinksCount++;
          }
        }
      });
    }

    console.log('[Quick Generate] Added', internalLinksCount, 'internal links');

    // STEP 5: Sla artikel op
    console.log('[Quick Generate] Saving article...');

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { data: blogPost, error: blogPostError } = await supabase
      .from('BlogPost')
      .insert({
        title,
        slug,
        content: articleContent,
        status: 'draft',
        clientId: client.id,
        projectId: project?.id || null,
        seoKeywords: keyword,
        metadata: {
          generatedBy: 'quick-generate-writgo',
          keyword,
          toneOfVoice,
          wordCount,
          imageCount: images.length,
          images,
          internalLinksCount,
          writgoRules: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (blogPostError || !blogPost) {
      console.error('[Quick Generate] Failed to save blog post:', blogPostError);
      return NextResponse.json(
        { 
          error: 'Failed to save article',
          details: blogPostError?.message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log('[Quick Generate] ✅ SUCCESS! Article saved:', blogPost.id);

    return NextResponse.json({
      success: true,
      article: {
        id: blogPost.id,
        title,
        slug,
        content: articleContent,
        keyword,
        wordCount,
        imageCount: images.length,
        images,
        internalLinksCount,
      },
      message: '✅ Artikel succesvol gegenereerd met Writgo regels!'
    });

  } catch (error: any) {
    console.error('[Quick Generate] ERROR:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate article',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
