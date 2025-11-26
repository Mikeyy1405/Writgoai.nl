

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { chatCompletion, selectOptimalModelForTask } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { CREDIT_COSTS } from '@/lib/credits';
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

    // Check user credits
    const user = await prisma.client.findUnique({
      where: { email: session.user.email },
            select: { 
        id: true, 
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true
      },
    });

    const requiredCredits = CREDIT_COSTS.SOCIAL_POST; // 15 credits
    if (!user || (!user.isUnlimited && (user.subscriptionCredits + user.topUpCredits) < requiredCredits)) {
      return NextResponse.json(
        { error: `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor een social media post.` },
        { status: 402 }
      );
    }

    // Get client's tone of voice settings
    const toneOfVoiceData = await getClientToneOfVoice(user.id);
    const customToneInstructions = generateToneOfVoicePrompt(toneOfVoiceData, tone as any);

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

    const writingPrompt = `Je bent een social media expert. Schrijf een ${platform.toUpperCase()} post in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.

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
- Emoji's: ${includeEmojis ? 'Ja, gebruik relevant' : 'Nee'}
- Hashtags: ${includeHashtags ? `Ja, ${spec.hashtagCount} relevante hashtags` : 'Nee'}
${useStorytelling ? `- Storytelling: JA - ${storyType}\n\n**STORYTELLING STRUCTUUR:**\n${storytellingTypes[storyType] || storytellingTypes['hero-journey']}` : ''}

**PLATFORM BEST PRACTICES:**
${platform === 'linkedin' ? '- Start met een hook vraag of statement\n- Gebruik line breaks voor leesbaarheid\n- Eindig met een vraag of CTA' : ''}
${platform === 'twitter' ? '- Direct en krachtig\n- Binnen 280 karakters\n- Geen lange threads' : ''}
${platform === 'instagram' ? '- Visueel en emotioneel\n- Storytelling\n- Veel line breaks' : ''}
${platform === 'facebook' ? '- Persoonlijk en conversatie\n- Vraag engagement\n- Niet te lang' : ''}
${platform === 'tiktok' ? '- Trend-focused\n- Hook in eerste zin\n- Call-to-action voor video' : ''}

**STRUCTUUR:**
${useStorytelling ? 'Volg de storytelling structuur hierboven!' : `1. **Hook** - Grijp aandacht in eerste regel
2. **Waarde** - Deel inzicht, tip, of informatie
3. **Engagement** - Vraag, CTA of discussie starter`}
${includeHashtags ? `${useStorytelling ? '6' : '4'}. **Hashtags** - ${spec.hashtagCount} relevante hashtags aan het einde` : ''}

${useStorytelling ? 'Maak het verhaal PERSOONLIJK en EMOTIONEEL. Gebruik concrete details en voorbeelden.' : ''}

Schrijf nu de complete ${platform} post! Geen HTML, gewoon platte tekst met line breaks.`;

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
    const creditsUsed = CREDIT_COSTS.SOCIAL_POST; // 20 credits voor social media post
        // Deduct credits (only if not unlimited)
    if (!user.isUnlimited) {
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
    }

    const remainingCredits = user.isUnlimited ? 999999 : (user.subscriptionCredits + user.topUpCredits - creditsUsed);

    // AUTO-SAVE: Sla social post automatisch op in Content Bibliotheek
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
