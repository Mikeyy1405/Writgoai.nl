import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET /api/media-library
 *
 * Get all media from the user's media library
 * Supports filtering by type (image/video) and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'image' or 'video'
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Build query
    let query = supabase
      .from('media')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    // Apply filters
    if (type === 'image' || type === 'video') {
      query = query.eq('type', type);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,filename.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: media, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Error fetching media:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch media'
      }, { status: 500 });
    }

    return NextResponse.json({
      media: media || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Error in media library GET:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
