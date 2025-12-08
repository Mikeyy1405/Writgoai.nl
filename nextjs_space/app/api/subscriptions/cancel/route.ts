

export const dynamic = "force-dynamic";
/**
 * Cancel subscription - Payment system migrated to Moneybird
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
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

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { subscriptionId: true, subscriptionStatus: true }
    });

    if (!client?.subscriptionId) {
      return NextResponse.json(
        { error: 'Geen actief abonnement gevonden' },
        { status: 400 }
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
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
