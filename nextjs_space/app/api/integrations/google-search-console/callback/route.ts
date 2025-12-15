import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getSupabaseAdmin } from '@/lib/supabase';
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
      console.log('[GSC Callback] No session found, redirecting to login');
      return NextResponse.redirect(new URL('/inloggen', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    console.log('[GSC Callback] Code:', code ? 'present' : 'missing');
    console.log('[GSC Callback] Error:', error);

    // Handle OAuth errors
    if (error) {
      console.error('[GSC Callback] OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings?error=oauth_failed&details=${error}`, request.url)
      );
    }

    if (!code) {
      console.error('[GSC Callback] No authorization code');
      return NextResponse.redirect(
        new URL('/settings?error=no_code', request.url)
      );
    }

    // Check if credentials are configured
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (!clientId || !clientSecret || !nextAuthUrl) {
      console.error('[GSC Callback] Missing environment variables:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        hasNextAuthUrl: !!nextAuthUrl
      });
      return NextResponse.redirect(
        new URL('/settings?error=gsc_not_configured', request.url)
      );
    }

    // Exchange code for tokens
    console.log('[GSC Callback] Exchanging code for tokens...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${nextAuthUrl}/api/integrations/google-search-console/callback`,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('[GSC Callback] Token exchange failed:', errorData);
      let errorJson;
      try {
        errorJson = JSON.parse(errorData);
      } catch (e) {
        errorJson = { error: 'unknown' };
      }
      return NextResponse.redirect(
        new URL(`/settings?error=token_exchange_failed&details=${encodeURIComponent(errorJson.error || 'Unknown error')}`, request.url)
      );
    }

    const tokens = await tokenResponse.json();
    console.log('[GSC Callback] Tokens received');

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get Search Console sites
    console.log('[GSC Callback] Fetching Search Console sites...');
    const sitesResponse = await fetch(
      'https://www.googleapis.com/webmasters/v3/sites',
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      }
    );

    let sites: string[] = [];
    if (sitesResponse.ok) {
      const sitesData = await sitesResponse.json();
      sites = sitesData.siteEntry?.map((s: any) => s.siteUrl) || [];
      console.log('[GSC Callback] Found', sites.length, 'sites');
    } else {
      console.warn('[GSC Callback] Failed to fetch sites:', await sitesResponse.text());
    }

    // Get user's client from Supabase
    const supabase = getSupabaseAdmin();
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[GSC Callback] Client not found:', clientError);
      return NextResponse.redirect(
        new URL('/settings?error=client_not_found', request.url)
      );
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;

    // Store tokens in database
    console.log('[GSC Callback] Saving tokens to database...');
    const { error: updateError } = await supabase
      .from('Client')
      .update({
        googleSearchConsoleToken: encryptedAccessToken,
        googleSearchConsoleRefreshToken: encryptedRefreshToken,
        googleSearchConsoleSites: sites,
        updatedAt: new Date().toISOString()
      })
      .eq('id', client.id);

    if (updateError) {
      console.error('[GSC Callback] Database update failed:', updateError);
      return NextResponse.redirect(
        new URL('/settings?error=database_update_failed', request.url)
      );
    }

    console.log('[GSC Callback] ✅ Success! Tokens saved.');

    // Redirect to settings with success message
    return NextResponse.redirect(
      new URL('/settings?success=google_search_console_connected', request.url)
    );
  } catch (error: any) {
    console.error('[GSC Callback] Error:', error);
    return NextResponse.redirect(
      new URL(`/settings?error=callback_failed&details=${encodeURIComponent(error.message)}`, request.url)
    );
  }
}
