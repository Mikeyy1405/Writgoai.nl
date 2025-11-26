
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/packages - Fetch all active subscription packages
export async function GET() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
