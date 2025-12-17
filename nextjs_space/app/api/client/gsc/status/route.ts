import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/gsc/status
 * Check if GSC is connected for current client
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false });
    }
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        gscRefreshToken: true,
        gscAccessToken: true,
      },
    });
    
    const connected = !!(client?.gscRefreshToken || client?.gscAccessToken);
    
    return NextResponse.json({
      connected,
      hasRefreshToken: !!client?.gscRefreshToken,
    });
  } catch (error: any) {
    console.error('[GSC Status] Error:', error);
    return NextResponse.json({ connected: false });
  }
}
