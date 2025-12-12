export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Fetch all projects for the current user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's clientId
    let clientId = session.user.id;
    
    // If user is admin, get the specific client from query params
    // Otherwise, use the logged-in user's ID
    const { searchParams } = new URL(request.url);
    const queryClientId = searchParams.get('clientId');
    
    if (queryClientId && session.user.role === 'admin') {
      clientId = queryClientId;
    }

    const projects = await prisma.project.findMany({
      where: { clientId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, websiteUrl, description, clientId } = body;

    // Validation
    if (!name || !websiteUrl) {
      return NextResponse.json(
        { error: 'Project naam en website URL zijn verplicht' },
        { status: 400 }
      );
    }

    // Determine which clientId to use
    let targetClientId = clientId || session.user.id;
    
    // If user is not admin, they can only create projects for themselves
    if (session.user.role !== 'admin' && targetClientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to create project for another client' },
        { status: 403 }
      );
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: targetClientId }
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        clientId: targetClientId,
        name: name.trim(),
        websiteUrl: websiteUrl.trim(),
        description: description?.trim() || null,
        status: 'active',
        isActive: true,
        isPrimary: false,
        settings: {}
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Project succesvol aangemaakt',
      project 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
