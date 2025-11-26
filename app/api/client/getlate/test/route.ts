export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { testConnection } from '@/lib/getlate-api';

/**
 * GET /api/client/getlate/test
 * Test de Getlate API connectie
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    const result = await testConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Getlate test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'Connectie test gefaald' 
      },
      { status: 500 }
    );
  }
}
