export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/client/getlate/connect?projectId=xxx
 * 
 * Genereer een Getlate connect URL voor het verbinden van social media accounts
 * 
 * BELANGRIJK: Dit is een vereenvoudigde implementatie.
 * In de echte Getlate.dev moet je via hun dashboard accounts verbinden.
 * Deze endpoint geeft instructies aan de gebruiker.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const projectId = req.nextUrl.searchParams.get('projectId');

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
      include: {
        socialMediaConfig: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden' },
        { status: 404 }
      );
    }

    if (!project.socialMediaConfig?.getlateProfileId) {
      return NextResponse.json(
        { error: 'Getlate profile niet gevonden. Voer eerst setup uit.' },
        { status: 400 }
      );
    }

    // Retourneer de Getlate dashboard URL waar gebruikers accounts kunnen verbinden
    const dashboardUrl = 'https://getlate.dev/dashboard/accounts';

    return NextResponse.json({
      success: true,
      dashboardUrl,
      profileId: project.socialMediaConfig.getlateProfileId,
      instructions: {
        nl: [
          '1. Ga naar het Getlate.dev dashboard',
          '2. Navigeer naar "Accounts"',
          '3. Klik op "Connect Account"',
          '4. Selecteer het platform dat je wilt verbinden',
          '5. Volg de authenticatie stappen',
          '6. Kom terug naar WritgoAI en klik op "Accounts Vernieuwen"',
        ],
        en: [
          '1. Go to the Getlate.dev dashboard',
          '2. Navigate to "Accounts"',
          '3. Click "Connect Account"',
          '4. Select the platform you want to connect',
          '5. Follow the authentication steps',
          '6. Return to WritgoAI and click "Refresh Accounts"',
        ],
      },
    });
  } catch (error: any) {
    console.error('Getlate connect error:', error);
    return NextResponse.json(
      { error: error.message || 'Connect URL genereren gefaald' },
      { status: 500 }
    );
  }
}
