import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { classifyOpportunity, scoreOpportunity } from '@/lib/ai-discovery';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/writgo/classify-and-score
 * Classify and score a content opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunityId, title, description, keywords } = body;

    if (!opportunityId && !title) {
      return NextResponse.json({ error: 'opportunityId or title required' }, { status: 400 });
    }

    let opportunity: any;

    // If opportunityId provided, fetch from database
    if (opportunityId) {
      const { data, error } = await supabase
        .from('writgo_content_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      opportunity = data;
    }

    // Classify the opportunity
    const classification = await classifyOpportunity(
      opportunity?.title || title,
      opportunity?.metadata?.description || description,
      opportunity?.metadata?.keywords || keywords
    );

    // Score the opportunity
    const score = scoreOpportunity({
      topicId: classification.topicId,
      contentType: classification.contentType,
      detectedAt: opportunity?.detected_at ? new Date(opportunity.detected_at) : new Date(),
      keywords: opportunity?.metadata?.keywords || keywords,
      source: opportunity?.discovery_source || 'manual'
    });

    // Update opportunity in database if opportunityId provided
    if (opportunityId) {
      const { error: updateError } = await supabase
        .from('writgo_content_opportunities')
        .update({
          topic_id: classification.topicId,
          content_type: classification.contentType,
          priority_score: score.priorityScore,
          relevance_score: score.breakdown.relevance,
          freshness_score: score.breakdown.freshness,
          authority_score: score.breakdown.authority,
          metadata: {
            ...opportunity.metadata,
            classification,
            score
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (updateError) {
        console.error('Error updating opportunity:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      classification,
      score,
      shouldGenerate: score.shouldGenerate
    });

  } catch (error: any) {
    console.error('Error in classify and score:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/writgo/classify-and-score/batch
 * Classify and score all unclassified opportunities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all opportunities without topic_id
    const { data: opportunities, error } = await supabase
      .from('writgo_content_opportunities')
      .select('*')
      .is('topic_id', null)
      .eq('status', 'detected')
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No unclassified opportunities found',
        processed: 0
      });
    }

    let processed = 0;
    const results = [];

    for (const opp of opportunities) {
      try {
        // Classify
        const classification = await classifyOpportunity(
          opp.title,
          opp.metadata?.description,
          opp.metadata?.keywords
        );

        // Score
        const score = scoreOpportunity({
          topicId: classification.topicId,
          contentType: classification.contentType,
          detectedAt: new Date(opp.detected_at),
          keywords: opp.metadata?.keywords,
          source: opp.discovery_source || 'unknown'
        });

        // Update
        await supabase
          .from('writgo_content_opportunities')
          .update({
            topic_id: classification.topicId,
            content_type: classification.contentType,
            priority_score: score.priorityScore,
            relevance_score: score.breakdown.relevance,
            freshness_score: score.breakdown.freshness,
            authority_score: score.breakdown.authority,
            metadata: {
              ...opp.metadata,
              classification,
              score
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', opp.id);

        processed++;
        results.push({
          id: opp.id,
          title: opp.title,
          topic: classification.topicName,
          score: score.priorityScore,
          shouldGenerate: score.shouldGenerate
        });

        // Rate limiting - small delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Error processing opportunity ${opp.id}:`, err);
      }
    }

    // Log activity
    await supabase.from('writgo_activity_logs').insert({
      action_type: 'batch_classification',
      description: `${processed} opportunities geclassificeerd en gescoord`,
      status: 'success',
      metadata: { processed, total: opportunities.length }
    });

    return NextResponse.json({
      success: true,
      processed,
      total: opportunities.length,
      results
    });

  } catch (error: any) {
    console.error('Error in batch classify and score:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
