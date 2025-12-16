export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

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

// GET - Haal specifieke affiliate link op
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
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

    // Get specific affiliate link
    const link = await prisma.affiliateLink.findFirst({
      where: {
        id: params.linkId,
        projectId: params.id,
      },
    });

    if (!link) {
      return NextResponse.json({ error: 'Affiliate link niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('[Affiliate Link GET] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen affiliate link' },
      { status: 500 }
    );
  }
}

// PATCH - Update affiliate link
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
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

    const body = await req.json();
    const { url, anchorText, category, description } = body;

    // Verify link exists and belongs to this project
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        id: params.linkId,
        projectId: params.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Affiliate link niet gevonden' }, { status: 404 });
    }

    // Update link
    const updatedLink = await prisma.affiliateLink.update({
      where: { id: params.linkId },
      data: {
        url: url || existingLink.url,
        anchorText: anchorText !== undefined ? anchorText : existingLink.anchorText,
        category: category !== undefined ? category : existingLink.category,
        description: description !== undefined ? description : existingLink.description,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Affiliate link bijgewerkt',
      link: updatedLink,
    });
  } catch (error) {
    console.error('[Affiliate Link PATCH] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij bijwerken affiliate link' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder affiliate link
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
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

    // Verify link exists and belongs to this project
    const existingLink = await prisma.affiliateLink.findFirst({
      where: {
        id: params.linkId,
        projectId: params.id,
      },
    });

    if (!existingLink) {
      return NextResponse.json({ error: 'Affiliate link niet gevonden' }, { status: 404 });
    }

    // Delete link
    await prisma.affiliateLink.delete({
      where: { id: params.linkId },
    });

    return NextResponse.json({
      success: true,
      message: 'Affiliate link verwijderd',
    });
  } catch (error) {
    console.error('[Affiliate Link DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Fout bij verwijderen affiliate link' },
      { status: 500 }
    );
  }
}
