
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { humanizeText, validateHumanization } from '@/lib/text-humanizer';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { content, instruction, conversationId, mode } = await req.json();

    if (!content || !instruction) {
      return NextResponse.json(
        { error: 'Content en instructie zijn verplicht' },
        { status: 400 }
      );
    }

    let improvedContent: string;
    let humanizationMetrics: any = null;
    let humanizationWarnings: string[] = [];

    // Check if this is a humanization request
    if (mode === 'humanize' || instruction.toLowerCase().includes('humanis') || 
        instruction.toLowerCase().includes('menselijk')) {
      
      // Strip HTML tags for humanization
      const textOnly = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Apply humanization
      const result = await humanizeText(textOnly, 'nl');
      improvedContent = result.humanizedText;
      humanizationMetrics = result.metrics;
      humanizationWarnings = result.warnings;
      
      // Validate
      const validation = validateHumanization(result.metrics);
      if (!validation.isValid) {
        humanizationWarnings.push(...validation.issues);
      }
      
      // Preserve some HTML structure if present
      if (content.includes('<p>')) {
        const paragraphs = improvedContent.split('\n\n').filter(p => p.trim());
        improvedContent = paragraphs.map(p => `<p>${p}</p>`).join('\n');
      }
      
    } else {
      // Regular AI improvement
      const apiKey = process.env.ABACUSAI_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ error: 'API configuratie ontbreekt' }, { status: 500 });
      }

      // Enhanced system prompt with humanization rules
      const systemPrompt = `Je bent een professionele tekst editor die teksten menselijker maakt. 

BELANGRIJKE REGELS:
1. Vervang formele woorden: "uiteraard"→"natuurlijk", "optimaal"→"goed", "diverse"→"verschillende", "tevens"→"ook"
2. Vermijd AI-patronen zoals "Of het nu...is", "Perfect voor", en perfecte lijstjes van 3
3. Voeg persoonlijke voornaamwoorden toe: "je", "we", "ons" (minimaal 2x per alinea)
4. Voeg imperfecties toe: "hoewel", "soms", "meestal" (1-2x per alinea)
5. Verzacht absolute statements: "altijd"→"meestal", "nooit"→"zelden"
6. Varieer zinslengte: 40% kort (5-12 woorden), 40% middel (13-20), 20% lang (21-30)
7. Varieer zinsbeginnwoorden (max 2 opeenvolgende met zelfde beginwoord)

BEHOUD ALTIJD de HTML structuur en formatting (bold, italic, headers, lists, etc.).
Geef ALLEEN de verbeterde HTML terug, zonder uitleg of markdown code blocks.`;

      const userPrompt = `Instructie: ${instruction}

Content (HTML):
${content}

Maak deze tekst natuurlijker en menselijker volgens de regels hierboven.`;

      const aimlResponse = await fetch('https://api.abacus.ai/chat/chatllm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          model: 'claude-sonnet-4-5-20250929',
          temperature: 0.9, // Higher for more variation
        }),
      });

      if (!aimlResponse.ok) {
        const errorText = await aimlResponse.text();
        console.error('AIML API error:', errorText);
        throw new Error('AI aanroep mislukt');
      }

      const aimlData = await aimlResponse.json();
      improvedContent = aimlData.choices?.[0]?.message?.content;

      if (!improvedContent) {
        throw new Error('Geen verbeterde content ontvangen van AI');
      }
    }

    // Create or update conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.textEditorConversation.findUnique({
        where: { id: conversationId },
      });
    }

    if (!conversation) {
      conversation = await prisma.textEditorConversation.create({
        data: {
          clientId: client.id,
          title: instruction.substring(0, 50) + (instruction.length > 50 ? '...' : ''),
        },
      });
    }

    // Add messages to conversation
    await prisma.textEditorMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: instruction,
      },
    });

    await prisma.textEditorMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: humanizationMetrics 
          ? `Tekst is gehumaniseerd. Metrics: ${humanizationMetrics.formalWordPercentage.toFixed(1)}% formele woorden, ${humanizationMetrics.pronounsPer100Words.toFixed(1)} persoonlijke voornaamwoorden per 100 woorden.`
          : 'Tekst is verbeterd volgens je instructie.',
      },
    });

    return NextResponse.json({
      improvedContent,
      conversationId: conversation.id,
      humanizationMetrics,
      humanizationWarnings,
    });
  } catch (error: any) {
    console.error('Text editor improve error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verbeteren van tekst' },
      { status: 500 }
    );
  }
}
