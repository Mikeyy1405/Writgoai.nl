

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
      sources = [],
      angle = 'neutral',
      wordCount = 800,
      language = 'nl',
      urgent = false,
    } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Onderwerp is verplicht' }, { status: 400 });
    }

    console.log('📰 News article generation started:', { topic, angle, urgent });

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

    const requiredCredits = CREDIT_COSTS.NEWS_ARTICLE; // 40 credits
    if (!user || (!user.isUnlimited && (user.subscriptionCredits + user.topUpCredits) < requiredCredits)) {
      return NextResponse.json(
        { error: `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor een news artikel.` },
        { status: 402 }
      );
    }

    // Get client's tone of voice settings
    const toneOfVoiceData = await getClientToneOfVoice(user.id);
    const customToneInstructions = generateToneOfVoicePrompt(toneOfVoiceData, 'professional');

    // STEP 1: Real-time News Research - GPT-4o Search Preview
    console.log('🔍 Step 1: News Research...');
    
    const researchModel = selectOptimalModelForTask('web_search', 'medium', 'quality');
    
    const researchPrompt = `Je bent een nieuws researcher. Zoek de meest recente, betrouwbare nieuwsinformatie over:

**ONDERWERP:** ${topic}
${sources.length > 0 ? `**BRONNEN:** ${sources.join(', ')}` : ''}

Geef:
1. **Laatste ontwikkelingen** (van vandaag of deze week)
2. **Belangrijke feiten en cijfers** met data
3. **Quotes van experts** waar beschikbaar
4. **Context en achtergrond** voor volledig begrip
5. **Bronnen** met naam en datum

Focus op ${language === 'nl' ? 'Nederlandse' : 'internationale'} nieuwsbronnen.
Datum van vandaag: ${new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;

    const researchResponse = await chatCompletion({
      model: researchModel.primary.model,
      messages: [
        {
          role: 'system',
          content: 'Je bent een professionele nieuws researcher. Zoek alleen actuele nieuwsinformatie van de laatste 24-48 uur en vermeld altijd bronnen met datum.'
        },
        {
          role: 'user',
          content: researchPrompt
        }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const researchResults = researchResponse.choices?.[0]?.message?.content || '';
    console.log('✅ News research completed');

    // STEP 2: News Article Writing - GPT-4o (snelheid + kwaliteit)
    console.log('✍️ Step 2: Article Writing...');
    
    const writingModel = selectOptimalModelForTask('blog_writing', 'medium', 'balanced');
    
    const angleInstructions: Record<string, string> = {
      neutral: 'Objectief en neutraal. Presenteer feiten zonder vooroordelen.',
      critical: 'Kritisch en onderzoekend. Stel vragen en analyseer dieper.',
      positive: 'Positief en hoopvol. Focus op kansen en voordelen.',
      analytical: 'Analytisch en diepgravend. Leg verbanden en context uit.'
    };

    const writingPrompt = `Je bent een professionele nieuwsschrijver. Schrijf een actueel nieuwsartikel in het ${language === 'nl' ? 'Nederlands' : 'Engels'}.

**ONDERWERP:** ${topic}

**RESEARCH RESULTATEN:**
${researchResults}

${customToneInstructions}

**SCHRIJF INSTRUCTIES:**
- Invalshoek: ${angleInstructions[angle] || angleInstructions.neutral}
- Lengte: ${wordCount} woorden
- Taal: ${language === 'nl' ? 'Nederlands' : 'Engels'}
${urgent ? '- **URGENT/BREAKING NEWS** stijl - directe, pakkende opening' : ''}

**STRUCTUUR:**
Schrijf het artikel met deze HTML structuur:

<h1>Pakkende nieuwskop die de kern vat</h1>

<p><strong>Lead:</strong> De eerste alinea vat het belangrijkste nieuws samen - Wie, Wat, Waar, Wanneer, Waarom, Hoe.</p>

<h2>Ontwikkelingen</h2>
<p>Beschrijf de laatste ontwikkelingen met concrete feiten, cijfers en tijdlijnen uit het research.</p>

<h2>Achtergrond</h2>
<p>Geef context: Waarom is dit nieuws belangrijk? Wat ging hieraan vooraf?</p>

<h2>Reacties</h2>
<p>Quotes en reacties van betrokken partijen, experts, of autoriteiten waar beschikbaar uit research.</p>

<h2>Vervolgstappen</h2>
<p>Wat betekent dit? Wat zijn de gevolgen? Wat kunnen we verwachten?</p>

**JOURNALISTIEKE REGELS:**
- Gebruik alleen <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags
- Start met de belangrijkste informatie (omgekeerde piramide)
- Gebruik concrete feiten, cijfers en data uit het research
- Vermeld bronnen in de tekst waar relevant ("volgens [bron]...")
- Objectief en feitelijk - geen sensatie
- Actieve zinnen, korte paragrafen
- Exact ${wordCount} woorden

Schrijf nu het complete nieuwsartikel in perfecte HTML formatting!`;

    const writingResponse = await chatCompletion({
      model: writingModel.primary.model,
      messages: [
        {
          role: 'system',
          content: `Je bent een professionele nieuwsschrijver die actuele, feitelijke artikelen schrijft in het ${language === 'nl' ? 'Nederlands' : 'Engels'}. Je schrijft altijd in correcte HTML met alleen toegestane tags.`
        },
        {
          role: 'user',
          content: writingPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 3000,
    });

    const articleContent = writingResponse.choices?.[0]?.message?.content || '';
    console.log('✅ News article completed');

    // Extract title
    const titleMatch = articleContent.match(/<h1>(.*?)<\/h1>/);
    const title = titleMatch ? titleMatch[1] : topic;

    // Deduct credits
    const creditsUsed = CREDIT_COSTS.NEWS_ARTICLE; // 60 credits voor news artikel met real-time research
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

    // AUTO-SAVE: Sla nieuwsartikel automatisch op in Content Bibliotheek
    console.log('💾 Auto-saving to Content Library...');
    
    try {
      const saveResult = await autoSaveToLibrary({
        clientId: user.id,
        type: 'blog',
        title,
        content: articleContent.replace(/<[^>]*>/g, ''), // Plain text
        contentHtml: articleContent,
        category: 'news',
        tags: ['ai-generated', 'news', 'article', angle, ...(urgent ? ['urgent', 'breaking'] : [])],
        description: articleContent.substring(0, 200).replace(/<[^>]*>/g, ''),
        metaDesc: articleContent.substring(0, 160).replace(/<[^>]*>/g, ''),
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
      title,
      content: articleContent,
      remainingCredits,
    });

  } catch (error: any) {
    console.error('❌ Error generating news article:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het genereren van het nieuwsartikel' },
      { status: 500 }
    );
  }
}
