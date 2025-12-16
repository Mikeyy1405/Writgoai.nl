/**
 * Stop WordPress Autopilot API
 * POST: Stop/pause autopilot for a site
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { updateAutopilotSite } from '@/lib/wordpress-autopilot/database';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
    const { siteId } = body;
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID verplicht' },
        { status: 400 }
      );
    }
    
    // Get site
    const site = await prisma.wordPressAutopilotSite.findUnique({
      where: { id: siteId },
    });
    
    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang' },
        { status: 403 }
      );
    }
    
    // Update site status
    await updateAutopilotSite(siteId, {
      status: 'paused',
    });
    
    console.log(`⏸️ Autopilot paused for site: ${site.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Autopilot gepauzeerd',
    });
  } catch (error: any) {
    console.error('❌ Failed to stop autopilot:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij stoppen autopilot' },
      { status: 500 }
    );
  }
}
