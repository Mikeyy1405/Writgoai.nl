/**
 * Google Algorithm Updates Tracker
 * 
 * Tracks Google algorithm updates and analyzes their impact on projects
 */

import { prisma } from '@/lib/db';

/**
 * Known Google algorithm updates
 * This should be updated regularly or fetched from an external source
 */
const KNOWN_UPDATES = [
  {
    name: 'December 2024 Core Update',
    date: '2024-12-05',
    type: 'core' as const,
    description: 'Google released a core algorithm update affecting search rankings globally. Focus on content quality and user experience.',
    impactLevel: 'major' as const,
    officialUrl: 'https://developers.google.com/search/blog'
  },
  {
    name: 'November 2024 Spam Update',
    date: '2024-11-14',
    type: 'spam' as const,
    description: 'Targeting spammy and low-quality content, automated content, and link schemes.',
    impactLevel: 'moderate' as const,
    officialUrl: 'https://developers.google.com/search/blog'
  },
  {
    name: 'October 2024 Helpful Content Update',
    date: '2024-10-10',
    type: 'helpful_content' as const,
    description: 'Promoting content written by people, for people. De-prioritizing AI-generated content without human oversight.',
    impactLevel: 'major' as const,
    officialUrl: 'https://developers.google.com/search/blog'
  },
  {
    name: 'September 2024 Product Reviews Update',
    date: '2024-09-12',
    type: 'product_reviews' as const,
    description: 'Rewarding in-depth product reviews with original research and hands-on testing.',
    impactLevel: 'moderate' as const,
    officialUrl: 'https://developers.google.com/search/blog'
  }
];

/**
 * Track and store Google algorithm updates
 */
export async function trackGoogleUpdates() {
  try {
    console.log('[Google Updates] Checking for new updates');
    
    for (const update of KNOWN_UPDATES) {
      await prisma.googleUpdate.upsert({
        where: {
          name_date: {
            name: update.name,
            date: new Date(update.date)
          }
        },
        create: {
          name: update.name,
          date: new Date(update.date),
          type: update.type,
          description: update.description,
          impactLevel: update.impactLevel,
          officialUrl: update.officialUrl
        },
        update: {
          description: update.description,
          impactLevel: update.impactLevel,
          officialUrl: update.officialUrl
        }
      });
    }
    
    console.log(`[Google Updates] Tracked ${KNOWN_UPDATES.length} updates`);
    
    // Analyze impact on all projects
    await analyzeUpdateImpact();
    
  } catch (error) {
    console.error('[Google Updates] Error:', error);
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
 * Analyze the impact of Google updates on projects
 */
async function analyzeUpdateImpact() {
  try {
    console.log('[Update Impact] Analyzing impact on all projects');
    
    // Get recent updates (last 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentUpdates = await prisma.googleUpdate.findMany({
      where: {
        date: { gte: ninetyDaysAgo }
      }
    });
    
    if (recentUpdates.length === 0) {
      console.log('[Update Impact] No recent updates to analyze');
      return;
    }
    
    // Get all projects with GSC data
    const projects = await prisma.project.findMany({
      where: {
        google_search_console_token: { not: null }
      },
      select: { id: true }
    });
    
    console.log(`[Update Impact] Analyzing ${recentUpdates.length} updates for ${projects.length} projects`);
    
    for (const update of recentUpdates) {
      for (const project of projects) {
        // Check if already analyzed
        const existingImpact = await prisma.updateImpact.findUnique({
          where: {
            projectId_updateId: {
              projectId: project.id,
              updateId: update.id
            }
          }
        });
        
        if (existingImpact) {
          continue; // Skip already analyzed
        }
        
        // Compare performance before and after update (7 days window)
        const updateDate = new Date(update.date);
        const beforeStart = new Date(updateDate);
        beforeStart.setDate(beforeStart.getDate() - 14); // 14 days before
        const beforeEnd = new Date(updateDate);
        beforeEnd.setDate(beforeEnd.getDate() - 1); // 1 day before update
        
        const afterStart = new Date(updateDate);
        const afterEnd = new Date(updateDate);
        afterEnd.setDate(afterEnd.getDate() + 14); // 14 days after
        
        // Get performance before update
        const before = await prisma.gSCPerformance.aggregate({
          where: {
            projectId: project.id,
            date: { gte: beforeStart, lte: beforeEnd }
          },
          _sum: { clicks: true, impressions: true },
          _avg: { position: true }
        });
        
        // Get performance after update
        const after = await prisma.gSCPerformance.aggregate({
          where: {
            projectId: project.id,
            date: { gte: afterStart, lte: afterEnd }
          },
          _sum: { clicks: true, impressions: true },
          _avg: { position: true }
        });
        
        // Skip if no data
        if (!before._sum.clicks && !after._sum.clicks) {
          continue;
        }
        
        // Calculate changes
        const clicksChange = calculatePercentageChange(
          before._sum.clicks || 0,
          after._sum.clicks || 0
        );
        
        const impressionsChange = calculatePercentageChange(
          before._sum.impressions || 0,
          after._sum.impressions || 0
        );
        
        const positionChange = (after._avg.position || 0) - (before._avg.position || 0);
        
        // Calculate impact score (-100 to +100)
        // Positive clicks/impressions = good, negative position change = good (lower is better)
        const impactScore = (clicksChange * 0.5) + (impressionsChange * 0.3) - (positionChange * 5);
        
        // Get top affected URLs
        const affectedUrls = await getAffectedUrls(
          project.id,
          beforeStart,
          beforeEnd,
          afterStart,
          afterEnd
        );
        
        // Generate analysis
        const analysis = generateImpactAnalysis(
          update.name,
          impactScore,
          clicksChange,
          impressionsChange,
          positionChange
        );
        
        // Save impact analysis
        await prisma.updateImpact.create({
          data: {
            projectId: project.id,
            updateId: update.id,
            impactScore: Math.round(impactScore * 100) / 100,
            clicksChange: Math.round(clicksChange * 100) / 100,
            impressionsChange: Math.round(impressionsChange * 100) / 100,
            positionChange: Math.round(positionChange * 100) / 100,
            affectedUrls: affectedUrls,
            analysis
          }
        });
      }
    }
    
    console.log('[Update Impact] Analysis completed');
    
  } catch (error) {
    console.error('[Update Impact] Error:', error);
  }
}

/**
 * Get top URLs affected by an update
 */
async function getAffectedUrls(
  projectId: string,
  beforeStart: Date,
  beforeEnd: Date,
  afterStart: Date,
  afterEnd: Date
): Promise<any[]> {
  try {
    // Get URLs with significant changes
    const urls = await prisma.$queryRaw<Array<{
      url: string;
      clicks_before: number;
      clicks_after: number;
      position_before: number;
      position_after: number;
    }>>`
      WITH before_data AS (
        SELECT 
          url,
          SUM(clicks) as clicks,
          AVG(position) as position
        FROM "GSCPerformance"
        WHERE "projectId" = ${projectId}
          AND date >= ${beforeStart}
          AND date <= ${beforeEnd}
        GROUP BY url
      ),
      after_data AS (
        SELECT 
          url,
          SUM(clicks) as clicks,
          AVG(position) as position
        FROM "GSCPerformance"
        WHERE "projectId" = ${projectId}
          AND date >= ${afterStart}
          AND date <= ${afterEnd}
        GROUP BY url
      )
      SELECT 
        COALESCE(b.url, a.url) as url,
        COALESCE(b.clicks, 0) as clicks_before,
        COALESCE(a.clicks, 0) as clicks_after,
        COALESCE(b.position, 0) as position_before,
        COALESCE(a.position, 0) as position_after
      FROM before_data b
      FULL OUTER JOIN after_data a ON b.url = a.url
      WHERE ABS(COALESCE(a.clicks, 0) - COALESCE(b.clicks, 0)) > 5
         OR ABS(COALESCE(a.position, 0) - COALESCE(b.position, 0)) > 3
      ORDER BY ABS(COALESCE(a.clicks, 0) - COALESCE(b.clicks, 0)) DESC
      LIMIT 10
    `;
    
    return urls.map(u => ({
      url: u.url,
      clicksBefore: u.clicks_before,
      clicksAfter: u.clicks_after,
      clicksChange: calculatePercentageChange(u.clicks_before, u.clicks_after),
      positionBefore: u.position_before,
      positionAfter: u.position_after,
      positionChange: u.position_after - u.position_before
    }));
    
  } catch (error) {
    console.error('[Affected URLs] Error:', error);
    return [];
  }
}

/**
 * Generate human-readable impact analysis
 */
function generateImpactAnalysis(
  updateName: string,
  impactScore: number,
  clicksChange: number,
  impressionsChange: number,
  positionChange: number
): string {
  let analysis = `**Impact van ${updateName}:**\n\n`;
  
  if (impactScore > 10) {
    analysis += `✅ **Positieve impact** - Je website presteert beter na deze update.\n\n`;
    analysis += `- Clicks: ${clicksChange > 0 ? '+' : ''}${clicksChange.toFixed(1)}%\n`;
    analysis += `- Impressions: ${impressionsChange > 0 ? '+' : ''}${impressionsChange.toFixed(1)}%\n`;
    analysis += `- Positie: ${positionChange < 0 ? 'Verbeterd' : 'Verslechterd'} met ${Math.abs(positionChange).toFixed(1)} posities\n\n`;
    analysis += `**Aanbeveling:** Blijf focussen op de strategie die je nu gebruikt. De update waardeert je content positief.`;
  } else if (impactScore < -10) {
    analysis += `⚠️ **Negatieve impact** - Je website is negatief beïnvloed door deze update.\n\n`;
    analysis += `- Clicks: ${clicksChange > 0 ? '+' : ''}${clicksChange.toFixed(1)}%\n`;
    analysis += `- Impressions: ${impressionsChange > 0 ? '+' : ''}${impressionsChange.toFixed(1)}%\n`;
    analysis += `- Positie: ${positionChange < 0 ? 'Verbeterd' : 'Verslechterd'} met ${Math.abs(positionChange).toFixed(1)} posities\n\n`;
    analysis += `**Actie vereist:** Bekijk de getroffen pagina's en overweeg content updates, kwaliteitsverbeteringen of het verwijderen van low-quality content.`;
  } else {
    analysis += `➖ **Minimale impact** - Geen significante veranderingen gedetecteerd.\n\n`;
    analysis += `- Clicks: ${clicksChange > 0 ? '+' : ''}${clicksChange.toFixed(1)}%\n`;
    analysis += `- Impressions: ${impressionsChange > 0 ? '+' : ''}${impressionsChange.toFixed(1)}%\n`;
    analysis += `- Positie: ${positionChange < 0 ? 'Verbeterd' : 'Verslechterd'} met ${Math.abs(positionChange).toFixed(1)} posities\n\n`;
    analysis += `**Aanbeveling:** Blijf je content monitoren en optimaliseren volgens best practices.`;
  }
  
  return analysis;
}

/**
 * Get all Google updates
 */
export async function getGoogleUpdates(limit: number = 20) {
  return await prisma.googleUpdate.findMany({
    orderBy: { date: 'desc' },
    take: limit
  });
}

/**
 * Get update impact for a specific project
 */
export async function getProjectUpdateImpact(projectId: string) {
  return await prisma.updateImpact.findMany({
    where: { projectId },
    include: {
      update: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get recent updates (last 90 days)
 */
export async function getRecentUpdates() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  return await prisma.googleUpdate.findMany({
    where: {
      date: { gte: ninetyDaysAgo }
    },
    orderBy: { date: 'desc' }
  });
}
