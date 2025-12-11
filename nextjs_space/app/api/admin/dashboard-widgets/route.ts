/**
 * Admin Dashboard Widgets API
 * GET /api/admin/dashboard-widgets - Aggregate data for all dashboard widgets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all data in parallel for better performance
    const [
      emailsData,
      distributionData,
      contentData,
      platformsData,
    ] = await Promise.allSettled([
      // 1. Emails data
      getEmailsData(),
      
      // 2. Distribution/Social Media data
      getDistributionData(),
      
      // 3. Content data
      getContentData(),
      
      // 4. Social media platforms data
      getPlatformsData(),
    ]);

    return NextResponse.json({
      emails: emailsData.status === 'fulfilled' ? emailsData.value : { unread: 0, recent: [] },
      socialMedia: distributionData.status === 'fulfilled' ? distributionData.value : { 
        platforms: [], 
        scheduledPosts: 0, 
        recentPosts: [] 
      },
      content: contentData.status === 'fulfilled' ? contentData.value : { 
        generatedToday: 0, 
        pending: 0, 
        published: 0, 
        recent: [] 
      },
      platforms: platformsData.status === 'fulfilled' ? platformsData.value : [],
    });
  } catch (error: any) {
    console.error('[Dashboard Widgets API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getEmailsData() {
  // Get unread count
  const unread = await prisma.inboxEmail.count({
    where: { 
      isRead: false,
      folder: 'inbox'
    },
  });

  // Get recent unread emails
  const recent = await prisma.inboxEmail.findMany({
    where: { 
      isRead: false,
      folder: 'inbox'
    },
    orderBy: {
      receivedAt: 'desc',
    },
    take: 5,
    select: {
      id: true,
      from: true,
      fromName: true,
      subject: true,
      snippet: true,
      receivedAt: true,
      isRead: true,
    },
  });

  return {
    unread,
    recent: recent.map(email => ({
      id: email.id,
      from: email.from,
      fromName: email.fromName || email.from,
      subject: email.subject,
      preview: email.snippet || '',
      receivedAt: email.receivedAt.toISOString(),
      isRead: email.isRead,
    })),
  };
}

async function getDistributionData() {
  // Get scheduled posts count from distribution_tasks
  const { data: scheduledTasks, error } = await supabaseAdmin
    .from('distribution_tasks')
    .select('id, scheduled_at, status, platforms, metadata', { count: 'exact' })
    .in('status', ['pending', 'scheduled'])
    .order('scheduled_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[Dashboard Widgets] Error fetching distribution tasks:', error);
    throw error;
  }

  const scheduledPosts = scheduledTasks?.length || 0;

  return {
    scheduledPosts,
    recentPosts: (scheduledTasks || []).map(task => ({
      id: task.id,
      platforms: task.platforms,
      scheduledFor: task.scheduled_at,
      content: task.metadata?.preview || task.metadata?.title || 'Geen titel',
      status: task.status,
    })),
  };
}

async function getPlatformsData() {
  // Get connected platforms data from latedev accounts
  // This would need to be fetched from the Late.dev API or a database table
  // For now, return empty array as placeholder until platform integration is complete
  return [];
}

async function getContentData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // Get content statistics from ContentPiece
  const [
    generatedToday,
    pending,
    publishedThisWeek,
    recentContent,
  ] = await Promise.all([
    // Content generated today
    prisma.contentPiece.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    }),
    
    // Pending content (status = 'pending' or 'draft')
    prisma.contentPiece.count({
      where: {
        status: {
          in: ['pending', 'draft'],
        },
      },
    }),
    
    // Published this week
    prisma.contentPiece.count({
      where: {
        status: 'published',
        updatedAt: {
          gte: weekStart,
        },
      },
    }),
    
    // Recent content items
    prisma.contentPiece.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          },
        },
      },
    }),
  ]);

  return {
    generatedToday,
    pending,
    published: publishedThisWeek,
    recent: recentContent.map(content => ({
      id: content.id,
      title: content.title || 'Geen titel',
      type: content.type || 'content',
      clientName: content.client?.companyName || content.client?.name || 'Onbekend',
      status: content.status,
      createdAt: content.createdAt.toISOString(),
    })),
  };
}
