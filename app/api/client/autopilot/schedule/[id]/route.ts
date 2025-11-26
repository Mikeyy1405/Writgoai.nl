
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Get single schedule
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const schedule = await prisma.autopilotSchedule.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: 'Planning niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Kon planning niet ophalen' },
      { status: 500 }
    );
  }
}

// PATCH - Update schedule
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isActive, ...updateData } = body;

    const schedule = await prisma.autopilotSchedule.updateMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
      data: {
        ...updateData,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });

    if (schedule.count === 0) {
      return NextResponse.json(
        { error: 'Planning niet gevonden' },
        { status: 404 }
      );
    }

    // Fetch updated schedule
    const updatedSchedule = await prisma.autopilotSchedule.findUnique({
      where: { id: params.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      schedule: updatedSchedule,
      message: 'Planning bijgewerkt',
    });
  } catch (error: any) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Kon planning niet bijwerken' },
      { status: 500 }
    );
  }
}

// DELETE - Delete schedule
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const result = await prisma.autopilotSchedule.deleteMany({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Planning niet gevonden' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Planning verwijderd',
    });
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Kon planning niet verwijderen' },
      { status: 500 }
    );
  }
}
