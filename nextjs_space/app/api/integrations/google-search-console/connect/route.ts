import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleSearchConsole } from '@/lib/google-search-console';

export const dynamic = 'force-dynamic';

/**
 * POST /api/integrations/google-search-console/connect
 * Start Google Search Console OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate OAuth URL
    const authUrl = GoogleSearchConsole.getAuthUrl();

    return NextResponse.json({
      authUrl,
      message: 'Redirect user to this URL to authorize',
    });
  } catch (error) {
    console.error('Error starting Google Search Console OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integrations/google-search-console/connect
 * Alternative GET endpoint that redirects to OAuth URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/inloggen', request.url));
    }

    // Generate OAuth URL and redirect
    const authUrl = GoogleSearchConsole.getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error redirecting to Google OAuth:', error);
    return NextResponse.redirect(
      new URL('/settings?error=oauth_failed', request.url)
    );
  }
}
