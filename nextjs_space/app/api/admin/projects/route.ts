import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';
import { getlateClient } from '@/lib/getlate/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/projects
 * Fetch all projects for the current user's client
 * FIXED: Better error logging
 */
export async function GET(request: Request) {
  try {
    console.log('[Projects API GET] Fetching projects...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Projects API GET] No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Projects API GET] User:', session.user.email);

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      console.error('[Projects API GET] Client not found for:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('[Projects API GET] Client found:', client.id);

    // Haal alle projecten op
    const projects = await prisma.project.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('[Projects API GET] Found', projects.length, 'projects');

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('[Projects API GET] ❌ ERROR:', error);
    console.error('[Projects API GET] Error details:', error.message);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch projects',
        details: error.message || 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/projects
 * Create a new project for the current user's client
 * FIXED: Better error logging and graceful Getlate failure handling
 */
export async function POST(request: Request) {
  try {
    console.log('[Projects API POST] Starting project creation...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('[Projects API POST] No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Projects API POST] User:', session.user.email);

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      console.error('[Projects API POST] Client not found for:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    console.log('[Projects API POST] Client found:', client.id);

    const data = await request.json();
    console.log('[Projects API POST] Request data:', {
      name: data.name,
      websiteUrl: data.websiteUrl,
      hasDescription: !!data.description
    });

    // Valideer required fields
    if (!data.name || !data.websiteUrl) {
      console.error('[Projects API POST] Missing required fields');
      return NextResponse.json(
        { error: 'Name and websiteUrl are required' },
        { status: 400 }
      );
    }

    // Stap 1: Maak Getlate.dev Profile aan (OPTIONAL - failure is non-blocking)
    let getlateProfile = null;
    let getlateError = null;
    
    try {
      console.log('[Projects API POST] Attempting Getlate profile creation...');
      
      // Genereer random kleur voor het profile
      const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      
      const profileResponse = await getlateClient.createProfile(
        data.name,
        data.description || `Social media management for ${data.name}`,
        randomColor
      );
      
      getlateProfile = profileResponse.profile;
      console.log('[Projects API POST] ✓ Created Getlate profile:', getlateProfile._id);
    } catch (error: any) {
      getlateError = error.message || 'Unknown error';
      console.warn('[Projects API POST] ⚠️ Getlate profile creation failed:', getlateError);
      console.warn('[Projects API POST] Continuing without Getlate integration...');
      // Don't throw - continue with project creation
    }

    // Stap 2: Maak WritGo project aan
    console.log('[Projects API POST] Creating project in database...');
    
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

    console.log('[Projects API POST] ✓ Created project:', project.id);
    
    if (getlateProfile) {
      console.log('[Projects API POST] ✓ With Getlate profile:', getlateProfile._id);
    } else {
      console.log('[Projects API POST] ⚠️ Without Getlate profile (error:', getlateError, ')');
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error('[Projects API POST] ❌ FATAL ERROR:', error);
    console.error('[Projects API POST] Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to create project',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
