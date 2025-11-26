import { NextResponse } from 'next/server';

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
