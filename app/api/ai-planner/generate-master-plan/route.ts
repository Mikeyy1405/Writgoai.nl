

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';
import { generateContentPlan } from '@/lib/content-plan-generator';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId, scanData, days = 30 } = await request.json();

    if (!scanData) {
      return NextResponse.json({ error: 'Scan data is vereist' }, { status: 400 });
    }

    const targetClientId = clientId || session.user.id;

    console.log(`Generating content plan for client: ${targetClientId}`);

    // Generate AI-powered content plan
    const contentPlan = await generateContentPlan(scanData, days);

    // Store content plan in client record
    await prisma.client.update({
      where: { id: targetClientId },
      data: {
        contentPlan: contentPlan as any,
        lastPlanGenerated: new Date(),
      },
    });

    console.log(`Content plan stored successfully: ${contentPlan.length} days`);

    return NextResponse.json({
      success: true,
      plan: contentPlan,
      message: `${contentPlan.length}-daags contentplan succesvol gegenereerd`,
    });

  } catch (error) {
    console.error('Content plan generation error:', error);
    return NextResponse.json({
      error: 'Fout bij genereren contentplan',
      details: error instanceof Error ? error.message : 'Onbekende fout',
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: session.user.id },
      select: {
        contentPlan: true,
        lastPlanGenerated: true,
      },
    });

    if (!client || !client.contentPlan) {
      return NextResponse.json({ 
        plan: [],
        message: 'Nog geen contentplan beschikbaar',
      });
    }

    return NextResponse.json({
      plan: client.contentPlan,
      lastGenerated: client.lastPlanGenerated,
    });

  } catch (error) {
    console.error('Error fetching content plan:', error);
    return NextResponse.json({
      error: 'Fout bij ophalen contentplan',
    }, { status: 500 });
  }
}
