import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// PUT - Update affiliate link
export async function PUT(
  request: Request,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const link = await prisma.affiliateLink.update({
      where: { id: params.linkId },
      data: {
        name: body.name,
        url: body.url,
        description: body.description,
        category: body.category,
        keywords: body.keywords,
        isActive: body.isActive
      }
    });

    return NextResponse.json(link);
  } catch (error: any) {
    console.error('❌ PUT affiliate link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete affiliate link
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; linkId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.affiliateLink.delete({
      where: { id: params.linkId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ DELETE affiliate link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
