import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache the brand settings for 1 hour
let cachedBrandSettings: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedBrandSettings && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json(cachedBrandSettings);
    }

    // Fetch from database
    let brandSettings = await prisma.brandSettings.findUnique({
      where: { id: 'default' },
    });

    // If no settings exist, create default
    if (!brandSettings) {
      brandSettings = await prisma.brandSettings.create({
        data: {
          id: 'default',
          companyName: 'Writgo Media',
          tagline: 'AI-First Omnipresence Content Agency',
          logoUrl: 'https://computerstartgids.nl/wp-content/uploads/2025/12/Writgo-Media-logo-4.png',
          primaryColor: '#FF9933',
          secondaryColor: '#0B3C5D',
          accentColor: '#FF6B35',
        },
      });
      
      // Clear cache to ensure fresh settings
      cachedBrandSettings = null;
      cacheTime = 0;
    }

    // Update cache
    cachedBrandSettings = brandSettings;
    cacheTime = now;

    return NextResponse.json(brandSettings);
  } catch (error) {
    console.error('Failed to fetch brand settings:', error);
    
    // Return default settings if database fails
    return NextResponse.json({
      id: 'default',
      companyName: 'Writgo Media',
      tagline: 'AI-First Omnipresence Content Agency',
      logoUrl: 'https://computerstartgids.nl/wp-content/uploads/2025/12/Writgo-Media-logo-4.png',
      logoLightUrl: null,
      logoDarkUrl: null,
      logoIconUrl: null,
      faviconUrl: null,
      favicon192Url: null,
      favicon512Url: null,
      primaryColor: '#FF9933',
      secondaryColor: '#0B3C5D',
      accentColor: '#FF6B35',
      email: null,
      phone: null,
      address: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      defaultMetaTitle: null,
      defaultMetaDescription: null,
      updatedAt: new Date(),
    });
  }
}
