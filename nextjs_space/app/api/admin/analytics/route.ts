import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics - Get comprehensive analytics data
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      select: { role: true }
    });
    
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    // Parse time range from query params
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    // Calculate date range
    const daysAgo = parseInt(range.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    // Fetch API usage data
    const apiUsage = await prisma.apiUsage.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);
    
    // Calculate overview stats
    const totalApiCalls = apiUsage.length;
    const totalTokens = apiUsage.reduce((sum, usage) => sum + (usage.inputTokens || 0) + (usage.outputTokens || 0), 0);
    const totalCost = apiUsage.reduce((sum, usage) => sum + (usage.cost || 0), 0);
    const avgResponseTime = apiUsage.length > 0 
      ? apiUsage.reduce((sum, usage) => sum + (usage.responseTime || 0), 0) / apiUsage.length 
      : 0;
    
    // Group by date for trends
    const trendMap = new Map<string, { apiCalls: number; tokens: number; cost: number }>();
    apiUsage.forEach(usage => {
      const date = usage.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(date) || { apiCalls: 0, tokens: 0, cost: 0 };
      existing.apiCalls += 1;
      existing.tokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);
      existing.cost += usage.cost || 0;
      trendMap.set(date, existing);
    });
    
    const trends = Array.from(trendMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Group by client
    const clientMap = new Map<string, { clientName: string; apiCalls: number; tokens: number; cost: number }>();
    apiUsage.forEach(usage => {
      if (usage.client) {
        const existing = clientMap.get(usage.clientId) || { 
          clientName: usage.client.name, 
          apiCalls: 0, 
          tokens: 0, 
          cost: 0 
        };
        existing.apiCalls += 1;
        existing.tokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);
        existing.cost += usage.cost || 0;
        clientMap.set(usage.clientId, existing);
      }
    });
    
    const byClient = Array.from(clientMap.entries())
      .map(([clientId, data]) => ({ clientId, ...data }))
      .sort((a, b) => b.cost - a.cost);
    
    // Group by model
    const modelMap = new Map<string, { apiCalls: number; tokens: number; cost: number }>();
    apiUsage.forEach(usage => {
      const model = usage.modelName || 'unknown';
      const existing = modelMap.get(model) || { apiCalls: 0, tokens: 0, cost: 0 };
      existing.apiCalls += 1;
      existing.tokens += (usage.inputTokens || 0) + (usage.outputTokens || 0);
      existing.cost += usage.cost || 0;
      modelMap.set(model, existing);
    });
    
    const byModel = Array.from(modelMap.entries())
      .map(([model, data]) => ({ model, ...data }))
      .sort((a, b) => b.apiCalls - a.apiCalls);
    
    // Get content stats
    const [totalContent, blogsGenerated, socialGenerated] = await Promise.all([
      prisma.savedContent.count().catch(() => 0),
      prisma.savedContent.count({ 
        where: { contentType: 'blog' } 
      }).catch(() => 0),
      prisma.savedContent.count({ 
        where: { contentType: 'social' } 
      }).catch(() => 0),
    ]);
    
    const videosGenerated = totalContent - blogsGenerated - socialGenerated;
    
    // Calculate performance metrics
    const successfulCalls = apiUsage.filter(u => !u.error).length;
    const errorCalls = apiUsage.filter(u => u.error).length;
    const successRate = totalApiCalls > 0 ? (successfulCalls / totalApiCalls) * 100 : 100;
    const errorRate = totalApiCalls > 0 ? (errorCalls / totalApiCalls) * 100 : 0;
    
    return NextResponse.json({
      overview: {
        totalApiCalls,
        totalTokens,
        totalCost,
        avgResponseTime,
      },
      trends,
      byClient,
      byModel,
      contentStats: {
        totalContent,
        blogsGenerated,
        socialGenerated,
        videosGenerated,
      },
      performanceMetrics: {
        avgGenerationTime: avgResponseTime,
        successRate,
        errorRate,
      },
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
