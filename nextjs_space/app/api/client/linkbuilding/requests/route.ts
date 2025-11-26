
/**
 * Linkbuilding Requests API
 * 
 * Manages linkbuilding partnership requests between clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const maxDuration = 300;

/**
 * GET: List all linkbuilding requests (sent and received)
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'sent', 'received', 'all'

    // Fetch sent requests
    const sentRequests = type === 'all' || type === 'sent'
      ? await prisma.linkbuildingRequest.findMany({
          where: { fromClientId: client.id },
          include: {
            toClient: {
              select: {
                id: true,
                name: true,
                companyName: true,
                website: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // Fetch received requests
    const receivedRequests = type === 'all' || type === 'received'
      ? await prisma.linkbuildingRequest.findMany({
          where: { toClientId: client.id },
          include: {
            fromClient: {
              select: {
                id: true,
                name: true,
                companyName: true,
                website: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    return NextResponse.json({
      success: true,
      sent: sentRequests,
      received: receivedRequests,
    });
  } catch (error: any) {
    console.error('Error fetching linkbuilding requests:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new linkbuilding request
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
    const {
      toClientId,
      fromProjectId,
      toProjectId,
      message,
      proposedTopics,
      niche,
      creditsOffered,
      linksPerMonth,
    } = body;

    if (!toClientId) {
      return NextResponse.json(
        { error: 'Target client ID is required' },
        { status: 400 }
      );
    }

    // Don't allow requesting to self
    if (toClientId === client.id) {
      return NextResponse.json(
        { error: 'Cannot send request to yourself' },
        { status: 400 }
      );
    }

    // Check if target client exists
    const targetClient = await prisma.client.findUnique({
      where: { id: toClientId },
    });

    if (!targetClient) {
      return NextResponse.json(
        { error: 'Target client not found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending or accepted request
    const existingRequest = await prisma.linkbuildingRequest.findFirst({
      where: {
        OR: [
          { fromClientId: client.id, toClientId },
          { fromClientId: toClientId, toClientId: client.id },
        ],
        status: { in: ['pending', 'accepted'] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Er bestaat al een actief verzoek met deze client' },
        { status: 400 }
      );
    }

    // Calculate relevance score using AI if topics are provided
    let relevanceScore = null;
    let matchingTopics: string[] = [];

    if (proposedTopics && proposedTopics.length > 0) {
      // TODO: Calculate relevance score using AI
      relevanceScore = 75; // Placeholder
      matchingTopics = proposedTopics;
    }

    // Set expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create the request
    const newRequest = await prisma.linkbuildingRequest.create({
      data: {
        fromClientId: client.id,
        toClientId,
        fromProjectId: fromProjectId || null,
        toProjectId: toProjectId || null,
        message: message || '',
        proposedTopics: proposedTopics || [],
        niche: niche || null,
        relevanceScore,
        matchingTopics,
        creditsOffered: creditsOffered || 0,
        linksPerMonth: linksPerMonth || 2,
        expiresAt,
        status: 'pending',
      },
      include: {
        toClient: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            website: true,
          },
        },
      },
    });

    // TODO: Send notification email to target client

    return NextResponse.json({
      success: true,
      request: newRequest,
      message: 'Linkbuilding verzoek succesvol verzonden',
    });
  } catch (error: any) {
    console.error('Error creating linkbuilding request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update a request status (accept/reject)
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
    const { requestId, action, responseMessage } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'Request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Find the request
    const linkRequest = await prisma.linkbuildingRequest.findFirst({
      where: {
        id: requestId,
        toClientId: client.id, // Only the recipient can accept/reject
      },
    });

    if (!linkRequest) {
      return NextResponse.json(
        { error: 'Request not found or you are not authorized' },
        { status: 404 }
      );
    }

    if (linkRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    // Update request status
    const updatedRequest = await prisma.linkbuildingRequest.update({
      where: { id: requestId },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
        respondedAt: new Date(),
        responseMessage: responseMessage || null,
      },
    });

    // If accepted, create a partnership
    if (action === 'accept') {
      await prisma.linkbuildingPartnership.create({
        data: {
          requestingClientId: linkRequest.fromClientId,
          targetClientId: linkRequest.toClientId,
          requestingProjectId: linkRequest.fromProjectId,
          targetProjectId: linkRequest.toProjectId,
          relevantTopics: linkRequest.proposedTopics,
          niche: linkRequest.niche,
          maxLinksPerMonth: linkRequest.linksPerMonth,
          status: 'active',
        },
      });
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message:
        action === 'accept'
          ? 'Linkbuilding partnership geaccepteerd'
          : 'Linkbuilding verzoek afgewezen',
    });
  } catch (error: any) {
    console.error('Error updating linkbuilding request:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update request' },
      { status: 500 }
    );
  }
}
