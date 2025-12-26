import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

/**
 * GET - List all affiliates for a project
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const { data: affiliates, error } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Mask sensitive data but keep custom_links visible
    const maskedAffiliates = affiliates?.map((a: any) => ({
      ...a,
      client_secret: a.client_secret ? '••••••••' : null,
      // Keep custom_links as-is for display
    }));

    return NextResponse.json({
      success: true,
      affiliates: maskedAffiliates || [],
    });

  } catch (error: any) {
    console.error('Get affiliates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Create or update affiliate for a project
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      project_id, 
      platform, 
      affiliate_id,
      site_code,
      client_id,
      client_secret,
      custom_links = [],
      is_active = true,
    } = body;

    if (!project_id || !platform) {
      return NextResponse.json({ 
        error: 'project_id and platform are required' 
      }, { status: 400 });
    }

    // Check if affiliate already exists for this project/platform
    const { data: existing } = await getSupabaseAdmin()
      .from('project_affiliates')
      .select('id, client_secret')
      .eq('project_id', project_id)
      .eq('platform', platform)
      .single();

    const affiliateData: any = {
      project_id,
      platform,
      affiliate_id,
      site_code,
      client_id,
      custom_links,
      is_active,
      updated_at: new Date().toISOString(),
    };

    // Only update client_secret if provided (not masked)
    if (client_secret && client_secret !== '••••••••') {
      affiliateData.client_secret = client_secret;
    } else if (existing?.client_secret) {
      // Keep existing secret
      affiliateData.client_secret = existing.client_secret;
    }

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await getSupabaseAdmin()
        .from('project_affiliates')
        .update(affiliateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      affiliateData.created_at = new Date().toISOString();
      const { data, error } = await getSupabaseAdmin()
        .from('project_affiliates')
        .insert(affiliateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Mask secret in response
    result.client_secret = result.client_secret ? '••••••••' : null;

    return NextResponse.json({
      success: true,
      affiliate: result,
    });

  } catch (error: any) {
    console.error('Save affiliate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Remove affiliate from project
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Affiliate ID is required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('project_affiliates')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Affiliate deleted',
    });

  } catch (error: any) {
    console.error('Delete affiliate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
