
/**
 * Article Ideas Scheduling API
 * 
 * Handles automatic and manual scheduling of article ideas
 * based on project autopilot settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  scheduleArticleIdeas,
  rescheduleAllIdeas,
  scheduleNewIdea,
} from '@/lib/article-scheduler';

export const maxDuration = 300;

/**
 * POST: Automatically schedule all unscheduled ideas for a project
 */
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
    const { projectId, action, ideaId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'schedule-all':
        // Schedule all unscheduled ideas
        const scheduleResult = await scheduleArticleIdeas(
          projectId,
          client.id
        );
        return NextResponse.json(scheduleResult);

      case 'reschedule-all':
        // Reschedule all ideas (reset and recalculate)
        const rescheduleResult = await rescheduleAllIdeas(
          projectId,
          client.id
        );
        return NextResponse.json(rescheduleResult);

      case 'schedule-one':
        // Schedule a single idea
        if (!ideaId) {
          return NextResponse.json(
            { error: 'Idea ID is required for schedule-one action' },
            { status: 400 }
          );
        }
        const scheduledDate = await scheduleNewIdea(
          ideaId,
          projectId,
          client.id
        );
        if (scheduledDate) {
          return NextResponse.json({
            success: true,
            scheduledFor: scheduledDate,
            message: 'Idee succesvol ingepland',
          });
        } else {
          return NextResponse.json(
            { error: 'Kon idee niet inplannen' },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: schedule-all, reschedule-all, or schedule-one' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('❌ Error in article scheduling:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij inplannen van ideeën' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Update scheduled date for a specific idea
 */
export async function PUT(request: NextRequest) {
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
    const { ideaId, scheduledFor } = body;

    if (!ideaId || !scheduledFor) {
      return NextResponse.json(
        { error: 'Idea ID and scheduled date are required' },
        { status: 400 }
      );
    }

    // Verify idea ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Update the scheduled date
    const updatedIdea = await prisma.articleIdea.update({
      where: { id: ideaId },
      data: { scheduledFor: new Date(scheduledFor) },
    });

    return NextResponse.json({
      success: true,
      idea: updatedIdea,
      message: 'Planningsdatum succesvol bijgewerkt',
    });
  } catch (error: any) {
    console.error('❌ Error updating scheduled date:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij bijwerken van planningsdatum' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Remove scheduled date from an idea
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }

    // Verify idea ownership
    const idea = await prisma.articleIdea.findFirst({
      where: {
        id: ideaId,
        clientId: client.id,
      },
    });

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found or access denied' },
        { status: 404 }
      );
    }

    // Remove scheduled date
    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: { scheduledFor: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Planningsdatum verwijderd',
    });
  } catch (error: any) {
    console.error('❌ Error removing scheduled date:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verwijderen van planningsdatum' },
      { status: 500 }
    );
  }
}
