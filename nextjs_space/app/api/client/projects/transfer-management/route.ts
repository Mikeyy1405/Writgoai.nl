import { NextRequest, NextResponse } from 'next/server';

// Deze functionaliteit is verwijderd - gebruik nu collaborators in plaats van fully managed service
export async function POST(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Deze functionaliteit is niet meer beschikbaar. Gebruik de nieuwe collaborator feature.' 
  }, { status: 404 });
}
