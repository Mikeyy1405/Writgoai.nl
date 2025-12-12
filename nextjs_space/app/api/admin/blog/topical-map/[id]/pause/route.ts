import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/blog/topical-map/:id/pause
 * 
 * Pauses the batch generation process
 * Note: Current batch will complete, but no new batches will start
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the map
    const map = await prisma.topicalAuthorityMap.findUnique({
      where: { id },
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    if (map.status !== 'generating') {
      return NextResponse.json(
        { error: 'No active generation to pause' },
        { status: 400 }
      );
    }

    // Update map status
    await prisma.topicalAuthorityMap.update({
      where: { id },
      data: { status: 'paused' },
    });

    // Update batch job status
    if (map.currentBatchId) {
      await prisma.batchJob.update({
        where: { id: map.currentBatchId },
        data: {
          status: 'paused',
          pausedAt: new Date(),
        },
      });
    }

    console.log(`[Pause API] Paused generation for map: ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Generation paused. Current batch will complete.',
    });

  } catch (error: any) {
    console.error('[Pause API] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
