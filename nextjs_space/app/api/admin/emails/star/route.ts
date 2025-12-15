
/**
 * Star/Unstar Email API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { toggleEmailStar } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Admin only
    if (!session?.user?.email || session.user.email !== 'admin@WritgoAI.nl') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emailId } = body;

    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }

    const isStarred = await toggleEmailStar(emailId);

    return NextResponse.json({
      success: true,
      isStarred,
    });
  } catch (error) {
    console.error('[Admin] Error toggling star:', error);
    return NextResponse.json(
      { error: 'Failed to toggle star' },
      { status: 500 }
    );
  }
}
