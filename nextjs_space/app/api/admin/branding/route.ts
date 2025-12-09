import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const maxDuration = 60;

// GET - Fetch brand settings (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    let brandSettings = await prisma.brandSettings.findUnique({
      where: { id: 'default' },
    });

    // If no settings exist, create default
    if (!brandSettings) {
      brandSettings = await prisma.brandSettings.create({
        data: {
          id: 'default',
          companyName: 'WritgoAI',
          tagline: 'Content die scoort',
          logoUrl: '/writgo-media-logo.png',
          primaryColor: '#FF6B35',
          secondaryColor: '#0B3C5D',
          accentColor: '#FF9933',
        },
      });
    }

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Branding API] Failed to fetch brand settings:', error);
    
    // Check if this is a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };
      
      // P2021: Table does not exist
      if (prismaError.code === 'P2021') {
        console.error('[Branding API] Database table does not exist. Run: npx prisma db push');
        return NextResponse.json(
          { error: 'Database tabel ontbreekt. Voer database migratie uit.' },
          { status: 500 }
        );
      }
      
      // P1001: Can't reach database server
      if (prismaError.code === 'P1001') {
        console.error('[Branding API] Cannot connect to database');
        return NextResponse.json(
          { error: 'Kan geen verbinding maken met de database' },
          { status: 500 }
        );
      }
      
      console.error('[Branding API] Prisma error code:', prismaError.code);
    }
    
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

    // Update or create brand settings
    const brandSettings = await prisma.brandSettings.upsert({
      where: { id: 'default' },
      update: {
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
      },
      create: {
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
      },
    });

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('[Branding API] Failed to update brand settings:', error);
    
    // Check if this is a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code: string; meta?: any };
      
      // P2021: Table does not exist
      if (prismaError.code === 'P2021') {
        console.error('[Branding API] Database table does not exist. Run: npx prisma db push');
        return NextResponse.json(
          { error: 'Database tabel ontbreekt. Voer database migratie uit.' },
          { status: 500 }
        );
      }
      
      // P1001: Can't reach database server
      if (prismaError.code === 'P1001') {
        console.error('[Branding API] Cannot connect to database');
        return NextResponse.json(
          { error: 'Kan geen verbinding maken met de database' },
          { status: 500 }
        );
      }
      
      console.error('[Branding API] Prisma error code:', prismaError.code);
    }
    
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het bijwerken van de branding instellingen' },
      { status: 500 }
    );
  }
}
