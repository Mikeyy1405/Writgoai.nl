
// DEPRECATED - Use /api/cron/daily-generation instead

import { NextResponse } from 'next/server';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ 
    error: 'Deze route is deprecated. Gebruik /api/cron/daily-generation' 
  }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Deze route is deprecated. Gebruik /api/cron/daily-generation' 
  }, { status: 410 });
}
