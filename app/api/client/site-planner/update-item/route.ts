import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Update een specifiek item in een site plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { projectId, itemId, title, description, keywords, url } = await req.json();

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

    // Update the item in the plan data
    const planData = plan.planData as any;

    const updateItem = (item: any): any => {
      if (item.id === itemId) {
        return {
          ...item,
          title: title !== undefined ? title : item.title,
          description: description !== undefined ? description : item.description,
          keywords: keywords !== undefined ? keywords : item.keywords,
          url: url !== undefined ? url : item.url,
        };
      }

      // Update nested items
      if (item.clusters) {
        item.clusters = item.clusters.map(updateItem);
      }
      if (item.blogs) {
        item.blogs = item.blogs.map(updateItem);
      }

      return item;
    };

    // Update homepage
    if (planData.homepage?.id === itemId) {
      planData.homepage = updateItem(planData.homepage);
    }

    // Update pillars and their nested items
    if (planData.pillars) {
      planData.pillars = planData.pillars.map(updateItem);
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
    console.error('Update item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update item' },
      { status: 500 }
    );
  }
}
