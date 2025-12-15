import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get article to verify ownership
    const article = await prisma.contentHubArticle.findUnique({
      where: { id: params.id },
      include: {
        site: true,
      },
    });

    if (!article || article.site.clientId !== client.id) {
      return NextResponse.json({ error: 'Artikel niet gevonden' }, { status: 404 });
    }

    // Only reset if article is in a generation state (prevent race conditions)
    if (['researching', 'writing', 'publishing'].includes(article.status)) {
      await prisma.contentHubArticle.update({
        where: { id: params.id },
        data: { status: 'pending' },
      });
    }

    return NextResponse.json({ success: true, message: 'Generatie geannuleerd' });
  } catch (error: any) {
    console.error('[Cancel Article] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Kon artikel niet annuleren' },
      { status: 500 }
    );
  }
}
