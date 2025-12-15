import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Check admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const invoiced = searchParams.get('invoiced');
    const tool = searchParams.get('tool');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    
    if (clientId) where.clientId = clientId;
    if (invoiced !== null && invoiced !== undefined) {
      where.invoiced = invoiced === 'true';
    }
    if (tool) where.tool = tool;
    if (startDate) where.createdAt = { gte: new Date(startDate) };
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const usage = await prisma.toolUsage.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    // Calculate stats
    const stats = {
      totalItems: usage.length,
      totalSuggestedPrice: usage.reduce((sum, u) => sum + (u.suggestedPrice || 0), 0),
      unbilledItems: usage.filter(u => !u.invoiced).length,
      unbilledPrice: usage.filter(u => !u.invoiced).reduce((sum, u) => sum + (u.suggestedPrice || 0), 0),
      byTool: {} as Record<string, { count: number; price: number }>,
      byClient: {} as Record<string, { name: string; count: number; price: number }>,
    };

    for (const item of usage) {
      // By tool
      if (!stats.byTool[item.tool]) {
        stats.byTool[item.tool] = { count: 0, price: 0 };
      }
      stats.byTool[item.tool].count++;
      stats.byTool[item.tool].price += item.suggestedPrice || 0;

      // By client
      if (!stats.byClient[item.clientId]) {
        stats.byClient[item.clientId] = {
          name: item.client?.name || 'Onbekend',
          count: 0,
          price: 0,
        };
      }
      stats.byClient[item.clientId].count++;
      stats.byClient[item.clientId].price += item.suggestedPrice || 0;
    }

    return NextResponse.json({ usage, stats });
  } catch (error: any) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon usage niet ophalen' },
      { status: 500 }
    );
  }
}

// Mark usage as invoiced
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { usageIds, invoiceItemId } = body;

    if (!usageIds || !Array.isArray(usageIds) || usageIds.length === 0) {
      return NextResponse.json(
        { error: 'usageIds is verplicht' },
        { status: 400 }
      );
    }

    await prisma.toolUsage.updateMany({
      where: {
        id: { in: usageIds },
      },
      data: {
        invoiced: true,
        invoiceItemId: invoiceItemId || null,
      },
    });

    return NextResponse.json({ success: true, updatedCount: usageIds.length });
  } catch (error: any) {
    console.error('Usage update error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon usage niet bijwerken' },
      { status: 500 }
    );
  }
}
