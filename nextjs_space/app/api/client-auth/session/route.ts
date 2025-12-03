

export const dynamic = "force-dynamic";
/**
 * Client Session API
 * Returns current client session info
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('client-token')?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 401 }
      );
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    return NextResponse.json({
      authenticated: true,
      userType: decoded.userType || 'client', // Default to 'client' for backwards compatibility
      role: decoded.role || 'client',
      user: {
        id: decoded.clientId || decoded.userId,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      },
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return NextResponse.json(
      { authenticated: false, user: null, error: error.message },
      { status: 401 }
    );
  }
}
