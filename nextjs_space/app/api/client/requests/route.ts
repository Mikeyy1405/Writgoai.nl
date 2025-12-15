import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { notifyAdminNewRequest } from '@/lib/notification-helper';
import { getServiceCost } from '@/lib/service-pricing';

export const dynamic = 'force-dynamic';

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

    // Check and deduct credits (unless unlimited)
    const serviceCost = getServiceCost(type);
    if (!client.isUnlimited) {
      const totalCredits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);
      if (totalCredits < serviceCost) {
        return NextResponse.json(
          { error: `Je hebt niet genoeg credits. Deze dienst kost ${serviceCost} credits.` },
          { status: 400 }
        );
      }

      // Deduct credits (prioritize top-up credits first)
      let remainingCost = serviceCost;
      let topUpDeduction = 0;
      let subscriptionDeduction = 0;

      if (client.topUpCredits && client.topUpCredits >= remainingCost) {
        topUpDeduction = remainingCost;
      } else if (client.topUpCredits) {
        topUpDeduction = client.topUpCredits;
        remainingCost -= client.topUpCredits;
        subscriptionDeduction = remainingCost;
      } else {
        subscriptionDeduction = remainingCost;
      }

      await prisma.client.update({
        where: { id: client.id },
        data: {
          topUpCredits: { decrement: topUpDeduction },
          subscriptionCredits: { decrement: subscriptionDeduction },
        }
      });

      console.log(`[Credits] Deducted ${serviceCost} credits from client ${client.id} for ${type} request`);
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
