
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sendChatCompletion } from '@/lib/aiml-chat-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        totalCreditsUsed: true,
        subscriptionCredits: true,
        topUpCredits: true,
        subscriptionPlan: true,
        projects: {
          select: {
            id: true,
            name: true,
            autopilotEnabled: true,
          },
          take: 5,
        },
        savedContent: {
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Gather user context
    const totalContent = await prisma.savedContent.count({
      where: { clientId: client.id },
    });

    const contentThisWeek = await prisma.savedContent.count({
      where: {
        clientId: client.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const totalCreditsUsed = client.totalCreditsUsed || 0;
    const creditsAvailable =
      (client.subscriptionCredits || 0) + (client.topUpCredits || 0);

    const hasTopicalMaps = await prisma.topicalMap.count({
      where: {
        project: {
          clientId: client.id,
        },
      },
    });

    const hasAutopilot = client.projects.some((p) => p.autopilotEnabled);

    // Build context for AI
    const userContext = {
      name: client.name,
      totalContent,
      contentThisWeek,
      totalProjects: client.projects.length,
      creditsAvailable,
      totalCreditsUsed,
      subscriptionPlan: client.subscriptionPlan || 'free',
      hasTopicalMaps: hasTopicalMaps > 0,
      hasAutopilot,
      isActive: contentThisWeek > 0,
      projects: client.projects.map((p) => ({
        name: p.name,
        hasAutopilot: p.autopilotEnabled,
      })),
    };

    // Generate personalized tip using AI
    const systemPrompt = `Je bent een expert content strategist en WritGo AI assistent. 
Genereer een persoonlijke, actionable tip voor deze gebruiker op basis van hun profiel en activiteit.

De tip moet:
1. Kort en krachtig zijn (max 2-3 zinnen)
2. Direct toepasbaar zijn vandaag/deze week
3. Gericht zijn op het verbeteren van hun content strategie
4. Specifiek zijn voor hun situatie (niet generiek)
5. Een concrete actie bevatten

BELANGRIJK - Gebruik deze data en respecteer de huidige status:
- Totaal content gegenereerd: ${userContext.totalContent}
- Content deze week: ${userContext.contentThisWeek}
- Aantal projecten: ${userContext.totalProjects}
- Credits beschikbaar: ${userContext.creditsAvailable}
- Credits gebruikt: ${userContext.totalCreditsUsed}
- Subscription plan: ${userContext.subscriptionPlan}
- Heeft Topical Maps: ${userContext.hasTopicalMaps ? 'Ja' : 'Nee'}
- Heeft Autopilot: ${userContext.hasAutopilot ? 'Ja' : 'Nee'}
- Recent actief: ${userContext.isActive ? 'Ja' : 'Nee'}

KRITIEKE REGEL: Als "Heeft Topical Maps: Ja", stel NOOIT voor om een topical map te maken! Focus op andere strategieën zoals:
- Content optimalisatie
- Autopilot activatie
- Nieuwe content genereren
- SEO verbetering
- Linkbuilding

Return ONLY a JSON object with this structure (no markdown, no code blocks):
{
  "title": "Korte pakkende titel voor de tip",
  "description": "Beschrijving van de tip (2-3 zinnen)",
  "action": "Concrete actie tekst (bijv: 'Ga naar Content Specialist')",
  "href": "Link naar relevante tool (bijv: '/client-portal/content-specialist')",
  "reason": "Waarom deze tip relevant is voor deze gebruiker"
}`;

    const response = await sendChatCompletion({
      model: 'google/gemini-3-pro-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Genereer een persoonlijke tip voor ${userContext.name}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 500,
    });

    let tip;
    try {
      // Extract JSON from response
      let content = '';
      if ('choices' in response && response.choices && response.choices[0]) {
        content = response.choices[0]?.message?.content || '';
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tip = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI tip response:', parseError);
      // Smart fallback tip based on user context
      if (!userContext.hasTopicalMaps && userContext.totalProjects > 0) {
        tip = {
          title: 'Start met een Content Strategie',
          description:
            'Een strategische content planning verhoogt je SEO resultaten met 40%. Begin vandaag met een complete topical map voor je niche.',
          action: 'Ga naar Content Planner',
          href: '/client-portal/content-planner',
          reason: 'Een goede content strategie begint met planning',
        };
      } else if (userContext.contentThisWeek === 0) {
        tip = {
          title: 'Genereer Nieuwe Content',
          description:
            'Je hebt deze week nog geen content gegenereerd. Gebruik de Content Specialist om in enkele minuten SEO-geoptimaliseerde artikelen te maken.',
          action: 'Start Content Specialist',
          href: '/client-portal/content-specialist',
          reason: 'Regelmatige content publicatie verbetert je SEO ranking',
        };
      } else if (!userContext.hasAutopilot && userContext.hasTopicalMaps) {
        tip = {
          title: 'Activeer Autopilot Mode',
          description:
            'Je hebt al een topical map. Laat de AI nu automatisch content genereren met Autopilot voor consistente output.',
          action: 'Bekijk Autopilot',
          href: '/client-portal/content-planner',
          reason: 'Automatiseer je content creatie proces',
        };
      } else {
        tip = {
          title: 'Optimaliseer Je Content',
          description:
            'Gebruik de Content Specialist om je content strategie naar een hoger niveau te tillen met AI-powered optimalisaties.',
          action: 'Ga naar Content Specialist',
          href: '/client-portal/content-specialist',
          reason: 'Continue optimalisatie is key voor succes',
        };
      }
    }

    return NextResponse.json({
      success: true,
      tip,
      userContext: {
        totalContent,
        contentThisWeek,
        creditsAvailable,
      },
    });
  } catch (error) {
    console.error('Error generating daily tip:', error);
    return NextResponse.json(
      { error: 'Failed to generate tip' },
      { status: 500 }
    );
  }
}
