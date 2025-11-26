
/**
 * Automatic Social Media Setup API - Ayrshare Integration
 * Creates Ayrshare profile and generates JWT link for account connection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { 
  createAyrshareProfile, 
  getAyrshareSocialAccounts,
  generateAyrshareJWTLink
} from '@/lib/ayrshare-api';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID vereist' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email },
      },
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    let profileKey: string;
    let connectedAccounts: any[] = [];
    let jwtLink: string | undefined;

    // Stap 1: Check of profile al bestaat, anders aanmaken
    if (!project.socialMediaConfig?.ayrshareProfileKey) {
      console.log('[Ayrshare] Creating new profile for project:', project.name);
      
      const profileResult = await createAyrshareProfile(`${project.name} - WritgoAI`);
      
      if (!profileResult) {
        return NextResponse.json(
          { error: 'Kon Ayrshare profile niet aanmaken' },
          { status: 500 }
        );
      }

      // Check for errors in the result
      if (profileResult.error) {
        if (profileResult.error.requiresBusinessPlan) {
          return NextResponse.json(
            { 
              error: 'business_plan_required',
              message: 'Het maken van meerdere profielen vereist een Ayrshare Business Plan. Upgrade je Ayrshare account of gebruik één profiel voor alle projecten.',
              details: profileResult.error.message,
            },
            { status: 402 } // Payment Required
          );
        }
        
        return NextResponse.json(
          { 
            error: 'profile_creation_failed',
            message: 'Kon Ayrshare profile niet aanmaken',
            details: profileResult.error.message,
          },
          { status: 500 }
        );
      }

      if (!profileResult.profileKey) {
        return NextResponse.json(
          { error: 'Kon Ayrshare profile niet aanmaken - geen profile key ontvangen' },
          { status: 500 }
        );
      }

      profileKey = profileResult.profileKey;

      // Sla profile op in database
      await prisma.socialMediaConfig.upsert({
        where: { projectId },
        create: {
          projectId,
          ayrshareProfileKey: profileKey,
          accountIds: [],
          contentTypes: [],
          autopilotEnabled: false,
        },
        update: {
          ayrshareProfileKey: profileKey,
        },
      });

      console.log('[Ayrshare] Profile created:', profileKey);
    } else {
      profileKey = project.socialMediaConfig.ayrshareProfileKey;
      console.log('[Ayrshare] Using existing profile:', profileKey);
    }

    // Stap 2: Haal bestaande connected accounts op
    try {
      connectedAccounts = await getAyrshareSocialAccounts(profileKey);
      console.log('[Ayrshare] Connected accounts:', connectedAccounts.length);
      if (connectedAccounts.length > 0) {
        console.log('[Ayrshare] Connected platforms:', connectedAccounts.map(a => a.platform).join(', '));
      }
    } catch (error) {
      console.error('[Ayrshare] Error fetching accounts:', error);
      // Continue zonder accounts
    }

    // Stap 3: Generate JWT link voor account connectie
    try {
      const jwtResult = await generateAyrshareJWTLink(profileKey, 'writgoai.nl');
      if (jwtResult) {
        jwtLink = jwtResult.url;
        console.log('[Ayrshare] JWT link generated');
      }
    } catch (error) {
      console.error('[Ayrshare] Error generating JWT:', error);
    }

    console.log('[Ayrshare] Setup complete. Accounts:', connectedAccounts.length);

    return NextResponse.json({
      success: true,
      profileKey,
      connectedAccounts,
      jwtLink,
    });
  } catch (error: any) {
    console.error('[Ayrshare Auto-Setup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er is een fout opgetreden' },
      { status: 500 }
    );
  }
}
