
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            createdAt: true
          }
        },
        savedContent: {
          select: {
            id: true,
            title: true,
            createdAt: true
          },
          take: 10,
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            savedContent: true,
            projects: true,
            creditTransactions: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionStatus, subscriptionPlan, isUnlimited } = body;

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...(subscriptionStatus && { subscriptionStatus }),
        ...(subscriptionPlan && { subscriptionPlan }),
        ...(typeof isUnlimited === 'boolean' && { isUnlimited })
      }
    });

    // Log activity
    await prisma.clientActivityLog.create({
      data: {
        clientId: params.id,
        action: 'admin_update',
        description: 'Admin updated client settings',
        metadata: body
      }
    });

    return NextResponse.json(client);

  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
