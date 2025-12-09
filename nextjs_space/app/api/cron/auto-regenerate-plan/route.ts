
/**
 * CRON Job: Auto-regenerate content plan
 * Runs daily to ensure content plan is always 7 days ahead
 * 
 * Checks all clients with active automation and regenerates plan if needed
 */

import { NextResponse } from 'next/server';
import { generateContentPlan } from '@/lib/content-plan-generator';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  try {
    // Verify CRON secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting auto-regenerate content plans...');

    // Find all clients with active automation
    const clients = await prisma.client.findMany({
      where: {
        automationActive: true,
        AND: [
          { keywords: { isEmpty: false } },
          { targetAudience: { not: null } },
        ]
      },
      select: {
        id: true,
        email: true,
        companyName: true,
        contentPlan: true,
        lastPlanGenerated: true,
        keywords: true,
        targetAudience: true,
        brandVoice: true,
      },
    });

    console.log(`Found ${clients.length} clients with active automation`);

    const results = {
      total: clients.length,
      regenerated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const client of clients) {
      try {
        const needsRegeneration = shouldRegeneratePlan(client.contentPlan, client.lastPlanGenerated);

        if (!needsRegeneration) {
          console.log(`✓ Skipping ${client.email} - plan is still fresh (7 days ahead)`);
          results.skipped++;
          continue;
        }

        console.log(`🔄 Regenerating plan for ${client.email}...`);

        // Build website scan object from stored data
        const websiteScan = {
          websiteAnalysis: {
            name: client.companyName || 'Je bedrijf',
            description: client.companyName ? `${client.companyName} - Content marketing en automatisering` : 'Content marketing bureau',
            targetAudience: client.targetAudience || 'Ondernemers',
            toneOfVoice: client.brandVoice || 'Professioneel en informatief',
            contentStyle: ['Informatief', 'Praktisch', 'Educatief']
          },
          nicheAnalysis: {
            primaryNiche: client.keywords?.[0] || 'Content Marketing',
            subNiches: client.keywords?.slice(1, 4) || ['SEO', 'Social Media', 'Content strategie'],
            keywords: client.keywords || ['content marketing', 'seo', 'social media'],
            topics: client.keywords?.slice(0, 10) || []
          },
          contentStrategy: {
            contentPillars: ['Content Marketing', 'SEO Tips', 'Social Media Strategie', 'AI in Marketing'],
            contentTypes: ['How-to guides', 'Tips & tricks', 'Case studies']
          }
        };

        // Generate new 7-day plan
        const newPlan = await generateContentPlan(websiteScan, 7);

        // Save to database
        await prisma.client.update({
          where: { id: client.id },
          data: {
            contentPlan: newPlan as any,
            lastPlanGenerated: new Date(),
          },
        });

        console.log(`✅ Plan regenerated for ${client.email}: ${newPlan.length} days`);
        results.regenerated++;

      } catch (error) {
        const errorMsg = `Error for ${client.email}: ${error instanceof Error ? error.message : 'Unknown'}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log('✅ Auto-regeneration complete:', results);

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Auto-regeneration error:', error);
    return NextResponse.json({
      error: 'Auto-regeneration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Check if content plan needs to be regenerated
 * Returns true if:
 * - No plan exists
 * - Plan has less than 3 days remaining
 * - Last generated more than 7 days ago
 */
function shouldRegeneratePlan(contentPlan: any, lastPlanGenerated: Date | null): boolean {
  // No plan exists
  if (!contentPlan || !Array.isArray(contentPlan) || contentPlan.length === 0) {
    console.log('No content plan exists');
    return true;
  }

  // Check if last generated is too old (more than 7 days ago)
  if (lastPlanGenerated) {
    const daysSinceGeneration = Math.floor(
      (Date.now() - new Date(lastPlanGenerated).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceGeneration > 7) {
      console.log(`Plan is ${daysSinceGeneration} days old`);
      return true;
    }
  }

  // Check how many days are still in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureDays = contentPlan.filter(day => {
    if (!day.date) return false;
    const dayDate = new Date(day.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate >= today;
  });

  console.log(`Plan has ${futureDays.length} future days remaining`);

  // Regenerate if less than 3 days remaining
  if (futureDays.length < 3) {
    return true;
  }

  return false;
}
