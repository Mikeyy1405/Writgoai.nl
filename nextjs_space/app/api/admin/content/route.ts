

export const dynamic = "force-dynamic";
// Admin API voor het ophalen van alle gegenereerde content

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';


export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const whereClause: any = {};
    
    if (clientId) {
      whereClause.clientId = clientId;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    const contentPieces = await prisma.contentPiece.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            website: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
    
    return NextResponse.json({ contentPieces });
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
  }
}

