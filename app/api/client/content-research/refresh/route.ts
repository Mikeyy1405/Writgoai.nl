

export const dynamic = "force-dynamic";
/**
 * Daily Refresh API
 * Add new content insights to existing plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { refreshDailyInsights, MasterContentPlan } from '@/lib/intelligent-content-planner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.contentStrategy) {
      return NextResponse.json({ 
        error: 'Geen bestaand content plan. Voer eerst een complete analyse uit.' 
      }, { status: 400 });
    }

    console.log(`🔄 Refreshing insights for project: ${project.name}`);

    const existingPlan = project.contentStrategy as unknown as MasterContentPlan;
    
    // Get new insights
    const newIdeas = await refreshDailyInsights(
      existingPlan,
      project.niche || '',
      project.targetAudience || 'Nederlandse lezers'
    );

    if (newIdeas.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Geen nieuwe inzichten gevonden'
      });
    }

    // Update content strategy with new ideas
    const updatedPlan = {
      ...existingPlan,
      contentIdeas: [...existingPlan.contentIdeas, ...newIdeas],
      summary: {
        ...existingPlan.summary,
        totalIdeas: existingPlan.contentIdeas.length + newIdeas.length,
      }
    };

    await prisma.project.update({
      where: { id: project.id },
      data: {
        contentStrategy: updatedPlan as any,
        contentStrategyDate: new Date(),
      }
    });

    // Add new article ideas
    const articleIdeas = newIdeas.map(idea => ({
      clientId: client.id,
      title: idea.title,
      slug: idea.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      focusKeyword: idea.focusKeyword,
      topic: idea.description,
      secondaryKeywords: idea.secondaryKeywords,
      searchIntent: idea.searchIntent,
      difficulty: idea.estimatedDifficulty,
      contentOutline: { sections: idea.outline.map(h2 => ({ heading: h2, subpoints: [] })) },
      contentType: idea.contentType,
      priority: idea.priority,
      aiScore: idea.trending ? 90 : 70,
      trending: idea.trending,
      status: 'idea',
    }));

    await prisma.articleIdea.createMany({
      data: articleIdeas,
    });

    console.log(`✅ Added ${newIdeas.length} new content ideas`);

    return NextResponse.json({
      success: true,
      newIdeas: newIdeas.length,
      message: `${newIdeas.length} nieuwe content ideeën toegevoegd!`,
    });

  } catch (error: any) {
    console.error('❌ Refresh insights error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh insights', 
      details: error.message 
    }, { status: 500 });
  }
}
