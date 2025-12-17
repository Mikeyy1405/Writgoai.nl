/**
 * POST /api/client/topical-authority/cancel
 * 
 * Cancel a generating topical authority map
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export async function POST(request: Request) {
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
    
    const { mapId } = await request.json();
    
    if (!mapId) {
      return NextResponse.json(
        { success: false, error: 'Map ID is verplicht' },
        { status: 400 }
      );
    }
    
    console.log(`[Cancel Map] Cancelling map: ${mapId}`);
    
    // Verify ownership and check status
    const map = await prisma.topicalAuthorityMap.findFirst({
      where: {
        id: mapId,
        project: {
          clientId: client.id
        }
      }
    });
    
    if (!map) {
      return NextResponse.json(
        { success: false, error: 'Map niet gevonden of geen toegang' },
        { status: 404 }
      );
    }
    
    // Only allow cancelling if status is 'generating'
    if (map.status !== 'generating') {
      return NextResponse.json(
        { success: false, error: `Kan alleen 'generating' maps annuleren. Huidige status: ${map.status}` },
        { status: 400 }
      );
    }
    
    // Update map status to cancelled
    await prisma.topicalAuthorityMap.update({
      where: { id: mapId },
      data: { 
        status: 'cancelled',
        updatedAt: new Date()
      }
    });
    
    console.log(`[Cancel Map] ✅ Map cancelled successfully: ${mapId}`);
    
    return NextResponse.json({ 
      success: true,
      message: 'Generatie geannuleerd'
    });
    
  } catch (error: any) {
    console.error('[Cancel Map] ❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Fout bij annuleren'
    }, { status: 500 });
  }
}
