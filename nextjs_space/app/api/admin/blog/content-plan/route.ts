import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/blog/content-plan
 * 
 * List all content plans with their items and stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const where: any = {};
    if (status) where.status = status;

    // Get plans with item counts
    const [plans, total] = await Promise.all([
      prisma.contentPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.contentPlan.count({ where }),
    ]);

    // Get item counts for each plan
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
        const items = await prisma.contentPlanItem.findMany({
          where: { planId: plan.id },
          orderBy: { order: 'asc' },
        });

        const stats = {
          total: items.length,
          pending: items.filter(i => i.status === 'pending').length,
          generating: items.filter(i => i.status === 'generating').length,
          generated: items.filter(i => i.status === 'generated').length,
          published: items.filter(i => i.status === 'published').length,
          failed: items.filter(i => i.status === 'failed').length,
        };

        return {
          ...plan,
          stats,
          items: items.map(item => ({
            id: item.id,
            title: item.title,
            status: item.status,
            scheduledDate: item.scheduledDate,
            blogPostId: item.blogPostId,
          })),
        };
      })
    );

    return NextResponse.json({
      plans: plansWithStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[Content Plan List] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
