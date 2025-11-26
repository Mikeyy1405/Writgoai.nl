
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST - Genereer artikel voor specifieke task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Haal task op
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        Client: {
          include: {
            AIProfile: true,
          },
        },
      },
    });

    if (!task || task.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Artikel is al gegenereerd' }, { status: 400 });
    }

    // Update task status naar IN_PROGRESS
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'IN_PROGRESS' },
    });

    // Parse task notes voor metadata
    let metadata: any = {};
    try {
      if (task.notes) {
        metadata = JSON.parse(task.notes);
      }
    } catch (e) {
      console.error('Error parsing task notes:', e);
    }

    // Haal AI Profile op
    const aiProfile = task.Client?.AIProfile;
    if (!aiProfile) {
      return NextResponse.json({ error: 'Geen AI Profile gevonden' }, { status: 400 });
    }

    // Genereer artikel met AI
    const articlePrompt = `
🎯 **WRITGO METHODE - ARTIKEL GENERATIE**

Schrijf een volledig artikel volgens onderstaande specificaties.

**ARTIKEL INFO:**
- Titel: ${task.title}
- Main Keyword: ${metadata.mainKeyword || 'content automatisering'}
- LSI Keywords: ${(metadata.lsiKeywords || []).join(', ')}
- Target Word Count: ${metadata.targetWordCount || 1800}
- Content Type: ${metadata.contentType || 'Article'}
- Category: ${metadata.contentCategory || 'General'}

**BEDRIJFSINFO:**
- Bedrijf: ${aiProfile.websiteName || task.Client?.companyName || 'WritgoAI'}
- Website: ${aiProfile.websiteUrl || task.Client?.website || 'https://writgoai.nl'}
- Beschrijving: ${aiProfile.companyDescription || 'AI-gedreven content automatisering'}
- Doelgroep: ${aiProfile.targetAudience || 'Nederlandse ondernemers'}
- Tone of Voice: ${aiProfile.toneOfVoice || 'Professioneel maar toegankelijk'}

**WRITGO STRATEGIE:**
1. Focus op praktische, actiebare content
2. Gebruik commerciële keywords met koopintentie
3. Schrijf in duidelijke, toegankelijke taal voor Nederlandse ondernemers
4. Voeg concrete voorbeelden en tips toe
5. Eindig met een call-to-action

**STRUCTUUR:**
- Pakkende introductie (100-150 woorden)
- Minimaal 5 hoofdstukken met H2 headers
- Gebruik H3 subheaders waar passend
- Bullets en genummerde lijsten voor leesbaarheid
- Concrete voorbeelden en case studies
- Afsluiting met conclusie en CTA

**OUTPUT FORMAT - Markdown:**

# [Titel]

[Introductie paragraaf...]

## [Hoofdstuk 1]

[Content...]

## [Hoofdstuk 2]

[Content...]

[etc...]

## Conclusie

[Afsluitende paragraaf met CTA...]

BELANGRIJK: 
- Minimaal ${metadata.targetWordCount || 1800} woorden
- Gebruik de main keyword en LSI keywords natuurlijk door de tekst
- Schrijf in markdown format
- Maak het praktisch en actiegericht
`;

    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Call AI
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een professionele content writer die artikelen schrijft volgens de Writgo methode. Je schrijft SEO-geoptimaliseerde, praktische artikelen voor Nederlandse ondernemers.',
          },
          { role: 'user', content: articlePrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('AI generation failed:', response.statusText);
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'TODO' },
      });
      return NextResponse.json({ error: 'Artikel generatie mislukt' }, { status: 500 });
    }

    const data = await response.json();
    const articleContent = data.choices[0]?.message?.content || '';

    if (!articleContent) {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'TODO' },
      });
      return NextResponse.json({ error: 'Geen content gegenereerd' }, { status: 500 });
    }

    // Maak deliverable aan
    await prisma.deliverable.create({
      data: {
        taskId: taskId,
        fileName: `${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`,
        fileUrl: '#', // Placeholder URL
        fileSize: articleContent.length,
        notes: articleContent,
      },
    });

    // Update task status naar COMPLETED
    await prisma.task.update({
      where: { id: taskId },
      data: { 
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      message: 'Artikel succesvol gegenereerd!',
      success: true,
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article' },
      { status: 500 }
    );
  }
}
