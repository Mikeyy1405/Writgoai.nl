
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT update affiliate link
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, description, category, isActive } = body;

    // Verify ownership
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { 
        id: params.id,
        clientId: session.user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    const updatedLink = await prisma.affiliateLink.update({
      where: { id: params.id },
      data: {
        title: title || existingLink.title,
        url: url || existingLink.url,
        description: description !== undefined ? description : existingLink.description,
        category: category !== undefined ? category : existingLink.category,
        isActive: isActive !== undefined ? isActive : existingLink.isActive,
      },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to update affiliate link' },
      { status: 500 }
    );
  }
}

// DELETE affiliate link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingLink = await prisma.affiliateLink.findFirst({
      where: { 
        id: params.id,
        clientId: session.user.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }

    await prisma.affiliateLink.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to delete affiliate link' },
      { status: 500 }
    );
  }
}
