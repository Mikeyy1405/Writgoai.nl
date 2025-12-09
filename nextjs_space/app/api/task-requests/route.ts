

export const dynamic = "force-dynamic";
/**
 * 📝 Task Requests API
 * Klanten kunnen opdrachten aanvragen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';


// GET: Haal task requests op
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const isAdmin = session.user.email === 'info@WritgoAI.nl';

    let taskRequests;

    if (isAdmin && !clientId) {
      // Admin sees all task requests
      taskRequests = await prisma.taskRequest.findMany({
        include: {
          client: {
            select: {
              id: true,
              email: true,
              name: true,
              companyName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // Client sees only their own requests
      const client = await prisma.client.findUnique({
        where: { email: session.user.email },
      });

      if (!client) {
        return NextResponse.json(
          { error: 'Client not found' },
          { status: 404 }
        );
      }

      taskRequests = await prisma.taskRequest.findMany({
        where: { clientId: client.id },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return NextResponse.json({
      success: true,
      taskRequests,
    });
  } catch (error: any) {
    console.error('Get task requests error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// POST: Create new task request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      taskType,
      title,
      description,
      specifications,
      estimatedCost,
      creditCost,
      requestedDeadline,
    } = body;

    if (!taskType || !title || !description) {
      return NextResponse.json(
        { error: 'taskType, title, en description zijn verplicht' },
        { status: 400 }
      );
    }

    const taskRequest = await prisma.taskRequest.create({
      data: {
        clientId: client.id,
        taskType,
        title,
        description,
        specifications,
        estimatedCost,
        creditCost,
        requestedDeadline: requestedDeadline ? new Date(requestedDeadline) : null,
      },
    });

    return NextResponse.json({
      success: true,
      taskRequest,
      message: 'Opdracht aanvraag verzonden!',
    });
  } catch (error: any) {
    console.error('Create task request error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update task request (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user?.email !== 'info@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, priority, adminNotes, assignedTo, deliverables, actualDeadline } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is verplicht' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (deliverables !== undefined) updateData.deliverables = deliverables;
    if (actualDeadline) updateData.actualDeadline = new Date(actualDeadline);
    if (status === 'completed') updateData.completedAt = new Date();

    const taskRequest = await prisma.taskRequest.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      taskRequest,
    });
  } catch (error: any) {
    console.error('Update task request error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
