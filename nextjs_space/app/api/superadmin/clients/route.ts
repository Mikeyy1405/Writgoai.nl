
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || session.user.email !== 'info@writgo.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const plan = searchParams.get('plan') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status === 'active') {
      where.subscriptionStatus = 'active';
    } else if (status === 'inactive') {
      where.subscriptionStatus = { not: 'active' };
    }

    if (plan !== 'all') {
      where.subscriptionPlan = plan;
    }

    // Get clients
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          subscriptionStatus: true,
          subscriptionPlan: true,
          subscriptionCredits: true,
          topUpCredits: true,
          totalCreditsUsed: true,
          isUnlimited: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              savedContent: true,
              projects: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.client.count({ where })
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
