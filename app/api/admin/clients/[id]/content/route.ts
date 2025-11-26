

export const dynamic = "force-dynamic";
// Admin API voor het ophalen van alle content van een specifieke klant

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        contentPieces: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json({ client, contentPieces: client.contentPieces });
  } catch (error) {
    console.error('Failed to fetch client content:', error);
    return NextResponse.json({ error: 'Failed to fetch client content' }, { status: 500 });
  }
}

