import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/navigation-config';
import bcrypt from 'bcryptjs';

/**
 * POST /api/admin/writgo-marketing/setup
 * Creates Writgo.nl as an internal client for marketing automation
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isUserAdmin(session.user.email, session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Writgo.nl client already exists
    const existingClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: 'marketing@writgo.nl' },
          { companyName: 'Writgo.nl' }
        ]
      }
    });

    if (existingClient) {
      return NextResponse.json({
        success: true,
        client: existingClient,
        message: 'Writgo.nl client already exists'
      });
    }

    // Create Writgo.nl as internal client
    const writgoClient = await prisma.client.create({
      data: {
        email: 'marketing@writgo.nl',
        name: 'Writgo Marketing',
        companyName: 'Writgo.nl',
        website: 'https://writgo.nl',
        password: await hashPassword('writgo-internal-2024'), // Secure password
        targetAudience: 'Lokale dienstverleners zoals kappers, installateurs, fysiotherapeuten, advocaten en andere MKB-ondernemers die hun online zichtbaarheid willen vergroten',
        brandVoice: 'Professioneel maar toegankelijk, Nederlands, expert maar niet complex, oplossingsgericht',
        keywords: [
          'omnipresence marketing',
          'AI content agency',
          'social media + SEO pakket',
          'lokale marketing',
          'automatische social media',
          'content marketing MKB',
          'AI content voor lokale bedrijven',
          'social media automatisering',
          'SEO content schrijven',
          'blog content genereren',
          'Instagram marketing',
          'LinkedIn content',
          'lokale zichtbaarheid',
          'online marketing MKB',
          'content strategie'
        ],
        automationActive: false,
        hasCompletedOnboarding: true,
      }
    });

    return NextResponse.json({
      success: true,
      client: writgoClient,
      message: 'Writgo.nl client created successfully'
    });
  } catch (error) {
    console.error('Error setting up Writgo marketing client:', error);
    return NextResponse.json(
      { error: 'Failed to setup Writgo marketing client' },
      { status: 500 }
    );
  }
}

// Hash password using bcryptjs
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}
