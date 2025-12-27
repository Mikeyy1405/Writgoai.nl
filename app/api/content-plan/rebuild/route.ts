import { NextResponse } from 'next/request';
import { createClient } from '@/lib/supabase-server';
import { enrichContentIdea } from '@/lib/content-plan-enricher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/content-plan/rebuild
 *
 * Rebuild existing content plan with comprehensive details
 */
export async function POST(request: Request) {
  try {
    const { project_id } = await request.json();

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get existing content plan
    const { data: plan, error: planError } = await supabase
      .from('content_plans')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Content plan not found' },
        { status: 404 }
      );
    }

    if (!plan.plan || !Array.isArray(plan.plan) || plan.plan.length === 0) {
      return NextResponse.json(
        { error: 'Content plan has no articles to rebuild' },
        { status: 400 }
      );
    }

    console.log(`Rebuilding content plan for project ${project_id} with ${plan.plan.length} articles`);

    // Enrich first 10 articles as a demo (full enrichment would take too long)
    const articlesToEnrich = plan.plan.slice(0, 10);
    const enrichedArticles = [];

    for (let i = 0; i < articlesToEnrich.length; i++) {
      const article = articlesToEnrich[i];

      console.log(`Enriching article ${i + 1}/${articlesToEnrich.length}: ${article.title}`);

      try {
        const enriched = await enrichContentIdea(
          {
            title: article.title,
            description: article.description,
            keywords: article.keywords,
            contentType: article.contentType,
            cluster: article.cluster,
            category: article.category,
            priority: article.priority,
            searchIntent: article.searchIntent,
          },
          plan.niche,
          plan.language || 'nl'
        );

        // Preserve existing data (status, search volume, etc.)
        enrichedArticles.push({
          ...enriched,
          status: article.status,
          searchVolume: article.searchVolume,
          competition: article.competition,
          keywordDifficulty: article.keywordDifficulty,
          rankingPotential: article.rankingPotential,
        });
      } catch (enrichError) {
        console.error(`Failed to enrich article ${i + 1}:`, enrichError);
        // Keep original article if enrichment fails
        enrichedArticles.push(article);
      }

      // Small delay to avoid rate limits
      if (i < articlesToEnrich.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Combine enriched articles with remaining articles
    const rebuiltPlan = [
      ...enrichedArticles,
      ...plan.plan.slice(10), // Keep rest as-is for now
    ];

    // Update content plan in database
    const { error: updateError } = await supabase
      .from('content_plans')
      .update({
        plan: rebuiltPlan,
        updated_at: new Date().toISOString(),
      })
      .eq('project_id', project_id);

    if (updateError) {
      console.error('Failed to update content plan:', updateError);
      return NextResponse.json(
        { error: 'Failed to save rebuilt plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrichedCount: enrichedArticles.length,
      totalCount: rebuiltPlan.length,
      message: `✅ Successfully enriched ${enrichedArticles.length} articles with comprehensive details`,
    });
  } catch (error: any) {
    console.error('Rebuild error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to rebuild content plan' },
      { status: 500 }
    );
  }
}
