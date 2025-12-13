import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the client to ensure data isolation
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Only fetch projects belonging to this client
    const projects = await prisma.project.findMany({
      where: { 
        clientId: client.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' },
      // Exclude sensitive fields from response
      select: {
        id: true,
        clientId: true,
        name: true,
        websiteUrl: true,
        description: true,
        status: true,
        niche: true,
        targetAudience: true,
        brandVoice: true,
        writingStyle: true,
        customInstructions: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude sensitive fields:
        // wordpressPassword, settings (contains API secrets)
      }
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the client from session to ensure security
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      websiteUrl,  // Accept websiteUrl from frontend
      siteUrl,     // Keep for backwards compatibility
      description, // Accept description
      status,      // Accept status
      niche, 
      targetAudience, 
      brandVoice, 
      wordpressUrl, 
      wordpressUsername, 
      wordpressPassword, 
      getlateProfileId, 
      getlateAccessToken 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Always use the authenticated client's ID, never trust client-provided clientId
    const project = await prisma.project.create({
      data: {
        clientId: client.id,  // Use authenticated client's ID
        name,
        websiteUrl: websiteUrl || siteUrl || '',     // Accept both, prefer websiteUrl, empty string if not provided
        description,                                  // New field
        status: status || 'active',                  // New field with default
        niche,
        targetAudience,
        brandVoice,
        wordpressUrl,
        wordpressUsername,
        wordpressPassword,
        getlateProfileId,
        getlateAccessToken,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
