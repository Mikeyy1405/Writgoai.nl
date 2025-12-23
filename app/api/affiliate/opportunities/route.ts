/**
 * GET /api/affiliate/opportunities
 * Get affiliate opportunities for a project
 * 
 * PATCH /api/affiliate/opportunities
 * Update opportunity status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const project_id = searchParams.get('project_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!project_id) {
      return NextResponse.json(
        { error: 'project_id is required' },
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

    // Build query
    let query = supabase
      .from('affiliate_opportunities')
      .select('*')
      .eq('project_id', project_id)
      .order('discovered_at', { ascending: false })
      .limit(limit);

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: opportunities, error: oppError } = await query;

    if (oppError) {
      console.error('Error fetching opportunities:', oppError);
      return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
    }

    // Calculate stats
    const { data: allOpportunities } = await supabase
      .from('affiliate_opportunities')
      .select('status')
      .eq('project_id', project_id);

    const stats = {
      total: allOpportunities?.length || 0,
      by_status: {
        discovered: allOpportunities?.filter(o => o.status === 'discovered').length || 0,
        researching: allOpportunities?.filter(o => o.status === 'researching').length || 0,
        signed_up: allOpportunities?.filter(o => o.status === 'signed_up').length || 0,
        active: allOpportunities?.filter(o => o.status === 'active').length || 0,
        dismissed: allOpportunities?.filter(o => o.status === 'dismissed').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      opportunities,
      stats,
    });
  } catch (error) {
    console.error('Error in GET affiliate opportunities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunity_id, status, notes } = body;

    if (!opportunity_id || !status) {
      return NextResponse.json(
        { error: 'opportunity_id and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['discovered', 'researching', 'signed_up', 'active', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    // Fetch opportunity to verify access
    const { data: opportunity, error: oppError } = await supabase
      .from('affiliate_opportunities')
      .select('project_id, metadata')
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

    // Update opportunity
    const updateData: any = {
      status,
    };

    // Add notes to metadata if provided
    if (notes) {
      updateData.metadata = {
        ...opportunity.metadata,
        notes,
        status_updated_at: new Date().toISOString(),
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from('affiliate_opportunities')
      .update(updateData)
      .eq('id', opportunity_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating opportunity:', updateError);
      return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      opportunity: updated,
    });
  } catch (error) {
    console.error('Error in PATCH affiliate opportunities:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
