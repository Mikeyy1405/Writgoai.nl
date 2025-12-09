

export const dynamic = "force-dynamic";
/**
 * Purchase credits - Payment system migrated to Moneybird
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const clientId = decoded.clientId;

    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return NextResponse.json(
        { error: 'packageId is required' },
        { status: 400 }
      );
    }

    // Get package details
    const pkg = await prisma.creditPackage.findUnique({
      where: { id: packageId }
    });

    if (!pkg || !pkg.active) {
      return NextResponse.json(
        { error: 'Package not found or inactive' },
        { status: 404 }
      );
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { email: true, name: true }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
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
    console.error('Purchase error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
