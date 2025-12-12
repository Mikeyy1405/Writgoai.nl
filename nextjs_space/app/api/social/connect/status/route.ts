import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * GET /api/social/connect/status
 * Check if a platform connection has been completed
 * 
 * Query params:
 * - projectId: WritGo project ID
 * - platform: Platform name (e.g., 'linkedin')
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');

    if (!projectId || !platform) {
      return NextResponse.json(
        { error: 'projectId and platform are required' },
        { status: 400 }
      );
    }

    // Check if we have any connected accounts for this platform
    const connectedAccount = await prisma.connectedSocialAccount.findFirst({
      where: {
        projectId,
        platform,
        isActive: true
      },
      orderBy: {
        connectedAt: 'desc' // Get the most recently connected
      }
    });

    return NextResponse.json({
      connected: !!connectedAccount,
      account: connectedAccount || null
    });
  } catch (error) {
    console.error('Failed to check connection status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
