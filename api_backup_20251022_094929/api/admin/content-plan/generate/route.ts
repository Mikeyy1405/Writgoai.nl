
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateContentPlan } from '@/lib/content-planner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, month, year } = body;

    if (!clientId || !month || !year) {
      return NextResponse.json(
        { error: 'Client ID, month, and year are required' },
        { status: 400 }
      );
    }

    // Haal klant en profiel op
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { 
        AIProfile: true,
        ClientSubscription: {
          include: { Package: true }
        }
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.AIProfile) {
      return NextResponse.json(
        { error: 'Client has no AI profile configured' },
        { status: 400 }
      );
    }

    // Check of er al een plan bestaat
    const existingPlan = await prisma.contentPlan.findUnique({
      where: {
        clientId_month_year: {
          clientId,
          month,
          year,
        },
      },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Content plan already exists for this month' },
        { status: 400 }
      );
    }

    // Bepaal aantal artikelen op basis van abonnement
    const subscription = client.ClientSubscription[0];
    const articlesCount = subscription?.Package?.articlesPerMonth || 4;

    // Genereer content plan met AI
    const articleIdeas = await generateContentPlan({
      client,
      profile: client.AIProfile,
      month,
      year,
      articlesCount,
    });

    // Maak content plan in database
    const contentPlan = await prisma.contentPlan.create({
      data: {
        clientId,
        month,
        year,
        status: 'APPROVED',
        approvedAt: new Date(),
        PlannedArticles: {
          create: articleIdeas.map((idea) => ({
            title: idea.title,
            suggestedTopic: idea.topic,
            keywords: idea.keywords,
            scheduledDate: idea.scheduledDate,
            status: 'PLANNED',
          })),
        },
      },
      include: {
        PlannedArticles: true,
      },
    });

    return NextResponse.json({
      success: true,
      contentPlan,
      message: `Content plan created with ${articleIdeas.length} articles`,
    });
  } catch (error) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate content plan', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
