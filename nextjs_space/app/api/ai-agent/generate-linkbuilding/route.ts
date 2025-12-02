import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { autoSaveToLibrary } from '@/lib/content-library-helper';
import { prisma } from '@/lib/db';
import { getClientToneOfVoice, generateToneOfVoicePrompt } from '@/lib/tone-of-voice-helper';

const AIML_API_BASE_URL = process.env.AIML_API_BASE_URL || 'https://api.aimlapi.com';
const AIML_API_KEY = process.env.AIML_API_KEY;

function getOpenAI() {
  return new OpenAI({
  apiKey: AIML_API_KEY,
  baseURL: AIML_API_BASE_URL,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUrl, keywords, clientId } = await request.json();

    if (!targetUrl || !keywords) {
      return NextResponse.json(
        { error: 'Target URL and keywords are required' },
        { status: 400 }
      );
    }

    // Parse keywords
    const keywordList = keywords.split(',').map((k: string) => k.trim()).filter(Boolean);

    // Get user for tone of voice
    const user = await prisma.client.findUnique({
      where: { email: session?.user?.email || '' },
      select: { id: true },
    });

    // Get tone of voice if user exists
    const toneOfVoiceData = user ? await getClientToneOfVoice(user.id) : { toneOfVoice: '', customInstructions: '', hasCustomTone: false };
    const customToneInstructions = generateToneOfVoicePrompt(toneOfVoiceData, 'professional');

    const systemPrompt = `Je bent een expert SEO content schrijver gespecialiseerd in linkbuilding artikelen.
Je taak is om een hoogwaardig, SEO-geoptimaliseerd artikel te schrijven dat:
- Natuurlijk en informatief is
- De gegeven anchor texts/keywords subtiel integreert
- Backlinks bevat naar de opgegeven URL
- Tussen de 800-1200 woorden is
- Leesbaar en engaging is
- Voldoet aan Google's E-E-A-T richtlijnen

Retourneer een JSON object met:
{
  "title": "De titel van het artikel",
  "content": "De volledige content in HTML formaat met <h2>, <h3>, <p>, <a> tags. Zorg dat de backlinks naar de target URL natuurlijk zijn geïntegreerd met de anchor texts.",
  "meta_description": "Een SEO-vriendelijke meta description (150-160 karakters)",
  "anchor_texts": ["lijst", "van", "gebruikte", "anchor", "texts"]
}`;

    const userPrompt = `Schrijf een linkbuilding artikel met de volgende specificaties:

Target URL (waar je naartoe wilt linken): ${targetUrl}
Anchor Texts/Keywords: ${keywordList.join(', ')}

${customToneInstructions}

Het artikel moet:
1. Informatief en waardevol zijn voor de lezer
2. De anchor texts natuurlijk verwerken
3. Backlinks bevatten naar ${targetUrl} met de gegeven anchor texts
4. SEO-geoptimaliseerd zijn
5. 800-1200 woorden bevatten

Genereer het artikel nu in JSON formaat.`;

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const result = JSON.parse(responseText);

    // AUTO-SAVE: Sla linkbuilding artikel automatisch op in Content Bibliotheek
    console.log('💾 Auto-saving to Content Library...');
    
    try {
      // Get user email from session
      const user = await prisma.client.findUnique({
        where: { email: session?.user?.email || '' },
        select: { id: true },
      });
      
      if (user) {
        const saveResult = await autoSaveToLibrary({
          clientId: user.id,
          type: 'linkbuilding',
          title: result.title || 'Untitled Article',
          content: (result.content || '').replace(/<[^>]*>/g, ''), // Plain text
          contentHtml: result.content || '',
          category: 'linkbuilding',
          tags: ['ai-generated', 'linkbuilding', 'seo', ...(result.anchor_texts || keywordList)],
          description: result.meta_description || '',
          keywords: keywordList,
          metaDesc: result.meta_description || '',
        });
        
        if (saveResult.saved) {
          console.log(`✅ ${saveResult.message}`);
        } else if (saveResult.duplicate) {
          console.log(`⏭️  ${saveResult.message}`);
        } else {
          console.warn(`⚠️ ${saveResult.message}`);
        }
      }
    } catch (saveError) {
      console.error('❌ Error auto-saving to library:', saveError);
      // Continue anyway - auto-save failure should not block the response
    }

    return NextResponse.json({
      title: result.title || 'Untitled Article',
      content: result.content || '',
      meta_description: result.meta_description || '',
      anchor_texts: result.anchor_texts || keywordList,
      target_url: targetUrl,
    });

  } catch (error: any) {
    console.error('[LINKBUILDING API ERROR]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate linkbuilding article' },
      { status: 500 }
    );
  }
}
