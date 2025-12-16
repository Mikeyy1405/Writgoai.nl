/**
 * WordPress Autopilot Sites API
 * GET: Get all sites
 * DELETE: Delete a site
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAutopilotSites, deleteAutopilotSite } from '@/lib/wordpress-autopilot/database';

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
    
    const sites = await getAutopilotSites(client.id);
    
    return NextResponse.json({
      success: true,
      sites,
    });
  } catch (error: any) {
    console.error('❌ Failed to get sites:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen sites' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
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
    
    await deleteAutopilotSite(siteId);
    
    return NextResponse.json({
      success: true,
      message: 'Site verwijderd',
    });
  } catch (error: any) {
    console.error('❌ Failed to delete site:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verwijderen site' },
      { status: 500 }
    );
  }
}
