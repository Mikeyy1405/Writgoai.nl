
/**
 * Payment Webhook - Migrated to Moneybird
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // Payment system being migrated to Moneybird
  return NextResponse.json(
    { 
      error: 'Webhook endpoint gemigreerd naar Moneybird',
      migrating: true 
    },
    { status: 503 }
  );
}
