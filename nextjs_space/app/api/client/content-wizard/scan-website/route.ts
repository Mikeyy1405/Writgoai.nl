import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { scanWordPressSite, ScanResult } from '@/lib/wordpress-scanner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { websiteUrl, projectId } = body;
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is verplicht' }, { status: 400 });
    }
    
    console.log(`[Scan Website] Starting scan for ${websiteUrl}`);
    
    // Run the comprehensive WordPress scan
    const scanResult: ScanResult = await scanWordPressSite(websiteUrl);
    
    console.log(`[Scan Website] Scan complete:`, {
      success: scanResult.success,
      niche: scanResult.niche,
      totalPosts: scanResult.totalPosts,
      totalPages: scanResult.totalPages,
      existingTopics: scanResult.existingTopics.length,
      categories: scanResult.categories.length
    });
    
    // Update project if provided
    if (projectId) {
      const client = await prisma.client.findUnique({
        where: { email: session.user.email }
      });
      
      if (client) {
        await prisma.project.updateMany({
          where: { 
            id: projectId,
            clientId: client.id
          },
          data: {
            sitemap: {
              urls: scanResult.existingContent.map(c => c.url),
              titles: scanResult.existingContent.map(c => c.title),
              topics: scanResult.existingTopics,
              categories: scanResult.categories,
              tags: scanResult.tags,
              totalPosts: scanResult.totalPosts,
              totalPages: scanResult.totalPages
            },
            sitemapScannedAt: new Date(),
            niche: scanResult.niche
          }
        });
        console.log(`[Scan Website] Updated project ${projectId} with scan results`);
      }
    }
    
    return NextResponse.json({
      success: scanResult.success,
      niche: scanResult.niche,
      existingPages: scanResult.existingContent.length,
      existingContent: scanResult.existingContent.slice(0, 100), // Limit response size
      existingTopics: scanResult.existingTopics,
      categories: scanResult.categories,
      tags: scanResult.tags,
      totalPosts: scanResult.totalPosts,
      totalPages: scanResult.totalPages,
      hasWordPress: scanResult.hasWordPress,
      sitemapFound: scanResult.sitemapFound,
      apiAvailable: scanResult.apiAvailable,
      suggestedTopics: scanResult.suggestedTopics,
      error: scanResult.error
    });
    
  } catch (error: any) {
    console.error('Error scanning website:', error);
    return NextResponse.json(
      { error: error.message || 'Website scan mislukt' },
      { status: 500 }
    );
  }
}
