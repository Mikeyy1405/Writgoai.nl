export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * API endpoint voor WooCommerce instellingen per project
 * WooCommerce gebruikt de WordPress credentials van het project
 */

// Helper functie voor client en project validatie
async function validateClientAndProject(email: string, projectId: string) {
  const client = await prisma.client.findUnique({
    where: { email },
  });

  if (!client) {
    return { error: 'Client niet gevonden', status: 404 };
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      clientId: client.id,
    },
  });

  if (!project) {
    return { error: 'Project niet gevonden', status: 404 };
  }

  return { client, project };
}

// GET - Haal WooCommerce instellingen op
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const { project } = validation;

    return NextResponse.json({
      enabled: project.wooCommerceEnabled || false,
      isConfigured: !!project.wordpressUrl && !!project.wordpressUsername,
      wordpressUrl: project.wordpressUrl || null,
      wordpressUsername: project.wordpressUsername || null,
    });

  } catch (error: any) {
    console.error('Error fetching WooCommerce settings:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen WooCommerce instellingen' },
      { status: 500 }
    );
  }
}

// PUT - Update WooCommerce instellingen
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const validation = await validateClientAndProject(session.user.email, params.id);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const data = await req.json();
    const { enabled } = data;

    // Update WooCommerce enabled status
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        wooCommerceEnabled: enabled || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'WooCommerce instellingen opgeslagen',
      enabled: updatedProject.wooCommerceEnabled,
    });

  } catch (error: any) {
    console.error('Error saving WooCommerce settings:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan WooCommerce instellingen' },
      { status: 500 }
    );
  }
}
