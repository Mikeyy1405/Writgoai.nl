
import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint om OAuth flow direct te testen
 * Gebruik: https://writgoai.nl/api/test-gsc-oauth
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/client/search-console/oauth`;
  
  if (!clientId) {
    return NextResponse.json({
      error: 'CLIENT_ID niet gevonden',
      env: process.env.NEXTAUTH_URL,
    });
  }
  
  const scopes = ['https://www.googleapis.com/auth/webmasters.readonly'].join(' ');
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  console.log('🔗 Test OAuth URL:', authUrl);
  console.log('📍 Redirect URI:', redirectUri);
  console.log('🔑 Client ID:', clientId?.substring(0, 20) + '...');
  
  // Direct HTML response met clickable link
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>GSC OAuth Test</title>
        <style>
          body { font-family: Arial; padding: 40px; background: #1a1a1a; color: #fff; }
          .info { background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { 
            display: inline-block;
            padding: 15px 30px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 16px;
          }
          .button:hover { background: #357ae8; }
          code { background: #333; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h1>🔐 Google Search Console OAuth Test</h1>
        
        <div class="info">
          <h3>✅ Configuratie Check:</h3>
          <ul>
            <li><strong>Client ID:</strong> <code>${clientId?.substring(0, 40)}...</code></li>
            <li><strong>Redirect URI:</strong> <code>${redirectUri}</code></li>
            <li><strong>NEXTAUTH_URL:</strong> <code>${process.env.NEXTAUTH_URL}</code></li>
          </ul>
        </div>
        
        <div class="info">
          <h3>📋 Instructies:</h3>
          <ol>
            <li>Klik op de knop hieronder om naar Google te gaan</li>
            <li>Log in met je Google account</li>
            <li>Geef toestemming voor Search Console toegang</li>
            <li>Je wordt teruggestuurd naar WritGo</li>
            <li>Check daarna de diagnostics: <a href="/api/client/search-console/diagnostics" style="color: #4285f4">/api/client/search-console/diagnostics</a></li>
          </ol>
        </div>
        
        <a href="${authUrl}" class="button">
          🚀 Start OAuth Flow Nu
        </a>
        
        <div class="info">
          <h3>🔍 Debug Info:</h3>
          <p>De OAuth URL is gegenereerd en klaar voor gebruik.</p>
          <p><small>Auth URL: ${authUrl.substring(0, 100)}...</small></p>
        </div>
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
