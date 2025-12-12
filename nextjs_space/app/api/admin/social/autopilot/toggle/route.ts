import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/social/autopilot/toggle
 * Toggle autopilot enabled status for social media
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, enabled, config } = body;

    if (!planId) {
      return NextResponse.json(
        { error: 'planId is verplicht' },
        { status: 400 }
      );
    }

    // Get client ID
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    // Upsert autopilot config
    const autopilotConfig = await prisma.autopilotConfig.upsert({
      where: {
        type_planId: {
          type: 'social',
          planId,
        },
      },
      create: {
        clientId: client.id,
        type: 'social',
        planId,
        enabled,
        frequency: config?.frequency || '3x-week',
        time: config?.time || '09:00',
        weekdays: config?.weekdays || [1, 3, 5],
        maxPerDay: config?.maxPerDay || 1,
        autoPublish: config?.autoPublish !== undefined ? config.autoPublish : true,
      },
      update: {
        enabled,
        frequency: config?.frequency,
        time: config?.time,
        weekdays: config?.weekdays,
        maxPerDay: config?.maxPerDay,
        autoPublish: config?.autoPublish,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      config: autopilotConfig,
    });
  } catch (error) {
    console.error('Social autopilot toggle error:', error);
    return NextResponse.json(
      { error: 'Fout bij wijzigen autopilot status' },
      { status: 500 }
    );
  }
}
