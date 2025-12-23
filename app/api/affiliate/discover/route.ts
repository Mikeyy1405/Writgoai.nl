/**
 * POST /api/affiliate/discover
 * Detect products in content and create affiliate opportunities
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { detectProducts, extractContext, scoreOpportunity, determineLocation } from '@/lib/affiliate-discovery';
import { researchAffiliatePrograms } from '@/lib/affiliate-research';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, article_id, content, auto_research = true } = body;

    if (!project_id || !content) {
      return NextResponse.json(
        { error: 'project_id and content are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Detect products in content
    console.log('Detecting products in content...');
    const detectionResult = await detectProducts(content);

    if (!detectionResult.products || detectionResult.products.length === 0) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        message: 'No products detected in content',
      });
    }

    console.log(`Detected ${detectionResult.products.length} products`);

    // Create opportunities in database
    const opportunities = [];
    
    for (const product of detectionResult.products) {
      try {
        // Extract more context if needed
        const fullContext = extractContext(content, product.product_name);
        const location = determineLocation(content, product.product_name);
        const score = scoreOpportunity(product.product_name, fullContext);

        // Only create opportunity if confidence score is reasonable
        if (product.confidence < 0.3) {
          console.log(`Skipping low confidence product: ${product.product_name}`);
          continue;
        }

        // Check if opportunity already exists for this product in this article
        if (article_id) {
          const { data: existing } = await supabase
            .from('affiliate_opportunities')
            .select('id')
            .eq('article_id', article_id)
            .eq('product_name', product.product_name)
            .single();

          if (existing) {
            console.log(`Opportunity already exists for ${product.product_name}`);
            continue;
          }
        }

        // Create opportunity
        const { data: opportunity, error: createError } = await supabase
          .from('affiliate_opportunities')
          .insert({
            project_id,
            article_id: article_id || null,
            product_name: product.product_name,
            brand_name: product.brand_name || null,
            mentioned_at: location,
            context: fullContext.substring(0, 500), // Limit context length
            status: 'discovered',
            research_completed: false,
            metadata: {
              confidence: product.confidence,
              score: score,
              detected_at: new Date().toISOString(),
            },
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating opportunity:', createError);
          continue;
        }

        opportunities.push(opportunity);

        // Auto-research if enabled
        if (auto_research && opportunity) {
          console.log(`Auto-researching: ${product.product_name}`);
          
          try {
            const researchResult = await researchAffiliatePrograms(
              product.product_name,
              product.brand_name
            );

            // Update opportunity with research results
            if (researchResult.programs.length > 0) {
              await supabase
                .from('affiliate_opportunities')
                .update({
                  affiliate_programs: researchResult.programs,
                  research_completed: true,
                  status: 'researching',
                  metadata: {
                    ...opportunity.metadata,
                    research_notes: researchResult.notes,
                    researched_at: researchResult.researched_at,
                  },
                })
                .eq('id', opportunity.id);

              // Update local opportunity object
              opportunity.affiliate_programs = researchResult.programs;
              opportunity.research_completed = true;
              opportunity.status = 'researching';
            }
          } catch (researchError) {
            console.error('Auto-research failed:', researchError);
            // Continue even if research fails
          }
        }
      } catch (error) {
        console.error('Error processing product:', error);
        // Continue with next product
      }
    }

    return NextResponse.json({
      success: true,
      opportunities: opportunities.map(opp => ({
        id: opp.id,
        product_name: opp.product_name,
        brand_name: opp.brand_name,
        mentioned_at: opp.mentioned_at,
        context: opp.context,
        status: opp.status,
        research_completed: opp.research_completed,
        affiliate_programs: opp.affiliate_programs || [],
      })),
      total_detected: detectionResult.products.length,
      total_created: opportunities.length,
    });
  } catch (error) {
    console.error('Error in affiliate discover:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
