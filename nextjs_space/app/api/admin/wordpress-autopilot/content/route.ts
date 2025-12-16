/**
 * WordPress Autopilot Content API
 * GET: Get all content for a site with performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getContentCalendar } from '@/lib/wordpress-autopilot/database';

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
    const status = searchParams.get('status');
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID verplicht' },
        { status: 400 }
      );
    }
    
    // Get site to verify ownership
    const site = await prisma.wordPressAutopilotSite.findUnique({
      where: { id: siteId },
    });
    
    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang' },
        { status: 403 }
      );
    }
    
    // Get content calendar
    const content = await getContentCalendar(siteId, {
      status: status as any,
    });
    
    // Get associated SavedContent for published items
    const contentWithDetails = await Promise.all(
      content.map(async (item) => {
        if (item.contentId) {
          const savedContent = await prisma.savedContent.findUnique({
            where: { id: item.contentId },
            select: {
              id: true,
              title: true,
              wordCount: true,
            },
          });
          
          return {
            ...item,
            wordCount: savedContent?.wordCount,
          };
        }
        return item;
      })
    );
    
    return NextResponse.json({
      success: true,
      content: contentWithDetails,
      total: content.length,
    });
  } catch (error: any) {
    console.error('❌ Failed to get content:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen content' },
      { status: 500 }
    );
  }
}
