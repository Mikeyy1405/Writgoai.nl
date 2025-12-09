

export const dynamic = "force-dynamic";
/**
 * 💰 Admin: Credits Toewijzen aan Klanten
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if admin
    if (!session || session.user?.email !== 'info@WritgoAI.nl') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId, amount, type, description } = body;

    if (!clientId || !amount) {
      return NextResponse.json(
        { error: 'clientId en amount zijn verplicht' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    // Update credits based on type
    let updatedClient;
    if (type === 'subscription') {
      updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          subscriptionCredits: {
            increment: amount,
          },
        },
      });
    } else {
      updatedClient = await prisma.client.update({
        where: { id: clientId },
        data: {
          topUpCredits: {
            increment: amount,
          },
        },
      });
    }

    // Create transaction log
    await prisma.creditTransaction.create({
      data: {
        clientId,
        amount,
        type: 'bonus',
        description: description || `Admin toegewezen: ${amount} credits`,
        balanceAfter: updatedClient.subscriptionCredits + updatedClient.topUpCredits,
      },
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
      message: `${amount} credits toegevoegd`,
    });
  } catch (error: any) {
    console.error('Manage credits error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
