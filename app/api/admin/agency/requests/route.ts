import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET all client requests for admin
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

    const where: any = {};
    if (status && status !== 'all') where.status = status;

    const requests = await prisma.clientRequest.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    return NextResponse.json({ error: 'Kon verzoeken niet ophalen' }, { status: 500 });
  }
}

// POST - Convert request to assignment
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
    const { requestId, budget, deadline, adminResponse } = body;

    if (!requestId) {
      return NextResponse.json({ error: 'Request ID is verplicht' }, { status: 400 });
    }

    // Get the request
    const clientRequest = await prisma.clientRequest.findUnique({
      where: { id: requestId },
      include: { client: true }
    });

    if (!clientRequest) {
      return NextResponse.json({ error: 'Verzoek niet gevonden' }, { status: 404 });
    }

    // Create assignment from request
    const assignment = await prisma.assignment.create({
      data: {
        clientId: clientRequest.clientId,
        title: clientRequest.title,
        description: clientRequest.description,
        type: clientRequest.type,
        budget: budget ? parseFloat(budget) : null,
        deadline: deadline ? new Date(deadline) : null,
        status: 'open',
        priority: 'normal',
      }
    });

    // Update request status
    await prisma.clientRequest.update({
      where: { id: requestId },
      data: {
        status: 'converted',
        assignmentId: assignment.id,
        adminResponse: adminResponse || null,
        reviewedAt: new Date(),
      }
    });

    return NextResponse.json({ assignment });
  } catch (error: any) {
    console.error('Error converting request:', error);
    return NextResponse.json({ error: 'Kon verzoek niet omzetten' }, { status: 500 });
  }
}
