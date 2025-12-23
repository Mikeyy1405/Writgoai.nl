/**
 * POST /api/affiliate/research
 * Research affiliate programs for a specific opportunity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { researchAffiliatePrograms } from '@/lib/affiliate-research';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunity_id, product_name, brand_name } = body;

    if (!opportunity_id && !product_name) {
      return NextResponse.json(
        { error: 'opportunity_id or product_name is required' },
        { status: 400 }
      );
    }

    let productToResearch = product_name;
    let brandToResearch = brand_name;
    let opportunityId = opportunity_id;

    // If opportunity_id provided, fetch the opportunity details
    if (opportunity_id) {
      const { data: opportunity, error: oppError } = await supabase
        .from('affiliate_opportunities')
        .select('*')
        .eq('id', opportunity_id)
        .single();

      if (oppError || !opportunity) {
        return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
      }

      // Verify user has access to this opportunity's project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('id', opportunity.project_id)
        .eq('user_id', user.id)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      productToResearch = opportunity.product_name;
      brandToResearch = opportunity.brand_name;
    }

    // Research affiliate programs
    console.log(`Researching affiliate programs for: ${productToResearch}`);
    const researchResult = await researchAffiliatePrograms(productToResearch, brandToResearch);

    // Update opportunity if ID was provided
    if (opportunityId) {
      const { error: updateError } = await supabase
        .from('affiliate_opportunities')
        .update({
          affiliate_programs: researchResult.programs,
          research_completed: true,
          status: researchResult.programs.length > 0 ? 'researching' : 'discovered',
          metadata: {
            research_notes: researchResult.notes,
            researched_at: researchResult.researched_at,
          },
        })
        .eq('id', opportunityId);

      if (updateError) {
        console.error('Error updating opportunity:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      opportunity_id: opportunityId,
      product_name: productToResearch,
      brand_name: brandToResearch,
      programs: researchResult.programs,
      notes: researchResult.notes,
      researched_at: researchResult.researched_at,
    });
  } catch (error) {
    console.error('Error in affiliate research:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
