import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/integrations/google-search-console/disconnect
 * Disconnect Google Search Console integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Remove tokens from database
    await prisma.client.update({
      where: { id: client.id },
      data: {
        googleSearchConsoleToken: null,
        googleSearchConsoleRefreshToken: null,
        googleSearchConsoleSites: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Google Search Console disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting Google Search Console:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}
