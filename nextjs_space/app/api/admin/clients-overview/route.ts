
/**
 * 👥 Admin: Klanten Overzicht
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabaseAdmin as prisma } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Check if admin
    if (!session || session.user?.email !== 'info@WritgoAI.nl') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all clients with stats
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        website: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contentPieces: true,
            videos: true,
            conversations: true,
            taskRequests: true,
            messages: true,
          },
        },
        conversations: {
          orderBy: {
            lastMessageAt: 'desc',
          },
          take: 1,
          select: {
            lastMessageAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data
    const clientsData = clients.map((client: any) => ({
      ...client,
      totalCredits: client.subscriptionCredits + client.topUpCredits,
      lastActive: client.conversations[0]?.lastMessageAt || client.updatedAt,
      stats: {
        contentPieces: client._count.contentPieces,
        videos: client._count.videos,
        conversations: client._count.conversations,
        taskRequests: client._count.taskRequests,
        unreadMessages: client._count.messages,
      },
    }));

    return NextResponse.json({
      success: true,
      clients: clientsData,
    });
  } catch (error: any) {
    console.error('Clients overview error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
