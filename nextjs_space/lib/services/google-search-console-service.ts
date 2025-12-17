/**
 * Google Search Console Service
 * 
 * Features:
 * - Data sync van GSC naar database
 * - Performance tracking per URL
 * - Automatische alerts bij performance drops
 * - AI-powered improvement tips
 */

import { GoogleSearchConsole } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/**
 * Sync GSC data voor een project
 */
export async function syncGSCData(projectId: string): Promise<{ success: boolean; rowsProcessed: number; urlsProcessed: number }> {
  try {
    console.log(`[GSC Sync] Starting sync for project ${projectId}`);
    
    // Get project with GSC credentials
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        website: true,
        google_search_console_token: true,
        google_search_console_refresh_token: true,
      }
    });
    
    if (!project || !project.google_search_console_token) {
      console.log(`[GSC Sync] Project ${projectId} has no GSC connection`);
      return { success: false, rowsProcessed: 0, urlsProcessed: 0 };
    }
    
    // Update sync status
    await prisma.gSCSyncStatus.upsert({
      where: { projectId },
      create: {
        projectId,
        lastSyncStatus: 'in_progress',
        nextSyncAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
      },
      update: {
        lastSyncStatus: 'in_progress',
        updatedAt: new Date()
      }
    });
    
    // Initialize GSC client
    const gsc = new GoogleSearchConsole(
      project.google_search_console_token,
      project.google_search_console_refresh_token || undefined
    );
    
    // Fetch last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Fetch performance data per URL and date
    console.log(`[GSC Sync] Fetching data from ${startDate} to ${endDate}`);
    const performanceData = await gsc.getPerformanceOverTime(project.website, startDate, endDate);
    
    // Fetch top pages for the period
    const topPages = await gsc.getTopPages(project.website, startDate, endDate, 100);
    
    console.log(`[GSC Sync] Fetched ${topPages.length} top pages`);
    
    let rowsProcessed = 0;
    const urlSet = new Set<string>();
    
    // Process each page
    for (const page of topPages) {
      urlSet.add(page.page);
      
      // Save daily performance data (using aggregate if we don't have daily breakdown)
      await prisma.gSCPerformance.upsert({
        where: {
          projectId_url_date: {
            projectId,
            url: page.page,
            date: new Date(endDate)
          }
        },
        create: {
          projectId,
          url: page.page,
          date: new Date(endDate),
          impressions: page.impressions || 0,
          clicks: page.clicks || 0,
          ctr: page.ctr || 0,
          position: page.position || 0
        },
        update: {
          impressions: page.impressions || 0,
          clicks: page.clicks || 0,
          ctr: page.ctr || 0,
          position: page.position || 0
        }
      });
      
      rowsProcessed++;
    }
    
    // Update sync status
    await prisma.gSCSyncStatus.update({
      where: { projectId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'success',
        totalUrls: urlSet.size,
        updatedAt: new Date()
      }
    });
    
    console.log(`[GSC Sync] Sync completed: ${rowsProcessed} rows, ${urlSet.size} URLs`);
    
    // Generate alerts and tips
    await generatePerformanceAlerts(projectId);
    await generateImprovementTips(projectId);
    
    return { success: true, rowsProcessed, urlsProcessed: urlSet.size };
    
  } catch (error: any) {
    console.error('[GSC Sync] Error:', error);
    
    await prisma.gSCSyncStatus.update({
      where: { projectId },
      data: {
        lastSyncStatus: 'error',
        lastSyncError: error.message,
        updatedAt: new Date()
      }
    });
    
    throw error;
  }
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Generate performance alerts for significant changes
 */
async function generatePerformanceAlerts(projectId: string) {
  try {
    console.log(`[Alerts] Generating alerts for project ${projectId}`);
    
    // Get last 7 days vs previous 7 days
    const today = new Date();
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    // Get URLs with data
    const urls = await prisma.gSCPerformance.findMany({
      where: {
        projectId,
        date: { gte: previous7Days }
      },
      select: { url: true },
      distinct: ['url']
    });
    
    console.log(`[Alerts] Analyzing ${urls.length} URLs`);
    
    for (const { url } of urls) {
      // Calculate metrics for last 7 days
      const recent = await prisma.gSCPerformance.aggregate({
        where: {
          projectId,
          url,
          date: { gte: last7Days, lte: today }
        },
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true }
      });
      
      // Calculate metrics for previous 7 days
      const previous = await prisma.gSCPerformance.aggregate({
        where: {
          projectId,
          url,
          date: { gte: previous7Days, lt: last7Days }
        },
        _sum: { clicks: true, impressions: true },
        _avg: { ctr: true, position: true }
      });
      
      // Skip if no previous data
      if (!previous._sum.clicks && !previous._sum.impressions) continue;
      
      // Check for significant drops
      const clicksChange = calculatePercentageChange(
        previous._sum.clicks || 0,
        recent._sum.clicks || 0
      );
      
      const impressionsChange = calculatePercentageChange(
        previous._sum.impressions || 0,
        recent._sum.impressions || 0
      );
      
      const positionChange = (recent._avg.position || 0) - (previous._avg.position || 0);
      
      // Generate alerts for clicks drop
      if (clicksChange < -20 && previous._sum.clicks && previous._sum.clicks > 10) {
        await prisma.performanceAlert.create({
          data: {
            projectId,
            url,
            alertType: 'clicks_drop',
            severity: clicksChange < -50 ? 'critical' : clicksChange < -30 ? 'high' : 'medium',
            message: `Clicks gedaald met ${Math.abs(clicksChange).toFixed(1)}% in de laatste 7 dagen`,
            oldValue: previous._sum.clicks || 0,
            newValue: recent._sum.clicks || 0,
            percentageChange: clicksChange
          }
        });
      }
      
      // Generate alerts for position drop (higher number = worse ranking)
      if (positionChange > 5 && previous._avg.position && previous._avg.position > 0) {
        await prisma.performanceAlert.create({
          data: {
            projectId,
            url,
            alertType: 'position_drop',
            severity: positionChange > 20 ? 'critical' : positionChange > 10 ? 'high' : 'medium',
            message: `Positie verslechterd met ${positionChange.toFixed(1)} posities (van ${previous._avg.position.toFixed(1)} naar ${(recent._avg.position || 0).toFixed(1)})`,
            oldValue: previous._avg.position || 0,
            newValue: recent._avg.position || 0,
            percentageChange: positionChange
          }
        });
      }
      
      // Generate alerts for impressions drop
      if (impressionsChange < -30 && previous._sum.impressions && previous._sum.impressions > 50) {
        await prisma.performanceAlert.create({
          data: {
            projectId,
            url,
            alertType: 'impressions_drop',
            severity: impressionsChange < -60 ? 'critical' : impressionsChange < -40 ? 'high' : 'medium',
            message: `Impressions gedaald met ${Math.abs(impressionsChange).toFixed(1)}% in de laatste 7 dagen`,
            oldValue: previous._sum.impressions || 0,
            newValue: recent._sum.impressions || 0,
            percentageChange: impressionsChange
          }
        });
      }
    }
    
    console.log(`[Alerts] Generated alerts for ${urls.length} URLs`);
    
  } catch (error) {
    console.error('[Alerts] Error:', error);
  }
}

/**
 * Generate AI-powered improvement tips
 */
async function generateImprovementTips(projectId: string) {
  try {
    console.log(`[Tips] Generating improvement tips for project ${projectId}`);
    
    // Get URLs with poor performance (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const poorPerformers = await prisma.$queryRaw<Array<{
      url: string;
      avg_ctr: number;
      avg_position: number;
      total_clicks: number;
      total_impressions: number;
    }>>`
      SELECT 
        url,
        AVG(ctr) as avg_ctr,
        AVG(position) as avg_position,
        SUM(clicks) as total_clicks,
        SUM(impressions) as total_impressions
      FROM "GSCPerformance"
      WHERE "projectId" = ${projectId}
        AND date >= ${thirtyDaysAgo}
      GROUP BY url
      HAVING 
        AVG(position) > 10 
        OR AVG(ctr) < 0.02 
        OR SUM(clicks) < 10
      LIMIT 50
    `;
    
    console.log(`[Tips] Found ${poorPerformers.length} URLs needing improvement`);
    
    // Delete old tips for these URLs to avoid duplicates
    const urls = poorPerformers.map(p => p.url);
    if (urls.length > 0) {
      await prisma.improvementTip.deleteMany({
        where: {
          projectId,
          url: { in: urls },
          isCompleted: false
        }
      });
    }
    
    for (const perf of poorPerformers) {
      const tips = [];
      
      // Low CTR tip
      if (perf.avg_ctr < 0.02) {
        tips.push({
          tipType: 'meta_description',
          priority: 'high',
          title: 'Verbeter Meta Description',
          description: `CTR is slechts ${(perf.avg_ctr * 100).toFixed(2)}%. Optimaliseer je title en meta description om de click-through rate te verhogen.`,
          actionItems: [
            'Voeg cijfers of jaartallen toe aan de title',
            'Gebruik power words (Beste, Ultieme, Complete)',
            'Maak de meta description aantrekkelijker',
            'Voeg een duidelijke call-to-action toe'
          ]
        });
      }
      
      // Poor position tip
      if (perf.avg_position > 10) {
        tips.push({
          tipType: 'keyword_optimization',
          priority: 'high',
          title: 'Verbeter Keyword Optimalisatie',
          description: `Gemiddelde positie is ${perf.avg_position.toFixed(1)}. Optimaliseer je content voor betere rankings.`,
          actionItems: [
            'Voeg meer relevante keywords toe',
            'Verbeter de diepgang en kwaliteit van de content',
            'Voeg interne links toe vanuit high-authority paginas',
            'Update de content met verse informatie'
          ]
        });
      }
      
      // Low clicks but high impressions = CTR problem
      if (perf.total_clicks < 50 && perf.total_impressions > 500) {
        tips.push({
          tipType: 'meta_description',
          priority: 'urgent',
          title: 'CTR Probleem: Veel Impressions, Weinig Clicks',
          description: `Je pagina wordt ${perf.total_impressions} keer getoond maar krijgt maar ${perf.total_clicks} clicks. Dit is een CTR probleem.`,
          actionItems: [
            'Herschrijf de title met een duidelijker voordeel',
            'Voeg een unieke selling point toe',
            'Test verschillende meta descriptions',
            'Zorg dat title en beschrijving overeenkomen met zoekintentie'
          ]
        });
      }
      
      // Low traffic overall
      if (perf.total_clicks < 10 && perf.total_impressions < 100) {
        tips.push({
          tipType: 'content_update',
          priority: 'medium',
          title: 'Content Update Nodig',
          description: `Slechts ${perf.total_clicks} clicks en ${perf.total_impressions} impressions in 30 dagen. Content is mogelijk verouderd of niet relevant.`,
          actionItems: [
            'Update met het huidige jaar',
            'Voeg nieuwe informatie en statistieken toe',
            'Verbeter content structuur met H2/H3 headings',
            'Voeg afbeeldingen en videos toe',
            'Promoot de content via social media'
          ]
        });
      }
      
      // Save tips
      for (const tip of tips) {
        await prisma.improvementTip.create({
          data: {
            projectId,
            url: perf.url,
            ...tip
          }
        });
      }
    }
    
    console.log(`[Tips] Generated tips for ${poorPerformers.length} URLs`);
    
  } catch (error) {
    console.error('[Tips] Error:', error);
  }
}

/**
 * Get performance data for a specific URL
 */
export async function getUrlPerformance(projectId: string, url: string, days: number = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return await prisma.gSCPerformance.findMany({
    where: {
      projectId,
      url,
      date: { gte: startDate }
    },
    orderBy: { date: 'desc' }
  });
}

/**
 * Get all performance alerts for a project
 */
export async function getPerformanceAlerts(projectId: string, unreadOnly: boolean = false) {
  return await prisma.performanceAlert.findMany({
    where: {
      projectId,
      ...(unreadOnly && { isRead: false })
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string) {
  return await prisma.performanceAlert.update({
    where: { id: alertId },
    data: { isRead: true }
  });
}

/**
 * Get improvement tips for a project
 */
export async function getImprovementTips(projectId: string, completedOnly: boolean = false) {
  return await prisma.improvementTip.findMany({
    where: {
      projectId,
      isCompleted: completedOnly
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 50
  });
}

/**
 * Mark tip as completed
 */
export async function markTipAsCompleted(tipId: string) {
  return await prisma.improvementTip.update({
    where: { id: tipId },
    data: {
      isCompleted: true,
      completedAt: new Date()
    }
  });
}

/**
 * Get GSC sync status
 */
export async function getSyncStatus(projectId: string) {
  return await prisma.gSCSyncStatus.findUnique({
    where: { projectId }
  });
}

/**
 * Get top performing URLs
 */
export async function getTopPerformingUrls(projectId: string, days: number = 30, limit: number = 20) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const results = await prisma.$queryRaw<Array<{
    url: string;
    total_clicks: number;
    total_impressions: number;
    avg_ctr: number;
    avg_position: number;
  }>>`
    SELECT 
      url,
      SUM(clicks) as total_clicks,
      SUM(impressions) as total_impressions,
      AVG(ctr) as avg_ctr,
      AVG(position) as avg_position
    FROM "GSCPerformance"
    WHERE "projectId" = ${projectId}
      AND date >= ${startDate}
    GROUP BY url
    ORDER BY total_clicks DESC
    LIMIT ${limit}
  `;
  
  return results;
}
