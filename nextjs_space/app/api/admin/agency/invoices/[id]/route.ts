import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        },
        items: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                type: true,
              }
            }
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Factuur niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Kon factuur niet ophalen' }, { status: 500 });
  }
}

// PUT update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const {
      status,
      notes,
      paymentTerms,
      dueDate,
      paidAt,
    } = body;

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'sent' && !body.sentAt) {
        updateData.sentAt = new Date();
      }
      if (status === 'paid' && !paidAt) {
        updateData.paidAt = new Date();
      }
    }
    if (notes !== undefined) updateData.notes = notes;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (paidAt !== undefined) updateData.paidAt = paidAt ? new Date(paidAt) : null;

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        items: true,
      }
    });

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Kon factuur niet bijwerken' }, { status: 500 });
  }
}

// DELETE invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Delete invoice items first, then invoice
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: params.id }
    });

    await prisma.invoice.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Kon factuur niet verwijderen' }, { status: 500 });
  }
}
