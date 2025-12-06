

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { CREDIT_COSTS, checkCreditsWithAdminBypass, UNLIMITED_CREDITS } from '@/lib/credits';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const {
      topic,
      platforms = ['linkedin'],
      tone = 'professional',
      includeHashtags = true,
      includeEmojis = false,
      includeImage = false,
      language = 'nl',
      useStorytelling = false,
      storyType = 'hero-journey',
      length = 'medium',
    } = body;
    
    // Use first platform for generation (can be extended to generate for multiple)
    const platform = Array.isArray(platforms) ? platforms[0] : platforms;

    if (!topic) {
      return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
    }

    console.log('📱 Social post generation started:', { topic, platform, tone });

    // Check credits with admin bypass
    const requiredCredits = CREDIT_COSTS.SOCIAL_POST;
    const creditCheck = await checkCreditsWithAdminBypass(session.user.email, requiredCredits);
    
    if (!creditCheck.allowed) {
      return NextResponse.json(
        { error: creditCheck.reason || `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor een social media post.` },
        { status: creditCheck.statusCode || 402 }
      );
    }

    // Get user for credit deduction and tone of voice (only needed if not unlimited)
    const user = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true
      },
    });

    // Get client's tone of voice settings (if user exists in Client table)
    let customToneInstructions = '';
    if (user) {
      const toneOfVoiceData = await getClientToneOfVoice(user.id);
      customToneInstructions = generateToneOfVoicePrompt(toneOfVoiceData, tone as any);
    }

    // Platform specifications
    const platformSpecs: Record<string, { maxLength: number; style: string; hashtagCount: number }> = {
      linkedin: {
        maxLength: 3000,
        style: 'Professioneel en zakelijk. Focus op waarde en inzichten.',
        hashtagCount: 5
      },
      facebook: {
        maxLength: 2000,
        style: 'Vriendelijk en persoonlijk. Conversatie starten.',
        hashtagCount: 3
      },
      twitter: {
        maxLength: 280,
        style: 'Kort en krachtig. Direct to the point.',
        hashtagCount: 2
      },
      instagram: {
        maxLength: 2200,
        style: 'Visueel en inspirerend. Emotie en storytelling.',
        hashtagCount: 10
      },
      tiktok: {
        maxLength: 2200,
        style: 'Trendy en engaging. Hook in eerste 3 seconden.',
        hashtagCount: 5
      }
    };

    const spec = platformSpecs[platform] || platformSpecs.linkedin;

    // STEP 1: Quick Research for Trending Topics
    console.log('🔍 Research trending topics...');
    
    const researchModel = selectOptimalModelForTask('web_search', 'simple', 'speed');
    
    const researchPrompt = `Zoek actuele trends en populaire onderwerpen gerelateerd aan: ${topic}

Geef kort:
1. Trending hashtags
2. Actuele statistieken of cijfers
3. Recente ontwikkelingen

Focus op ${language === 'nl' ? 'Nederlandse' : 'internationale'} trends.
Max 200 woorden.`;

    const researchResponse = await chatCompletion({
      model: researchModel.primary.model,
      messages: [
        {
          role: 'user',
          content: researchPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const trendingInfo = researchResponse.choices?.[0]?.message?.content || '';

    // STEP 2: Generate Social Post - Gemini Flash (snel voor korte content)
    console.log('✍️ Generate social post...');
    
    const writingModel = selectOptimalModelForTask('social_media', 'simple', 'speed');
    
    const toneInstructions: Record<string, string> = {
      professional: 'Professioneel en zakelijk',
      casual: 'Casual en vriendelijk',
      inspiring: 'Inspirerend en motiverend',
      humorous: 'Humoristisch en luchtig',
      educational: 'Educatief en informatief',
      friendly: 'Vriendelijk en toegankelijk'
    };
    
    const storytellingTypes: Record<string, string> = {
      'hero-journey': `Gebruik de Hero's Journey structuur:
1. Situatie/Probleem (waar begon het?)
2. Uitdaging (wat was het moeilijkste?)
3. Oplossing (wat hielp?)
4. Resultaat (waar ben je nu?)
5. Les/Inzicht (wat leerde je?)`,
      'problem-solution': `Gebruik Problem-Solution structuur:
1. Probleem (herkenbare situatie)
2. Impact (waarom is dit belangrijk?)
3. Oplossing (wat werkt?)
4. Bewijs (concrete resultaten)
5. Call-to-action`,
      'before-after': `Gebruik Before-After structuur:
1. Before (situatie voor)
2. Kantelpunt (wat veranderde?)
3. After (situatie nu)
4. Transformatie (wat maakte het verschil?)
5. Inspiratie voor anderen`,
      'personal-story': `Gebruik Personal Story structuur:
1. Opening (persoonlijke hook)
2. Context (waarom relevant?)
3. Verhaal (wat gebeurde?)
4. Emotie (hoe voelde het?)
5. Les/Inzicht`,
      'case-study': `Gebruik Case Study structuur:
1. Klant/Situatie (wie?)
2. Uitdaging (probleem)
3. Aanpak (wat deden we?)
4. Resultaten (cijfers/bewijs)
5. Takeaway`
    };

    const lengthGuide: Record<string, string> = {
      short: '50-100 woorden',
      medium: '100-200 woorden',
      long: '200-300 woorden'
    };

    const writingPrompt = `Je bent een social media expert die WAARDEVOLLE en ENGAGING posts schrijft. Schrijf een ${platform.toUpperCase()} post in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.

**ONDERWERP:** ${topic}

**TRENDING INFO:**
${trendingInfo}

${customToneInstructions}

**POST SPECIFICATIES:**
- Platform: ${platform.toUpperCase()}
- Stijl: ${spec.style}
- Toon: ${toneInstructions[tone] || toneInstructions.professional}
- Lengte: ${lengthGuide[length] || lengthGuide.medium}
- Max lengte: ${spec.maxLength} karakters
- Emoji's: ${includeEmojis ? 'Ja, gebruik relevant (1-3 per sectie)' : 'Nee'}
- Hashtags: ${includeHashtags ? `Ja, ${spec.hashtagCount} relevante hashtags aan het einde` : 'Nee'}
${useStorytelling ? `- Storytelling: JA - ${storyType}\n\n**STORYTELLING STRUCTUUR:**\n${storytellingTypes[storyType] || storytellingTypes['hero-journey']}` : ''}

**VERPLICHTE STRUCTUUR (GEBRUIK DIT ALTIJD):**
${useStorytelling ? 'Volg de storytelling structuur hierboven!' : `
1. **HOOK** (Eerste zin) - Pak aandacht met:
   - Een controversiële stelling (bijv: "Stop met deze 3 fouten...")
   - Een verrassende vraag (bijv: "Wist je dat 90% van de mensen dit verkeerd doet?")
   - Een pakkend feit (bijv: "85% van de bedrijven maakt deze vergissing...")
   
2. **BODY** (Waardevolle content) - Geef concrete tips/inzichten:
   - Gebruik genummerde lijsten (1️⃣, 2️⃣, 3️⃣)
   - Geef specifieke voorbeelden en uitleg
   - Maak het direct toepasbaar
   - Gebruik pijltjes (→) voor sub-punten
   
3. **CALL-TO-ACTION** (Engagement) - Eindig met:
   - Een vraag die mensen laat reageren
   - Een discussie starter
   - Een oproep om ervaringen te delen`}

**PLATFORM BEST PRACTICES:**
${platform === 'linkedin' ? `- Professionele toon maar wel persoonlijk
- Gebruik line breaks voor leesbaarheid (witregel tussen secties)
- Start met een krachtige hook die professionals aanspreekt
- Geef business-waarde en praktische inzichten
- Eindig met een vraag om engagement te stimuleren
- Voorbeelden: "Welke fout maakte jij vroeger? 👇", "Ben je het hier mee eens? 💬"` : ''}
${platform === 'twitter' ? `- Direct en krachtig binnen 280 karakters
- Eén sterke boodschap
- Gebruik pakkende opening
- Max 2-3 hashtags` : ''}
${platform === 'instagram' ? `- Visueel en emotioneel
- Kortere paragrafen (2-3 regels per paragraaf)
- Start met emoji + hook
- Vertel een mini-verhaal
- Veel witregel tussen secties
- 10-15 relevante hashtags` : ''}
${platform === 'facebook' ? `- Persoonlijke en conversational toon
- Stel vragen aan de community
- Gebruik relateerbare voorbeelden
- Gemakkelijk te lezen formatting
- Moedig discussie aan` : ''}
${platform === 'tiktok' ? `- Trend-focused en energiek
- Hook in eerste 3 woorden
- Kort en punchy
- Call-to-action voor engagement` : ''}

**VOORBEELDEN VAN GOEDE ${platform.toUpperCase()} POSTS:**

${platform === 'linkedin' ? `
"Stop met deze 3 fouten als je remote werkt 💻

De meeste remote workers maken dezelfde fouten:

1️⃣ De hele dag in pyjama werken
→ Je hersenen schakelen niet naar 'werk-modus'

2️⃣ Geen vaste werkplek  
→ Je concentratie gaat achteruit zonder dedicated workspace

3️⃣ Lunch achter je laptop
→ Geen pauzes = productiviteitsdip in de middag

Welke fout maakte jij vroeger? 👇

#remotework #productiviteit #thuiswerken #werkvanuit huis #tips"
` : ''}

${platform === 'instagram' ? `
"Je hoeft niet 7 dagen per week te sporten 🏋️

En dat is goed nieuws! ✨

De waarheid?
→ 3-4 keer per week is perfect
→ Je spieren hebben rust nodig
→ Overtraining doet meer kwaad dan goed

Begin met 3 dagen:
• Maandag: Kracht
• Woensdag: Cardio  
• Vrijdag: Full body

Consistency > Intensiteit 💪

Hoe vaak train jij per week? 👇

#fitness #sporten #gezondleven #fitnesstips #workout #training #fitfam #gezond #motivatie #sport"
` : ''}

${platform === 'facebook' ? `
Kleine tip voor mensen die hun eerste plantje gekocht hebben 🌱

Water geven is NIET het belangrijkste (vind ik persoonlijk ook altijd verrassend!)

Het belangrijkste is licht. De meeste kamerplanten sterven door te weinig licht, niet door te weinig water.

Mijn tip: 
Zet je plant eerst op de plek waar je hem wilt hebben. Kijk na 1 week: worden de bladeren geel/slap? Verplaats hem dichter naar het raam.

En ja, elke plant is anders, maar dit is een goed startpunt 😊

Hebben jullie tips voor beginners? Deel ze hieronder! 👇
` : ''}

**BELANGRIJK:**
- Schrijf ECHTE, waardevolle content - geen vage tips of placeholder tekst
- Gebruik concrete voorbeelden en specifieke cijfers/feiten waar mogelijk
- Maak het engaging en actionable
- Geen generic tekst zoals "Dit is een AI-gegenereerde post" - dat is VERBODEN
- De lezer moet direct waarde krijgen uit de post

${includeHashtags ? `\n**HASHTAGS:** Plaats ${spec.hashtagCount} relevante hashtags aan het einde. Mix populaire en niche-specifieke tags.` : ''}

Schrijf nu de complete ${platform} post! Geen HTML, gewoon platte tekst met line breaks en emoji's.`;

    const writingResponse = await chatCompletion({
      model: writingModel.primary.model,
      messages: [
        {
          role: 'system',
          content: `Je bent een social media expert die engaging posts schrijft voor ${platform}. Schrijf altijd in gewone tekst (geen HTML), gebruik line breaks voor leesbaarheid.`
        },
        {
          role: 'user',
          content: writingPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1000,
    });

    const postContent = writingResponse.choices?.[0]?.message?.content || '';
    console.log('✅ Social post completed');

    // Extract hashtags
    const hashtagMatches = postContent.match(/#\w+/g);
    const hashtags = hashtagMatches || [];

    // Deduct credits
    const creditsUsed = CREDIT_COSTS.SOCIAL_POST;
    let remainingCredits = UNLIMITED_CREDITS;
    
    // Deduct credits (only if not unlimited - admins and unlimited users skip this)
    if (!creditCheck.isUnlimited && user) {
      // Calculate remaining credits BEFORE database update (user object has current values)
      // TypeScript guarantees user is not null here, but being explicit for clarity
      const currentTotal = (user.subscriptionCredits || 0) + (user.topUpCredits || 0);
      remainingCredits = currentTotal - creditsUsed;
      
      const subscriptionDeduct = Math.min(user.subscriptionCredits, creditsUsed);
      const topUpDeduct = Math.max(0, creditsUsed - subscriptionDeduct);
      
      await prisma.client.update({
        where: { id: user.id },
        data: {
          subscriptionCredits: user.subscriptionCredits - subscriptionDeduct,
          topUpCredits: user.topUpCredits - topUpDeduct,
          totalCreditsUsed: { increment: creditsUsed },
        },
      });
      
      console.log(`💳 Credits deducted: ${creditsUsed} (${subscriptionDeduct} subscription + ${topUpDeduct} top-up). Remaining: ${remainingCredits}`);
    } else {
      console.log(`💳 Credits NOT deducted (unlimited/admin user)`);
    }

    // AUTO-SAVE: Sla social post automatisch op in Content Bibliotheek (only if user exists in Client table)
    if (user) {
      console.log('💾 Auto-saving to Content Library...');
      
      try {
        const saveResult = await autoSaveToLibrary({
          clientId: user.id,
          type: 'social',
          title: `${platform.toUpperCase()} post: ${topic}`,
          content: postContent,
          category: 'social-media',
          tags: ['ai-generated', 'social-media', platform, ...(useStorytelling ? ['storytelling', storyType] : [])],
          description: postContent.substring(0, 200),
          keywords: hashtags.map((tag: string) => tag.replace('#', '')),
        });
        
        if (saveResult.saved) {
          console.log(`✅ ${saveResult.message}`);
        } else if (saveResult.duplicate) {
          console.log(`⏭️  ${saveResult.message}`);
        } else {
          console.warn(`⚠️ ${saveResult.message}`);
        }
      } catch (saveError) {
        console.error('❌ Error auto-saving to library:', saveError);
        // Continue anyway - auto-save failure should not block the response
      }
    }

    return NextResponse.json({
      success: true,
      post: postContent,
      hashtags,
      platform,
      platforms,
      useStorytelling,
      storyType: useStorytelling ? storyType : undefined,
      remainingCredits,
    });

  } catch (error: any) {
    console.error('❌ Error generating social post:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het genereren van de social media post' },
      { status: 500 }
    );
  }
}
