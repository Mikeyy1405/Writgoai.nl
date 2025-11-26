
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateDailyContentForClient } from '@/lib/daily-content-generator-v2';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const clientId = body.clientId || session.user.id;
    
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
