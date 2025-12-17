import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getImprovementTips, markTipAsCompleted } from '@/lib/services/google-search-console-service';

/**
 * GET /api/client/gsc/tips
 * Get improvement tips for a project
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const completedOnly = searchParams.get('completedOnly') === 'true';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Get tips
    const tips = await getImprovementTips(projectId, completedOnly);

    return NextResponse.json({
      success: true,
      tips,
      totalTips: tips.length
    });
  } catch (error: any) {
    console.error('[API] GSC Tips Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/gsc/tips
 * Mark tip as completed
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { tipId } = await req.json();

    if (!tipId) {
      return NextResponse.json(
        { error: 'Tip ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify tip ownership
    const tip = await prisma.improvementTip.findUnique({
      where: { id: tipId },
      include: { project: true }
    });

    if (!tip || tip.project.client_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Tip niet gevonden' },
        { status: 404 }
      );
    }

    // Mark as completed
    await markTipAsCompleted(tipId);

    return NextResponse.json({
      success: true,
      message: 'Tip gemarkeerd als voltooid'
    });
  } catch (error: any) {
    console.error('[API] Mark Tip Completed Error:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
