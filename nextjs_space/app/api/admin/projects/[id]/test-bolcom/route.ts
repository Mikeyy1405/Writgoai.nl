import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/projects/[id]/test-bolcom
 * Test Bol.com API connection
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID en Client Secret zijn verplicht' },
        { status: 400 }
      );
    }

    // Test OAuth2 authentication with Bol.com
    const tokenUrl = 'https://login.bol.com/token';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Bol.com authentication failed:', tokenResponse.status, errorText);
      
      if (tokenResponse.status === 401) {
        return NextResponse.json(
          { error: 'Ongeldige Client ID of Client Secret. Controleer je gegevens.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Kan geen verbinding maken met Bol.com API.' },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Authentication successful - for affiliate API, we primarily need the token
    // The affiliate API (catalog/search) is different from retailer API
    // We'll verify we can make a basic catalog search request
    const catalogSearchUrl = 'https://api.bol.com/catalog/v4/search?q=test&limit=1';
    
    try {
      const searchResponse = await fetch(catalogSearchUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json',
        },
      });

      if (!searchResponse.ok) {
        console.log('Bol.com catalog API test had issues:', searchResponse.status);
        // Authentication works, but catalog access may be limited - this is still a success
        return NextResponse.json({
          success: true,
          message: 'Authenticatie gelukt! Bol.com credentials zijn correct.',
          warning: 'Mogelijk beperkte API toegang - controleer je affiliate rechten als je problemen ervaart.'
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Bol.com API verbinding succesvol getest!',
      });
    } catch (apiError) {
      // If catalog test fails, authentication still worked
      console.log('Catalog test failed but auth succeeded:', apiError);
      return NextResponse.json({
        success: true,
        message: 'Authenticatie gelukt! Bol.com credentials zijn correct.',
      });
    }
  } catch (error: any) {
    console.error('Bol.com connection test error:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return NextResponse.json(
        { error: 'Kan Bol.com API niet bereiken. Controleer je internetverbinding.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Er ging iets mis bij het testen van de verbinding.' },
      { status: 500 }
    );
  }
}
