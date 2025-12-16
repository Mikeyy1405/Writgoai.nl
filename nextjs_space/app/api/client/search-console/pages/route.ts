import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { google } from 'googleapis';

/**
 * GET /api/client/search-console/pages
 * Get Google Search Console data for pages
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0];

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client_id: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Check if Google Search Console is connected
    if (!project.google_search_console_token) {
      return NextResponse.json(
        { 
          error: 'Google Search Console niet verbonden',
          needsConnection: true,
        },
        { status: 400 }
      );
    }

    try {
      // Initialize Google Search Console API
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        access_token: project.google_search_console_token,
        refresh_token: project.google_search_console_refresh_token,
      });

      const searchconsole = google.searchconsole({ version: 'v1', auth: oauth2Client });

      // Query Search Console data
      const response = await searchconsole.searchanalytics.query({
        siteUrl: project.website,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 100,
          dataState: 'final',
        },
      });

      const pages = response.data.rows?.map((row: any) => ({
        url: row.keys?.[0] || '',
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })) || [];

      return NextResponse.json({
        success: true,
        pages,
        dateRange: { startDate, endDate },
        totalPages: pages.length,
      });
    } catch (gscError: any) {
      console.error('Google Search Console API error:', gscError);
      
      // Check if token expired
      if (gscError.code === 401 || gscError.message?.includes('invalid_grant')) {
        return NextResponse.json(
          { 
            error: 'Google Search Console verbinding verlopen',
            needsReconnection: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Fout bij ophalen van Search Console data',
          details: gscError.message || 'Onbekende fout',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Error fetching Search Console pages:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het ophalen van pagina data' },
      { status: 500 }
    );
  }
}
