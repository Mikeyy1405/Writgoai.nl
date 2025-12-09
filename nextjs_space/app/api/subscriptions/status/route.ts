

export const dynamic = "force-dynamic";
/**
 * Get current subscription status
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
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
      select: {
        subscriptionId: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        monthlyCredits: true,
        subscriptionCredits: true,
        topUpCredits: true
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get plan details if subscribed
    let planDetails = null;
    if (client.subscriptionPlan) {
      planDetails = await prisma.subscriptionPlan.findUnique({
        where: { name: client.subscriptionPlan }
      });
    }

    return NextResponse.json({
      subscription: {
        id: client.subscriptionId,
        plan: client.subscriptionPlan,
        status: client.subscriptionStatus,
        startDate: client.subscriptionStartDate,
        endDate: client.subscriptionEndDate,
        monthlyCredits: client.monthlyCredits,
        subscriptionCredits: client.subscriptionCredits,
        topUpCredits: client.topUpCredits,
        totalCredits: client.subscriptionCredits + client.topUpCredits
      },
      planDetails
    });

  } catch (error: any) {
    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
