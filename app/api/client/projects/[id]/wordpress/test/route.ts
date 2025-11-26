

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

// POST - Test WordPress verbinding
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const data = await request.json();
    const { wordpressUrl, wordpressUsername, wordpressPassword } = data;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
        { status: 400 }
      );
    }

    // Normalize WordPress URL
    const normalizedUrl = wordpressUrl.replace(/\/$/, '');

    // Test connection by getting site info
    const authHeader = Buffer.from(
      `${wordpressUsername}:${wordpressPassword}`
    ).toString('base64');

    const testResponse = await fetch(`${normalizedUrl}/wp-json/wp/v2/users/me`, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.error('WordPress test failed:', errorText);
      
      if (testResponse.status === 401) {
        return NextResponse.json(
          { error: 'Ongeldige gebruikersnaam of wachtwoord' },
          { status: 400 }
        );
      }
      
      if (testResponse.status === 404) {
        return NextResponse.json(
          { error: 'WordPress API niet gevonden. Controleer de URL.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Kan geen verbinding maken met WordPress' },
        { status: 400 }
      );
    }

    const userData = await testResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Verbinding succesvol!',
      user: {
        id: userData.id,
        name: userData.name,
        roles: userData.roles
      }
    });

  } catch (error: any) {
    console.error('Error testing WordPress connection:', error);
    
    if (error.message?.includes('fetch')) {
      return NextResponse.json(
        { error: 'Kan geen verbinding maken met WordPress URL. Controleer de URL en probeer opnieuw.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fout bij testen WordPress verbinding' },
      { status: 500 }
    );
  }
}
