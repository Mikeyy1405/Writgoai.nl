

export const dynamic = "force-dynamic";
/**
 * Get credit transaction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCreditHistory } from '@/lib/credits';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const clientId = decoded.clientId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await getCreditHistory(clientId, limit);

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
