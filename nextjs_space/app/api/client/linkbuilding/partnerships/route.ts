
/**
 * Linkbuilding Partnerships API
 * 
 * Manages active linkbuilding partnerships between clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const maxDuration = 300;

/**
 * GET: List all active partnerships
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get partnerships where client is either requester or target
    const partnerships = await prisma.linkbuildingPartnership.findMany({
      where: {
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
        status: 'active',
      },
      include: {
        requestingClient: {
          select: {
            id: true,
            name: true,
            companyName: true,
            website: true,
          },
        },
        targetClient: {
          select: {
            id: true,
            name: true,
            companyName: true,
            website: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      partnerships,
    });
  } catch (error: any) {
    console.error('Error fetching partnerships:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch partnerships' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update partnership (pause, resume, end)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { partnershipId, action } = body;

    if (!partnershipId || !action) {
      return NextResponse.json(
        { error: 'Partnership ID and action are required' },
        { status: 400 }
      );
    }

    if (!['pause', 'resume', 'end'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "pause", "resume", or "end"' },
        { status: 400 }
      );
    }

    // Find the partnership
    const partnership = await prisma.linkbuildingPartnership.findFirst({
      where: {
        id: partnershipId,
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
      },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: 'Partnership not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update partnership status
    const updateData: any = {};
    
    if (action === 'pause') {
      updateData.status = 'paused';
    } else if (action === 'resume') {
      updateData.status = 'active';
    } else if (action === 'end') {
      updateData.status = 'ended';
      updateData.endDate = new Date();
    }

    const updatedPartnership = await prisma.linkbuildingPartnership.update({
      where: { id: partnershipId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      partnership: updatedPartnership,
      message: `Partnership ${action === 'end' ? 'beëindigd' : action === 'pause' ? 'gepauzeerd' : 'hervat'}`,
    });
  } catch (error: any) {
    console.error('Error updating partnership:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update partnership' },
      { status: 500 }
    );
  }
}

/**
 * POST: Record a new link exchange
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { partnershipId, linkGiven } = body;

    if (!partnershipId || linkGiven === undefined) {
      return NextResponse.json(
        { error: 'Partnership ID and linkGiven flag are required' },
        { status: 400 }
      );
    }

    // Find the partnership
    const partnership = await prisma.linkbuildingPartnership.findFirst({
      where: {
        id: partnershipId,
        OR: [
          { requestingClientId: client.id },
          { targetClientId: client.id },
        ],
      },
    });

    if (!partnership) {
      return NextResponse.json(
        { error: 'Partnership not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update link counts
    const isRequester = partnership.requestingClientId === client.id;
    
    const updatedPartnership = await prisma.linkbuildingPartnership.update({
      where: { id: partnershipId },
      data: {
        ...(linkGiven
          ? { linksGiven: { increment: 1 } }
          : { linksReceived: { increment: 1 } }),
        lastLinkDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      partnership: updatedPartnership,
      message: 'Link exchange recorded',
    });
  } catch (error: any) {
    console.error('Error recording link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to record link' },
      { status: 500 }
    );
  }
}
