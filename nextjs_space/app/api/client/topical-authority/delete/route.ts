/**
 * DELETE /api/client/topical-authority/delete
 * 
 * Delete a topical authority map and all its articles
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const mapId = searchParams.get('mapId');
    
    if (!mapId) {
      return NextResponse.json(
        { success: false, error: 'Map ID is verplicht' },
        { status: 400 }
      );
    }
    
    console.log(`[Delete Map] Deleting map: ${mapId}`);
    
    // Verify ownership
    const map = await prisma.topicalAuthorityMap.findFirst({
      where: {
        id: mapId,
        project: {
          clientId: client.id
        }
      },
      include: {
        _count: {
          select: {
            articles: true
          }
        }
      }
    });
    
    if (!map) {
      return NextResponse.json(
        { success: false, error: 'Map niet gevonden of geen toegang' },
        { status: 404 }
      );
    }
    
    console.log(`[Delete Map] Found map with ${map._count.articles} articles`);
    
    // Delete all articles first (if cascade is not set up)
    const deletedArticles = await prisma.topicalAuthorityArticle.deleteMany({
      where: { mapId }
    });
    
    console.log(`[Delete Map] Deleted ${deletedArticles.count} articles`);
    
    // Delete the map
    await prisma.topicalAuthorityMap.delete({
      where: { id: mapId }
    });
    
    console.log(`[Delete Map] ✅ Map deleted successfully: ${mapId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Map en alle artikelen verwijderd',
      data: {
        deletedArticles: deletedArticles.count
      }
    });
    
  } catch (error: any) {
    console.error('[Delete Map] ❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Fout bij verwijderen'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Support POST as well for compatibility
  return DELETE(request);
}
