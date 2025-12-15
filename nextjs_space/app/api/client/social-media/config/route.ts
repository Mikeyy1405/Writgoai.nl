
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Calculate next scheduled run based on frequency and settings
 */
function calculateNextRun(
  lastRun: Date,
  frequency: string,
  scheduleDays: string[],
  scheduleTime: string
): Date {
  const nextRun = new Date(lastRun);
  const [hours, minutes] = scheduleTime.split(':').map(Number);

  if (frequency === 'daily') {
    // Run every day at the scheduled time
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  } else if (frequency === 'weekly' || frequency === 'custom-days') {
    // Run on specific days of the week
    const daysMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    if (!scheduleDays || scheduleDays.length === 0) {
      // Default to next week if no days specified
      nextRun.setDate(nextRun.getDate() + 7);
      nextRun.setHours(hours, minutes, 0, 0);
      return nextRun;
    }

    // Find the next scheduled day
    const currentDay = nextRun.getDay();
    const scheduledDayNumbers = scheduleDays.map(day => daysMap[day.toLowerCase()]).sort((a, b) => a - b);

    let daysUntilNext = 7; // Default to next week
    for (const day of scheduledDayNumbers) {
      let diff = day - currentDay;
      if (diff <= 0) diff += 7; // Move to next week if day has passed
      if (diff < daysUntilNext) daysUntilNext = diff;
    }

    nextRun.setDate(nextRun.getDate() + daysUntilNext);
    nextRun.setHours(hours, minutes, 0, 0);
  } else {
    // Default to daily if unknown frequency
    nextRun.setDate(nextRun.getDate() + 1);
    nextRun.setHours(hours, minutes, 0, 0);
  }

  return nextRun;
}

/**
 * GET /api/client/social-media/config
 * Get social media configuration for a project
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get or create social media config
    let config = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    if (!config) {
      // Create default config
      config = await prisma.socialMediaConfig.create({
        data: {
          projectId,
          autopilotEnabled: false,
          postsPerWeek: 3,
          contentTypes: ['blog_promo', 'tips'],
          includeHashtags: true,
          includeEmojis: true,
          scheduleDays: ['monday', 'wednesday', 'friday'],
          scheduleTime: '09:00',
          timezone: 'Europe/Amsterdam',
          autoPublishBlog: false,
          autoApprove: false,
        },
      });
    }

    // Return config (no API key masking needed anymore)
    return NextResponse.json({
      config: config,
      hasProfile: !!config.lateDevProfileId,
      connectedAccounts: config.connectedAccounts || [],
    });
  } catch (error) {
    console.error('Error fetching social media config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/social-media/config
 * Update social media configuration
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, ...configData } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing config
    const existingConfig = await prisma.socialMediaConfig.findUnique({
      where: { projectId },
    });

    // Calculate next scheduled run if autopilot is enabled
    if (configData.autopilotEnabled && configData.scheduleFrequency && configData.scheduleDays && configData.scheduleTime) {
      configData.nextScheduledRun = calculateNextRun(
        new Date(),
        configData.scheduleFrequency,
        configData.scheduleDays,
        configData.scheduleTime
      );
    }

    // Update or create config
    const config = await prisma.socialMediaConfig.upsert({
      where: { projectId },
      update: configData,
      create: {
        projectId,
        ...configData,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Error updating social media config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}
