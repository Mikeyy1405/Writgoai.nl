
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can access this endpoint
    if (session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const assignedEmail = searchParams.get('assignedEmail');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (clientId) {
      where.clientId = clientId;
    }
    
    if (assignedEmail) {
      where.assignedEmail = assignedEmail;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            email: true,
            companyName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
        timeline: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
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

    const body = await req.json();
    const {
      title,
      clientId,
      category,
      words,
      notes,
      deadline,
      priority,
      rate,
      price,
      vat,
      totalPrice,
      writerFee,
    } = body;

    if (!title || !clientId || !category || !words || !deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        title,
        clientId,
        category,
        words: parseInt(words),
        notes,
        deadline: new Date(deadline),
        priority: priority || false,
        rate: rate ? parseFloat(rate) : null,
        price: price ? parseFloat(price) : null,
        vat: vat ? parseFloat(vat) : null,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        writerFee: writerFee ? parseFloat(writerFee) : null,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            companyName: true,
          },
        },
      },
    });

    // Add timeline event
    await prisma.orderTimeline.create({
      data: {
        orderId: order.id,
        action: 'created',
        details: 'Order aangemaakt',
        user: session.user.email,
      },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
