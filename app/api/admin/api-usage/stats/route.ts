
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { getClientUsageStats, getAverageCostPerArticle } from '@/lib/api-usage-tracker';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (admin?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const clientId = searchParams.get('clientId'); // optional

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Get statistics
    let stats;
    if (clientId) {
      // Get stats for specific client
      stats = await getClientUsageStats(clientId, startDate);
    } else {
      // Get overall stats (all clients)
      const where: any = {
        createdAt: {
          gte: startDate,
        },
      };

      const [totalUsage, usageByFeature, usageByModel, usageByClient, recentUsage] = await Promise.all([
        // Total stats
        prisma.apiUsage.aggregate({
          where,
          _sum: {
            totalTokens: true,
            totalCost: true,
          },
          _count: true,
        }),

        // Usage by feature
        prisma.apiUsage.groupBy({
          by: ['feature'],
          where,
          _sum: {
            totalTokens: true,
            totalCost: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              totalCost: 'desc',
            },
          },
        }),

        // Usage by model
        prisma.apiUsage.groupBy({
          by: ['model'],
          where,
          _sum: {
            totalTokens: true,
            totalCost: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              totalCost: 'desc',
            },
          },
        }),

        // Usage by client
        prisma.apiUsage.groupBy({
          by: ['clientId'],
          where: {
            ...where,
            clientId: {
              not: null,
            },
          },
          _sum: {
            totalTokens: true,
            totalCost: true,
          },
          _count: true,
          orderBy: {
            _sum: {
              totalCost: 'desc',
            },
          },
          take: 10, // Top 10 clients
        }),

        // Daily usage (last 30 days)
        prisma.$queryRaw`
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as requests,
            SUM(total_tokens) as tokens,
            SUM(total_cost) as cost
          FROM "ApiUsage"
          WHERE created_at >= ${startDate}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,
      ]);

      // Get client names for top clients
      const clientIds = usageByClient
        .map(c => c.clientId)
        .filter((id): id is string => id !== null);
      
      const clients = await prisma.client.findMany({
        where: {
          id: {
            in: clientIds,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      const clientMap = new Map(clients.map(c => [c.id, c]));

      stats = {
        total: {
          requests: totalUsage._count,
          tokens: totalUsage._sum.totalTokens || 0,
          cost: totalUsage._sum.totalCost || 0,
          costUSD: ((totalUsage._sum.totalCost || 0) / 100).toFixed(2),
        },
        byFeature: usageByFeature.map(f => ({
          feature: f.feature,
          requests: f._count,
          tokens: f._sum.totalTokens || 0,
          cost: f._sum.totalCost || 0,
          costUSD: ((f._sum.totalCost || 0) / 100).toFixed(2),
        })),
        byModel: usageByModel.map(m => ({
          model: m.model,
          requests: m._count,
          tokens: m._sum.totalTokens || 0,
          cost: m._sum.totalCost || 0,
          costUSD: ((m._sum.totalCost || 0) / 100).toFixed(2),
        })),
        byClient: usageByClient.map(c => ({
          clientId: c.clientId,
          clientName: c.clientId ? clientMap.get(c.clientId)?.name || 'Unknown' : 'Unknown',
          clientEmail: c.clientId ? clientMap.get(c.clientId)?.email || '' : '',
          requests: c._count,
          tokens: c._sum.totalTokens || 0,
          cost: c._sum.totalCost || 0,
          costUSD: ((c._sum.totalCost || 0) / 100).toFixed(2),
        })),
        recent: recentUsage,
      };
    }

    // Get average cost per article
    const avgCosts = await getAverageCostPerArticle(clientId);

    return NextResponse.json({
      success: true,
      timeRange: parseInt(timeRange),
      startDate: startDate.toISOString(),
      stats,
      avgCosts,
    });
  } catch (error: any) {
    console.error('Error fetching API usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API usage stats', details: error.message },
      { status: 500 }
    );
  }
}
