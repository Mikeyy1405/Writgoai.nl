
/**
 * Get all subscription plans
 */

import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { priceEur: 'asc' }
    });

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('Get plans error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
