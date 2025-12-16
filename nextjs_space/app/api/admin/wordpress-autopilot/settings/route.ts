/**
 * WordPress Autopilot Settings API
 * GET: Get settings for a site
 * PUT: Update settings including content rules
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAutopilotSettings, saveAutopilotSettings } from '@/lib/wordpress-autopilot/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get('siteId');
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID verplicht' },
        { status: 400 }
      );
    }
    
    // Verify site ownership
    const site = await prisma.wordPressAutopilotSite.findUnique({
      where: { id: siteId },
    });
    
    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang' },
        { status: 403 }
      );
    }
    
    // Get settings
    const settings = await getAutopilotSettings(siteId);
    
    return NextResponse.json({
      settings: settings || {
        siteId,
        enabled: true,
        postingFrequency: 'weekly',
        contentLength: 'medium',
        includeImages: true,
        includeFAQ: true,
        includeYouTube: false,
        autoPublish: true,
        notifications: {
          onPublish: true,
          onError: true,
        },
        toneOfVoice: 'professioneel',
        dosAndDonts: {
          dos: [],
          donts: [],
        },
      },
    });
  } catch (error: any) {
    console.error('❌ Failed to get settings:', error);
    return NextResponse.json(
      { error: error.message || 'Ophalen van instellingen mislukt' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    const { siteId, settings } = body;
    
    if (!siteId || !settings) {
      return NextResponse.json(
        { error: 'Site ID en settings verplicht' },
        { status: 400 }
      );
    }
    
    // Verify site ownership
    const site = await prisma.wordPressAutopilotSite.findUnique({
      where: { id: siteId },
    });
    
    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang' },
        { status: 403 }
      );
    }
    
    // Save settings
    const savedSettings = await saveAutopilotSettings({
      siteId,
      ...settings,
    });
    
    console.log(`✅ Settings updated for site: ${siteId}`);
    
    return NextResponse.json({
      success: true,
      settings: savedSettings,
    });
  } catch (error: any) {
    console.error('❌ Failed to update settings:', error);
    return NextResponse.json(
      { error: error.message || 'Opslaan van instellingen mislukt' },
      { status: 500 }
    );
  }
}
