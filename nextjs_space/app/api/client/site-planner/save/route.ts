import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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

    if (!name || !keywords || !planData) {
      return NextResponse.json(
        { error: 'Name, keywords, en planData zijn verplicht' },
        { status: 400 }
      );
    }

    const sitePlan = await prisma.sitePlan.create({
      data: {
        clientId: client.id,
        projectId: '', // This endpoint is deprecated, projectId should be provided
        name,
        keywords: Array.isArray(keywords) ? keywords : [keywords],
        targetAudience,
        language: language || 'nl',
        planData: planData as any,
      },
    });

    console.log(`✅ [Site Planner] Plan opgeslagen: ${sitePlan.id}`);

    return NextResponse.json({ 
      success: true, 
      planId: sitePlan.id,
      message: 'Site plan succesvol opgeslagen!' 
    });
  } catch (error: any) {
    console.error('❌ [Site Planner Save] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis bij het opslaan' },
      { status: 500 }
    );
  }
}
