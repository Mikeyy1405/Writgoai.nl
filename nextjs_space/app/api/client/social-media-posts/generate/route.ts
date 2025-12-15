import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deductCredits } from '@/lib/credits';
import { scrapeWebsite } from '@/lib/website-scraper';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.AIML_API_KEY || 'dummy-key-for-build',
    baseURL: 'https://api.aimlapi.com/v1',
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { ideaId, platforms } = body;

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Get idea and project details
    const idea = await prisma.socialMediaIdea.findUnique({
      where: { id: ideaId },
      include: {
        project: true,
      },
    });

    if (!idea || idea.project.clientId !== client.id) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Check if post already exists for this idea
    const existingPost = await prisma.socialMediaPost.findFirst({
      where: { sourceIdeaId: ideaId },
    });

    if (existingPost) {
      return NextResponse.json({ 
        error: 'Post already generated for this idea',
        post: existingPost 
      }, { status: 400 });
    }

    const project = idea.project;
    const targetPlatforms = platforms || idea.suggestedPlatforms;
    const projectNiche = project.niche || 'algemene onderwerpen';
    const projectLanguage = idea.language || project.language || 'NL';

    console.log(`[Post Generator] Starting for idea: ${idea.title}`);
    console.log(`[Post Generator] Niche: ${projectNiche}`);
    console.log(`[Post Generator] Language: ${projectLanguage}`);

    // Get topic from content plan (if available)
    let contentTopic = null;
    if (idea.topicId) {
      contentTopic = await prisma.socialMediaTopic.findUnique({
        where: { id: idea.topicId },
      });
      console.log(`[Post Generator] ✅ Using content topic: ${contentTopic?.topic}`);
    }

    // Get website content for context (MORE context for better posts)
    let websiteContent = '';
    if (project.websiteUrl) {
      try {
        const websiteData = await scrapeWebsite(project.websiteUrl);
        if (websiteData.success && websiteData.content) {
          websiteContent = websiteData.content.substring(0, 2000); // More context
          console.log(`[Post Generator] ✅ Website content loaded`);
        }
      } catch (error) {
        console.warn('[Post Generator] Website scraping failed:', error);
      }
    }

    // Get recent posts to avoid repetition
    const recentPosts = await prisma.socialMediaPost.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { content: true },
    });

    // Language mapping
    const languageMap: Record<string, string> = {
      'NL': 'Nederlands',
      'EN': 'English',
      'DE': 'Deutsch',
      'FR': 'Français',
      'ES': 'Español',
    };
    const targetLanguageName = languageMap[projectLanguage.toUpperCase()] || 'Nederlands';

    // VEEL MEER CONTEXT uit de idea description en visual idea
    const ideaDescription = idea.description || '';
    const visualIdea = idea.visualIdea || '';
    const contentContext = websiteContent || ideaDescription || '';
    const focusKeyword = contentTopic?.keywords?.[0] || idea.keywords?.[0] || projectNiche;
    const postTopic = contentTopic?.topic || idea.title;
    
    console.log(`[Post Generator] Idea description: ${ideaDescription.substring(0, 100)}...`);
    console.log(`[Post Generator] Visual idea: ${visualIdea}`);

    // Generate social media post text (STRICT EDUCATIONAL ONLY - NO MARKETING)
    const socialTextPrompt = `Je bent een expert die ALLEEN maar vakkennis deelt over het onderwerp: ${projectNiche}.

🚫 ABSOLUTE VERBODEN (JE POST WORDT AFGEKEURD ALS JE DIT DOET):
❌ NOOIT praten over tools, websites, platforms, diensten, apps, software
❌ NOOIT Writgo noemen of naar verwijzen
❌ NOOIT marketing taal gebruiken: "ontdek", "bezoek", "klik", "leer meer"
❌ NOOIT call-to-actions of uitnodigingen
❌ NOOIT links of URLs suggereren
❌ NOOIT promotionele content
❌ NOOIT emoji's zoals 🌟✨💪🚀 (dit zijn marketing emoji's)

✅ JE MAG ALLEEN:
✅ Vakkennis delen over ${projectNiche}
✅ Concrete tips en praktische informatie geven
✅ Uitleggen HOE iets werkt
✅ Problemen identificeren en oplossingen bieden
✅ Voorbeelden uit de praktijk delen
✅ Schrijven alsof je een collega of vriend helpt

HET ONDERWERP VAN DEZE POST:
Titel: ${postTopic}
Beschrijving: ${ideaDescription}
Focus: ${focusKeyword}

${contentTopic ? `Context uit contentplan:
${contentTopic.description}
Keywords: ${contentTopic.keywords?.join(', ')}
` : ''}

${websiteContent ? `Vakkennis context:
${contentContext.substring(0, 1500)}` : ''}

SCHRIJF EEN POST VAN 150-200 WOORDEN DIE:
1. Direct begint met de nuttige informatie
2. Concrete, praktische tips geeft
3. Geschreven is in natuurlijke, heldere taal
4. NULKOMMANUL marketing bevat

VOORBEELDEN VAN GOEDE POSTS:

"Bij yoga is ademhaling de basis. Hier zijn 3 technieken voor beginners:

1. Buikademhaling: Leg je hand op je buik. Adem diep in door je neus en voel je buik opbollen. Adem langzaam uit door je mond. Doe dit 10 keer.

2. Borstademhaling: Plaats je handen op je ribben. Voel ze uitzetten bij inademing. Dit activeert het middelste deel van je longen.

3. Volledige yogaademhaling: Combineer beiden. Begin met buikademhaling, dan borstademhaling, en adem uit in omgekeerde volgorde.

Begin met 5 minuten per dag. Je zult merken dat je kalmeer blijft en meer focus hebt."

"Wanneer is je baby klaar voor vast voedsel? Let op deze 3 signalen:

1. Je baby kan stabiel rechtop zitten zonder ondersteuning. Dit is meestal rond 6 maanden.

2. De tongreflex is verdwenen. Als je een lepel in de mond brengt, duwt de tong het voedsel niet meer automatisch naar buiten.

3. Je baby toont interesse in eten. Kijkt naar je bord, maakt kauwbewegingen, of grijpt naar voedsel.

Begin met gladde groentepuree (wortel, zoete aardappel). Geef kleine beetjes op een babylepel. Dwing niets. De eerste weken gaat het vooral om wennen aan structuren en smaken."

TAAL: ${targetLanguageName}

Schrijf nu de post over "${postTopic}". PUUR INHOUDELIJK. GEEN MARKETING.`;

    console.log('[Post Generator] Generating post text...');
    
    const textResponse = await getOpenAI().chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: socialTextPrompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const socialText = textResponse.choices[0]?.message?.content?.trim() || '';

    // Generate hashtags
    const hashtagPrompt = `Genereer 8-12 relevante hashtags voor deze social media post over: ${postTopic}

Focus keyword: ${focusKeyword}
Niche: ${projectNiche}

Geef een mix van:
- Populaire hashtags (hoge reach)
- Niche hashtags (specifiek publiek)
- Branded hashtags (indien relevant)

FORMAAT (alleen JSON):
{
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", ...]
}`;

    const hashtagResponse = await getOpenAI().chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [{ role: 'user', content: hashtagPrompt }],
      temperature: 0.5,
      max_tokens: 300
    });

    let hashtags: string[] = [];
    try {
      const hashtagText = hashtagResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = hashtagText.match(/\{[\s\S]*\}/);
      const hashtagData = JSON.parse(jsonMatch ? jsonMatch[0] : hashtagText);
      hashtags = hashtagData.hashtags || [];
    } catch (e) {
      console.warn('⚠️ Failed to parse hashtags, using defaults');
      hashtags = ['#' + projectNiche.toLowerCase().replace(/\s+/g, '')];
    }

    // Generate social media image with FLUX-PRO for perfect anatomy
    console.log('[Post Generator] Generating image with FLUX-PRO...');
    
    // Use the visual idea from the content plan
    const baseVisualIdea = visualIdea || 'relevant scene related to the topic';
    
    const socialImagePrompt = `Professional, high-quality photograph: ${baseVisualIdea}

SUBJECT: ${postTopic}
NICHE: ${projectNiche}
DESCRIPTION: ${ideaDescription.substring(0, 200)}

CREATE A REAL, SITUATIONAL IMAGE - SHOW THE ACTUAL SUBJECT:
${projectNiche.toLowerCase().includes('yoga') || projectNiche.toLowerCase().includes('fitness') ? 
  '- Actual yoga pose or exercise being performed\n- Real person with CORRECT ANATOMY (2 arms, 2 legs, normal proportions)\n- Natural lighting, gym or home setting\n- Professional fitness photography' :
  projectNiche.toLowerCase().includes('baby') || projectNiche.toLowerCase().includes('kind') ?
  '- Real parent-child interaction\n- Baby/toddler with CORRECT ANATOMY (normal hands, feet, face)\n- Natural home setting (high chair, table, floor)\n- Warm, authentic family moment' :
  projectNiche.toLowerCase().includes('food') || projectNiche.toLowerCase().includes('recept') || projectNiche.toLowerCase().includes('koken') ?
  '- Real food, ingredients, or finished dish\n- Kitchen setting or plated presentation\n- Natural daylight, appetizing composition\n- Professional food photography' :
  projectNiche.toLowerCase().includes('plant') || projectNiche.toLowerCase().includes('tuin') ?
  '- Actual plants, flowers, or garden scene\n- Close-up botanical detail or outdoor setting\n- Natural colors, proper plant anatomy\n- Professional nature photography' :
  projectNiche.toLowerCase().includes('ai') || projectNiche.toLowerCase().includes('tech') || projectNiche.toLowerCase().includes('marketing') ?
  '- Abstract concept visualization OR workspace WITHOUT screens\n- Clean, modern composition\n- Professional objects (notebook, coffee, desk items)\n- NO computers, phones, tablets, or any electronic screens' :
  '- Real objects, people, or scenes that represent the topic\n- Authentic situation, proper proportions\n- Natural composition and lighting\n- Professional editorial photography'
}

🚫 ABSOLUTE FORBIDDEN (WILL REJECT):
❌ NO computers, laptops, tablets, phones, screens, monitors, TVs, or ANY electronic displays
❌ NO mockups, website screenshots, or interface designs
❌ NO text, logos, brand names, or website names visible in image
❌ NO generic "social media post" imagery or templates
❌ NO anatomical errors: wrong number of fingers/toes, distorted limbs, incorrect body proportions
❌ NO abstract art or illustrations - REAL PHOTOGRAPHY ONLY

✅ MUST HAVE:
✅ Professional photography quality
✅ Correct human anatomy if people are shown (2 arms, 2 legs, 5 fingers per hand, 5 toes per foot)
✅ Natural, realistic lighting
✅ Sharp focus and proper composition
✅ The ACTUAL subject matter (not someone looking at a screen about it)

STYLE: Professional editorial photography, photorealistic, natural lighting, square 1:1 format.

EXAMPLE: For "${postTopic}" - show the REAL thing (yoga pose, baby eating, plant close-up, food dish) NOT a person using a device.`;

    const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-pro', // Better quality and anatomy than SD3
        prompt: socialImagePrompt,
        size: '1024x1024',
        quality: 'hd',
        n: 1
      }),
    });

    let imageUrl: string | null = null;
    let totalCredits = 5; // Base cost for text generation

    if (imageResponse.ok) {
      const imageResult = await imageResponse.json();
      imageUrl = imageResult.data?.[0]?.url || imageResult.choices?.[0]?.message?.content;
      
      if (imageUrl) {
        console.log('[Post Generator] ✅ Image generated with FLUX-PRO');
        totalCredits += 5; // FLUX-PRO cost ($0.05 ≈ 5 credits)
      }
    } else {
      console.warn('[Post Generator] ⚠️ Image generation failed');
      const errorText = await imageResponse.text();
      console.error('[Post Generator] Image error:', errorText);
    }

    // Save post
    const post = await prisma.socialMediaPost.create({
      data: {
        projectId: project.id,
        sourceIdeaId: ideaId,
        platforms: targetPlatforms,
        content: socialText,
        language: projectLanguage,
        contentType: idea.contentType,
        mediaUrl: imageUrl,
        status: 'draft',
        creditsUsed: totalCredits,
      },
    });

    // Update idea status
    await prisma.socialMediaIdea.update({
      where: { id: ideaId },
      data: { status: 'generated' },
    });

    // Update topic usage count
    if (contentTopic) {
      await prisma.socialMediaTopic.update({
        where: { id: contentTopic.id },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
      console.log(`[Post Generator] ✅ Topic usage updated`);
    }

    // Deduct credits
    await deductCredits(
      client.id,
      totalCredits,
      `Social media post voor ${project.name}`
    );

    console.log('[Post Generator] ✅ Complete!');

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        hashtags,
      },
    });
  } catch (error: any) {
    console.error('[Post Generator] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij genereren van post' },
      { status: 500 }
    );
  }
}
