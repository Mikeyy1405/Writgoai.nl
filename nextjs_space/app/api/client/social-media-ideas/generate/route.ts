
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { deductCredits } from '@/lib/credits';
import { scrapeWebsite } from '@/lib/website-scraper';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AIML_API_KEY,
  baseURL: 'https://api.aimlapi.com/v1',
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Check credits (unless unlimited)
    if (!client.isUnlimited) {
      const totalCredits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);
      if (totalCredits < 10) {
        return NextResponse.json(
          { error: 'Onvoldoende credits. Je hebt minimaal 10 credits nodig.' },
          { status: 402 }
        );
      }
    }

    const body = await req.json();
    const { projectId, count = 10, language } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
      include: {
        savedContent: {
          select: {
            title: true,
          },
          take: 20,
          orderBy: { createdAt: 'desc' },
          where: {
            isArchived: false,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Use language from request or fallback to project language
    const targetLanguage = language || project.language || 'NL';

    console.log(`[Social Media Ideas] Starting generation for ${project.name}`);
    console.log(`[Social Media Ideas] Website: ${project.websiteUrl}`);
    console.log(`[Social Media Ideas] Niche: ${project.niche}`);

    // STEP 1: Scrape and analyze website content
    let websiteContent = '';
    let websiteTitle = '';
    let mainTopics: string[] = [];

    if (project.websiteUrl) {
      try {
        console.log(`[Social Media Ideas] Scraping website: ${project.websiteUrl}`);
        const websiteData = await scrapeWebsite(project.websiteUrl);
        
        if (websiteData.success && websiteData.content) {
          websiteTitle = websiteData.title || '';
          websiteContent = websiteData.content.substring(0, 3000); // First 3000 chars
          
          console.log(`[Social Media Ideas] ✅ Website scraped successfully`);
          console.log(`[Social Media Ideas] Title: ${websiteTitle}`);
          console.log(`[Social Media Ideas] Content length: ${websiteContent.length} chars`);
        } else {
          console.warn(`[Social Media Ideas] ⚠️ Website scraping failed`);
        }
      } catch (error) {
        console.error('[Social Media Ideas] Website scraping error:', error);
      }
    }

    // STEP 2: Extract main topics from saved content
    if (project.savedContent && project.savedContent.length > 0) {
      mainTopics = project.savedContent.map(c => c.title).filter(Boolean).slice(0, 10);
      console.log(`[Social Media Ideas] Found ${mainTopics.length} content topics from library`);
    }

    // STEP 3: Build STRICT prompt - ONLY educational content about the NICHE TOPIC
    const prompt = `Je bent een vakexpert in ${project.niche}. Je taak is om ${count} educational content ideeën te bedenken die ALLEEN maar vakkennis delen.

🚫 ABSOLUTE VERBODEN - JE IDEEËN WORDEN AFGEKEURD ALS:
❌ Je praat over tools, websites, platforms, software, apps, diensten
❌ Je noemt Writgo of welke tool dan ook
❌ Je gebruikt marketing taal: "ontdek", "leer", "boost", "verbeter je"
❌ Je suggereert het bezoeken van websites of het gebruiken van services
❌ Je maakt promotionele content
❌ Je gebruikt marketing emoji's zoals 🌟✨💪🚀

✅ JE MOET ALLEEN:
✅ Vakkennis delen over ${project.niche}
✅ Praktische how-to content bedenken
✅ Problemen en oplossingen identificeren
✅ Tips en technieken uitleggen
✅ Concrete, bruikbare informatie geven

${websiteContent ? `VAKKENNIS CONTEXT (gebruik dit als inspiratie voor onderwerpen):
${websiteContent}
` : ''}

${mainTopics.length > 0 ? `BESTAANDE ONDERWERPEN (bedenk iets anders):
${mainTopics.map(t => `- ${t}`).join('\n')}
` : ''}

VOORBEELDEN VAN GOEDE IDEEËN:

Yoga niche:
- Titel: "3 ademhalingstechnieken voor beginners"
- Beschrijving: "Leg uit hoe buikademhaling, borstademhaling en volledige yogaademhaling werken. Geef stap-voor-stap instructies."
- Visual: "Close-up van persoon die zittend ademt, hand op buik"

Baby voeding niche:
- Titel: "Wanneer is je baby klaar voor vast voedsel?"
- Beschrijving: "Leg de 3 signalen uit: zelfstandig rechtop zitten, tongreflex verdwenen, interesse in eten. Geef praktische tips voor de eerste hapjes."
- Visual: "Baby in kinderstoel met lepel en schaaltje, mama helpt"

Marketing/content niche:
- Titel: "Hoe schrijf je een goede blog opening"
- Beschrijving: "Leg de haak-methode uit: start met vraag, probleem of verrassend feit. Geef 3 concrete voorbeelden en waarom ze werken."
- Visual: "Notitieboek met pen en koffie op bureau (GEEN laptop/scherm)"

Tuin/planten niche:
- Titel: "Waarom heeft mijn plant bruine bladeren"
- Beschrijving: "Leg de 3 hoofdoorzaken uit: te veel water, te weinig licht, luchtvochtigheid. Geef voor elk de oplossing."
- Visual: "Close-up van plantblad met bruine punt, hand die het aanraakt"

TAAL: ${targetLanguage === 'NL' ? 'perfect Nederlands' : targetLanguage === 'EN' ? 'fluent English' : targetLanguage === 'DE' ? 'fließendes Deutsch' : targetLanguage === 'FR' ? 'français naturel' : 'español fluido'}

Bedenk nu ${count} ideeën als JSON in dit formaat:
{
  "ideas": [
    {
      "title": "Specifiek, praktisch onderwerp uit ${project.niche}",
      "description": "Concrete uitleg van wat je gaat delen: het probleem, de oplossing, of de how-to. 3-4 zinnen die het volledige onderwerp beschrijven zodat de post schrijver weet wat te maken.",
      "contentType": "educational",
      "suggestedPlatforms": ["linkedin", "facebook", "instagram"],
      "keywords": ["relevant", "natuurlijk", "beschrijvend"],
      "visualIdea": "Beschrijf de ECHTE situatie, object of persoon. Voor digitale topics: GEEN schermen, gebruik objecten zoals notebook, koffie, boek, whiteboard. Voor fysieke topics: show het echte ding (yoga pose, baby met eten, plant close-up, ingrediënten)."
    }
  ]
}

ONTHOUD: PUUR VAKINHOUDELIJK. GEEN MARKETING. GEEN TOOLS. ALLEEN KENNIS OVER ${project.niche}.`;

    console.log('[Social Media Ideas] Generating with Claude...');

    // STEP 4: Generate ideas with AI
    const completion = await openai.chat.completions.create({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0].message.content || '{}';
    console.log('[Social Media Ideas] AI Response received');

    let generatedIdeas: any[] = [];
    try {
      const response = JSON.parse(responseContent);
      if (response.ideas && Array.isArray(response.ideas)) {
        generatedIdeas = response.ideas;
      } else if (Array.isArray(response)) {
        generatedIdeas = response;
      } else {
        console.error('[Social Media Ideas] Invalid response format:', response);
        return NextResponse.json(
          { error: 'AI response heeft niet het verwachte formaat' },
          { status: 500 }
        );
      }
    } catch (parseError) {
      console.error('[Social Media Ideas] Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Kon AI response niet verwerken. Probeer het opnieuw.' },
        { status: 500 }
      );
    }

    if (generatedIdeas.length === 0) {
      return NextResponse.json(
        { error: 'Geen ideeën gegenereerd. Probeer het opnieuw.' },
        { status: 500 }
      );
    }

    console.log(`[Social Media Ideas] Generated ${generatedIdeas.length} ideas, saving...`);

    // STEP 5: Save ideas to database
    const savedIdeas = await Promise.all(
      generatedIdeas.map((idea) =>
        prisma.socialMediaIdea.create({
          data: {
            projectId: project.id,
            title: idea.title || 'Untitled',
            description: idea.description || '',
            contentType: idea.contentType || 'educational',
            language: targetLanguage,
            suggestedPlatforms: idea.suggestedPlatforms || ['linkedin', 'facebook'],
            keywords: idea.keywords || [],
            status: 'idea',
            visualIdea: idea.visualIdea || null,
          },
        })
      )
    );

    // Deduct credits
    await deductCredits(
      client.id, 
      10, 
      `Social Media Ideeën (${savedIdeas.length} ideeën voor ${project.name})`
    );

    console.log(`[Social Media Ideas] ✅ Successfully saved ${savedIdeas.length} ideas`);

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
      count: savedIdeas.length,
    });
  } catch (error: any) {
    console.error('[Social Media Ideas] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij genereren van ideeën' },
      { status: 500 }
    );
  }
}
