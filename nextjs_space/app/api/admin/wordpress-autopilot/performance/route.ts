/**
 * WordPress Autopilot Performance Metrics API
 * GET: Get performance metrics for a site
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getContentCalendar } from '@/lib/wordpress-autopilot/database';
import type { AutopilotPerformanceMetrics } from '@/lib/wordpress-autopilot/types';

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
    
    // Get all published content
    const publishedContent = await getContentCalendar(siteId, {
      status: 'published',
    });
    
    // Calculate metrics
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const postsThisMonth = publishedContent.filter(
      item => item.publishedAt && item.publishedAt >= oneMonthAgo
    ).length;
    
    const postsThisWeek = publishedContent.filter(
      item => item.publishedAt && item.publishedAt >= oneWeekAgo
    ).length;
    
    // Get word counts from SavedContent
    const contentDetails = await Promise.all(
      publishedContent.slice(0, 20).map(async (item) => {
        if (item.contentId) {
          const savedContent = await prisma.savedContent.findUnique({
            where: { id: item.contentId },
            select: {
              wordCount: true,
            },
          });
          return savedContent?.wordCount || 0;
        }
        return 0;
      })
    );
    
    const averageWordCount = contentDetails.length > 0
      ? Math.round(contentDetails.reduce((a, b) => a + b, 0) / contentDetails.length)
      : 0;
    
    // Get recent posts
    const recentPosts = publishedContent
      .slice(0, 10)
      .map(item => ({
        id: item.id,
        title: item.title,
        url: item.publishedUrl || '',
        publishedAt: item.publishedAt || new Date(),
        views: 0, // TODO: Integrate with analytics
        wordCount: 0,
        focusKeyword: item.focusKeyword,
      }));
    
    // Calculate content coverage
    const strategy = await prisma.contentStrategy.findFirst({
      where: { siteId },
    });
    
    const contentCoverage = strategy ? {
      totalTopics: strategy.mainTopics?.length || 0,
      coveredTopics: publishedContent.length,
      percentage: strategy.currentCoverage || 0,
      uncoveredTopics: [],
      topicBreakdown: {},
    } : {
      totalTopics: 0,
      coveredTopics: 0,
      percentage: 0,
      uncoveredTopics: [],
      topicBreakdown: {},
    };
    
    const metrics: AutopilotPerformanceMetrics = {
      siteId: site.id,
      siteName: site.name,
      totalPosts: publishedContent.length,
      postsThisMonth,
      postsThisWeek,
      averageWordCount,
      totalViews: 0, // TODO: Integrate analytics
      averageViews: 0,
      topicalAuthorityScore: site.topicalAuthorityScore || 0,
      topPerformingPosts: [],
      recentPosts,
      keywordRankings: [],
      contentCoverage,
    };
    
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    console.error('❌ Failed to get performance metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen metrics' },
      { status: 500 }
    );
  }
}
