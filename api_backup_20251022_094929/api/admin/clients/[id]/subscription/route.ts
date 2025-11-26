
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST assign or change subscription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 });
    }

    // Check if package exists
    const pkg = await prisma.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Cancel any existing active subscriptions
    await prisma.clientSubscription.updateMany({
      where: {
        clientId: params.id,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // Create new subscription
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const subscription = await prisma.clientSubscription.create({
      data: {
        clientId: params.id,
        packageId: packageId,
        status: 'ACTIVE',
        startDate: new Date(),
        nextBillingDate: nextBillingDate,
        articlesUsed: 0,
        reelsUsed: 0,
      },
      include: {
        Package: true,
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error assigning subscription:', error);
    return NextResponse.json(
      { error: 'Failed to assign subscription' },
      { status: 500 }
    );
  }
}

// DELETE cancel subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const subscription = await prisma.clientSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
