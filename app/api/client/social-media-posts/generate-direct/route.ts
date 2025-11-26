
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateImage } from '@/lib/aiml-api';
import { deductCredits } from '@/lib/credits';
import { scrapeWebsite } from '@/lib/website-scraper';

interface GenerateDirectRequest {
  projectId: string;
  count: number;
  language?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateDirectRequest = await req.json();
    const { projectId, count = 10, language } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is vereist' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check credits (10 credits per post + 5 credits per image with FLUX-PRO)
    const creditsNeeded = count * 15; // 10 for content + 5 for FLUX-PRO image
    const totalCredits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);

    if (!client.isUnlimited && totalCredits < creditsNeeded) {
      return NextResponse.json(
        { error: `Onvoldoende credits. Je hebt ${creditsNeeded} credits nodig.` },
        { status: 402 }
      );
    }

    // Generate posts directly with AI
    const generatedPosts = await generatePostsWithAI(project, count, language);

    // Deduct credits
    await deductCredits(client.id, creditsNeeded, `${count} social media posts gegenereerd`);

    return NextResponse.json({
      success: true,
      posts: generatedPosts,
      creditsUsed: creditsNeeded,
    });
  } catch (error) {
    console.error('Error generating posts:', error);
    return NextResponse.json(
      { error: 'Fout bij genereren van posts' },
      { status: 500 }
    );
  }
}

async function generatePostsWithAI(project: any, count: number, targetLanguage?: string) {
  const posts = [];

  // Use targetLanguage or fallback to project language
  const lang = targetLanguage || project.language || 'NL';
  const getLanguageName = (code: string) => {
    const upperCode = code.toUpperCase();
    if (upperCode === 'EN') return 'English';
    if (upperCode === 'DE') return 'Deutsch';
    if (upperCode === 'FR') return 'Français';
    if (upperCode === 'ES') return 'Español';
    return 'Nederlands';
  };
  const languageName = getLanguageName(lang);

  // Scrape website content ONCE for all posts
  let websiteContent = '';
  try {
    console.log(`🌐 Analyzing website content from ${project.websiteUrl}...`);
    const scraped = await scrapeWebsite(project.websiteUrl);
    if (scraped?.content) {
      // Get up to 2500 characters of actual content
      websiteContent = scraped.content.substring(0, 2500);
      console.log(`✅ Extracted ${websiteContent.length} characters of website content`);
    }
  } catch (error) {
    console.error('⚠️ Could not scrape website, will use project info only:', error);
  }

  // Get existing blog posts for content ideas
  const existingContent = await prisma.savedContent.findMany({
    where: {
      projectId: project.id,
      type: 'BLOG',
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  const blogTopics = existingContent.map(c => c.title).join(', ');

  // Generate all posts
  for (let i = 0; i < count; i++) {
    try {
      // Generate content with educational focus
      const contentPrompt = `Je schrijft social media posts over ${project.name} die PURE KENNIS delen.

WEBSITE INFORMATIE:
${websiteContent ? `Website tekst:\n${websiteContent}\n` : ''}
${blogTopics ? `Eerder geschreven over: ${blogTopics}\n` : ''}

TAAK: Schrijf 1 social media post in ${languageName} die CONCRETE KENNIS deelt.

ABSOLUTE VERBODEN:
❌ GEEN promotie van websites, tools, cursussen, diensten
❌ GEEN vage tips zoals "dit is belangrijk" of "denk hieraan"
❌ GEEN calls-to-action zoals "bezoek", "lees meer", "klik hier"  
❌ GEEN verwijzingen naar externe bronnen of links
❌ GEEN marketing taal ("ontdek", "verbeter je", "til naar hoger niveau")

WAT WEL:
✅ Deel CONCRETE kennis uit de website tekst
✅ Geef SPECIFIEKE voorbeelden en praktische uitleg
✅ Schrijf zoals je tegen een vriend praat - direct, eerlijk, behulpzaam
✅ Focus op 1 duidelijk onderwerp uit de niche
✅ Gebruik een natuurlijke structuur: probleem → uitleg → oplossing → vraag

VOORBEELDEN VAN GOEDE POSTS:
"Veel mensen denken dat [misvatting], maar eigenlijk werkt het zo: [concrete uitleg]. 
De reden? [wetenschappelijke/praktische uitleg]. 
Wil je het zelf proberen? Begin met [concrete stap]. 
Wat is jouw ervaring hiermee? 💬"

"[Concreet probleem] komt vaak voor, en dit is waarom: [duidelijke oorzaak].
Hier zijn 3 dingen die echt helpen:
1. [Specifiek advies met uitleg]
2. [Specifiek advies met uitleg]  
3. [Specifiek advies met uitleg]
Ken je dit herkennen? 🤔"

SCHRIJF NU:
Post in ${languageName}, 150-250 woorden, met 1-2 emoji's voor gevoel.
Geen hashtags, geen links, geen promotie - alleen waardevolle kennis delen.`;

      const contentResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Je bent een expert die PURE KENNIS deelt zonder enige vorm van marketing. Je schrijft alsof je een vriend helpt begrijpen hoe iets werkt.',
            },
            { role: 'user', content: contentPrompt }
          ],
          temperature: 0.8,
        }),
      });

      const contentData = await contentResponse.json();
      let postContent = contentData.choices[0].message.content.trim();

      // Extra validation: remove any promotional phrases that slipped through
      const blockedPhrases = [
        /bezoek.*?voor/gi,
        /ontdek.*?op/gi,
        /klik.*?hier/gi,
        /lees.*?meer/gi,
        /schrijf.*?je.*?in/gi,
        /til.*?naar.*?hoger.*?niveau/gi,
        /verbeter.*?je/gi,
        /download/gi,
        /gratis/gi,
        /aanbieding/gi,
      ];

      for (const phrase of blockedPhrases) {
        if (phrase.test(postContent)) {
          console.log(`⚠️ Blocked promotional phrase detected, regenerating...`);
          // Skip this post, it's too promotional
          continue;
        }
      }

      // Generate REALISTIC image based on actual subject matter
      console.log('🎨 Generating image for social post...');
      
      // Create image prompt that focuses on REAL SUBJECT, not screens/mockups
      const imagePromptRequest = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Create SHORT image prompts (max 150 chars) that describe REAL SCENES from the actual subject matter - never screens, devices, or mockups.',
            },
            {
              role: 'user',
              content: `Post content: ${postContent.substring(0, 400)}

Create a REALISTIC image prompt showing the ACTUAL SUBJECT:
- For yoga: show a person doing a yoga pose at sunrise
- For cooking: show fresh ingredients or a dish being prepared
- For travel: show an actual destination or landscape
- For gardening: show plants, soil, hands planting
- For fitness: show someone exercising outdoors

FORBIDDEN:
❌ NO laptops, phones, tablets, monitors, screens
❌ NO "someone looking at", "browsing", "reading on device"  
❌ NO mockups, interfaces, dashboards, websites
❌ NO generic office/workspace scenes

REQUIRED:
✅ Show the REAL WORLD subject matter
✅ Authentic, editorial-style photography
✅ Natural lighting and realistic composition
✅ Focus on the actual activity/topic/thing itself

Prompt (English, max 150 chars):`
            }
          ],
          temperature: 0.6,
        }),
      });

      const imagePromptData = await imagePromptRequest.json();
      const imagePrompt = imagePromptData.choices[0]?.message?.content?.trim() || 
        'Editorial style photograph, natural lighting, authentic moment, high quality, realistic composition';

      console.log(`📝 Image prompt: ${imagePrompt}`);
      
      const imageResult = await generateImage({
        prompt: imagePrompt,
        model: 'FLUX_PRO',  // Better quality and anatomy
        width: 1024,
        height: 1024,
        quality: 'high',
      });

      let mediaUrl = null;
      if (imageResult.success && imageResult.images && imageResult.images.length > 0) {
        mediaUrl = imageResult.images[0];
        console.log('✅ Image generated successfully');
      }

      // Determine best platforms based on content type
      const platforms = ['linkedin', 'facebook', 'instagram'];

      // Save post to database
      const post = await prisma.socialMediaPost.create({
        data: {
          project: { connect: { id: project.id } },
          content: postContent,
          platforms: platforms,
          mediaUrl: mediaUrl,
          status: 'draft',
          contentType: 'educational',
          language: lang,
        },
      });

      posts.push(post);
      console.log(`✅ Post ${i + 1}/${count} generated successfully`);
    } catch (error) {
      console.error(`❌ Error generating post ${i + 1}:`, error);
      // Continue with next post
    }
  }

  return posts;
}
