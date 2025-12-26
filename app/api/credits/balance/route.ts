import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getCreditBalance } from '@/lib/credit-manager';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


export async function GET(request: Request) {
  try {
    const supabase = createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credit balance
    const balance = await getCreditBalance(user.id);
    
    if (!balance) {
      // User doesn't have a subscription yet
      return NextResponse.json({
        credits_remaining: 0,
        monthly_credits: 0,
        subscription_tier: null,
        subscription_active: false,
      });
    }

    return NextResponse.json(balance);
  } catch (error: any) {
    console.error('Get credit balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get credit balance' },
      { status: 500 }
    );
  }
}
