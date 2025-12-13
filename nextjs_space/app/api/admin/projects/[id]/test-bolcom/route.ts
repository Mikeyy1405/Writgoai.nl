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

    // Test if we can use the API with a simple search
    const testSearchUrl = 'https://api.bol.com/retailer/v10/products?q=laptop&limit=1';
    
    const searchResponse = await fetch(testSearchUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.retailer.v10+json',
      },
    });

    if (!searchResponse.ok) {
      console.error('Bol.com API test search failed:', searchResponse.status);
      return NextResponse.json(
        { 
          success: true, 
          message: 'Authenticatie gelukt, maar API toegang beperkt. Controleer je API rechten.',
          warning: true
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bol.com API verbinding succesvol getest!',
    });
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
