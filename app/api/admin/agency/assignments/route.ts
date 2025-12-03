import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { notifyAssignmentCreated } from '@/lib/notification-helper';

// GET all assignments
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (clientId) where.clientId = clientId;

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        },
        _count: {
          select: {
            invoiceItems: true,
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { deadline: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ assignments });
  } catch (error: any) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Kon opdrachten niet ophalen' }, { status: 500 });
  }
}

// POST create new assignment
export async function POST(request: NextRequest) {
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
      clientId,
      projectId,
      title,
      description,
      type,
      priority,
      deadline,
      estimatedHours,
      budget,
      notes,
    } = body;

    if (!clientId || !title || !description || !type) {
      return NextResponse.json(
        { error: 'Klant, titel, beschrijving en type zijn verplicht' },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.create({
      data: {
        clientId,
        projectId: projectId || null,
        title,
        description,
        type,
        priority: priority || 'normal',
        deadline: deadline ? new Date(deadline) : null,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        budget: budget ? parseFloat(budget) : null,
        notes: notes || null,
      },
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

    // Send notification email to client
    await notifyAssignmentCreated(assignment.id);

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Kon opdracht niet aanmaken' }, { status: 500 });
  }
}
