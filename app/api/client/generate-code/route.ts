

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
      prompt,
      description,
      type = 'complete_website',
    } = body;

    const userPrompt = prompt || description;

    if (!userPrompt) {
      return NextResponse.json({ error: 'Beschrijving is verplicht' }, { status: 400 });
    }

    console.log('💻 Code generation started:', { prompt: userPrompt, type });

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

    const requiredCredits = CREDIT_COSTS.CODE_GENERATION; // 25 credits
    if (!user || (!user.isUnlimited && (user.subscriptionCredits + user.topUpCredits) < requiredCredits)) {
      return NextResponse.json(
        { error: `Onvoldoende credits. Je hebt minimaal ${requiredCredits} credits nodig voor code generatie.` },
        { status: 402 }
      );
    }

    // Get client's tone of voice (for code comments and descriptions)
    const toneOfVoiceData = await getClientToneOfVoice(user.id);
    const customToneInstructions = toneOfVoiceData.hasCustomTone 
      ? `\n**TONE OF VOICE voor comments en beschrijvingen:** ${toneOfVoiceData.toneOfVoice}\n` 
      : '';

    // Code Generation - DeepSeek Chat (beste voor code, goedkoop)
    console.log('💻 Generating code...');
    
    const codeModel = selectOptimalModelForTask('code_generation', 'medium', 'balanced');

    const codePrompt = `Je bent een expert web developer. Genereer een complete, interactieve webcomponent.

**OPDRACHT:** ${userPrompt}
${customToneInstructions}

**REQUIREMENTS:**
- Schrijf moderne, responsive HTML
- Gebruik clean, professionele CSS met modern design
- Voeg interactiviteit toe met vanilla JavaScript
- Maak het mobile-friendly
- Gebruik smooth animations en transitions
- Zorg voor een professionele, moderne uitstraling

**OUTPUT FORMAT:**
Geef EXACT deze structuur terug:

TITLE: [Een korte, pakkende titel]
DESCRIPTION: [Een korte beschrijving van wat het doet]

HTML:
\`\`\`html
[Complete HTML code hier - alleen de body content, geen <!DOCTYPE>, <html>, <head> of <body> tags]
\`\`\`

CSS:
\`\`\`css
[Complete CSS code hier - alle styling]
\`\`\`

JAVASCRIPT:
\`\`\`javascript
[Complete JavaScript code hier - alle functionaliteit]
\`\`\`

**BELANGRIJKE REGELS:**
1. Gebruik ALLEEN vanilla JavaScript, geen frameworks
2. Maak het visueel aantrekkelijk met gradients, shadows, en smooth animations
3. Voeg hover effects en transitions toe waar mogelijk
4. Zorg dat alles werkt zonder externe dependencies
5. Test dat alle event listeners correct werken

Genereer nu de complete, werkende component!`;

    const codeResponse = await chatCompletion({
      model: codeModel.primary.model,
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert frontend developer die prachtige, interactieve webcomponenten maakt met HTML, CSS en JavaScript.'
        },
        {
          role: 'user',
          content: codePrompt
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
    });

    const generatedCode = codeResponse.choices?.[0]?.message?.content || '';
    console.log('✅ Code generation completed');

    // Extract title and description
    const titleMatch = generatedCode.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const descriptionMatch = generatedCode.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
    
    const componentTitle = titleMatch ? titleMatch[1].trim() : 'Generated Component';
    const componentDescription = descriptionMatch ? descriptionMatch[1].trim() : 'Gegenereerd met AI';

    // Extract code blocks
    const htmlMatch = generatedCode.match(/HTML:[\s\S]*?```(?:html)?\n([\s\S]*?)```/i);
    const cssMatch = generatedCode.match(/CSS:[\s\S]*?```(?:css)?\n([\s\S]*?)```/i);
    const jsMatch = generatedCode.match(/JAVASCRIPT:[\s\S]*?```(?:javascript|js)?\n([\s\S]*?)```/i);

    const html = htmlMatch ? htmlMatch[1].trim() : '<div><p>Geen HTML gegenereerd</p></div>';
    const css = cssMatch ? cssMatch[1].trim() : '/* Geen CSS gegenereerd */';
    const js = jsMatch ? jsMatch[1].trim() : '// Geen JavaScript gegenereerd';

    // Deduct credits
    const creditsUsed = CREDIT_COSTS.CODE_GENERATION; // 30 credits voor code generatie
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

    // AUTO-SAVE: Sla code automatisch op in Content Bibliotheek
    console.log('💾 Auto-saving to Content Library...');
    
    try {
      // Combine HTML, CSS, JS into one content block
      const fullCode = `<!-- ${componentTitle} -->\n\n${html}\n\n<style>\n${css}\n</style>\n\n<script>\n${js}\n</script>`;
      
      const saveResult = await autoSaveToLibrary({
        clientId: user.id,
        type: 'code',
        title: componentTitle,
        content: fullCode,
        contentHtml: fullCode,
        category: 'webcomponent',
        tags: ['ai-generated', 'code', 'html', 'css', 'javascript'],
        description: componentDescription,
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

    console.log('✅ Code generation successful');

    return NextResponse.json({
      success: true,
      html,
      css,
      js,
      title: componentTitle,
      description: componentDescription,
      remainingCredits,
    });

  } catch (error: any) {
    console.error('❌ Error generating code:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het genereren van code' },
      { status: 500 }
    );
  }
}
