import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { GoogleSearchConsole } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

/**
 * GET /api/integrations/google-search-console/callback
 * Handle OAuth callback from Google
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/inloggen', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings?error=${error}`, request.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=no_code', request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await GoogleSearchConsole.getTokensFromCode(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user's client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.redirect(
        new URL('/settings?error=client_not_found', request.url)
      );
    }

    // Test connection and get sites
    const gsc = new GoogleSearchConsole(
      tokens.access_token,
      tokens.refresh_token || undefined
    );
    const sites = await gsc.getSites();

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;

    // Store tokens in database
    await prisma.client.update({
      where: { id: client.id },
      data: {
        googleSearchConsoleToken: encryptedAccessToken,
        googleSearchConsoleRefreshToken: encryptedRefreshToken,
        googleSearchConsoleSites: JSON.stringify(sites),
      },
    });

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?success=google_search_console_connected', request.url)
    );
  } catch (error) {
    console.error('Error in Google Search Console callback:', error);
    return NextResponse.redirect(
      new URL('/settings?error=callback_failed', request.url)
    );
  }
}
