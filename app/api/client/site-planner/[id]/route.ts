import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// GET - Haal een specifiek plan op
export async function GET(
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

    const sitePlan = await prisma.sitePlan.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!sitePlan) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ plan: sitePlan });
  } catch (error: any) {
    console.error('❌ [Site Planner Get] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het ophalen van het plan' },
      { status: 500 }
    );
  }
}

// PUT - Update een plan
export async function PUT(
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

    const { name, keywords, targetAudience, language, planData } = await req.json();

    const sitePlan = await prisma.sitePlan.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!sitePlan) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    const updatedPlan = await prisma.sitePlan.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(keywords && { keywords: Array.isArray(keywords) ? keywords : [keywords] }),
        ...(targetAudience !== undefined && { targetAudience }),
        ...(language && { language }),
        ...(planData && { planData }),
      },
    });

    console.log(`✅ [Site Planner] Plan bijgewerkt: ${updatedPlan.id}`);

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      message: 'Plan succesvol bijgewerkt!',
    });
  } catch (error: any) {
    console.error('❌ [Site Planner Update] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het bijwerken' },
      { status: 500 }
    );
  }
}

// DELETE - Verwijder een plan
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

    const sitePlan = await prisma.sitePlan.findFirst({
      where: {
        id: params.id,
        clientId: client.id,
      },
    });

    if (!sitePlan) {
      return NextResponse.json({ error: 'Plan niet gevonden' }, { status: 404 });
    }

    await prisma.sitePlan.delete({
      where: { id: params.id },
    });

    console.log(`✅ [Site Planner] Plan verwijderd: ${params.id}`);

    return NextResponse.json({
      success: true,
      message: 'Plan succesvol verwijderd!',
    });
  } catch (error: any) {
    console.error('❌ [Site Planner Delete] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het verwijderen' },
      { status: 500 }
    );
  }
}
