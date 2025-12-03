

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { testBolcomCredentials } from '@/lib/bolcom-api';

// POST - Test Bol.com credentials
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
    const { bolcomClientId, bolcomClientSecret } = data;

    if (!bolcomClientId || !bolcomClientSecret) {
      return NextResponse.json(
        { error: 'Client ID en Client Secret zijn verplicht' },
        { status: 400 }
      );
    }

    // Test de credentials
    const isValid = await testBolcomCredentials({
      clientId: bolcomClientId,
      clientSecret: bolcomClientSecret
    });

    if (!isValid) {
      return NextResponse.json(
        { error: 'Ongeldige Bol.com credentials. Controleer je Client ID en Client Secret.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Bol.com credentials zijn geldig! ✅'
    });

  } catch (error: any) {
    console.error('Error testing Bol.com credentials:', error);
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Ongeldige Bol.com credentials. Controleer je Client ID en Client Secret.' },
        { status: 400 }
      );
    }

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return NextResponse.json(
        { error: 'Kan geen verbinding maken met Bol.com API. Probeer het later opnieuw.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Fout bij testen Bol.com credentials' },
      { status: 500 }
    );
  }
}

