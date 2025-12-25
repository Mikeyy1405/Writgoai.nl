import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any; // Type assertion needed for tables not in generated types
}

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET - Fetch scheduled content for a project
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!projectId) {
      return NextResponse.json({ error: 'project_id is verplicht' }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await getSupabaseAdmin()
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Fetch scheduled content
    const { data: scheduledContent, error } = await getSupabaseAdmin()
      .from('scheduled_content')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_for', { ascending: true });

    if (error) {
      console.error('Error fetching scheduled content:', error);
      return NextResponse.json({ error: 'Fout bij ophalen' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      items: scheduledContent || []
    });

  } catch (error) {
    console.error('Content calendar GET error:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}

// POST - Create new scheduled content
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const {
      project_id,
      title,
      type = 'educational',
      pillar,
      hook,
      cta,
      scheduled_for,
      platforms = ['instagram'],
      auto_generate = true
    } = body;

    if (!project_id || !title || !scheduled_for) {
      return NextResponse.json({
        error: 'project_id, title en scheduled_for zijn verplicht'
      }, { status: 400 });
    }

    // Verify project ownership
    const { data: project } = await getSupabaseAdmin()
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Create scheduled content
    const { data: newItem, error } = await getSupabaseAdmin()
      .from('scheduled_content')
      .insert({
        project_id,
        title,
        type,
        pillar,
        hook,
        cta,
        scheduled_for: new Date(scheduled_for).toISOString(),
        platforms,
        auto_generate,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating scheduled content:', error);
      return NextResponse.json({ error: 'Fout bij aanmaken' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: newItem
    });

  } catch (error) {
    console.error('Content calendar POST error:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}

// PATCH - Update scheduled content
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      title,
      type,
      pillar,
      hook,
      cta,
      scheduled_for,
      platforms,
      auto_generate,
      status
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is verplicht' }, { status: 400 });
    }

    // Get item and verify ownership through project
    const { data: item } = await getSupabaseAdmin()
      .from('scheduled_content')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
    }

    // Verify project ownership
    const { data: project } = await getSupabaseAdmin()
      .from('projects')
      .select('id')
      .eq('id', item.project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (type !== undefined) updates.type = type;
    if (pillar !== undefined) updates.pillar = pillar;
    if (hook !== undefined) updates.hook = hook;
    if (cta !== undefined) updates.cta = cta;
    if (scheduled_for !== undefined) updates.scheduled_for = new Date(scheduled_for).toISOString();
    if (platforms !== undefined) updates.platforms = platforms;
    if (auto_generate !== undefined) updates.auto_generate = auto_generate;
    if (status !== undefined) updates.status = status;

    // Update item
    const { data: updatedItem, error } = await getSupabaseAdmin()
      .from('scheduled_content')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduled content:', error);
      return NextResponse.json({ error: 'Fout bij bijwerken' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: updatedItem
    });

  } catch (error) {
    console.error('Content calendar PATCH error:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}

// DELETE - Remove scheduled content
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is verplicht' }, { status: 400 });
    }

    // Get item and verify ownership through project
    const { data: item } = await getSupabaseAdmin()
      .from('scheduled_content')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!item) {
      return NextResponse.json({ error: 'Item niet gevonden' }, { status: 404 });
    }

    // Verify project ownership
    const { data: project } = await getSupabaseAdmin()
      .from('projects')
      .select('id')
      .eq('id', item.project_id)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    // Delete item
    const { error } = await getSupabaseAdmin()
      .from('scheduled_content')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scheduled content:', error);
      return NextResponse.json({ error: 'Fout bij verwijderen' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Content calendar DELETE error:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}
