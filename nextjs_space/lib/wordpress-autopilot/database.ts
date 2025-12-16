/**
 * WordPress Autopilot Database Helper
 * Database operations voor het WordPress Autopilot systeem
 */

import { prisma } from '@/lib/db';
import type {
  WordPressAutopilotSite,
  ContentStrategy,
  ContentCalendarItem,
  AutopilotSettings,
} from './types';

/**
 * Get all WordPress Autopilot sites for a client
 */
export async function getAutopilotSites(clientId: string): Promise<WordPressAutopilotSite[]> {
  const sites = await prisma.wordPressAutopilotSite.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
  });
  
  return sites as unknown as WordPressAutopilotSite[];
}

/**
 * Get a specific Autopilot site
 */
export async function getAutopilotSite(siteId: string): Promise<WordPressAutopilotSite | null> {
  const site = await prisma.wordPressAutopilotSite.findUnique({
    where: { id: siteId },
  });
  
  return site as unknown as WordPressAutopilotSite | null;
}

/**
 * Create a new Autopilot site
 */
export async function createAutopilotSite(
  data: Omit<WordPressAutopilotSite, 'id' | 'createdAt' | 'updatedAt' | 'totalPosts' | 'status'>
): Promise<WordPressAutopilotSite> {
  const site = await prisma.wordPressAutopilotSite.create({
    data: {
      ...data,
      status: 'active',
      totalPosts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
  });
  
  return site as unknown as WordPressAutopilotSite;
}

/**
 * Update Autopilot site
 */
export async function updateAutopilotSite(
  siteId: string,
  data: Partial<WordPressAutopilotSite>
): Promise<WordPressAutopilotSite> {
  const site = await prisma.wordPressAutopilotSite.update({
    where: { id: siteId },
    data: {
      ...data,
      updatedAt: new Date(),
    } as any,
  });
  
  return site as unknown as WordPressAutopilotSite;
}

/**
 * Delete Autopilot site
 */
export async function deleteAutopilotSite(siteId: string): Promise<void> {
  await prisma.wordPressAutopilotSite.delete({
    where: { id: siteId },
  });
}

/**
 * Get content strategy for a site
 */
export async function getContentStrategy(siteId: string): Promise<ContentStrategy | null> {
  const strategy = await prisma.contentStrategy.findFirst({
    where: { siteId },
    orderBy: { createdAt: 'desc' },
  });
  
  return strategy as unknown as ContentStrategy | null;
}

/**
 * Create or update content strategy
 */
export async function saveContentStrategy(
  data: Omit<ContentStrategy, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ContentStrategy> {
  // Check if strategy exists
  const existing = await prisma.contentStrategy.findFirst({
    where: { siteId: data.siteId },
  });
  
  if (existing) {
    const strategy = await prisma.contentStrategy.update({
      where: { id: existing.id },
      data: {
        ...data,
        updatedAt: new Date(),
      } as any,
    });
    return strategy as unknown as ContentStrategy;
  } else {
    const strategy = await prisma.contentStrategy.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
    return strategy as unknown as ContentStrategy;
  }
}

/**
 * Get content calendar for a site
 */
export async function getContentCalendar(
  siteId: string,
  options?: {
    status?: ContentCalendarItem['status'];
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ContentCalendarItem[]> {
  const where: any = { siteId };
  
  if (options?.status) {
    where.status = options.status;
  }
  
  if (options?.startDate || options?.endDate) {
    where.scheduledDate = {};
    if (options.startDate) {
      where.scheduledDate.gte = options.startDate;
    }
    if (options.endDate) {
      where.scheduledDate.lte = options.endDate;
    }
  }
  
  const items = await prisma.contentCalendarItem.findMany({
    where,
    orderBy: { scheduledDate: 'asc' },
    take: options?.limit,
  });
  
  return items as unknown as ContentCalendarItem[];
}

/**
 * Add items to content calendar
 */
export async function addToContentCalendar(
  items: Omit<ContentCalendarItem, 'id'>[] 
): Promise<ContentCalendarItem[]> {
  const created = await Promise.all(
    items.map(item =>
      prisma.contentCalendarItem.create({
        data: item as any,
      })
    )
  );
  
  return created as unknown as ContentCalendarItem[];
}

/**
 * Update content calendar item
 */
export async function updateContentCalendarItem(
  itemId: string,
  data: Partial<ContentCalendarItem>
): Promise<ContentCalendarItem> {
  const item = await prisma.contentCalendarItem.update({
    where: { id: itemId },
    data: data as any,
  });
  
  return item as unknown as ContentCalendarItem;
}

/**
 * Get Autopilot settings for a site
 */
export async function getAutopilotSettings(siteId: string): Promise<AutopilotSettings | null> {
  const settings = await prisma.autopilotSettings.findUnique({
    where: { siteId },
  });
  
  return settings as unknown as AutopilotSettings | null;
}

/**
 * Save Autopilot settings
 */
export async function saveAutopilotSettings(
  settings: AutopilotSettings
): Promise<AutopilotSettings> {
  const saved = await prisma.autopilotSettings.upsert({
    where: { siteId: settings.siteId },
    create: settings as any,
    update: settings as any,
  });
  
  return saved as unknown as AutopilotSettings;
}

/**
 * Get all active Autopilot sites (for scheduled tasks)
 */
export async function getActiveAutopilotSites(): Promise<WordPressAutopilotSite[]> {
  const sites = await prisma.wordPressAutopilotSite.findMany({
    where: { 
      status: 'active',
    },
  });
  
  return sites as unknown as WordPressAutopilotSite[];
}

/**
 * Get next scheduled posts (for cron job)
 */
export async function getNextScheduledPosts(limit: number = 10): Promise<ContentCalendarItem[]> {
  const now = new Date();
  
  const items = await prisma.contentCalendarItem.findMany({
    where: {
      status: 'scheduled',
      scheduledDate: {
        lte: now,
      },
    },
    orderBy: { scheduledDate: 'asc' },
    take: limit,
  });
  
  return items as unknown as ContentCalendarItem[];
}
