import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60;

// GET - Fetch brand settings (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    let { data: brandSettings, error: fetchError } = await supabaseAdmin
      .from('BrandSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    // If no settings exist, create default
    if (!brandSettings && !fetchError) {
      const { data: newSettings, error: createError } = await supabaseAdmin
        .from('BrandSettings')
        .insert({
          id: 'default',
          companyName: 'WritgoAI',
          tagline: 'Content die scoort',
          logoUrl: '/writgo-media-logo.png',
          primaryColor: '#FF6B35',
          secondaryColor: '#0B3C5D',
          accentColor: '#FF9933',
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
      brandSettings = newSettings;
    }

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Branding API] Failed to fetch brand settings:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van de branding instellingen' },
      { status: 500 }
    );
  }
}

// PUT - Update brand settings (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields
    if (!data.companyName) {
      return NextResponse.json({ error: 'Bedrijfsnaam is verplicht' }, { status: 400 });
    }

    if (!data.primaryColor || !data.secondaryColor) {
      return NextResponse.json({ error: 'Primary en secondary kleuren zijn verplicht' }, { status: 400 });
    }

    // Update or create brand settings using upsert
    const settingsData = {
      id: 'default',
      companyName: data.companyName,
      tagline: data.tagline || null,
      logoUrl: data.logoUrl || null,
      logoLightUrl: data.logoLightUrl || null,
      logoDarkUrl: data.logoDarkUrl || null,
      logoIconUrl: data.logoIconUrl || null,
      faviconUrl: data.faviconUrl || null,
      favicon192Url: data.favicon192Url || null,
      favicon512Url: data.favicon512Url || null,
      primaryColor: data.primaryColor,
      secondaryColor: data.secondaryColor,
      accentColor: data.accentColor || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      linkedinUrl: data.linkedinUrl || null,
      twitterUrl: data.twitterUrl || null,
      facebookUrl: data.facebookUrl || null,
      instagramUrl: data.instagramUrl || null,
      defaultMetaTitle: data.defaultMetaTitle || null,
      defaultMetaDescription: data.defaultMetaDescription || null,
    };

    const { data: brandSettings, error: upsertError } = await supabaseAdmin
      .from('BrandSettings')
      .upsert(settingsData, { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Branding API] Failed to update brand settings:', error);
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de branding instellingen' },
      { status: 500 }
    );
  }
}
