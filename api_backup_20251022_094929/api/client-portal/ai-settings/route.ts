
/**
 * API: Client AI Settings
 * Voor het updaten van client AI profile settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        AIProfile: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client.AIProfile);

  } catch (error) {
    console.error('[API] Error getting AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        AIProfile: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const data = await request.json();

    // Update or create AI profile
    if (client.AIProfile) {
      const updated = await prisma.clientAIProfile.update({
        where: { id: client.AIProfile.id },
        data: {
          websiteUrl: data.websiteUrl || client.AIProfile.websiteUrl,
          websiteName: data.websiteName || client.AIProfile.websiteName,
          companyDescription: data.companyDescription || client.AIProfile.companyDescription,
          targetAudience: data.targetAudience || client.AIProfile.targetAudience,
          toneOfVoice: data.toneOfVoice || client.AIProfile.toneOfVoice,
        },
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.clientAIProfile.create({
        data: {
          clientId: client.id,
          websiteUrl: data.websiteUrl,
          websiteName: data.websiteName,
          companyDescription: data.companyDescription,
          targetAudience: data.targetAudience,
          toneOfVoice: data.toneOfVoice,
        },
      });
      return NextResponse.json(created);
    }

  } catch (error) {
    console.error('[API] Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
