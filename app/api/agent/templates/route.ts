import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/agent/templates
 * List available templates (own + public + system)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    // Build query - get user's templates + public + system
    let query = supabase
      .from('agent_templates')
      .select('*')
      .or(`user_id.eq.${user.id},is_public.eq.true,is_system.eq.true`)
      .order('is_system', { ascending: false }) // System templates first
      .order('usage_count', { ascending: false }); // Then by popularity

    if (category) {
      query = query.eq('category', category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by category
    const grouped = templates?.reduce((acc: any, template) => {
      const cat = template.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(template);
      return acc;
    }, {});

    return NextResponse.json({ templates, grouped });
  } catch (error: any) {
    console.error('Error in GET /api/agent/templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/agent/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      icon,
      prompt_template,
      variables,
      is_scheduled,
      schedule_cron,
      is_public,
    } = body;

    if (!name || !prompt_template) {
      return NextResponse.json(
        { error: 'Name and prompt_template are required' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: createError } = await supabase
      .from('agent_templates')
      .insert({
        user_id: user.id,
        name,
        description,
        category: category || 'other',
        icon: icon || '📝',
        prompt_template,
        variables: variables || [],
        is_scheduled: is_scheduled || false,
        schedule_cron: schedule_cron || null,
        schedule_enabled: false,
        is_public: is_public || false,
        is_system: false,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating template:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/agent/templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
