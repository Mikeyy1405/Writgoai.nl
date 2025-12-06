
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
    const logPrefix = '[Late.dev Connect]';
    console.log(`${logPrefix} API route called`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log(`${logPrefix} Unauthorized - no session`);
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.log(`${logPrefix} Client not found:`, session.user.email);
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { projectId, platform } = await req.json();

    if (!projectId || !platform) {
      console.log(`${logPrefix} Missing parameters:`, { projectId, platform });
      return NextResponse.json({ 
        error: 'Project ID en platform zijn verplicht',
        details: 'Zowel projectId als platform moeten worden opgegeven'
      }, { status: 400 });
    }

    // Special logging for LinkedIn
    const isLinkedIn = platform.toLowerCase() === 'linkedin';
    const linkedInPrefix = isLinkedIn ? '[LinkedIn Connect]' : logPrefix;
    
    console.log(`${linkedInPrefix} Request for project:`, projectId, 'platform:', platform);

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
      console.log(`${linkedInPrefix} Project not found or access denied:`, projectId);
      return NextResponse.json({ 
        error: 'Project niet gevonden',
        details: 'Het opgegeven project bestaat niet of je hebt geen toegang'
      }, { status: 404 });
    }

    console.log(`${linkedInPrefix} Project found:`, project.name);

    // Ensure we have a Late.dev profile for this project
    let profileId = project.socialMediaConfig?.lateDevProfileId;
    
    if (!profileId) {
      console.log(`${linkedInPrefix} No profile found, creating one...`);
      
      try {
        const profileResult = await createLateDevProfile(project.name, project.id);
        
        if (!profileResult) {
          console.error(`${linkedInPrefix} Profile creation returned null`);
          return NextResponse.json(
            { 
              error: 'Kon Late.dev profiel niet aanmaken',
              details: 'Controleer of de Late.dev API key correct is geconfigureerd'
            },
            { status: 503 }
          );
        }

        profileId = profileResult.profileId;
        console.log(`${linkedInPrefix} Profile created successfully:`, profileId);

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
        
        console.log(`${linkedInPrefix} Profile saved to database`);
      } catch (profileError: any) {
        console.error(`${linkedInPrefix} Error creating profile:`, profileError);
        return NextResponse.json(
          { 
            error: 'Profiel aanmaken mislukt',
            details: profileError.message || 'Onbekende fout bij profiel aanmaken'
          },
          { status: 503 }
        );
      }
    } else {
      console.log(`${linkedInPrefix} Using existing profile:`, profileId);
    }

    // Create platform invite using late-dev-api
    console.log(`${linkedInPrefix} Creating platform invite for:`, platform, 'on profile:', profileId);
    
    // Validate platform parameter
    const supportedPlatforms = ['linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'pinterest', 'reddit', 'bluesky', 'threads'];
    const normalizedPlatform = platform.toLowerCase();
    
    if (!supportedPlatforms.includes(normalizedPlatform)) {
      console.error(`${linkedInPrefix} Unsupported platform:`, platform);
      return NextResponse.json(
        { 
          error: `Platform '${platform}' wordt niet ondersteund`,
          details: `Ondersteunde platforms: ${supportedPlatforms.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    try {
      const invite = await createPlatformInvite(profileId, normalizedPlatform);

      if (!invite) {
        console.error(`${linkedInPrefix} Platform invite creation returned null for platform:`, normalizedPlatform);
        
        if (isLinkedIn) {
          return NextResponse.json(
            { 
              error: 'LinkedIn koppeling maken mislukt',
              details: 'Controleer of LinkedIn is ingeschakeld in je Late.dev dashboard en of de API key correct is'
            },
            { status: 503 }
          );
        }
        
        return NextResponse.json(
          { 
            error: `${platform} koppeling maken mislukt`,
            details: 'Controleer of het platform is ingeschakeld in je Late.dev dashboard'
          },
          { status: 503 }
        );
      }

      if (!invite.inviteUrl) {
        console.error(`${linkedInPrefix} Invite created but no URL:`, invite);
        return NextResponse.json(
          { 
            error: 'Ongeldige koppellink ontvangen',
            details: 'De service heeft een koppellink aangemaakt maar deze bevat geen geldige URL'
          },
          { status: 500 }
        );
      }

      console.log(`${linkedInPrefix} Success! Invite URL created:`, invite.inviteUrl);

      return NextResponse.json({
        success: true,
        inviteUrl: invite.inviteUrl,
        inviteId: invite._id,
        expiresAt: invite.expiresAt,
        platform: normalizedPlatform,
      });
    } catch (inviteError: any) {
      console.error(`${linkedInPrefix} Error creating invite:`, inviteError);
      
      // Special handling for LinkedIn errors
      if (isLinkedIn) {
        return NextResponse.json(
          { 
            error: 'LinkedIn verbinding mislukt',
            details: inviteError.message || 'LinkedIn koppeling kon niet worden aangemaakt. Controleer de Late.dev configuratie.',
            technicalError: inviteError.toString()
          },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { 
          error: `${platform} verbinding mislukt`,
          details: inviteError.message || 'Koppeling kon niet worden aangemaakt',
          technicalError: inviteError.toString()
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error(`${logPrefix} Unexpected error:`, error);
    return NextResponse.json(
      { 
        error: 'Onverwachte fout opgetreden',
        details: error.message || 'Er is een onbekende fout opgetreden',
        technicalError: error.toString()
      },
      { status: 500 }
    );
  }
}
