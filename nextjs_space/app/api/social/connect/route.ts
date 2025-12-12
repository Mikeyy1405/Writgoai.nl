import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getlateClient } from '@/lib/getlate/client';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

/**
 * POST /api/social/connect
 * Get OAuth URL to connect a social media platform
 */
export async function POST(request: Request) {
  try {
    console.log('🔵 Social connect API called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.error('❌ No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('🔵 Request body:', body);
    
    const { projectId, platform } = body;

    // Validate input
    if (!projectId || !platform) {
      console.error('❌ Missing projectId or platform');
      return NextResponse.json(
        { error: 'projectId and platform are required' },
        { status: 400 }
      );
    }

    // Check if GETLATE_API_KEY is configured
    if (!process.env.GETLATE_API_KEY) {
      console.error('❌ GETLATE_API_KEY not configured');
      return NextResponse.json(
        { 
          error: 'Social media koppeling is momenteel niet geconfigureerd. Neem contact op met support@writgo.nl voor activatie.' 
        },
        { status: 503 }
      );
    }

    // Get project with getlateProfileId
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    console.log('🔵 Project found:', project ? `Yes (ID: ${project.id})` : 'No');

    if (!project) {
      console.error('❌ Project not found');
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.getlateProfileId) {
      console.error('❌ No Getlate profile ID');
      return NextResponse.json(
        { error: 'Project heeft nog geen Getlate profiel. Neem contact op met support.' },
        { status: 400 }
      );
    }

    console.log('🔵 Getting connect URL from Getlate...');
    
    // Get connect URL from Getlate.dev
    const redirectUrl = `${process.env.NEXTAUTH_URL}/api/social/connect/callback`;
    
    const connectData = await getlateClient.getConnectUrl(
      project.getlateProfileId,
      platform,
      redirectUrl
    );

    console.log('✅ Generated connect URL for platform:', platform);
    console.log('🔵 Connect data:', { authUrl: connectData.authUrl, state: connectData.state });

    return NextResponse.json({
      authUrl: connectData.authUrl,
      state: connectData.state
    });
  } catch (error: any) {
    console.error('❌ API Error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    // Check if error is due to missing API key
    if (error.message?.includes('GETLATE_API_KEY')) {
      return NextResponse.json(
        { error: 'Social media koppeling is momenteel niet geconfigureerd. Neem contact op met support@writgo.nl voor activatie.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to get connect URL' },
      { status: 500 }
    );
  }
}
