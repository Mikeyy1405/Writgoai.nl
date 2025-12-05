
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createPlatformInvite, createLateDevProfile } from '@/lib/late-dev-api';

/**
 * Generate Late.dev invite link for connecting social media accounts
 * POST /api/client/late-dev/connect
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Late.dev Connect] API route called');
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('[Late.dev Connect] Unauthorized - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.log('[Late.dev Connect] Client not found:', session.user.email);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const { projectId, platform } = await req.json();

    if (!projectId || !platform) {
      console.log('[Late.dev Connect] Missing parameters:', { projectId, platform });
      return NextResponse.json({ error: 'Project ID and platform are required' }, { status: 400 });
    }

    console.log('[Late.dev Connect] Request for project:', projectId, 'platform:', platform);

    // Verify project belongs to client
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      console.log('[Late.dev Connect] Project not found or access denied:', projectId);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[Late.dev Connect] Project found:', project.name);

    // Ensure we have a Late.dev profile for this project
    let profileId = project.socialMediaConfig?.lateDevProfileId;
    
    if (!profileId) {
      console.log('[Late.dev Connect] No profile found, creating one...');
      
      try {
        const profileResult = await createLateDevProfile(project.name, project.id);
        
        if (!profileResult) {
          console.error('[Late.dev Connect] Profile creation returned null');
          return NextResponse.json(
            { error: 'Kon Late.dev profiel niet aanmaken. Controleer API configuratie.' },
            { status: 503 }
          );
        }

        profileId = profileResult.profileId;
        console.log('[Late.dev Connect] Profile created successfully:', profileId);

        // Save profile ID in database
        await prisma.socialMediaConfig.upsert({
          where: { projectId },
          create: {
            projectId,
            lateDevProfileId: profileResult.profileId,
            lateDevProfileName: profileResult.name,
          },
          update: {
            lateDevProfileId: profileResult.profileId,
            lateDevProfileName: profileResult.name,
          },
        });
        
        console.log('[Late.dev Connect] Profile saved to database');
      } catch (profileError: any) {
        console.error('[Late.dev Connect] Error creating profile:', profileError);
        return NextResponse.json(
          { error: `Profiel aanmaken mislukt: ${profileError.message}` },
          { status: 503 }
        );
      }
    } else {
      console.log('[Late.dev Connect] Using existing profile:', profileId);
    }

    // Create platform invite using late-dev-api
    console.log('[Late.dev Connect] Creating platform invite for:', platform, 'on profile:', profileId);
    
    try {
      const invite = await createPlatformInvite(profileId, platform);

      if (!invite) {
        console.error('[Late.dev Connect] Platform invite creation returned null');
        return NextResponse.json(
          { error: 'Kon koppellink niet aanmaken. Controleer of het platform ondersteund wordt.' },
          { status: 503 }
        );
      }

      if (!invite.inviteUrl) {
        console.error('[Late.dev Connect] Invite created but no URL:', invite);
        return NextResponse.json(
          { error: 'Ongeldige koppellink ontvangen van service.' },
          { status: 500 }
        );
      }

      console.log('[Late.dev Connect] Success! Invite URL created:', invite.inviteUrl);

      return NextResponse.json({
        inviteUrl: invite.inviteUrl,
        inviteId: invite._id,
        expiresAt: invite.expiresAt,
      });
    } catch (inviteError: any) {
      console.error('[Late.dev Connect] Error creating invite:', inviteError);
      return NextResponse.json(
        { error: `Koppeling maken mislukt: ${inviteError.message}` },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error('[Late.dev Connect] Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
