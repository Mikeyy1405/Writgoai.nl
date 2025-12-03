import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { scanWebsite } from '@/lib/website-scanner';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, clientId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is vereist' }, { status: 400 });
    }

    console.log(`Scanning website: ${url}`);

    // Get client to check if sitemap is available
    const client = await prisma.client.findUnique({
      where: { id: clientId || session.user.id },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Scan website with AI
    const scanResult = await scanWebsite(url);

    // Merge with sitemap data if available
    if (client.wordpressSitemap && typeof client.wordpressSitemap === 'object') {
      const sitemap = client.wordpressSitemap as any;
      
      // Add sitemap categories to keywords if not already present
      if (sitemap.categories) {
        const existingKeywords = scanResult.nicheAnalysis.keywords;
        const newKeywords = [...new Set([...existingKeywords, ...sitemap.categories])];
        scanResult.nicheAnalysis.keywords = newKeywords.slice(0, 30);
      }

      // Add sitemap tags to topics
      if (sitemap.tags) {
        const existingTopics = scanResult.nicheAnalysis.topics;
        const newTopics = [...new Set([...existingTopics, ...sitemap.tags])];
        scanResult.nicheAnalysis.topics = newTopics.slice(0, 15);
      }

      console.log('Merged sitemap data:', {
        categories: sitemap.categories?.length || 0,
        tags: sitemap.tags?.length || 0,
        recentPosts: sitemap.recentPosts?.length || 0,
      });
    }

    // Store scan result in client
    await prisma.client.update({
      where: { id: clientId || session.user.id },
      data: {
        targetAudience: scanResult.websiteAnalysis.targetAudience,
        brandVoice: scanResult.websiteAnalysis.toneOfVoice,
        keywords: scanResult.nicheAnalysis.keywords,
      },
    });

    return NextResponse.json({
      success: true,
      scan: scanResult,
    });

  } catch (error) {
    console.error('Website scan error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({
      error: 'Fout bij scannen website',
      details: error instanceof Error ? error.message : 'Onbekende fout',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
