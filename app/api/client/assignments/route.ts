import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET client's assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { clientId: client.id },
      orderBy: [
        { status: 'asc' },
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Kon opdrachten niet ophalen' }, { status: 500 });
  }
}
