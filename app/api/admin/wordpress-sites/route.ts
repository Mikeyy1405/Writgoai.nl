// Admin API voor WordPress Sites Management

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/admin/wordpress-sites
 * Haal alle WordPress sites op
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    const sites = await prisma.wordPressSite.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { publishedContent: true }
        }
      }
    });
    
    return NextResponse.json({ sites });
  } catch (error) {
    console.error('Failed to fetch WordPress sites:', error);
    return NextResponse.json({ error: 'Failed to fetch WordPress sites' }, { status: 500 });
  }
}

/**
 * POST /api/admin/wordpress-sites
 * Maak een nieuwe WordPress site aan
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, url, username, applicationPassword, userId, agencyId } = body;
    
    // Validatie
    if (!name || !url || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'Name, URL, username, and application password are required' },
        { status: 400 }
      );
    }
    
    // Zorg ervoor dat URL eindigt met /
    const normalizedUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const apiEndpoint = `${normalizedUrl}/wp-json`;
    
    const site = await prisma.wordPressSite.create({
      data: {
        name,
        url: normalizedUrl,
        username,
        applicationPassword,
        apiEndpoint,
        userId: userId || null,
        agencyId: agencyId || null,
        isActive: true
      }
    });
    
    return NextResponse.json({ site, message: 'WordPress site successfully created' });
  } catch (error) {
    console.error('Failed to create WordPress site:', error);
    return NextResponse.json({ error: 'Failed to create WordPress site' }, { status: 500 });
  }
}
