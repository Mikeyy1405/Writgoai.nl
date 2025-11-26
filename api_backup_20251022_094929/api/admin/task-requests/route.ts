
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Task requests feature removed' }, { status: 404 });
}
