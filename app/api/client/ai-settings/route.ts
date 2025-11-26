
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get projects
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        name: true,
        description: true,
        websiteUrl: true,
        wordpressUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      client: {
        id: client.id,
        email: client.email,
        name: client.name,
        credits: {
          subscription: client.subscriptionCredits,
          topUp: client.topUpCredits,
          total: client.subscriptionCredits + client.topUpCredits,
          isUnlimited: client.isUnlimited,
        },
      },
      projects,
    });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Kon AI instellingen niet ophalen' },
      { status: 500 }
    );
  }
}
