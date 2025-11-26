import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// DELETE - Verwijder een item uit een plan
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const { itemId, itemType } = await req.json();

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId en itemType zijn verplicht' },
        { status: 400 }
      );
    }

    const sitePlan = await prisma.sitePlan.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!sitePlan) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    const planData = sitePlan.planData as any;

    // Verwijder item op basis van type
    if (itemType === 'homepage' && planData.homepage?.id === itemId) {
      delete planData.homepage;
    } else if (itemType === 'pillar') {
      planData.pillars = (planData.pillars || []).filter(
        (p: any) => p.id !== itemId
      );
    } else if (itemType === 'cluster') {
      planData.pillars = (planData.pillars || []).map((pillar: any) => ({
        ...pillar,
        clusters: (pillar.clusters || []).filter((c: any) => c.id !== itemId),
      }));
    } else if (itemType === 'blog') {
      planData.pillars = (planData.pillars || []).map((pillar: any) => ({
        ...pillar,
        clusters: (pillar.clusters || []).map((cluster: any) => ({
          ...cluster,
          blogs: (cluster.blogs || []).filter((b: any) => b.id !== itemId),
        })),
      }));
    } else {
      return NextResponse.json({ error: 'Ongeldig item type' }, { status: 400 });
    }

    const updatedPlan = await prisma.sitePlan.update({
      where: { id: params.id },
      data: { planData },
    });

    console.log(
      `✅ [Site Planner] Item verwijderd: ${itemType} ${itemId} uit plan ${params.id}`
    );

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Item succesvol verwijderd!',
    });
  } catch (error: any) {
    console.error('❌ [Site Planner Delete Item] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het verwijderen van het item' },
      { status: 500 }
    );
  }
}
