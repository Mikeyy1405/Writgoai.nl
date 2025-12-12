import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        wordpressUrl: true,
        wordpressUsername: true,
        wordpressPassword: true,
      }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const connected = !!(client.wordpressUrl && client.wordpressUsername && client.wordpressPassword);
    
    return NextResponse.json({ 
      connected,
      siteInfo: connected ? {
        url: client.wordpressUrl,
        name: new URL(client.wordpressUrl!).hostname
      } : null
    });
  } catch (error) {
    console.error('WordPress status check error:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}
