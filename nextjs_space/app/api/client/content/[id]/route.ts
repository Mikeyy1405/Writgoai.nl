
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';


export const dynamic = 'force-dynamic';

// Update content
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Verify ownership
    const contentPiece = await prisma.contentPiece.findFirst({
      where: { 
        id,
        clientId: client.id 
      }
    });
    
    if (!contentPiece) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    
    // Update content
    const updated = await prisma.contentPiece.update({
      where: { id },
      data: {
        ...body,
        reviewedAt: new Date(),
        status: body.status || 'ready_for_review'
      }
    });
    
    return NextResponse.json({
      success: true,
      content: updated
    });
    
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

// Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = params;
    
    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Verify ownership
    const contentPiece = await prisma.contentPiece.findFirst({
      where: { 
        id,
        clientId: client.id 
      }
    });
    
    if (!contentPiece) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }
    
    // Delete content
    await prisma.contentPiece.delete({
      where: { id }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Content deleted'
    });
    
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
