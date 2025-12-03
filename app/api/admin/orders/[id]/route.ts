
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
            createdAt: 'asc',
          },
        },
        timeline: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      status,
      assignedWriter,
      assignedEmail,
      paymentStatus,
      invoiceNumber,
      rating,
      deliveryUrl,
      notes,
    } = body;

    const updateData: any = {};
    let timelineDetails = '';

    if (status) {
      updateData.status = status;
      timelineDetails = `Status gewijzigd naar ${status}`;
    }
    
    if (assignedWriter !== undefined) {
      updateData.assignedWriter = assignedWriter;
      updateData.assignedEmail = assignedEmail;
      timelineDetails = assignedWriter 
        ? `Toegewezen aan ${assignedWriter}` 
        : 'Toewijzing verwijderd';
    }
    
    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
      timelineDetails = `Betaling status: ${paymentStatus}`;
    }
    
    if (invoiceNumber) {
      updateData.invoiceNumber = invoiceNumber;
    }
    
    if (rating !== undefined) {
      updateData.rating = rating;
      timelineDetails = `Beoordeling: ${rating}/5`;
    }
    
    if (deliveryUrl) {
      updateData.deliveryUrl = deliveryUrl;
      timelineDetails = 'Delivery URL toegevoegd';
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
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

    // Add timeline event if there's a meaningful change
    if (timelineDetails) {
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          action: 'updated',
          details: timelineDetails,
          user: session.user.email,
        },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.order.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
