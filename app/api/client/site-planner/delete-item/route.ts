import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Verwijder een specifiek item uit een site plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { projectId, itemId } = await req.json();

    if (!projectId || !itemId) {
      return NextResponse.json(
        { error: 'Project ID en Item ID zijn verplicht' },
        { status: 400 }
      );
    }

    // Fetch the plan
    const plan = await prisma.sitePlan.findUnique({
      where: { projectId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    // Remove the item from the plan data
    const planData = plan.planData as any;

    const removeItem = (items: any[]): any[] => {
      return items
        .filter((item) => item.id !== itemId)
        .map((item) => {
          if (item.clusters) {
            item.clusters = removeItem(item.clusters);
          }
          if (item.blogs) {
            item.blogs = removeItem(item.blogs);
          }
          return item;
        });
    };

    // Remove from homepage
    if (planData.homepage?.id === itemId) {
      delete planData.homepage;
    }

    // Remove from pillars and nested items
    if (planData.pillars) {
      planData.pillars = removeItem(planData.pillars);
    }

    // Save updated plan
    const updatedPlan = await prisma.sitePlan.update({
      where: { id: plan.id },
      data: {
        planData: planData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedPlan.planData,
    });
  } catch (error: any) {
    console.error('Delete item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete item' },
      { status: 500 }
    );
  }
}
