import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface GeneratePostRequest {
  project_id: string;
  topic?: string;
  article_id?: string;
  post_type: 'storytelling' | 'educational' | 'promotional' | 'engagement' | 'behind_the_scenes';
  platforms: string[];
  language?: string;
  niche?: string;
  website_url?: string;
}

const POST_TYPE_INSTRUCTIONS: Record<string, { nl: string; en: string }> = {
  storytelling: {
    nl: `Schrijf een STORYTELLING post:
- Begin met een persoonlijke anekdote of herkenbare situatie
- Neem de lezer mee in een verhaal
- Eindig met een les of inzicht
- Gebruik emotie en beeldspraak
- Wees authentiek en menselijk`,
    en: `Write a STORYTELLING post:
- Start with a personal anecdote or relatable situation
- Take the reader on a journey
- End with a lesson or insight
- Use emotion and imagery
- Be authentic and human`,
  },
  educational: {
    nl: `Schrijf een EDUCATIEVE post:
- Deel waardevolle kennis of tips
- Gebruik bullet points of genummerde lijsten
- Maak het praktisch en direct toepasbaar
- Eindig met een call-to-action om te bewaren of delen`,
    en: `Write an EDUCATIONAL post:
- Share valuable knowledge or tips
- Use bullet points or numbered lists
- Make it practical and actionable
- End with a call-to-action to save or share`,
  },
  promotional: {
    nl: `Schrijf een PROMOTIONELE post:
- Highlight de voordelen, niet de features
- Gebruik social proof of resultaten
- Creëer urgentie of schaarste
- Duidelijke call-to-action`,
    en: `Write a PROMOTIONAL post:
- Highlight benefits, not features
- Use social proof or results
- Create urgency or scarcity
- Clear call-to-action`,
  },
  engagement: {
    nl: `Schrijf een ENGAGEMENT post:
- Stel een vraag aan je publiek
- Vraag om meningen of ervaringen
- Maak het makkelijk om te reageren
- Wees nieuwsgierig en open`,
    en: `Write an ENGAGEMENT post:
- Ask a question to your audience
- Request opinions or experiences
- Make it easy to respond
- Be curious and open`,
  },
  behind_the_scenes: {
    nl: `Schrijf een BEHIND THE SCENES post:
- Laat de menselijke kant zien
- Deel het proces of de struggle
- Wees transparant en eerlijk
- Maak het persoonlijk`,
    en: `Write a BEHIND THE SCENES post:
- Show the human side
- Share the process or struggle
- Be transparent and honest
- Make it personal`,
  },
};

const PLATFORM_LIMITS: Record<string, { chars: number; hashtags: number }> = {
  twitter: { chars: 280, hashtags: 2 },
  instagram: { chars: 2200, hashtags: 15 },
  facebook: { chars: 63206, hashtags: 3 },
  linkedin: { chars: 3000, hashtags: 5 },
  tiktok: { chars: 2200, hashtags: 5 },
  threads: { chars: 500, hashtags: 3 },
  bluesky: { chars: 300, hashtags: 2 },
};

export async function POST(request: Request) {
  try {
    const body: GeneratePostRequest = await request.json();
    const { 
      project_id, 
      topic, 
      article_id, 
      post_type = 'storytelling', 
      platforms = ['instagram'],
      language = 'nl',
      niche = '',
      website_url = '',
    } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get article content if article_id is provided
    let articleContent = '';
    let articleTitle = '';
    if (article_id) {
      const { data: article } = await supabaseAdmin
        .from('articles')
        .select('title, content')
        .eq('id', article_id)
        .single();
      
      if (article) {
        articleTitle = article.title;
        // Strip HTML and get first 1000 chars
        articleContent = article.content
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1000);
      }
    }

    const isNL = language === 'nl';
    const postTypeInstructions = POST_TYPE_INSTRUCTIONS[post_type]?.[isNL ? 'nl' : 'en'] || POST_TYPE_INSTRUCTIONS.storytelling[isNL ? 'nl' : 'en'];

    // Get the most restrictive platform limit
    const mainPlatform = platforms[0] || 'instagram';
    const charLimit = PLATFORM_LIMITS[mainPlatform]?.chars || 2200;
    const hashtagLimit = PLATFORM_LIMITS[mainPlatform]?.hashtags || 5;

    const prompt = `${isNL ? 'Schrijf' : 'Write'} een social media post ${isNL ? 'voor' : 'for'} ${mainPlatform}.

${postTypeInstructions}

${isNL ? 'CONTEXT' : 'CONTEXT'}:
- Niche: ${niche || 'Algemeen'}
- Website: ${website_url || 'N/A'}
${topic ? `- Topic: ${topic}` : ''}
${articleTitle ? `- Artikel: ${articleTitle}` : ''}
${articleContent ? `- Artikel samenvatting: ${articleContent.slice(0, 500)}...` : ''}

${isNL ? 'REGELS' : 'RULES'}:
- ${isNL ? 'Maximaal' : 'Maximum'} ${charLimit} ${isNL ? 'karakters' : 'characters'}
- ${isNL ? 'Maximaal' : 'Maximum'} ${hashtagLimit} hashtags
- ${isNL ? 'Geen emoji spam, max 3-5 relevante emoji\'s' : 'No emoji spam, max 3-5 relevant emojis'}
- ${isNL ? 'Gebruik witregels voor leesbaarheid' : 'Use line breaks for readability'}
- ${isNL ? 'GEEN links in de tekst (die komen in bio/comments)' : 'NO links in text (those go in bio/comments)'}
- ${isNL ? 'Schrijf in het Nederlands, informeel (je/jij)' : 'Write in English'}
- ${isNL ? 'GEEN markdown formatting zoals **bold** of *italic* - gebruik gewoon plain text' : 'NO markdown formatting like **bold** or *italic* - use plain text only'}

${isNL ? 'VERBODEN WOORDEN' : 'FORBIDDEN WORDS'}: cruciaal, essentieel, kortom, duiken, jungle, gids, onmisbaar, onthullen, geheim, ultieme

Output ALLEEN de post tekst als plain text, geen markdown, geen uitleg of extra tekst.`;

    const postContent = await generateAICompletion({
      task: 'content',
      systemPrompt: isNL 
        ? 'Je bent een social media expert. Schrijf engaging posts in het Nederlands.'
        : 'You are a social media expert. Write engaging posts.',
      userPrompt: prompt,
      maxTokens: 1000,
      temperature: 0.8,
    });

    // Clean up the response - remove markdown and formatting
    let cleanedPost = postContent
      .replace(/^["']|["']$/g, '')
      .replace(/^(Post:|Caption:|Tekst:)/i, '')
      // Remove markdown bold
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      // Remove markdown italic
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown code blocks
      .replace(/```[^`]*```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .trim();

    // Generate image prompt based on post content
    const imagePromptRequest = `${isNL ? 'Beschrijf' : 'Describe'} een ${isNL ? 'perfecte' : 'perfect'} social media ${isNL ? 'afbeelding voor deze post' : 'image for this post'}:

"${cleanedPost.slice(0, 300)}"

${isNL ? 'Geef een korte, visuele beschrijving (max 100 woorden) voor een AI image generator. Focus op:' : 'Give a short, visual description (max 100 words) for an AI image generator. Focus on:'}
- ${isNL ? 'Kleuren en sfeer' : 'Colors and mood'}
- ${isNL ? 'Compositie' : 'Composition'}
- ${isNL ? 'Onderwerp/scene' : 'Subject/scene'}
- ${isNL ? 'Stijl (fotorealistisch, illustratie, etc.)' : 'Style (photorealistic, illustration, etc.)'}

${isNL ? 'GEEN tekst in de afbeelding!' : 'NO text in the image!'}`;

    const imagePrompt = await generateAICompletion({
      task: 'content',
      systemPrompt: 'Generate concise image prompts for AI image generation.',
      userPrompt: imagePromptRequest,
      maxTokens: 200,
      temperature: 0.7,
    });

    // Generate the image
    let imageUrl = '';
    try {
      const generatedImage = await generateFeaturedImage(
        topic || articleTitle || cleanedPost.slice(0, 50),
        imagePrompt.slice(0, 500)
      );
      imageUrl = generatedImage || '';
    } catch (e) {
      console.warn('Image generation failed:', e);
    }

    // Save to database
    const { data: savedPost, error: saveError } = await supabaseAdmin
      .from('social_posts')
      .insert({
        project_id,
        content: cleanedPost,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        post_type,
        platforms: platforms.map(p => ({ platform: p })),
        status: 'draft',
        article_id: article_id || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save post:', saveError);
    }

    return NextResponse.json({
      success: true,
      post: {
        id: savedPost?.id,
        content: cleanedPost,
        image_url: imageUrl,
        image_prompt: imagePrompt,
        post_type,
        platforms,
        status: 'draft',
      },
    });
  } catch (error: any) {
    console.error('Generate post error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// List posts for a project
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const status = searchParams.get('status');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('social_posts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: posts, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (error: any) {
    console.error('List posts error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
