
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST update Buffer email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bufferEmail } = body;

    if (!bufferEmail || !bufferEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id: session.user.id },
      data: {
        bufferEmail,
        bufferConnected: true,
        bufferConnectedAt: new Date()
      }
    });

    return NextResponse.json({ 
      message: 'Buffer email updated successfully',
      client 
    });
  } catch (error) {
    console.error('Error updating Buffer email:', error);
    return NextResponse.json(
      { error: 'Failed to update Buffer email' },
      { status: 500 }
    );
  }
}
