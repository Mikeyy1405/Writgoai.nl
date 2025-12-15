
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch all schedules for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get all schedules for this project with contentType = 'social-media'
    const schedules = await prisma.autopilotSchedule.findMany({
      where: {
        projectId,
        contentType: 'social-media',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

// POST - Create a new schedule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      name,
      scheduleType,
      scheduledDate,
      timeOfDay,
      secondTimeOfDay,
      dayOfWeek,
      daysOfWeek,
      postsPerRun,
      platforms,
    } = body;

    if (!projectId || !name || !scheduleType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate next run time
    const now = new Date();
    let nextRunAt = new Date();

    if (scheduleType === 'once' && scheduledDate) {
      nextRunAt = new Date(scheduledDate);
      const [hours, minutes] = (timeOfDay || '09:00').split(':');
      nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    } else if (scheduleType === 'once-daily') {
      const [hours, minutes] = (timeOfDay || '09:00').split(':');
      nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // If time has passed today, schedule for tomorrow
      if (nextRunAt <= now) {
        nextRunAt.setDate(nextRunAt.getDate() + 1);
      }
    } else if (scheduleType === 'weekly' && dayOfWeek !== undefined) {
      const [hours, minutes] = (timeOfDay || '09:00').split(':');
      nextRunAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const currentDay = nextRunAt.getDay();
      const targetDay = parseInt(dayOfWeek);
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRunAt <= now)) {
        daysUntilTarget += 7;
      }
      
      nextRunAt.setDate(nextRunAt.getDate() + daysUntilTarget);
    }

    // Create the schedule
    const schedule = await prisma.autopilotSchedule.create({
      data: {
        clientId: client.id,
        projectId,
        name,
        scheduleType,
        contentType: 'social-media',
        frequency: scheduleType,
        scheduledDate: scheduleType === 'once' ? new Date(scheduledDate) : null,
        timeOfDay: timeOfDay || '09:00',
        secondTimeOfDay: scheduleType === 'twice-daily' ? secondTimeOfDay : null,
        dayOfWeek: scheduleType === 'weekly' ? parseInt(dayOfWeek) : null,
        daysOfWeek: scheduleType === 'custom-days' ? daysOfWeek : [],
        articlesPerRun: postsPerRun || 3,
        platforms: platforms || [],
        nextRunAt,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Planning succesvol aangemaakt',
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

// PATCH - Update schedule (activate/deactivate)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { scheduleId, isActive } = body;

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const schedule = await prisma.autopilotSchedule.findFirst({
      where: {
        id: scheduleId,
        clientId: client.id,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Update the schedule
    const updated = await prisma.autopilotSchedule.update({
      where: { id: scheduleId },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      schedule: updated,
      message: isActive ? 'Planning geactiveerd' : 'Planning gepauzeerd',
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a schedule
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID required' },
        { status: 400 }
      );
    }

    // Verify ownership
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const schedule = await prisma.autopilotSchedule.findFirst({
      where: {
        id: scheduleId,
        clientId: client.id,
      },
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    // Delete the schedule
    await prisma.autopilotSchedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Planning verwijderd',
    });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
