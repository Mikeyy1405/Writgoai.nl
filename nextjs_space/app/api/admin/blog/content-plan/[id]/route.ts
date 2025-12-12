import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/blog/content-plan/[id]
 * 
 * Get a specific content plan with all items
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const plan = await prisma.contentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Get all items for this plan
    const items = await prisma.contentPlanItem.findMany({
      where: { planId: id },
      orderBy: { order: 'asc' },
    });

    // Get blog posts for generated items
    const itemsWithPosts = await Promise.all(
      items.map(async (item) => {
        if (item.blogPostId) {
          const post = await prisma.blogPost.findUnique({
            where: { id: item.blogPostId },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              publishedAt: true,
            },
          });
          return { ...item, blogPost: post };
        }
        return item;
      })
    );

    return NextResponse.json({
      plan: {
        ...plan,
        items: itemsWithPosts,
      },
    });
  } catch (error: any) {
    console.error('[Content Plan Get] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * PUT /api/admin/blog/content-plan/[id]
 * 
 * Update a content plan
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const plan = await prisma.contentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update plan
    const updatedPlan = await prisma.contentPlan.update({
      where: { id },
      data: {
        name: body.name || plan.name,
        status: body.status || plan.status,
      },
    });

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        if (item.id) {
          await prisma.contentPlanItem.update({
            where: { id: item.id },
            data: {
              title: item.title,
              description: item.description,
              scheduledDate: item.scheduledDate ? new Date(item.scheduledDate) : undefined,
              keywords: item.keywords,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });
  } catch (error: any) {
    console.error('[Content Plan Update] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/blog/content-plan/[id]
 * 
 * Delete a content plan and all its items
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const plan = await prisma.contentPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Delete all items (will cascade due to foreign key)
    await prisma.contentPlanItem.deleteMany({
      where: { planId: id },
    });

    // Delete plan
    await prisma.contentPlan.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Content plan deleted',
    });
  } catch (error: any) {
    console.error('[Content Plan Delete] Error:', error);
    return NextResponse.json({
      error: 'Server error',
      details: error.message,
    }, { status: 500 });
  }
}
