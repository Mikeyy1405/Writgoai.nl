import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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
      return NextResponse.json({
        companyName: 'Writgo Media',
        tagline: 'AI-First Omnipresence Content Agency',
        logoUrl: '/writgo-media-logo-transparent.png',
        primaryColor: '#FF5722',
        secondaryColor: '#2196F3',
        accentColor: '#FF9800',
      });
    }

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Brand API] Failed:', error);
    return NextResponse.json({
      companyName: 'Writgo Media',
      primaryColor: '#FF5722',
      secondaryColor: '#2196F3',
    });
  }
}
