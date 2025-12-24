import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * POST /api/admin/credits
 *
 * Updates credits for a specific user
 * Only accessible to admin users
 *
 * Body: {
 *   userId: string,
 *   credits: number,
 *   monthlyCredits?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: subscriber, error: subscriberError } = await supabase
      .from('subscribers')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();

    if (subscriberError || !subscriber || !subscriber.is_admin) {
      return NextResponse.json({
        error: 'Alleen administrators hebben toegang tot deze functie'
      }, { status: 403 });
    }

    const { userId, credits, monthlyCredits } = await request.json();

    // Validate input
    if (!userId || credits === undefined) {
      return NextResponse.json({
        error: 'userId en credits zijn verplicht'
      }, { status: 400 });
    }

    if (typeof credits !== 'number' || credits < 0) {
      return NextResponse.json({
        error: 'Credits moet een positief getal zijn'
      }, { status: 400 });
    }

    // Build update object
    const updateData: any = {
      credits_remaining: credits,
      updated_at: new Date().toISOString(),
    };

    // Optionally update monthly credits
    if (monthlyCredits !== undefined) {
      if (typeof monthlyCredits !== 'number' || monthlyCredits < 0) {
        return NextResponse.json({
          error: 'Monthly credits moet een positief getal zijn'
        }, { status: 400 });
      }
      updateData.monthly_credits = monthlyCredits;
    }

    // Update the user's credits
    const { data: updated, error: updateError } = await supabase
      .from('subscribers')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({
        error: 'Failed to update credits'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscriber: updated,
    });
  } catch (error) {
    console.error('Error in admin credits POST:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
