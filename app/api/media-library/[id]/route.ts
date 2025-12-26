import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDIA_LIBRARY_BUCKET = 'media-library';

let supabaseAdmin: ReturnType<typeof createAdminClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin;
}

/**
 * GET /api/media-library/[id]
 *
 * Get a specific media item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({
        error: 'Media not found'
      }, { status: 404 });
    }

    return NextResponse.json({ media });

  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/media-library/[id]
 *
 * Update media metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, alt_text, tags } = body;

    // Build update object
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (alt_text !== undefined) updates.alt_text = alt_text;
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }

    const { data: media, error: updateError } = await supabase
      .from('media')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !media) {
      return NextResponse.json({
        error: 'Failed to update media'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      media
    });

  } catch (error: any) {
    console.error('Error updating media:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/media-library/[id]
 *
 * Delete a media item from the library and storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get the media to find storage path
    const { data: media, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({
        error: 'Media not found'
      }, { status: 404 });
    }

    // Delete from storage if storage_path exists
    if (media.storage_path) {
      const admin = getSupabaseAdmin();
      const { error: storageError } = await admin.storage
        .from(MEDIA_LIBRARY_BUCKET)
        .remove([media.storage_path]);

      if (storageError) {
        console.error('Failed to delete from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('media')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete from database:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete media'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting media:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
