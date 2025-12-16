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
    console.log('[Client Stats API] Starting stats fetch...');
    
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      console.error('[Client Stats API] Authentication failed:', auth.error);
      return NextResponse.json(
        { 
          error: auth.error,
          message: 'Authenticatie gefaald. Log opnieuw in.'
        },
        { status: auth.status }
      );
    }

    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    console.log('[Client Stats API] Fetching stats for client ID:', clientId);
    
    const stats = await getDashboardStats(clientId);
    
    console.log('[Client Stats API] Stats fetched successfully:', {
      content_this_month: stats.content_this_month,
      total_impressions: stats.total_impressions,
      total_engagements: stats.total_engagements,
      connected_platforms: stats.connected_platforms
    });

    return NextResponse.json({
      stats,
    });
  } catch (error) {
    console.error('[Client Stats API] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Client Stats API] Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stats',
        message: 'Er is een onverwachte fout opgetreden bij het ophalen van statistieken',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}
