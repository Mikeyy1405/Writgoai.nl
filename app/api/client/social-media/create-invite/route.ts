
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

/**
 * POST /api/client/social-media/create-invite
 * DEPRECATED: Users now connect accounts via their own Late.dev API key
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Users should configure their own Late.dev API key in project settings.',
      deprecated: true 
    },
    { status: 410 } // Gone
  );
}

export const dynamic = 'force-dynamic';
