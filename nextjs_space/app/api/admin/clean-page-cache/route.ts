/**
 * POST /api/admin/clean-page-cache
 * 
 * Admin endpoint to clean WordPress PAGES from cache
 * (keeps only blog POSTS in cache)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { WordPressSitemapParser } from '@/lib/wordpress-sitemap-parser';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    });

    if (client?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get all projects
    const projects = await prisma.project.findMany({
      select: { id: true, websiteUrl: true }
    });

    console.log(`[Clean Cache] Processing ${projects.length} projects...`);

    let totalCleaned = 0;

    // Clean cached pages for each project
    for (const project of projects) {
      const cleaned = await WordPressSitemapParser.cleanCachedPages(project.id);
      totalCleaned += cleaned;
      
      if (cleaned > 0) {
        console.log(`[Clean Cache] Project ${project.websiteUrl}: cleaned ${cleaned} pages`);
      }
    }

    console.log(`[Clean Cache] ✅ Total: ${totalCleaned} cached pages removed`);

    return NextResponse.json({
      success: true,
      message: `Cleaned ${totalCleaned} cached WordPress pages`,
      totalCleaned,
      projectsProcessed: projects.length,
    });

  } catch (error: any) {
    console.error('[Clean Cache] Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to clean cache',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
