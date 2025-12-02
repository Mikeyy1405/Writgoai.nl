import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PUT - Update request (reject or review)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    const body = await request.json();
    const { status, adminResponse } = body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      updateData.reviewedAt = new Date();
    }
    if (adminResponse !== undefined) updateData.adminResponse = adminResponse;

    const clientRequest = await prisma.clientRequest.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ request: clientRequest });
  } catch (error: any) {
    console.error('Error updating request:', error);
    return NextResponse.json({ error: 'Kon verzoek niet bijwerken' }, { status: 500 });
  }
}

// DELETE request
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }

    await prisma.clientRequest.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting request:', error);
    return NextResponse.json({ error: 'Kon verzoek niet verwijderen' }, { status: 500 });
  }
}
