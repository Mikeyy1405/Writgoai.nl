
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { generateMasterContentPlan } from '@/lib/master-content-planner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      articlesPerWeek = 2,
      socialsPerWeek = 3,
      tiktoksPerWeek = 3,
      youtubeShortsPerWeek = 3,
    } = body;

    // Get client with AI profile
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: { AIProfile: true },
    });

    if (!client || !client.AIProfile) {
      return NextResponse.json(
        { error: 'Client or AI profile not found. Please complete website scan first.' },
        { status: 404 }
      );
    }

    // Generate master content plan
    console.log('Generating master content plan...');
    const masterPlan = await generateMasterContentPlan(
      client.AIProfile,
      articlesPerWeek,
      socialsPerWeek,
      tiktoksPerWeek,
      youtubeShortsPerWeek
    );

    // Store in database (simplified - just store the plan data)
    // In production, you'd want to store each item separately for tracking
    const storedPlan = await prisma.masterContentPlan.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        totalArticles: masterPlan.articles.length,
        status: 'READY',
        jimAnalysisData: JSON.stringify({
          strategy: masterPlan.strategy,
          totalItems: masterPlan.totalItems,
          duration: masterPlan.duration,
        }),
        websiteAnalysis: client.AIProfile.aiScanResults,
        seoStrategy: JSON.stringify(masterPlan),
      },
      update: {
        totalArticles: masterPlan.articles.length,
        status: 'READY',
        jimAnalysisData: JSON.stringify({
          strategy: masterPlan.strategy,
          totalItems: masterPlan.totalItems,
          duration: masterPlan.duration,
        }),
        seoStrategy: JSON.stringify(masterPlan),
        generatedAt: new Date(),
      },
    });

    // Create master articles
    for (let i = 0; i < masterPlan.articles.length; i++) {
      const article = masterPlan.articles[i];
      await prisma.masterArticle.upsert({
        where: {
          masterPlanId_articleNumber: {
            masterPlanId: storedPlan.id,
            articleNumber: i + 1,
          },
        },
        create: {
          masterPlanId: storedPlan.id,
          articleNumber: i + 1,
          title: article.title,
          topic: article.topic,
          mainKeyword: article.keywords[0] || article.title,
          lsiKeywords: article.keywords,
          priority: article.priority,
          status: 'AVAILABLE',
        },
        update: {
          title: article.title,
          topic: article.topic,
          mainKeyword: article.keywords[0] || article.title,
          lsiKeywords: article.keywords,
          priority: article.priority,
        },
      });
    }

    // Store video/reel ideas (simplified storage in AutoContentStrategy)
    await prisma.autoContentStrategy.upsert({
      where: { clientId: client.id },
      create: {
        clientId: client.id,
        niche: client.AIProfile.companyDescription || 'General',
        contentTypes: ['article', 'instagram_reel', 'tiktok_reel', 'youtube_short'],
        postsPerDay: Math.ceil((articlesPerWeek + socialsPerWeek + tiktoksPerWeek + youtubeShortsPerWeek) / 7),
        isEnabled: true,
      },
      update: {
        contentTypes: ['article', 'instagram_reel', 'tiktok_reel', 'youtube_short'],
        postsPerDay: Math.ceil((articlesPerWeek + socialsPerWeek + tiktoksPerWeek + youtubeShortsPerWeek) / 7),
      },
    });

    return NextResponse.json({
      success: true,
      plan: storedPlan,
      masterPlan: {
        ...masterPlan,
        // Don't send all items in response, just summary
        articles: masterPlan.articles.slice(0, 5),
        instagramReels: masterPlan.instagramReels.slice(0, 5),
        tiktokReels: masterPlan.tiktokReels.slice(0, 5),
        youtubeShorts: masterPlan.youtubeShorts.slice(0, 5),
      },
    });

  } catch (error) {
    console.error('Error in generate-master-plan API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        MasterContentPlan: {
          include: {
            MasterArticles: {
              take: 20,
              orderBy: { articleNumber: 'asc' },
            },
          },
        },
        AutoContentStrategy: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const masterPlan = client.MasterContentPlan;
    if (!masterPlan) {
      return NextResponse.json({ error: 'No master plan found' }, { status: 404 });
    }

    // Parse stored plan
    const fullPlan = masterPlan.seoStrategy ? JSON.parse(masterPlan.seoStrategy) : null;

    return NextResponse.json({
      success: true,
      plan: masterPlan,
      articles: client.MasterContentPlan?.MasterArticles || [],
      fullPlan: fullPlan,
      strategy: client.AutoContentStrategy,
    });

  } catch (error) {
    console.error('Error fetching master plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master plan' },
      { status: 500 }
    );
  }
}
