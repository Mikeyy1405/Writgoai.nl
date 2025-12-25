import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Lazy initialization to prevent build-time errors
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseAdmin as any;
}

/**
 * GET - List all knowledge base entries for a project
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    let query = getSupabaseAdmin()
      .from('project_knowledge_base')
      .select('*')
      .eq('project_id', projectId)
      // Note: is_active column removed until migration is applied
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    }

    const { data: entries, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      entries: entries || [],
    });

  } catch (error: any) {
    console.error('Get knowledge base error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Create or update knowledge base entry
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      project_id,
      title,
      content,
      category = 'general',
      source_url,
      tags = [],
      // Note: is_active removed until migration is applied
      // is_active = true,
    } = body;

    if (!project_id || !title || !content) {
      return NextResponse.json({ 
        error: 'project_id, title, and content are required' 
      }, { status: 400 });
    }

    const entryData = {
      project_id,
      title,
      content,
      category,
      source_url,
      tags,
      // Note: is_active removed until migration is applied
      updated_at: new Date().toISOString(),
    };

    let result;
    if (id) {
      // Update existing
      const { data, error } = await getSupabaseAdmin()
        .from('project_knowledge_base')
        .update(entryData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await getSupabaseAdmin()
        .from('project_knowledge_base')
        .insert({
          ...entryData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      entry: result,
    });

  } catch (error: any) {
    console.error('Save knowledge base error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Remove knowledge base entry
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const { error } = await getSupabaseAdmin()
      .from('project_knowledge_base')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Knowledge base entry deleted',
    });

  } catch (error: any) {
    console.error('Delete knowledge base error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

