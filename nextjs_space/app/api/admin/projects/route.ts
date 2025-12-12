import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { getlateClient } from '@/lib/getlate/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/projects
 * Fetch all projects for the current user's client
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal alle projecten op
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/projects
 * Create a new project for the current user's client
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();

    // Valideer required fields
    if (!data.name || !data.websiteUrl) {
      return NextResponse.json(
        { error: 'Name and websiteUrl are required' },
        { status: 400 }
      );
    }

    // Stap 1: Maak Getlate.dev Profile aan
    let getlateProfile = null;
    try {
      // Genereer random kleur voor het profile
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      
      const profileResponse = await getlateClient.createProfile(
        data.name,
        data.description || `Social media management for ${data.name}`,
        randomColor
      );
      
      getlateProfile = profileResponse.profile;
      console.log('✓ Created Getlate profile:', getlateProfile._id);
    } catch (error) {
      console.error('Failed to create Getlate profile:', error);
      // Continue without Getlate integration if it fails
      console.warn('⚠️ Project will be created without Getlate integration');
    }

    // Stap 2: Maak WritGo project aan
    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        name: data.name,
        websiteUrl: data.websiteUrl,
        description: data.description || null,
        status: 'active',
        // Store Getlate profile info if successful
        ...(getlateProfile && {
          getlateProfileId: getlateProfile._id,
          getlateProfileName: getlateProfile.name
        })
      }
    });

    console.log('✓ Created project:', project.id, 
      getlateProfile ? `with Getlate profile ${getlateProfile._id}` : 'without Getlate profile');

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
