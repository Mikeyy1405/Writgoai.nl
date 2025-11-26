
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAllSitePages, checkDuplicateContent } from '@/lib/google-search-console';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/search-console/pages
 * Haalt alle bestaande pagina's op van een site via Google Search Console
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    // Haal siteUrl op van query params
    const { searchParams } = new URL(request.url);
    const siteUrl = searchParams.get('siteUrl');
    const checkDuplicates = searchParams.get('checkDuplicates') === 'true';
    const topicsJson = searchParams.get('topics');
    
    if (!siteUrl) {
      return NextResponse.json(
        { error: 'siteUrl is verplicht' },
        { status: 400 }
      );
    }
    
    console.log('📊 Fetching Search Console data for:', siteUrl);
    
    // Haal alle bestaande pagina's op
    const pages = await getAllSitePages(siteUrl);
    
    console.log(`✅ Found ${pages.length} indexed pages`);
    
    // Check voor duplicates als topics zijn meegegeven
    let duplicates = null;
    if (checkDuplicates && topicsJson) {
      try {
        const topics = JSON.parse(topicsJson);
        console.log(`🔍 Checking ${topics.length} topics for duplicates...`);
        
        const duplicateMap = await checkDuplicateContent(siteUrl, topics);
        
        // Convert Map to object for JSON serialization
        duplicates = {};
        duplicateMap.forEach((value, key) => {
          duplicates[key] = value;
        });
        
        const duplicateCount = Array.from(duplicateMap.values()).filter(v => v.isDuplicate).length;
        console.log(`⚠️  Found ${duplicateCount} potential duplicates`);
      } catch (error) {
        console.error('Error checking duplicates:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      pages,
      duplicates,
      totalPages: pages.length,
      message: `${pages.length} pagina's gevonden in Search Console`,
    });
  } catch (error: any) {
    console.error('Error fetching Search Console pages:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij ophalen van Search Console data',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/search-console/pages
 * Check duplicate content voor specifieke topics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { siteUrl, topics } = body;
    
    if (!siteUrl || !topics || !Array.isArray(topics)) {
      return NextResponse.json(
        { error: 'siteUrl en topics zijn verplicht' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Checking ${topics.length} topics for duplicates on ${siteUrl}...`);
    
    // Check voor duplicates
    const duplicateMap = await checkDuplicateContent(siteUrl, topics);
    
    // Convert Map to array for easier processing
    const results = topics.map((topic: any, index: number) => {
      const duplicateInfo = duplicateMap.get(index) || {
        isDuplicate: false,
        score: 0,
      };
      
      return {
        topic,
        ...duplicateInfo,
      };
    });
    
    const duplicateCount = results.filter(r => r.isDuplicate).length;
    
    console.log(`✅ Duplicate check complete: ${duplicateCount}/${topics.length} duplicates found`);
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: topics.length,
        duplicates: duplicateCount,
        unique: topics.length - duplicateCount,
      },
    });
  } catch (error: any) {
    console.error('Error checking duplicates:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Fout bij duplicate check',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
