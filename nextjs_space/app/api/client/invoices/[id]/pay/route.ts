import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Payment system being migrated to Moneybird
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Payment system being migrated to Moneybird
    return NextResponse.json(
      { 
        error: 'Betalingssysteem wordt gemigreerd naar Moneybird. Probeer later opnieuw.',
        migrating: true 
      },
      { status: 503 }
    );
  } catch (error: any) {
    console.error('Error creating checkout:', error);
    return NextResponse.json(
      { error: error.message || 'Kon checkout niet aanmaken' },
      { status: 500 }
    );
  }
}
