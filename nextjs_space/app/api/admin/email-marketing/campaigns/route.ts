/**
 * Marketing Campaigns API
 * Create, read, update campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const campaigns = await prisma.marketingCampaign.findMany({
      where: { clientId: client.id },
      include: {
        list: {
          select: {
            name: true,
            subscriberCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('[Campaigns] Error fetching campaigns:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      name,
      subject,
      previewText,
      templateHtml,
      templateJson,
      listId,
      scheduledAt,
    } = body;

    if (!name || !subject || !templateHtml) {
      return NextResponse.json(
        { error: 'Name, subject, and template are required' },
        { status: 400 }
      );
    }

    // Create campaign
    const campaign = await prisma.marketingCampaign.create({
      data: {
        clientId: client.id,
        name,
        subject,
        previewText,
        templateHtml,
        templateJson,
        listId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'draft',
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: any) {
    console.error('[Campaigns] Error creating campaign:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
