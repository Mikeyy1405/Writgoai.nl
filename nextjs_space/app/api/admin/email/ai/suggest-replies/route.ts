/**
 * API Route: POST /api/admin/email/ai/suggest-replies
 * Genereer AI reply suggesties (kort, formeel, vriendelijk)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateReplySuggestions } from '@/lib/email/ai-email-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticatie check
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { emailContent, subject, from } = body;

    // Validatie
    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { error: 'Email content is verplicht' },
        { status: 400 }
      );
    }

    if (emailContent.length < 10) {
      return NextResponse.json(
        { error: 'Email content is te kort' },
        { status: 400 }
      );
    }

    // Genereer suggesties
    console.log(`💬 Genereren reply suggesties voor email van ${from || 'onbekend'}...`);
    
    const suggestions = await generateReplySuggestions(emailContent, subject, from);

    console.log('✅ Reply suggesties gegenereerd:', {
      count: suggestions.length,
      types: suggestions.map(s => s.type),
    });

    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('❌ Fout bij reply suggesties:', error);
    
    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het genereren van reply suggesties',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
