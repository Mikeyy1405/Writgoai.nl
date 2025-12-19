// Admin API voor individuele WordPress Site beheer

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/wordpress-sites/[id]
 * Haal een specifieke WordPress site op
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const site = await prisma.wordPressSite.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { publishedContent: true }
        }
      }
    });
    
    if (!site) {
      return NextResponse.json({ error: 'WordPress site not found' }, { status: 404 });
    }
    
    return NextResponse.json({ site });
  } catch (error) {
    console.error('Failed to fetch WordPress site:', error);
    return NextResponse.json({ error: 'Failed to fetch WordPress site' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/wordpress-sites/[id]
 * Update een WordPress site
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, url, username, applicationPassword, isActive, userId, agencyId } = body;
    
    // Build update data
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
      updateData.url = normalizedUrl;
      updateData.apiEndpoint = `${normalizedUrl}/wp-json`;
    }
    if (username !== undefined) updateData.username = username;
    if (applicationPassword !== undefined) updateData.applicationPassword = applicationPassword;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (userId !== undefined) updateData.userId = userId || null;
    if (agencyId !== undefined) updateData.agencyId = agencyId || null;
    
    const site = await prisma.wordPressSite.update({
      where: { id: params.id },
      data: updateData
    });
    
    return NextResponse.json({ site, message: 'WordPress site successfully updated' });
  } catch (error) {
    console.error('Failed to update WordPress site:', error);
    return NextResponse.json({ error: 'Failed to update WordPress site' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/wordpress-sites/[id]
 * Verwijder een WordPress site
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await prisma.wordPressSite.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'WordPress site successfully deleted' });
  } catch (error) {
    console.error('Failed to delete WordPress site:', error);
    return NextResponse.json({ error: 'Failed to delete WordPress site' }, { status: 500 });
  }
}
