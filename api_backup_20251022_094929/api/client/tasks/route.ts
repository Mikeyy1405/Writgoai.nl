
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Functie om automatisch taken aan te maken volgens de Writgo methode
async function ensureMonthlyTasksAreCreated(clientId: string) {
  try {
    // Haal klant op met abonnement en AI profile
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        ClientSubscription: {
          include: {
            Package: true,
          },
        },
        AIProfile: true,
      },
    });

    if (!client) return;

    // Check of klant een actief abonnement heeft
    const activeSubscription = client.ClientSubscription?.find(
      (sub) => sub.status === 'ACTIVE'
    );

    if (!activeSubscription) {
      // Geen actief subscription, gebruik defaults
      console.log(`No active subscription for client ${clientId}`);
      return;
    }

    // Bepaal hoeveel artikelen de klant per maand krijgt
    const articlesPerMonth = activeSubscription.Package.articlesPerMonth || 15;
    
    // Check hoeveel taken er al zijn (totaal, niet per maand)
    const existingTasks = await prisma.task.count({
      where: {
        clientId: clientId,
        category: 'CONTENT_AUTOMATION',
      },
    });

    // Bereken hoeveel taken er nog aangemaakt moeten worden
    const tasksToCreate = Math.max(0, articlesPerMonth - existingTasks);

    if (tasksToCreate === 0) {
      console.log(`Client ${clientId} already has ${existingTasks}/${articlesPerMonth} tasks`);
      return;
    }

    console.log(`Generating ${tasksToCreate} new tasks for client ${clientId} using Writgo method...`);

    // Haal AI Profile
    const aiProfile = client.AIProfile;
    if (!aiProfile) {
      console.log(`No AI Profile found for client ${clientId}`);
      return;
    }

    // Genereer artikelen met AI volgens de Writgo methode
    const writgoPrompt = `
🎯 **WRITGO METHODE - CONTENT PLAN**

Genereer ${tasksToCreate} artikelen voor: ${aiProfile.websiteName || client.companyName || 'deze klant'}

**BEDRIJFSINFO:**
- Website: ${aiProfile.websiteUrl || client.website || 'N/A'}
- Bedrijf: ${aiProfile.websiteName || client.companyName || 'N/A'}
- Beschrijving: ${aiProfile.companyDescription || 'AI-gedreven content automatisering'}
- Doelgroep: ${aiProfile.targetAudience || 'Nederlandse ondernemers'}

**WRITGO STRATEGIE:**
Focus op commerciële keywords met koopintentie en praktische how-to content.

**CONTENT MIX:**
- 40% Social Media Marketing & Automatisering
- 30% Content Creatie & AI Tools
- 20% YouTube & Video Marketing
- 10% SEO & Business tips

**OUTPUT FORMAT - JSON array met ${tasksToCreate} artikelen:**

[
  {
    "title": "Social Media Automatiseren: 5 Tools (2025)",
    "topic": "Uitleg over social media automatisering",
    "mainKeyword": "social media automatiseren",
    "lsiKeywords": ["social media planning", "content automatisering"],
    "targetWordCount": 1800,
    "searchVolume": 590,
    "difficulty": "Easy",
    "category": "Social Media",
    "contentType": "Tool Review",
    "priority": "HIGH"
  }
]

BELANGRIJK: Geef ALLEEN de JSON array, geen extra tekst!
`;

    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) {
      console.log('No API key configured');
      return;
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
            content: 'Je bent een SEO expert die content plannen maakt volgens de Writgo methode. Je genereert ALLEEN geldige JSON arrays.',
          },
          { role: 'user', content: writgoPrompt },
        ],
        temperature: 0.85,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      console.log(`AI generation failed: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON
    let articles;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      articles = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return;
    }

    if (!Array.isArray(articles) || articles.length < 1) {
      console.log('No articles generated');
      return;
    }

    // Haal admin user op
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
      console.log('No user found to assign as creator');
      return;
    }

    // Maak taken aan met gespreide deadlines
    const createdTasks = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Start vanaf morgen
    tomorrow.setHours(12, 0, 0, 0); // Zet tijd op 12:00 uur
    
    for (let i = 0; i < Math.min(articles.length, tasksToCreate); i++) {
      const article = articles[i];
      
      // Bereken deadline: verspreid artikelen over 3 dagen (voor eerste 3), daarna 1 per week
      const daysOffset = i < 3 ? i : 3 + Math.floor((i - 3) * 7);
      const deadline = new Date(tomorrow);
      deadline.setDate(deadline.getDate() + daysOffset);
      
      const task = await prisma.task.create({
        data: {
          clientId: clientId,
          createdById: adminUser.id,
          title: article.title || `Artikel ${i + 1}`,
          description: `**Topic:** ${article.topic || ''}\n\n**Main Keyword:** ${article.mainKeyword || ''}\n\n**LSI Keywords:** ${(article.lsiKeywords || []).join(', ')}\n\n**Target Word Count:** ${article.targetWordCount || 1500}\n\n**Content Type:** ${article.contentType || 'Article'}\n\n**Category:** ${article.category || 'General'}`,
          status: 'TODO',
          category: 'CONTENT_AUTOMATION',
          deadline: deadline,
          notes: JSON.stringify({
            mainKeyword: article.mainKeyword,
            lsiKeywords: article.lsiKeywords,
            targetWordCount: article.targetWordCount,
            searchVolume: article.searchVolume,
            difficulty: article.difficulty,
            contentCategory: article.category,
            contentType: article.contentType,
            priority: article.priority,
            writgoMethod: true, // Changed from jimMethod
          }),
        },
      });

      createdTasks.push(task);
    }

    console.log(`✅ Created ${createdTasks.length} tasks for client ${clientId} using Writgo method`);
  } catch (error) {
    console.error('Error ensuring monthly tasks:', error);
  }
}

// GET client's tasks
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Zorg ervoor dat taken automatisch worden aangemaakt
    await ensureMonthlyTasksAreCreated(session.user.id);

    const tasks = await prisma.task.findMany({
      where: { clientId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        Deliverable: true,
        Message: {
          where: { isRead: false, senderType: 'TEAM' },
          select: { id: true },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
