import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const sitePlans = await prisma.sitePlan.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keywords: true,
        targetAudience: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ plans: sitePlans });
  } catch (error: any) {
    console.error('❌ [Site Planner List] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van plannen' },
      { status: 500 }
    );
  }
}
