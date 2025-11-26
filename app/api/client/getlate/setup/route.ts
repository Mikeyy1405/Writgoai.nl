export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createProfile, listAccounts } from '@/lib/getlate-api';

/**
 * POST /api/client/getlate/setup
 * Setup Getlate profile voor een project
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const { projectId, profileName } = await req.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Controleer of project bestaat en bij deze client hoort
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: {
          email: session.user.email,
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    // Maak Getlate profile aan
    const name = profileName || `${project.name} - Social Media`;
    const getlateProfile = await createProfile(name);

    // Maak of update SocialMediaConfig
    const config = await prisma.socialMediaConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        getlateEnabled: true,
        getlateProfileId: getlateProfile.id,
        getlateProfileName: name,
      },
      update: {
        getlateEnabled: true,
        getlateProfileId: getlateProfile.id,
        getlateProfileName: name,
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: getlateProfile.id,
        name: getlateProfile.name,
      },
      config,
    });
  } catch (error: any) {
    console.error('Getlate setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Setup gefaald' },
      { status: 500 }
    );
  }
}
