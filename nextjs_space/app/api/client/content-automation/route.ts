
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// GET - Haal alle automations op voor client
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;

    const automations = await prisma.contentAutomation.findMany({
      where: { clientId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ automations });
  } catch (error: any) {
    console.error('❌ Error fetching automations:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van automations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Maak nieuwe automation
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;

    const body = await req.json();
    const {
      projectId,
      frequency,
      dayOfWeek,
      dayOfMonth,
      timeOfDay,
      websiteUrl,
      customInstructions,
      includeImages,
      includeBolcomProducts,
      numberOfImages,
      autoPublishWordpress,
      wordpressStatus,
      wordpressCategories,
      wordpressTags,
    } = body;

    // Calculate next run time
    const nextRunAt = calculateNextRun(frequency, dayOfWeek, dayOfMonth, timeOfDay);

    const automation = await prisma.contentAutomation.create({
      data: {
        clientId,
        projectId: projectId || null,
        frequency,
        dayOfWeek: dayOfWeek || null,
        dayOfMonth: dayOfMonth || null,
        timeOfDay: timeOfDay || '09:00',
        websiteUrl,
        customInstructions,
        includeImages: includeImages ?? true,
        includeBolcomProducts: includeBolcomProducts ?? false,
        numberOfImages: numberOfImages || 12,
        autoPublishWordpress: autoPublishWordpress ?? false,
        wordpressStatus: wordpressStatus || 'draft',
        wordpressCategories: wordpressCategories || [],
        wordpressTags: wordpressTags || [],
        nextRunAt,
      },
      include: {
        project: true,
      },
    });

    return NextResponse.json({
      success: true,
      automation,
      message: 'Automation succesvol aangemaakt!',
    });
  } catch (error: any) {
    console.error('❌ Error creating automation:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de automation' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate next run time
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
      // If time has passed today, schedule for tomorrow
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case '3x_week':
      // Monday, Wednesday, Friday (1, 3, 5)
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
        // Default to next Monday
        nextRun = new Date(now);
        nextRun.setDate(nextRun.getDate() + ((1 + 7 - nextRun.getDay()) % 7 || 7));
        nextRun.setHours(hours, minutes, 0, 0);
      }
      break;

    case 'weekly':
      // Specific day of week
      const targetDay = dayOfWeek ?? 1; // Default to Monday
      const currentDayOfWeek = nextRun.getDay();
      let daysUntilTarget = (targetDay - currentDayOfWeek + 7) % 7;
      
      if (daysUntilTarget === 0 && nextRun <= now) {
        daysUntilTarget = 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case 'monthly':
      // Specific day of month
      const targetDate = dayOfMonth ?? 1;
      nextRun.setDate(targetDate);
      
      if (nextRun <= now) {
        // Move to next month
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;

    default:
      // Default to next day
      nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}
