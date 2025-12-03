
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Admin Payout Management API
 * PATCH: Update payout status (approve/reject)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { action, notes } = await req.json();
    const payoutId = params.id;

    if (!action || !['approve', 'reject', 'mark_paid'].includes(action)) {
      return NextResponse.json({ error: 'Ongeldige actie' }, { status: 400 });
    }

    // Haal payout op
    const payout = await prisma.affiliatePayout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      return NextResponse.json({ error: 'Payout niet gevonden' }, { status: 404 });
    }

    let newStatus: string;
    let processedAt: Date | null = null;
    let paidAt: Date | null = null;

    switch (action) {
      case 'approve':
        newStatus = 'processing';
        processedAt = new Date();
        break;
      case 'reject':
        newStatus = 'rejected';
        processedAt = new Date();
        break;
      case 'mark_paid':
        newStatus = 'paid';
        paidAt = new Date();
        if (!payout.processedAt) {
          processedAt = new Date();
        }
        break;
      default:
        newStatus = payout.status;
    }

    // Update payout
    const updatedPayout = await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: {
        status: newStatus,
        processedAt: processedAt || payout.processedAt,
        paidAt: paidAt || payout.paidAt,
        notes: notes || payout.notes
      },
      include: {
        affiliateClient: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    // TODO: Send email notification to affiliate about status change
    // You can implement email notification here

    return NextResponse.json({
      success: true,
      payout: updatedPayout,
      message: `Payout ${action === 'approve' ? 'goedgekeurd' : action === 'reject' ? 'afgewezen' : 'gemarkeerd als betaald'}`
    });
  } catch (error) {
    console.error('Error updating payout:', error);
    return NextResponse.json({ error: 'Server fout' }, { status: 500 });
  }
}
