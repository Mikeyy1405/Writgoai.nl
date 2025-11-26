
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// PATCH - Update automation
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.contentAutomation.findFirst({
      where: { id, clientId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    // Recalculate nextRunAt if frequency or time changed
    let nextRunAt = existing.nextRunAt;
    if (
      body.frequency !== undefined ||
      body.dayOfWeek !== undefined ||
      body.dayOfMonth !== undefined ||
      body.timeOfDay !== undefined
    ) {
      nextRunAt = calculateNextRun(
        body.frequency ?? existing.frequency,
        body.dayOfWeek ?? existing.dayOfWeek ?? undefined,
        body.dayOfMonth ?? existing.dayOfMonth ?? undefined,
        body.timeOfDay ?? existing.timeOfDay
      );
    }

    const automation = await prisma.contentAutomation.update({
      where: { id },
      data: {
        ...body,
        nextRunAt,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      automation,
      message: 'Automation bijgewerkt!',
    });
  } catch (error: any) {
    console.error('❌ Error updating automation:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Verwijder automation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await prisma.contentAutomation.findFirst({
      where: { id, clientId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    await prisma.contentAutomation.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Automation verwijderd!',
    });
  } catch (error: any) {
    console.error('❌ Error deleting automation:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verwijderen' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  timeOfDay?: string
): Date {
  const now = new Date();
  const [hours, minutes] = (timeOfDay || '09:00').split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case '3x_week':
      const daysFor3x = [1, 3, 5];
      let currentDay = nextRun.getDay();
      let found = false;
      
      for (let i = 0; i < 7; i++) {
        if (daysFor3x.includes(currentDay) && nextRun > now) {
          found = true;
          break;
        }
        nextRun.setDate(nextRun.getDate() + 1);
        currentDay = nextRun.getDay();
      }
      
      if (!found) {
        nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + ((1 + 7 - nextRun.getDay()) % 7 || 7));
        nextRun.setHours(hours, minutes, 0, 0);
      }
      break;

    case 'weekly':
      const targetDay = dayOfWeek ?? 1;
      const currentDayOfWeek = nextRun.getDay();
      let daysUntilTarget = (targetDay - currentDayOfWeek + 7) % 7;
      
      if (daysUntilTarget === 0 && nextRun <= now) {
        daysUntilTarget = 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case 'monthly':
      const targetDate = dayOfMonth ?? 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;

    default:
      nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}
