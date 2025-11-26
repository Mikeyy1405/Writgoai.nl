
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { exchangeCodeForTokens, getOAuthUrl } from '@/lib/google-search-console';

/**
 * GET /api/client/search-console/oauth
 * Initieer OAuth flow of handle callback
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const action = searchParams.get('action');
    const projectId = searchParams.get('projectId');
    const state = searchParams.get('state');
    
    // Als er een code is, dan is dit een OAuth callback
    if (code) {
      console.log('═══════════════════════════════════════════');
      console.log('🔐 OAuth Callback Received');
      console.log('═══════════════════════════════════════════');
      console.log('✓ Code received:', code.substring(0, 20) + '...');
      console.log('✓ Code length:', code.length);
      console.log('✓ NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
      console.log('✓ Session email:', session.user.email);
      console.log('✓ State param:', state ? 'PRESENT' : 'NOT PRESENT');
      console.log('✓ ProjectId param:', projectId || 'NOT PRESENT');
      
      // Decode projectId from state if present
      let callbackProjectId = projectId;
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
          callbackProjectId = stateData.projectId;
          console.log('✓ Decoded projectId from state:', callbackProjectId);
        } catch (e) {
          console.log('⚠ Could not parse state, using projectId from query');
        }
      }
      
      // CRITICAL: Use https://writgoai.nl as the redirect URI to match Google Console config
      const redirectUri = 'https://writgoai.nl/api/client/search-console/oauth';
      console.log('✓ Using redirect URI:', redirectUri);
      console.log('───────────────────────────────────────────');
      console.log('🔄 Exchanging code for tokens...');
      
      try {
        const tokens = await exchangeCodeForTokens(code, redirectUri);
        
        console.log('───────────────────────────────────────────');
        console.log('✅ Token Exchange Successful!');
        console.log('✓ Access token present:', !!tokens.access_token);
        console.log('✓ Refresh token present:', !!tokens.refresh_token);
        console.log('✓ Access token length:', tokens.access_token?.length || 0);
        console.log('✓ Refresh token length:', tokens.refresh_token?.length || 0);
        
        // EXTRA VERIFICATIE: Check of tokens echt zijn opgeslagen
        console.log('🔍 Verifying token storage...');
        try {
          const fs = require('fs').promises;
          const path = require('path');
          const authPath = path.join('/home/ubuntu/.config', 'abacusai_auth_secrets.json');
          const authContent = await fs.readFile(authPath, 'utf8');
          const authData = JSON.parse(authContent);
          const savedAccessToken = authData?.['google search console']?.secrets?.access_token?.value;
          const savedRefreshToken = authData?.['google search console']?.secrets?.refresh_token?.value;
          console.log('✓ Access token saved to file:', !!savedAccessToken);
          console.log('✓ Refresh token saved to file:', !!savedRefreshToken);
          if (!savedAccessToken || !savedRefreshToken) {
            console.error('❌ CRITICAL: Tokens were not properly saved to auth file!');
          }
        } catch (verifyError: any) {
          console.error('❌ Error verifying token storage:', verifyError.message);
        }
        
        console.log('═══════════════════════════════════════════');
        console.log('🎉 OAuth Flow Complete - Redirecting...');
        console.log('═══════════════════════════════════════════');
        
        // Redirect terug naar de juiste pagina met success indicator
        // Als er een projectId is, ga terug naar de project settings
        // Anders ga naar de client portal settings
        const successUrl = callbackProjectId 
          ? `/client-portal/projects/${callbackProjectId}?tab=gsc&gsc=success`
          : '/client-portal?gsc=success';
        
        console.log('✓ Redirect to:', successUrl);
        
        return NextResponse.redirect(new URL(successUrl, 'https://writgoai.nl'));
      } catch (error: any) {
        console.log('═══════════════════════════════════════════');
        console.error('❌ OAuth Token Exchange Failed');
        console.log('═══════════════════════════════════════════');
        console.error('✗ Error message:', error.message);
        console.error('✗ Error stack:', error.stack);
        console.log('═══════════════════════════════════════════');
        
        const errorUrl = callbackProjectId 
          ? `/client-portal/projects/${callbackProjectId}?tab=gsc&gsc=error&message=${encodeURIComponent(error.message)}`
          : `/client-portal?gsc=error&message=${encodeURIComponent(error.message)}`;
        
        return NextResponse.redirect(new URL(errorUrl, 'https://writgoai.nl'));
      }
    }
    
    // Anders, initieer OAuth flow
    if (action === 'connect') {
      // CRITICAL: Use https://writgoai.nl as the redirect URI to match Google Console config
      const redirectUri = 'https://writgoai.nl/api/client/search-console/oauth';
      
      // Encode projectId in state parameter for callback
      let authUrl = getOAuthUrl(redirectUri);
      if (projectId) {
        const state = Buffer.from(JSON.stringify({ projectId })).toString('base64');
        authUrl += `&state=${encodeURIComponent(state)}`;
      }
      
      console.log('🔗 Initiating OAuth flow...');
      console.log('✓ Redirect URI:', redirectUri);
      console.log('✓ Project ID:', projectId || 'NOT PROVIDED');
      console.log('✓ Auth URL generated:', authUrl);
      
      // Return HTML with auto-redirect voor externe OAuth URLs
      // NextResponse.redirect werkt niet goed met externe URLs
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Redirecting to Google...</title>
          </head>
          <body>
            <p>Je wordt doorgestuurd naar Google...</p>
            <script>
              window.location.href = ${JSON.stringify(authUrl)};
            </script>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    }
    
    return NextResponse.json({
      error: 'Ongeldige request. Gebruik ?action=connect of geef een code mee.',
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error in OAuth flow:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij OAuth',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
