import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - Haal alle projecten met WordPress configuratie op
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          where: {
            isActive: true,
            wordpressUrl: {
              not: null
            }
          },
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressCategory: true,
            wordpressAutoPublish: true,
            isPrimary: true,
          },
          orderBy: [
            { isPrimary: 'desc' },
            { name: 'asc' }
          ]
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Map projects to a simpler format
    const wordpressProjects = client.projects.map(project => ({
      id: project.id,
      name: project.name,
      websiteUrl: project.websiteUrl,
      wordpressUrl: project.wordpressUrl!,
      hasCredentials: !!(project.wordpressUsername),
      isPrimary: project.isPrimary,
    }));

    // Also check if client has legacy WordPress settings (fallback)
    const hasClientWordPress = !!(client.wordpressUrl && client.wordpressUsername);

    return NextResponse.json({
      projects: wordpressProjects,
      hasLegacyConfig: hasClientWordPress,
      legacyConfig: hasClientWordPress ? {
        id: 'client-legacy',
        name: 'Standaard WordPress Site',
        websiteUrl: client.website || client.wordpressUrl!,
        wordpressUrl: client.wordpressUrl!,
        hasCredentials: true,
        isPrimary: false,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching WordPress projects:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen WordPress projecten' },
      { status: 500 }
    );
  }
}
