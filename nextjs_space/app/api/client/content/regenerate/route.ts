
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedClient, isAuthError } from '@/lib/auth-helpers';
import { generateDailyContentForClient } from '@/lib/daily-content-generator-v2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedClient();
    
    if (isAuthError(auth)) {
      return NextResponse.json(
        { error: auth.error }, 
        { status: auth.status }
      );
    }
    
    // Use client.id (from Client table), NOT session.user.id
    const clientId = auth.client.id;
    
    console.log('🔄 Regenerating content for client:', clientId);
    
    // Generate content
    const content = await generateDailyContentForClient(clientId);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Geen content om te genereren. Controleer je content plan.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      content
    });
    
  } catch (error) {
    console.error('Error regenerating content:', error);
    return NextResponse.json(
      { 
        error: 'Content generatie mislukt',
        details: error instanceof Error ? error.message : 'Onbekende fout'
      },
      { status: 500 }
    );
  }
}
