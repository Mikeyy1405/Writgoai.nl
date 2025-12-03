import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET single assignment
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

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const assignment = await prisma.assignment.findUnique({
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
        invoiceItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Opdracht niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json({ error: 'Kon opdracht niet ophalen' }, { status: 500 });
  }
}

// PUT update assignment
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

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      type,
      status,
      priority,
      deadline,
      estimatedHours,
      actualHours,
      budget,
      finalPrice,
      notes,
      adminNotes,
      deliverables,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours ? parseFloat(estimatedHours) : null;
    if (actualHours !== undefined) updateData.actualHours = actualHours ? parseFloat(actualHours) : null;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice ? parseFloat(finalPrice) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (deliverables !== undefined) updateData.deliverables = deliverables;

    const assignment = await prisma.assignment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Kon opdracht niet bijwerken' }, { status: 500 });
  }
}

// DELETE assignment
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

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await prisma.assignment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Kon opdracht niet verwijderen' }, { status: 500 });
  }
}
