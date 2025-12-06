

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
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { platform } = await req.json();

    if (!platform) {
      return NextResponse.json({ 
        error: 'Platform is verplicht',
        details: 'Geef een platform op (bijv. linkedin, instagram, facebook)'
      }, { status: 400 });
    }

    // Special logging for LinkedIn
    const isLinkedIn = platform.toLowerCase() === 'linkedin';
    const logPrefix = isLinkedIn ? '[LinkedIn Connect]' : '[Social Connect]';
    
    console.log(`${logPrefix} Connect request for platform:`, platform);

    const clientId = (session.user as any).id;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      console.error(`${logPrefix} Client not found:`, clientId);
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    console.log(`${logPrefix} Client found:`, client.email);

    // Get or create a profile ID for this client
    let profileId = client.lateDevProfileId;
    
    if (!profileId) {
      // Generate a unique profile ID
      profileId = `writgo_${clientId}`;
      
      console.log(`${logPrefix} Creating new profile ID:`, profileId);
      
      // Update client with profile ID
      await prisma.client.update({
        where: { id: clientId },
        data: { lateDevProfileId: profileId },
      });
      
      console.log(`${logPrefix} Profile ID saved to database`);
    } else {
      console.log(`${logPrefix} Using existing profile ID:`, profileId);
    }

    // Create invite link via GetLate.dev
    try {
      console.log(`${logPrefix} Calling createPlatformInvite for:`, platform);
      const inviteData = await createPlatformInvite(platform, profileId);

      if (!inviteData || !inviteData.inviteUrl) {
        console.error(`${logPrefix} No invite URL returned from createPlatformInvite`);
        
        if (isLinkedIn) {
          return NextResponse.json(
            { 
              error: 'LinkedIn verbinding maken mislukt',
              details: 'Kon geen LinkedIn koppellink aanmaken. Controleer of LinkedIn is ingeschakeld in de Late.dev configuratie.'
            },
            { status: 503 }
          );
        }
        
        return NextResponse.json(
          { 
            error: `${platform} verbinding maken mislukt`,
            details: 'Kon geen koppellink aanmaken. Probeer het later opnieuw.'
          },
          { status: 503 }
        );
      }

      console.log(`${logPrefix} Success! Invite URL created:`, inviteData.inviteUrl);

      return NextResponse.json({
        success: true,
        inviteUrl: inviteData.inviteUrl || inviteData.url,
        profileId,
        platform,
      });
    } catch (lateError) {
      console.error(`${logPrefix} GetLate API error:`, lateError);
      
      // Special error handling for LinkedIn
      if (isLinkedIn) {
        return NextResponse.json(
          { 
            error: 'LinkedIn verbinding tijdelijk niet beschikbaar',
            details: 'De LinkedIn koppeling kon niet worden aangemaakt. Controleer de configuratie of probeer het later opnieuw.',
            technicalDetails: lateError instanceof Error ? lateError.message : 'Onbekende fout'
          },
          { status: 503 }
        );
      }
      
      // Return a user-friendly error message
      return NextResponse.json(
        { 
          error: 'Social media verbinding tijdelijk niet beschikbaar',
          details: 'De social media integratie service ondervindt momenteel problemen. Probeer het later opnieuw of neem contact op met support.',
          technicalDetails: lateError instanceof Error ? lateError.message : 'Onbekende fout'
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error('[Social Connect] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Fout bij aanmaken van koppeling',
        details: error instanceof Error ? error.message : 'Onbekende fout'
      },
      { status: 500 }
    );
  }
}
