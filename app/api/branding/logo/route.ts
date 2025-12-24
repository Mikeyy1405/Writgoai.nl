import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = createClient();

    // Fetch logo URL from app_settings
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'logo_url')
      .single();

    if (error) {
      // PGRST116 is "not found" error, which is ok
      // PGRST205 is "table not found" error, which means the migration hasn't been run yet
      if (error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('Error fetching logo:', error);
      }
      return NextResponse.json({ logoUrl: null });
    }

    return NextResponse.json({ logoUrl: data?.value || null });
  } catch (error) {
    console.error('Error in logo GET:', error);
    return NextResponse.json({ logoUrl: null });
  }
}

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
        error: 'Alleen administrators kunnen het logo wijzigen'
      }, { status: 403 });
    }

    const { logoUrl } = await request.json();

    // Update or insert logo URL
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'logo_url',
        value: logoUrl,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'key'
      });

    if (error) {
      // PGRST205 is "table not found" error
      if (error.code === 'PGRST205') {
        console.error('Error updating logo: app_settings table does not exist. Please run the migration.');
        return NextResponse.json({
          error: 'Database migration required. Please contact support.'
        }, { status: 500 });
      }
      console.error('Error updating logo:', error);
      return NextResponse.json({ error: 'Failed to update logo' }, { status: 500 });
    }

    return NextResponse.json({ success: true, logoUrl });
  } catch (error) {
    console.error('Error in logo POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
