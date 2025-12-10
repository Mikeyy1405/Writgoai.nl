import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_BRAND_SETTINGS } from '@/lib/constants/branding';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: brandSettings, error } = await supabaseAdmin
      .from('BrandSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (error) {
      console.error('[Brand API] Error:', error);
      // Return defaults if table doesn't exist
      return NextResponse.json(DEFAULT_BRAND_SETTINGS);
    }

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Brand API] Failed:', error);
    return NextResponse.json(DEFAULT_BRAND_SETTINGS);
  }
}
