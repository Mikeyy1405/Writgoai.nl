import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { isUserAdmin } from '@/lib/navigation-config';

/**
 * POST /api/admin/writgo-marketing/activate-automation
 * Toggles automation for Writgo.nl marketing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !isUserAdmin(session.user.email, session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'active must be a boolean' },
        { status: 400 }
      );
    }

    // Find Writgo.nl client
    const writgoClient = await prisma.client.findFirst({
      where: {
        OR: [
          { email: 'marketing@writgo.nl' },
          { companyName: 'Writgo.nl' }
        ]
      }
    });

    if (!writgoClient) {
      return NextResponse.json(
        { error: 'Writgo.nl client not found. Run setup first.' },
        { status: 404 }
      );
    }

    // Check if content plan exists
    if (active && !writgoClient.contentPlan) {
      return NextResponse.json(
        { error: 'Cannot activate automation without a content plan. Generate a content plan first.' },
        { status: 400 }
      );
    }

    // Update automation status
    const updatedClient = await prisma.client.update({
      where: { id: writgoClient.id },
      data: {
        automationActive: active,
        automationStartDate: active ? new Date() : writgoClient.automationStartDate
      }
    });

    return NextResponse.json({
      success: true,
      automationActive: updatedClient.automationActive,
      automationStartDate: updatedClient.automationStartDate,
      message: active 
        ? 'Automation activated successfully'
        : 'Automation deactivated successfully'
    });
  } catch (error) {
    console.error('Error toggling automation:', error);
    return NextResponse.json(
      { error: 'Failed to toggle automation' },
      { status: 500 }
    );
  }
}
