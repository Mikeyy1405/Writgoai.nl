
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * GET /api/client/search-console/diagnostics
 * Diagnostics endpoint voor OAuth debugging
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
    
    // Check environment variables
    const hasClientId = !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    // Check auth secrets file
    let authFileStatus = 'not_found';
    let hasAccessToken = false;
    let hasRefreshToken = false;
    let tokenDetails = null;
    let directoryExists = false;
    
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const configDir = '/home/ubuntu/.config';
      const authPath = path.join(configDir, 'abacusai_auth_secrets.json');
      
      console.log('Checking for config directory:', configDir);
      
      // Check if directory exists
      try {
        await fs.access(configDir);
        directoryExists = true;
        console.log('✓ Config directory exists');
      } catch {
        directoryExists = false;
        console.log('✗ Config directory does NOT exist');
        authFileStatus = 'directory_missing';
      }
      
      if (directoryExists) {
        console.log('Checking for auth file:', authPath);
        const authData = JSON.parse(await fs.readFile(authPath, 'utf8'));
        authFileStatus = 'found';
        
        console.log('Auth file structure:', JSON.stringify(authData['google search console'], null, 2));
        
        if (authData['google search console']) {
          hasAccessToken = !!authData['google search console'].secrets?.access_token?.value;
          hasRefreshToken = !!authData['google search console'].secrets?.refresh_token?.value;
          
          // Show token expiry if available
          if (hasAccessToken) {
            tokenDetails = {
              expiresAt: authData['google search console'].secrets?.access_token?.expires_at || 'unknown'
            };
          }
        }
      }
    } catch (error: any) {
      console.error('Error reading auth file:', error);
      if (error.code === 'ENOENT' && authFileStatus !== 'directory_missing') {
        authFileStatus = 'file_missing';
      }
    }
    
    // Construct expected redirect URI
    const redirectUri = `${nextAuthUrl}/api/client/search-console/oauth`;
    
    // Generate helpful instructions based on status
    let instructions = '';
    if (hasAccessToken) {
      instructions = '✅ OAuth is succesvol gekoppeld! Je kunt nu je GSC sites zien.';
    } else if (authFileStatus === 'directory_missing') {
      instructions = '📁 De config directory bestaat nog niet. Deze wordt automatisch aangemaakt tijdens de eerste OAuth flow. Klik op "Google Account Koppelen" om te beginnen.';
    } else if (authFileStatus === 'file_missing') {
      instructions = '📄 Het auth bestand bestaat nog niet. Dit wordt automatisch aangemaakt tijdens de eerste OAuth flow. Klik op "Google Account Koppelen" om te beginnen.';
    } else if (authFileStatus === 'found') {
      instructions = '⚠️ Auth bestand bestaat, maar bevat geen tokens. Probeer opnieuw te koppelen.';
    } else {
      instructions = '🔗 OAuth is nog niet gekoppeld. Zorg ervoor dat de redirect URI in Google Cloud Console overeenkomt met: ' + redirectUri;
    }
    
    return NextResponse.json({
      environment: {
        hasClientId,
        hasClientSecret,
        nextAuthUrl,
        redirectUri,
      },
      authFile: {
        status: authFileStatus,
        directoryExists,
        hasAccessToken,
        hasRefreshToken,
        tokenDetails,
      },
      instructions,
    });
  } catch (error: any) {
    console.error('Error in diagnostics:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij diagnostics',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
