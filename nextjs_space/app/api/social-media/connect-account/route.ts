

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite } from '@/lib/getlate';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await req.json();

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    const clientId = (session.user as any).id;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get or create a profile ID for this client
    let profileId = client.lateDevProfileId;
    
    if (!profileId) {
      // Generate a unique profile ID
      profileId = `writgo_${clientId}`;
      
      // Update client with profile ID
      await prisma.client.update({
        where: { id: clientId },
        data: { lateDevProfileId: profileId },
      });
    }

    // Create invite link via GetLate.dev
    try {
      const inviteData = await createPlatformInvite(platform, profileId);

      return NextResponse.json({
        success: true,
        inviteUrl: inviteData.inviteUrl || inviteData.url,
        profileId,
        platform,
      });
    } catch (lateError) {
      console.error('GetLate API error:', lateError);
      
      // Return a user-friendly error message
      return NextResponse.json(
        { 
          error: 'Social media connection temporarily unavailable', 
          details: 'The social media integration service is currently experiencing issues. Please try again later or contact support if the problem persists.',
          technicalDetails: lateError instanceof Error ? lateError.message : 'Unknown error'
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error('Error creating platform invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
