/**
 * Client Subscription API Route
 * 
 * GET: Retrieve active subscription for logged-in client
 * PUT: Update subscription (upgrade/downgrade)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getClientSubscription,
  updateClientSubscription,
} from '@/lib/supabase/client-helpers';
import { ClientSubscriptionUpdate } from '@/lib/supabase/database.types';
import { getPackageByType } from '@/lib/constants/packages';

export const dynamic = 'force-dynamic';

/**
 * GET /api/client/subscription
 * Get active subscription for the logged-in client
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    const subscription = await getClientSubscription(clientId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Enrich with package info
    const packageInfo = getPackageByType(subscription.package_type);

    return NextResponse.json({
      subscription: {
        ...subscription,
        package_info: packageInfo,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/client/subscription
 * Update subscription for the logged-in client
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const clientId = session.user.id;
    const updates: ClientSubscriptionUpdate = await request.json();

    // Validate updates
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    const updatedSubscription = await updateClientSubscription(
      clientId,
      updates
    );

    // Enrich with package info
    const packageInfo = getPackageByType(updatedSubscription.package_type);

    return NextResponse.json({
      subscription: {
        ...updatedSubscription,
        package_info: packageInfo,
      },
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
