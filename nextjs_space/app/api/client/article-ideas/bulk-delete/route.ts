
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Bulk Delete Article Ideas
 * DELETE /api/client/article-ideas/bulk-delete
 * 
 * Verwijdert meerdere artikel ideeën tegelijk
 * Gebruikt voor bulk verwijderen in Autopilot en Content Research
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { articleIds, projectId } = body;

    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json({ error: 'Geen artikel IDs opgegeven' }, { status: 400 });
    }

    // Limiteer aantal tegelijk
    if (articleIds.length > 100) {
      return NextResponse.json({ 
        error: 'Maximaal 100 artikelen per keer verwijderen' 
      }, { status: 400 });
    }

    // Verwijder alleen artikelen die aan deze client toebehoren
    const deleteResult = await prisma.articleIdea.deleteMany({
      where: {
        id: { in: articleIds },
        clientId: client.id,
        // Optioneel: filter op project
        ...(projectId && { projectId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `${deleteResult.count} artikel${deleteResult.count !== 1 ? 'en' : ''} verwijderd`,
      deletedCount: deleteResult.count,
    });

  } catch (error: any) {
    console.error('Bulk delete article ideas error:', error);
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het verwijderen',
      details: error.message,
    }, { status: 500 });
  }
}
