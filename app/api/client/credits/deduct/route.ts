import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { deductCredits } from '@/lib/credits';

/**
 * POST: Deduct credits from user account
 * Note: In the pay-as-you-go model, this just tracks usage without blocking
 */

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, description } = body;

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description required' }, { status: 400 });
    }

    // This will track usage but not actually block (pay-as-you-go model)
    const result = await deductCredits(
      session.user.id || session.user.email,
      amount,
      description
    );

    return NextResponse.json({
      success: result.success,
      newBalance: result.newBalance,
      message: 'Usage tracked for billing',
    });

  } catch (error) {
    console.error('Error deducting credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
