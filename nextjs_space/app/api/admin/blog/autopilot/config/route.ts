import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/autopilot/config?planId=xxx
 * Get autopilot configuration
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

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is verplicht' },
        { status: 400 }
      );
    }

    const config = await prisma.autopilotConfig.findUnique({
      where: {
        type_planId: {
          type: 'blog',
          planId,
        },
      },
    });

    return NextResponse.json({
      config: config || null,
    });
  } catch (error) {
    console.error('Get autopilot config error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen configuratie' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/blog/autopilot/config
 * Update autopilot configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, config } = body;

    if (!planId || !config) {
      return NextResponse.json(
        { error: 'planId en config zijn verplicht' },
        { status: 400 }
      );
    }

    const autopilotConfig = await prisma.autopilotConfig.update({
      where: {
        type_planId: {
          type: 'blog',
          planId,
        },
      },
      data: {
        frequency: config.frequency,
        time: config.time,
        weekdays: config.weekdays,
        maxPerDay: config.maxPerDay,
        autoPublish: config.autoPublish,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      config: autopilotConfig,
    });
  } catch (error) {
    console.error('Update autopilot config error:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken configuratie' },
      { status: 500 }
    );
  }
}
