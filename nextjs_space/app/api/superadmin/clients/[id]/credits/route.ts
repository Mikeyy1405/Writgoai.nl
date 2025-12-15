
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, type, reason } = body;

    if (!amount || !type || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Update credits based on type
    let updateData: any = {};
    let description = '';

    if (type === 'subscription') {
      const newAmount = (client.subscriptionCredits || 0) + amount;
      updateData.subscriptionCredits = Math.max(0, newAmount);
      description = `Admin ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} subscription credits. Reason: ${reason}`;
    } else if (type === 'topup') {
      const newAmount = (client.topUpCredits || 0) + amount;
      updateData.topUpCredits = Math.max(0, newAmount);
      description = `Admin ${amount > 0 ? 'added' : 'removed'} ${Math.abs(amount)} top-up credits. Reason: ${reason}`;
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: updateData
    });

    // Create credit transaction
    await prisma.creditTransaction.create({
      data: {
        clientId: params.id,
        amount: amount,
        type: amount > 0 ? 'purchase' : 'usage',
        description: description,
        balanceAfter: (updatedClient.subscriptionCredits || 0) + (updatedClient.topUpCredits || 0)
      }
    });

    // Log activity
    await prisma.clientActivityLog.create({
      data: {
        clientId: params.id,
        action: 'admin_credit_adjustment',
        description: description,
        metadata: {
          amount,
          type,
          reason,
          newBalance: (updatedClient.subscriptionCredits || 0) + (updatedClient.topUpCredits || 0)
        }
      }
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
      newBalance: (updatedClient.subscriptionCredits || 0) + (updatedClient.topUpCredits || 0)
    });

  } catch (error) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
