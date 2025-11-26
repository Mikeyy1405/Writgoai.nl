
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = params.clientId;

    // Haal alle content plannen op voor deze klant
    const contentPlans = await prisma.contentPlan.findMany({
      where: { clientId },
      include: {
        PlannedArticles: {
          include: {
            PublishedArticle: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
      ],
    });

    return NextResponse.json(contentPlans);
  } catch (error) {
    console.error('Error fetching content plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content plans' },
      { status: 500 }
    );
  }
}
