

export const dynamic = "force-dynamic";
// Admin API voor het ophalen van alle klanten

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check for recent signups query parameter
    const { searchParams } = new URL(request.url);
    const recentOnly = searchParams.get('recent') === 'true';
    
    if (recentOnly) {
      // Get clients registered in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentClients = await prisma.client.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { contentPieces: true }
          }
        }
      });
      
      return NextResponse.json({ clients: recentClients });
    }
    
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contentPieces: true }
        }
      }
    });
    
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}
