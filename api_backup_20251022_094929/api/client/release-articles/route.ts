
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Release articles based on subscription package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get subscription
    const subscription = await prisma.clientSubscription.findUnique({
      where: { clientId: session.user.id },
      include: { Package: true },
    });

    if (!subscription || !subscription.Package) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      );
    }

    const monthlyAllowance = subscription.Package.articlesPerMonth || 0;

    if (monthlyAllowance === 0) {
      return NextResponse.json(
        { error: 'Your package does not include articles' },
        { status: 400 }
      );
    }

    // Get master plan
    const masterPlan = await prisma.masterContentPlan.findUnique({
      where: { clientId: session.user.id },
      include: {
        MasterArticles: {
          where: { isReleased: true },
        },
      },
    });

    if (!masterPlan) {
      return NextResponse.json(
        { error: 'No master plan found. Generate one first.' },
        { status: 400 }
      );
    }

    // Check how many already released this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const releasedThisMonth = masterPlan.MasterArticles.filter(
      (article: any) => article.releasedAt && new Date(article.releasedAt) >= firstOfMonth
    ).length;

    if (releasedThisMonth >= monthlyAllowance) {
      return NextResponse.json(
        { 
          error: 'Monthly article limit reached',
          released: releasedThisMonth,
          allowance: monthlyAllowance,
        },
        { status: 400 }
      );
    }

    const articlesToRelease = monthlyAllowance - releasedThisMonth;

    // Find locked articles with highest priority
    const lockedArticles = await prisma.masterArticle.findMany({
      where: {
        masterPlanId: masterPlan.id,
        isReleased: false,
        status: 'LOCKED',
      },
      orderBy: [
        { priority: 'asc' }, // HIGH first (alphabetically)
        { articleNumber: 'asc' },
      ],
      take: articlesToRelease,
    });

    if (lockedArticles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No more articles to release',
        releasedCount: 0,
      });
    }

    // Release articles
    await prisma.masterArticle.updateMany({
      where: {
        id: { in: lockedArticles.map((a) => a.id) },
      },
      data: {
        isReleased: true,
        releasedAt: new Date(),
        status: 'AVAILABLE',
      },
    });

    // Update master plan
    await prisma.masterContentPlan.update({
      where: { id: masterPlan.id },
      data: {
        articlesReleased: {
          increment: lockedArticles.length,
        },
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      releasedCount: lockedArticles.length,
      articles: lockedArticles.map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
      })),
      message: `${lockedArticles.length} nieuwe artikelen beschikbaar!`,
    });
  } catch (error) {
    console.error('Error releasing articles:', error);
    return NextResponse.json(
      { error: 'Failed to release articles' },
      { status: 500 }
    );
  }
}

// GET released articles count
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const masterPlan = await prisma.masterContentPlan.findUnique({
      where: { clientId: session.user.id },
      include: {
        MasterArticles: {
          where: { isReleased: true },
        },
      },
    });

    if (!masterPlan) {
      return NextResponse.json({ released: 0, total: 0 });
    }

    // Count released this month
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const releasedThisMonth = masterPlan.MasterArticles.filter(
      (article: any) => article.releasedAt && new Date(article.releasedAt) >= firstOfMonth
    ).length;

    return NextResponse.json({
      released: masterPlan.MasterArticles.length,
      total: masterPlan.totalArticles,
      releasedThisMonth,
    });
  } catch (error) {
    console.error('Error fetching released count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch count' },
      { status: 500 }
    );
  }
}
