/**
 * Client Stats API Route
 * 
 * GET: Retrieve dashboard statistics for logged-in client
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { getDashboardStats } from '@/lib/supabase/client-helpers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/stats
 * Get dashboard statistics for the logged-in client
 * 
 * Returns:
 * - content_this_month: Number of content pieces created this month
 * - total_impressions: Total impressions across all content
 * - total_engagements: Total engagements across all content
 * - connected_platforms: Number of connected platforms
 * - package_info: Current package details and remaining content
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    const stats = await getDashboardStats(clientId);

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
