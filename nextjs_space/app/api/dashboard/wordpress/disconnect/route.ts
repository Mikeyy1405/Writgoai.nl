import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
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

    // Clear WordPress credentials from database
    await prisma.client.update({
      where: { id: clientId },
      data: {
        wordpressUrl: null,
        wordpressUsername: null,
        wordpressPassword: null
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'WordPress ontkoppeld'
    });
  } catch (error: any) {
    console.error('WordPress disconnect error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
