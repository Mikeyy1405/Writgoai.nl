import { NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Deze API route is niet meer beschikbaar' }, { status: 404 });
}
