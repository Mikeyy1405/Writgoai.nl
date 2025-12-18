import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/simplified/content
 * 
 * OPTIMIZED: Fast database-only queries, no external API calls
 * 
 * Returns:
 * - Generated content (SavedContent table)
 * - Cached WordPress posts (WordPressSitemapCache table)
 * 
 * Performance: <500ms (was 5-10 seconds)
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('[Content API] ========== START ==========');
    console.log('[Content API] Request URL:', request.url);
    console.log('[Content API] Timestamp:', new Date().toISOString());
    
    // Check authenticatie
    console.log('[Content API] Checking session...');
    const session = await getServerSession(authOptions);
    console.log('[Content API] Session:', session?.user?.email || 'NO SESSION');
    console.log('[Content API] Session user:', session?.user ? JSON.stringify(session.user) : 'NULL');
    
    if (!session?.user?.email) {
      console.log('[Content API] ❌ Unauthorized - no session');
      return NextResponse.json(
        { 
          success: false,
          error: 'Niet geautoriseerd - geen sessie' 
        },
        { status: 401 }
      );
    }

    // Vind client
    console.log('[Content API] Looking up client by email:', session.user.email);
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    console.log('[Content API] Client:', client ? `Found (ID: ${client.id})` : 'NOT FOUND');

    if (!client) {
      console.log('[Content API] ❌ Client not found for email:', session.user.email);
      return NextResponse.json(
        { 
          success: false,
          error: 'Client niet gevonden' 
        },
        { status: 404 }
      );
    }

    console.log(`[Content API] Fetching content for client ${client.id}...`);

    // STEP 1: Check projects first
    console.log('[Content API] STEP 1: Checking projects for client...');
    const allProjects = await prisma.project.findMany({
      where: {
        clientId: client.id,
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
      },
    });
    
    console.log('[Content API] Projects found:', allProjects.length);
    if (allProjects.length === 0) {
      console.warn('[Content API] ⚠️ NO PROJECTS FOUND for this client!');
    } else {
      console.log('[Content API] Project details:');
      allProjects.forEach((p, idx) => {
        console.log(`[Content API]   ${idx + 1}. ${p.name} (ID: ${p.id})`);
        console.log(`[Content API]      - websiteUrl: ${p.websiteUrl || 'NOT SET'}`);
      });
      
      const projectsWithUrls = allProjects.filter(p => p.websiteUrl);
      console.log(`[Content API] Projects with websiteUrl: ${projectsWithUrls.length}/${allProjects.length}`);
    }

    // FAST: Only database queries, NO external API calls
    console.log('[Content API] STEP 2: Starting parallel database queries...');
    const [generatedContent, cachedWordPressPosts] = await Promise.all([
      // Generated content
      prisma.savedContent.findMany({
        where: {
          project: {
            clientId: client.id,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              websiteUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      
      // Cached WordPress posts
      prisma.wordPressSitemapCache.findMany({
        where: {
          project: {
            clientId: client.id,
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              websiteUrl: true,
            },
          },
        },
        orderBy: { publishedDate: 'desc' },
        take: 200,
      }),
    ]);

    console.log('[Content API] STEP 3: Query results:');
    console.log(`[Content API]   - Generated content: ${generatedContent.length} items`);
    console.log(`[Content API]   - Cached WordPress posts: ${cachedWordPressPosts.length} items`);
    
    if (generatedContent.length === 0 && cachedWordPressPosts.length === 0) {
      console.warn('[Content API] ⚠️ NO CONTENT FOUND at all!');
      console.warn('[Content API] This could mean:');
      console.warn('[Content API]   1. No content has been generated yet');
      console.warn('[Content API]   2. WordPress cache is empty (needs background fetch)');
      console.warn('[Content API]   3. Projects are not properly set up');
    }
    
    // Log first few items for debugging
    if (generatedContent.length > 0) {
      console.log('[Content API] Sample generated content (first 3):');
      generatedContent.slice(0, 3).forEach((item, idx) => {
        console.log(`[Content API]   ${idx + 1}. "${item.title}" (ID: ${item.id})`);
        console.log(`[Content API]      - projectId: ${item.projectId}`);
        console.log(`[Content API]      - hasProject: ${!!item.project}`);
        console.log(`[Content API]      - status: ${item.status}`);
        console.log(`[Content API]      - createdAt: ${item.createdAt}`);
      });
    }
    
    if (cachedWordPressPosts.length > 0) {
      console.log('[Content API] Sample WordPress posts (first 3):');
      cachedWordPressPosts.slice(0, 3).forEach((item, idx) => {
        console.log(`[Content API]   ${idx + 1}. "${item.title}" (ID: ${item.id})`);
        console.log(`[Content API]      - projectId: ${item.projectId}`);
        console.log(`[Content API]      - hasProject: ${!!item.project}`);
        console.log(`[Content API]      - url: ${item.url}`);
        console.log(`[Content API]      - publishedDate: ${item.publishedDate}`);
      });
    }

    // Map to unified format
    console.log('[Content API] STEP 4: Mapping to unified format...');
    
    // Check how many items will be filtered out
    const generatedWithoutProject = generatedContent.filter(item => !item.project);
    if (generatedWithoutProject.length > 0) {
      console.warn(`[Content API] ⚠️ Filtering out ${generatedWithoutProject.length} generated items without project!`);
    }
    
    const mappedGenerated = generatedContent
      .filter(item => item.project)
      .map(item => ({
        id: item.id,
        title: item.title || 'Untitled',
        url: item.publishedUrl || undefined,
        publishedDate: item.publishedAt,
        createdAt: item.createdAt,
        status: item.status || 'draft',
        source: 'generated',
        projectId: item.project.id,
        projectName: item.project.name || item.project.websiteUrl || 'Unknown Project',
        wordCount: item.wordCount || undefined,
      }));
    console.log(`[Content API]   - Mapped generated: ${mappedGenerated.length} items (${generatedWithoutProject.length} filtered)`);

    const wordpressWithoutProject = cachedWordPressPosts.filter(item => !item.project);
    if (wordpressWithoutProject.length > 0) {
      console.warn(`[Content API] ⚠️ Filtering out ${wordpressWithoutProject.length} WordPress items without project!`);
    }
    
    const mappedWordPress = cachedWordPressPosts
      .filter(item => item.project)
      .map(item => ({
        id: `wp-${item.id}`,
        title: item.title || 'Untitled',
        url: item.url,
        publishedDate: item.publishedDate,
        createdAt: item.publishedDate,
        status: 'published',
        source: 'wordpress',
        projectId: item.project.id,
        projectName: item.project.name || item.project.websiteUrl || 'Unknown Project',
      }));
    console.log(`[Content API]   - Mapped WordPress: ${mappedWordPress.length} items (${wordpressWithoutProject.length} filtered)`);

    // Combine and sort by date (newest first)
    console.log('[Content API] STEP 5: Combining and sorting content...');
    const allContent = [...mappedGenerated, ...mappedWordPress].sort((a, b) => {
      // ✅ CRITICAL FIX: Wrap in new Date() to handle string dates from database
      const dateA = new Date(a.publishedDate || a.createdAt || new Date(0));
      const dateB = new Date(b.publishedDate || b.createdAt || new Date(0));
      
      // Check for invalid dates
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        console.warn('[Content API] Invalid date detected:', { a: a.title, b: b.title });
        return 0;
      }
      
      return dateB.getTime() - dateA.getTime();
    });
    console.log(`[Content API]   - Total combined content: ${allContent.length} items`);

    // Calculate stats
    console.log('[Content API] STEP 6: Calculating stats...');
    const stats = {
      total: allContent.length,
      generated: mappedGenerated.length,
      wordpress: mappedWordPress.length,
      draft: allContent.filter(c => c.status === 'draft').length,
      published: allContent.filter(c => c.status === 'published').length,
      scheduled: allContent.filter(c => c.status === 'scheduled').length,
    };
    console.log('[Content API]   - Stats:', JSON.stringify(stats, null, 2));

    const duration = Date.now() - startTime;
    const response = {
      success: true,
      content: allContent,
      stats: stats,
    };
    
    console.log('[Content API] STEP 7: Preparing response...');
    console.log(`[Content API]   - Duration: ${duration}ms`);
    console.log('[Content API]   - Response structure:', {
      success: response.success,
      contentLength: response.content.length,
      stats: response.stats
    });
    
    if (allContent.length === 0) {
      console.warn('[Content API] ⚠️ WARNING: Returning EMPTY content array!');
      console.warn('[Content API] Client will see 0 items in Content Overview');
    } else {
      console.log(`[Content API] ✅ SUCCESS: Returning ${allContent.length} items`);
    }
    
    console.log('[Content API] ========== END ==========');

    return NextResponse.json(response);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Content API] ❌ ERROR after', duration, 'ms');
    console.error('[Content API] Error type:', error?.constructor?.name);
    console.error('[Content API] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Content API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Content API] Full error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Er is een fout opgetreden bij het ophalen van content',
        details: error instanceof Error ? error.message : 'Onbekende fout',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
