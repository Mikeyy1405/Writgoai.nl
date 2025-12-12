import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List affiliate links
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.affiliateLink.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(links);
  } catch (error: any) {
    console.error('❌ GET affiliate links error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create affiliate link
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const link = await prisma.affiliateLink.create({
      data: {
        projectId: params.id,
        name: body.name,
        url: body.url,
        description: body.description || null,
        category: body.category || null,
        keywords: body.keywords || []
      }
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST affiliate link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
