/**
 * Manual Email Sync API
 * POST /api/admin/emails/sync - Trigger immediate sync of all mailboxes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncAllMailboxes } from '@/lib/email-mailbox-sync';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin] Manual sync triggered');
    
    // Trigger sync of all mailboxes
    await syncAllMailboxes();

    return NextResponse.json({
      success: true,
      message: 'Email sync completed',
    });
  } catch (error: any) {
    console.error('[Admin] Error syncing emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync emails' },
      { status: 500 }
    );
  }
}
