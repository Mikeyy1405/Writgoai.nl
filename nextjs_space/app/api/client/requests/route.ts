import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { notifyAdminNewRequest } from '@/lib/notification-helper';

// GET client's own requests
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

    const requests = await prisma.clientRequest.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Kon verzoeken niet ophalen' }, { status: 500 });
  }
}

// POST - Create new request
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, type, budget, deadline, attachments } = body;

    if (!title || !description || !type) {
      return NextResponse.json(
        { error: 'Titel, beschrijving en type zijn verplicht' },
        { status: 400 }
      );
    }

    const clientRequest = await prisma.clientRequest.create({
      data: {
        clientId: client.id,
        title,
        description,
        type,
        budget: budget || null,
        deadline: deadline || null,
        attachments: attachments || [],
        status: 'new',
      }
    });

    // Notify admin about new request
    await notifyAdminNewRequest(clientRequest.id);

    return NextResponse.json({ request: clientRequest });
  } catch (error: any) {
    console.error('Error creating request:', error);
    return NextResponse.json({ error: 'Kon verzoek niet aanmaken' }, { status: 500 });
  }
}
