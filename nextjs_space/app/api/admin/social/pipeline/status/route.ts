import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/social/pipeline/status
 * Returns the current status of the social media pipeline
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Get the most recent active social media strategy
    const activeStrategy = await prisma.socialMediaStrategy.findFirst({
      where: {
        status: {
          in: ['planning', 'generating', 'completed', 'paused'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!activeStrategy) {
      // No active plan
      return NextResponse.json({
        hasActivePlan: false,
        plannedPosts: 0,
        generatedPosts: 0,
        postedPosts: 0,
        generationProgress: 0,
        generationStatus: 'idle',
        autopilotEnabled: false,
      });
    }

    // Count generated posts
    const generatedPosts = await prisma.socialMediaPost.count({
      where: {
        strategyId: activeStrategy.id,
        status: {
          in: ['scheduled', 'posted'],
        },
      },
    });

    // Count posted posts
    const postedPosts = await prisma.socialMediaPost.count({
      where: {
        strategyId: activeStrategy.id,
        status: 'posted',
      },
    });

    // Check autopilot status
    const autopilotConfig = await prisma.autopilotConfig.findUnique({
      where: {
        type_planId: {
          type: 'social',
          planId: activeStrategy.id,
        },
      },
    });

    // Calculate progress
    const totalPosts = activeStrategy.totalPosts || 0;
    const progress =
      totalPosts > 0 ? Math.round((generatedPosts / totalPosts) * 100) : 0;

    // Determine generation status
    let generationStatus: 'idle' | 'active' | 'completed' | 'paused' = 'idle';
    if (activeStrategy.status === 'generating') {
      generationStatus = 'active';
    } else if (activeStrategy.status === 'completed') {
      generationStatus = 'completed';
    } else if (activeStrategy.status === 'paused') {
      generationStatus = 'paused';
    }

    return NextResponse.json({
      hasActivePlan: true,
      planId: activeStrategy.id,
      plannedPosts: totalPosts,
      generatedPosts,
      postedPosts,
      generationProgress: progress,
      generationStatus,
      autopilotEnabled: autopilotConfig?.enabled || false,
    });
  } catch (error) {
    console.error('Social pipeline status error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen pipeline status' },
      { status: 500 }
    );
  }
}
