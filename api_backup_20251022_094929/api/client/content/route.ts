
// Client content overzicht API

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function getClientFromToken(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { clientId: string };
    return decoded.clientId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const clientId = getClientFromToken(request);
    
    if (!clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    
    const contentPieces = await prisma.contentPiece.findMany({
      where: { clientId },
      orderBy: { scheduledFor: 'desc' },
      take: limit
    });
    
    return NextResponse.json({
      success: true,
      content: contentPieces
    });
  } catch (error) {
    console.error('Get content error:', error);
    return NextResponse.json({ error: 'Failed to get content' }, { status: 500 });
  }
}
