/**
 * API endpoint to schedule automatic product updates
 * Creates or updates a scheduled task for weekly price/stock checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, enabled = true, schedule = 'weekly' } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        client: { email: session.user.email }
      },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check credentials
    if (!project.bolcomClientId || !project.bolcomClientSecret) {
      return NextResponse.json(
        { error: 'Bol.com credentials not configured' },
        { status: 400 }
      );
    }

    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json(
        { error: 'WordPress/WooCommerce credentials not configured' },
        { status: 400 }
      );
    }

    // Count Bol.com products
    const productCount = await prisma.wooCommerceProduct.count({
      where: {
        projectId,
        importSource: 'bol',
        sku: { not: null },
      },
    });

    if (productCount === 0) {
      return NextResponse.json(
        { 
          error: 'No products found',
          message: 'Import products from Bol.com first before scheduling updates'
        },
        { status: 400 }
      );
    }

    // Create or update scheduled task metadata
    const taskMetadata = {
      enabled,
      schedule,
      projectId,
      projectName: project.name,
      productCount,
      lastRun: null as Date | null,
      nextRun: null as Date | null,
      createdAt: new Date(),
    };

    // Store in project settings
    await prisma.project.update({
      where: { id: projectId },
      data: {
        wooCommerceAutoUpdate: enabled,
        wooCommerceUpdateSchedule: schedule,
      },
    });

    return NextResponse.json({
      success: true,
      message: enabled 
        ? `Automatische updates geactiveerd! ${productCount} producten worden wekelijks gecontroleerd.`
        : 'Automatische updates uitgeschakeld',
      taskMetadata,
    });
  } catch (error: any) {
    console.error('Schedule updates error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule updates', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        client: { email: session.user.email }
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Count products
    const productCount = await prisma.wooCommerceProduct.count({
      where: {
        projectId,
        importSource: 'bol',
        sku: { not: null },
      },
    });

    return NextResponse.json({
      enabled: project.wooCommerceAutoUpdate || false,
      schedule: project.wooCommerceUpdateSchedule || 'weekly',
      productCount,
      projectName: project.name,
    });
  } catch (error: any) {
    console.error('Get schedule status error:', error);
    return NextResponse.json(
      { error: 'Failed to get schedule status', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        client: { email: session.user.email }
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Disable auto-update
    await prisma.project.update({
      where: { id: projectId },
      data: {
        wooCommerceAutoUpdate: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Automatische updates uitgeschakeld',
    });
  } catch (error: any) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule', message: error.message },
      { status: 500 }
    );
  }
}
