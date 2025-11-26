
/**
 * Article Scheduler - Automatic scheduling for article ideas
 * 
 * This utility automatically assigns publication dates to article ideas
 * based on project autopilot settings and scheduling preferences.
 */

import { prisma } from './db';

export interface SchedulingResult {
  success: boolean;
  scheduledCount: number;
  message: string;
  scheduledIdeas?: Array<{
    id: string;
    title: string;
    scheduledFor: Date;
  }>;
}

/**
 * Automatically schedule all article ideas for a project
 * based on its autopilot settings
 */
export async function scheduleArticleIdeas(
  projectId: string,
  clientId: string
): Promise<SchedulingResult> {
  try {
    // Haal project en autopilot settings op
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        autopilotSchedules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      return {
        success: false,
        scheduledCount: 0,
        message: 'Project niet gevonden',
      };
    }

    // Haal alle ongescheduleerde article ideas op (zonder scheduledFor datum)
    const unscheduledIdeas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId,
        status: 'idea',
        hasContent: false,
        scheduledFor: null,
      },
      orderBy: [
        { priority: 'desc' }, // High priority first
        { aiScore: 'desc' }, // High AI score second
        { searchVolume: 'desc' }, // High search volume third
        { createdAt: 'asc' }, // Oldest first
      ],
    });

    if (unscheduledIdeas.length === 0) {
      return {
        success: true,
        scheduledCount: 0,
        message: 'Geen ongescheduleerde ideeën gevonden',
      };
    }

    // Bepaal scheduling parameters
    const autopilotSchedule = project.autopilotSchedules[0];
    let scheduleParams: ScheduleParams;

    if (autopilotSchedule) {
      // Use autopilot settings
      scheduleParams = {
        frequency: autopilotSchedule.frequency || 'weekly',
        daysOfWeek: autopilotSchedule.daysOfWeek,
        dayOfWeek: autopilotSchedule.dayOfWeek,
        timeOfDay: autopilotSchedule.timeOfDay,
        articlesPerRun: autopilotSchedule.articlesPerRun,
      };
    } else {
      // Default settings: 1x per week on Monday at 09:00
      scheduleParams = {
        frequency: 'weekly',
        dayOfWeek: 1, // Monday
        timeOfDay: '09:00',
        articlesPerRun: 1,
      };
    }

    // Genereer planning datums
    const scheduleDates = generateScheduleDates(
      scheduleParams,
      unscheduledIdeas.length
    );

    // Wijs datums toe aan ideeën
    const scheduledIdeas = [];
    for (let i = 0; i < unscheduledIdeas.length; i++) {
      const idea = unscheduledIdeas[i];
      const scheduledDate = scheduleDates[i];

      await prisma.articleIdea.update({
        where: { id: idea.id },
        data: { scheduledFor: scheduledDate },
      });

      scheduledIdeas.push({
        id: idea.id,
        title: idea.title,
        scheduledFor: scheduledDate,
      });
    }

    return {
      success: true,
      scheduledCount: scheduledIdeas.length,
      message: `${scheduledIdeas.length} ideeën automatisch ingepland`,
      scheduledIdeas,
    };
  } catch (error: any) {
    console.error('Error scheduling article ideas:', error);
    return {
      success: false,
      scheduledCount: 0,
      message: error.message || 'Fout bij automatisch inplannen',
    };
  }
}

/**
 * Reschedule all ideas when project settings change
 * Maintains relative order but adjusts dates based on new settings
 */
export async function rescheduleAllIdeas(
  projectId: string,
  clientId: string
): Promise<SchedulingResult> {
  try {
    // Haal alle geplande ideeën op (behalve al gegenereerde content)
    const allIdeas = await prisma.articleIdea.findMany({
      where: {
        projectId,
        clientId,
        status: 'idea',
        hasContent: false,
      },
      orderBy: [
        { scheduledFor: 'asc' }, // Behoud volgorde
        { priority: 'desc' },
        { aiScore: 'desc' },
      ],
    });

    if (allIdeas.length === 0) {
      return {
        success: true,
        scheduledCount: 0,
        message: 'Geen ideeën om opnieuw in te plannen',
      };
    }

    // Reset alle scheduledFor datums
    await prisma.articleIdea.updateMany({
      where: {
        projectId,
        clientId,
        status: 'idea',
        hasContent: false,
      },
      data: { scheduledFor: null },
    });

    // Plan opnieuw in
    return await scheduleArticleIdeas(projectId, clientId);
  } catch (error: any) {
    console.error('Error rescheduling ideas:', error);
    return {
      success: false,
      scheduledCount: 0,
      message: error.message || 'Fout bij opnieuw inplannen',
    };
  }
}

interface ScheduleParams {
  frequency: string;
  daysOfWeek?: number[];
  dayOfWeek?: number | null;
  timeOfDay: string;
  articlesPerRun: number;
}

/**
 * Generate a list of scheduled dates based on frequency settings
 */
function generateScheduleDates(
  params: ScheduleParams,
  count: number
): Date[] {
  const dates: Date[] = [];
  const [hours, minutes] = params.timeOfDay.split(':').map(Number);

  let currentDate = new Date();
  currentDate.setHours(hours, minutes, 0, 0);

  // Start from tomorrow if current time has passed
  if (currentDate <= new Date()) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  while (dates.length < count) {
    const dateToAdd = getNextScheduleDate(
      currentDate,
      params.frequency,
      params.daysOfWeek,
      params.dayOfWeek
    );

    // Add multiple articles for the same date if articlesPerRun > 1
    for (let i = 0; i < params.articlesPerRun && dates.length < count; i++) {
      dates.push(new Date(dateToAdd));
    }

    // Move to next scheduling period
    currentDate = new Date(dateToAdd);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Get the next valid schedule date based on frequency
 */
function getNextScheduleDate(
  fromDate: Date,
  frequency: string,
  daysOfWeek?: number[],
  dayOfWeek?: number | null
): Date {
  const nextDate = new Date(fromDate);

  switch (frequency) {
    case 'once-daily':
    case 'twice-daily':
      // Daily - use the provided date
      return nextDate;

    case 'three-weekly':
      // Monday, Wednesday, Friday (1, 3, 5)
      while (![1, 3, 5].includes(nextDate.getDay())) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate;

    case 'custom-days':
      // Specific days of week
      if (daysOfWeek && daysOfWeek.length > 0) {
        while (!daysOfWeek.includes(nextDate.getDay())) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
      }
      return nextDate;

    case 'weekly':
      // Specific day of week
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
      }
      return nextDate;

    case 'monthly':
      // First available date (we'll use first day of next month)
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(1);
      return nextDate;

    default:
      // Default to weekly on Monday
      while (nextDate.getDay() !== 1) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      return nextDate;
  }
}

/**
 * Schedule a single new article idea
 * Finds the next available slot after existing scheduled ideas
 */
export async function scheduleNewIdea(
  ideaId: string,
  projectId: string,
  clientId: string
): Promise<Date | null> {
  try {
    // Find the latest scheduled idea
    const latestIdea = await prisma.articleIdea.findFirst({
      where: {
        projectId,
        clientId,
        status: 'idea',
        hasContent: false,
        scheduledFor: { not: null },
      },
      orderBy: { scheduledFor: 'desc' },
    });

    // Get autopilot settings
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        autopilotSchedules: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!project) return null;

    const autopilotSchedule = project.autopilotSchedules[0];
    const scheduleParams: ScheduleParams = autopilotSchedule
      ? {
          frequency: autopilotSchedule.frequency || 'weekly',
          daysOfWeek: autopilotSchedule.daysOfWeek,
          dayOfWeek: autopilotSchedule.dayOfWeek,
          timeOfDay: autopilotSchedule.timeOfDay,
          articlesPerRun: autopilotSchedule.articlesPerRun,
        }
      : {
          frequency: 'weekly',
          dayOfWeek: 1,
          timeOfDay: '09:00',
          articlesPerRun: 1,
        };

    // Calculate next date
    let nextDate: Date;
    if (latestIdea?.scheduledFor) {
      // Schedule after the latest one
      const latestDate = new Date(latestIdea.scheduledFor);
      latestDate.setDate(latestDate.getDate() + 1);
      nextDate = getNextScheduleDate(
        latestDate,
        scheduleParams.frequency,
        scheduleParams.daysOfWeek,
        scheduleParams.dayOfWeek
      );
    } else {
      // No scheduled ideas yet, use current date
      const [hours, minutes] = scheduleParams.timeOfDay.split(':').map(Number);
      nextDate = new Date();
      nextDate.setHours(hours, minutes, 0, 0);
      if (nextDate <= new Date()) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      nextDate = getNextScheduleDate(
        nextDate,
        scheduleParams.frequency,
        scheduleParams.daysOfWeek,
        scheduleParams.dayOfWeek
      );
    }

    // Update the idea
    await prisma.articleIdea.update({
      where: { id: ideaId },
      data: { scheduledFor: nextDate },
    });

    return nextDate;
  } catch (error: any) {
    console.error('Error scheduling new idea:', error);
    return null;
  }
}
