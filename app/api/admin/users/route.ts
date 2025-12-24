import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// Create admin client for accessing auth.users
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/users
 *
 * Returns a list of all users with their credit information
 * Only accessible to admin users
 */
export async function GET() {
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

    // Get all users with their subscription info
    const { data: subscribers, error: fetchError } = await supabase
      .from('subscribers')
      .select(`
        id,
        user_id,
        credits_remaining,
        monthly_credits,
        subscription_tier,
        subscription_active,
        is_admin,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      return NextResponse.json({
        error: 'Failed to fetch users'
      }, { status: 500 });
    }

    // Get email addresses from auth.users for each subscriber
    const usersWithEmails = await Promise.all(
      subscribers.map(async (sub) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
        return {
          ...sub,
          email: authUser?.user?.email || 'Unknown',
          name: authUser?.user?.user_metadata?.name || null,
        };
      })
    );

    return NextResponse.json({
      users: usersWithEmails,
      total: usersWithEmails.length,
    });
  } catch (error) {
    console.error('Error in admin users GET:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
