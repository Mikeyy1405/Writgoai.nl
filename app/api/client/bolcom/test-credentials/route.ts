
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { testBolcomCredentials, type BolcomCredentials } from '@/lib/bolcom-api';

export const dynamic = "force-dynamic";

/**
 * POST /api/client/bolcom/test-credentials
 * Test Bol.com API credentials
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'Client ID en Client Secret zijn verplicht' },
        { status: 400 }
      );
    }

    const credentials: BolcomCredentials = {
      clientId,
      clientSecret,
    };

    const isValid = await testBolcomCredentials(credentials);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Bol.com credentials zijn geldig! ✅',
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Bol.com credentials zijn ongeldig. Controleer je Client ID en Client Secret.',
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Bol.com credentials test error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Fout bij testen credentials',
      },
      { status: 500 }
    );
  }
}
