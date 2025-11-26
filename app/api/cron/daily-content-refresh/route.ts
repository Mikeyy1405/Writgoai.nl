

export const dynamic = "force-dynamic";
export const revalidate = 0;
/**
 * Cron Job: Daily Content Refresh
 * Runs daily to add new content insights to all active projects
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { refreshDailyInsights, MasterContentPlan } from '@/lib/intelligent-content-planner';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 [CRON] Daily Content Refresh started');

    // Get all projects with active content strategy
    const projects = await prisma.project.findMany({
      where: {
        isActive: true,
        contentStrategy: { not: null },
        client: {
          subscriptionStatus: 'active'
        }
      },
      include: {
        client: true
      }
    });

    console.log(`   Found ${projects.length} active projects`);

    const results = [];

    for (const project of projects) {
      try {
        console.log(`   🔄 Refreshing: ${project.name}`);

        const existingPlan = project.contentStrategy as unknown as MasterContentPlan;
        
        // Validate existing plan
        if (!existingPlan || !existingPlan.contentIdeas || !Array.isArray(existingPlan.contentIdeas)) {
          console.log(`   ⚠️  ${project.name}: Invalid content strategy, skipping`);
          results.push({
            project: project.name,
            success: false,
            error: 'Invalid or missing content strategy'
          });
          continue;
        }
        
        const newIdeas = await refreshDailyInsights(
          existingPlan,
          project.niche || '',
          project.targetAudience || 'Nederlandse lezers'
        );

        if (newIdeas.length > 0) {
          // Update content strategy
          const updatedPlan = {
            ...existingPlan,
            contentIdeas: [...(existingPlan.contentIdeas || []), ...newIdeas],
            summary: {
              ...(existingPlan.summary || {}),
              totalIdeas: (existingPlan.contentIdeas?.length || 0) + newIdeas.length,
            }
          };

          await prisma.project.update({
            where: { id: project.id },
            data: {
              contentStrategy: updatedPlan as any,
              contentStrategyDate: new Date(),
            }
          });

          // Add new article ideas
          const articleIdeas = newIdeas.map(idea => ({
            clientId: project.clientId,
            title: idea.title,
            slug: idea.title.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, ''),
            focusKeyword: idea.focusKeyword,
            topic: idea.description,
            secondaryKeywords: idea.secondaryKeywords,
            searchIntent: idea.searchIntent,
            difficulty: idea.estimatedDifficulty,
            contentOutline: { sections: idea.outline.map(h2 => ({ heading: h2, subpoints: [] })) },
            contentType: idea.contentType,
            priority: idea.priority,
            aiScore: idea.trending ? 90 : 70,
            trending: idea.trending,
            status: 'idea',
          }));

          await prisma.articleIdea.createMany({
            data: articleIdeas,
          });

          results.push({
            project: project.name,
            newIdeas: newIdeas.length,
            success: true
          });

          console.log(`   ✅ ${project.name}: ${newIdeas.length} nieuwe ideeën`);
        } else {
          results.push({
            project: project.name,
            newIdeas: 0,
            success: true
          });
          console.log(`   ℹ️ ${project.name}: geen nieuwe ideeën`);
        }

      } catch (error: any) {
        console.error(`   ❌ Error refreshing ${project.name}:`, error.message);
        results.push({
          project: project.name,
          success: false,
          error: error.message
        });
      }
    }

    console.log('✅ [CRON] Daily Content Refresh completed');

    return NextResponse.json({
      success: true,
      totalProjects: projects.length,
      results,
    });

  } catch (error: any) {
    console.error('❌ [CRON] Daily refresh error:', error);
    return NextResponse.json({ 
      error: 'Daily refresh failed', 
      details: error.message 
    }, { status: 500 });
  }
}
