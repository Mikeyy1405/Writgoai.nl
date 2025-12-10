
/**
 * Fetch New Emails API
 * Manually trigger fetching new emails from the server
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { fetchNewEmails } from '@/lib/email-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Admin] Manually triggering email fetch...');
    
    // Use the new sync function instead
    const { syncAllMailboxes } = await import('@/lib/email-mailbox-sync');
    await syncAllMailboxes();

    return NextResponse.json({
      success: true,
      message: 'Email sync completed',
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching emails:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
