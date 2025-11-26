import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Voeg een nieuw item toe aan een site plan
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { projectId, item, parentId, type } = await req.json();

    if (!projectId || !item || !type) {
      return NextResponse.json(
        { error: 'Project ID, item data en type zijn verplicht' },
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

    // Add the item to the plan data
    const planData = plan.planData as any;

    // Generate unique ID
    const newItem = {
      ...item,
      id: `item-${Date.now()}`,
      type,
    };

    if (type === 'homepage') {
      planData.homepage = newItem;
    } else if (type === 'pillar') {
      if (!planData.pillars) {
        planData.pillars = [];
      }
      planData.pillars.push(newItem);
    } else if (type === 'cluster' && parentId) {
      // Add to pillar
      const pillar = planData.pillars?.find((p: any) => p.id === parentId);
      if (pillar) {
        if (!pillar.clusters) {
          pillar.clusters = [];
        }
        pillar.clusters.push(newItem);
      }
    } else if (type === 'blog' && parentId) {
      // Find parent cluster
      for (const pillar of planData.pillars || []) {
        const cluster = pillar.clusters?.find((c: any) => c.id === parentId);
        if (cluster) {
          if (!cluster.blogs) {
            cluster.blogs = [];
          }
          cluster.blogs.push(newItem);
          break;
        }
      }
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
      newItemId: newItem.id,
    });
  } catch (error: any) {
    console.error('Add item error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add item' },
      { status: 500 }
    );
  }
}
