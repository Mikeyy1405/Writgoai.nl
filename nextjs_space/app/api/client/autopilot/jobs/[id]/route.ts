
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/client/autopilot/jobs/[id]
 * Update a specific autopilot job (e.g., mark as failed)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, error } = body;

    // Validate status
    if (status && !['pending', 'generating', 'publishing', 'completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Update the job
    const updatedJob = await prisma.autopilotJob.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(error && { error }),
        ...(status === 'completed' || status === 'failed' || status === 'cancelled' ? { completedAt: new Date() } : {}),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      job: updatedJob,
    });
  } catch (error: any) {
    console.error('Error updating autopilot job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/client/autopilot/jobs/[id]
 * Delete a specific autopilot job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete the job
    await prisma.autopilotJob.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting autopilot job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
