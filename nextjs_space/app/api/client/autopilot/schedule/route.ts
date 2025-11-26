
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List all schedules
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const schedules = await prisma.autopilotSchedule.findMany({
      where: {
        clientId: client.id,
        ...(projectId && { projectId }),
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Kon schedules niet ophalen' },
      { status: 500 }
    );
  }
}

// POST - Create new schedule
export async function POST(request: Request) {
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
    const {
      name,
      projectId,
      scheduleType,
      scheduledDate,
      frequency,
      dayOfWeek,
      daysOfWeek, // NEW: Multiple days for custom-days frequency
      dayOfMonth,
      timeOfDay,
      secondTimeOfDay,
      customInterval,
      articleIds,
      articlesPerRun,
      autoPublish,
      notifyOnCompletion,
      // Content generation settings
      contentType,
      includeAffiliateLinks,
      includeBolcomProducts,
      includeImages,
      // NEW: Auto-select mode
      autoSelectMode,
    } = body;

    // Validation
    // If auto-select mode is enabled, articleIds can be empty
    if (!name || !projectId || !scheduleType) {
      return NextResponse.json(
        { error: 'Vul alle verplichte velden in' },
        { status: 400 }
      );
    }

    // If NOT in auto-select mode, articleIds are required
    if (!autoSelectMode && (!articleIds || articleIds.length === 0)) {
      return NextResponse.json(
        { error: 'Selecteer minimaal één artikel of schakel automatische selectie in' },
        { status: 400 }
      );
    }

    // Calculate nextRunAt
    let nextRunAt: Date;
    
    // For recurring schedules, calculate next run
    nextRunAt = calculateNextRun(
      scheduleType,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      customInterval,
      daysOfWeek || [] // NEW: Pass multiple days for custom-days frequency
    );

    const schedule = await prisma.autopilotSchedule.create({
      data: {
        clientId: client.id,
        projectId,
        name,
        scheduleType,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        frequency,
        dayOfWeek,
        daysOfWeek: daysOfWeek || [], // NEW: Multiple days for custom-days frequency
        dayOfMonth,
        timeOfDay: timeOfDay || '09:00',
        secondTimeOfDay,
        customInterval,
        articleIds: articleIds || [], // Empty array if auto-select mode
        autoSelectMode: autoSelectMode === true, // NEW: Store auto-select mode
        articlesPerRun: articlesPerRun || 1,
        autoPublish: autoPublish !== false,
        notifyOnCompletion: notifyOnCompletion !== false,
        // Content generation settings
        contentType: contentType || 'blog',
        includeAffiliateLinks: includeAffiliateLinks !== false,
        includeBolcomProducts: includeBolcomProducts !== false,
        includeImages: includeImages !== false,
        nextRunAt,
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

    return NextResponse.json({
      success: true,
      schedule,
      message: 'Planning succesvol aangemaakt',
    });
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return NextResponse.json(
      { error: 'Kon planning niet aanmaken' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run time
function calculateNextRun(
  scheduleType: string,
  frequency: string | null,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  timeOfDay: string,
  customInterval: number | null,
  daysOfWeek: number[] = [] // NEW: Multiple days for custom-days
): Date {
  const now = new Date();
  const [hours, minutes] = (timeOfDay || '09:00').split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);

  // If time has passed today, start from tomorrow
  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  switch (scheduleType) {
    case 'once-daily':
    case 'twice-daily':
      // Run every day (twice-daily will handle second run separately)
      // Already set to tomorrow if needed
      break;
      
    case 'three-weekly':
      // Run Monday, Wednesday, Friday
      // Find next Monday, Wednesday, or Friday
      while (![1, 3, 5].includes(nextRun.getDay())) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'custom-days':
      // NEW: Run on specific days of the week (e.g., Monday, Wednesday, Friday)
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find the next occurrence of any selected day
        while (!daysOfWeek.includes(nextRun.getDay())) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'weekly':
      if (dayOfWeek !== null) {
        while (nextRun.getDay() !== dayOfWeek) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
      }
      break;
      
    case 'monthly':
      if (dayOfMonth !== null) {
        nextRun.setDate(dayOfMonth);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }
      break;
  }

  return nextRun;
}
