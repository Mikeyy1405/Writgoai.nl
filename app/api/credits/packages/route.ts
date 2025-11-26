
/**
 * Get available credit packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const packages = await prisma.creditPackage.findMany({
      where: { active: true },
      orderBy: { priceEur: 'asc' }
    });

    return NextResponse.json({ packages });
  } catch (error: any) {
    console.error('Get packages error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
