
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ subscription: client.managedServiceSubscription });
  } catch (error) {
    console.error('[MANAGED_SERVICE_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Payment system being migrated to Moneybird
    return NextResponse.json(
      { 
        error: 'Betalingssysteem wordt gemigreerd naar Moneybird. Probeer later opnieuw.',
        migrating: true 
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('[MANAGED_SERVICE_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.managedServiceSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      status,
      contentPiecesPerMonth,
      socialPostsPerWeek,
      platforms,
      language,
      projectId,
    } = body;

    const updatedSubscription = await prisma.managedServiceSubscription.update({
      where: { id: client.managedServiceSubscription.id },
      data: {
        ...(status && { status }),
        ...(contentPiecesPerMonth && { contentPiecesPerMonth }),
        ...(socialPostsPerWeek && { socialPostsPerWeek }),
        ...(platforms && { platforms }),
        ...(language && { language }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('[MANAGED_SERVICE_PATCH]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        managedServiceSubscription: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.managedServiceSubscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription (Stripe removed - Moneybird integration coming)
    await prisma.managedServiceSubscription.update({
      where: { id: client.managedServiceSubscription.id },
      data: {
        status: 'cancelled',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[MANAGED_SERVICE_DELETE]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
