
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all affiliate links for client
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const links = await prisma.affiliateLink.findMany({
      where: { clientId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    );
  }
}

// POST create new affiliate link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, url, description, category } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }

    const link = await prisma.affiliateLink.create({
      data: {
        clientId: session.user.id,
        title,
        url,
        description: description || null,
        category: category || null,
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    return NextResponse.json(
      { error: 'Failed to create affiliate link' },
      { status: 500 }
    );
  }
}
