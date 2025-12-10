/**
 * Client Content API Route
 * 
 * GET: Retrieve content deliveries with filters (type, status, limit)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getContentDeliveries } from '@/lib/supabase/client-helpers';
import { ContentType, ContentStatus } from '@/lib/supabase/database.types';

export const dynamic = 'force-dynamic';

// Constants for pagination limits
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

/**
 * GET /api/client/content
 * Get content deliveries for the logged-in client
 * 
 * Query params:
 * - type: Filter by content type (pillar, cluster, social, video)
 * - status: Filter by status (draft, scheduled, published, failed)
 * - limit: Number of results to return (default: 50)
 * - offset: Number of results to skip (for pagination)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const type = searchParams.get('type') as ContentType | null;
    const status = searchParams.get('status') as ContentStatus | null;
    const limit = parseInt(searchParams.get('limit') || DEFAULT_LIMIT.toString(), 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate parameters
    if (type && !['pillar', 'cluster', 'social', 'video'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    if (status && !['draft', 'scheduled', 'published', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
      return NextResponse.json(
        { error: `Limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` },
        { status: 400 }
      );
    }

    const filters = {
      type: type || undefined,
      status: status || undefined,
      limit,
      offset,
    };

    const content = await getContentDeliveries(clientId, filters);

    return NextResponse.json({
      content,
      count: content.length,
      filters: {
        type: type || 'all',
        status: status || 'all',
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
