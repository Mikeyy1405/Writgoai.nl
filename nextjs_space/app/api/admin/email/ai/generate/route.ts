/**
 * API Route: POST /api/admin/email/ai/generate
 * Genereer volledige email met AI op basis van gebruiker prompt
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEmail } from '@/lib/email/ai-email-service';

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
    const { prompt, tone = 'zakelijk' } = body;

    // Validatie
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is verplicht' },
        { status: 400 }
      );
    }

    if (prompt.length < 5) {
      return NextResponse.json(
        { error: 'Prompt is te kort. Geef meer details over de email.' },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: 'Prompt is te lang. Max 500 karakters.' },
        { status: 400 }
      );
    }

    // Valideer tone
    const validTones = ['zakelijk', 'vriendelijk', 'neutraal'];
    if (!validTones.includes(tone)) {
      return NextResponse.json(
        { error: 'Ongeldige tone. Gebruik: zakelijk, vriendelijk of neutraal' },
        { status: 400 }
      );
    }

    // Genereer email
    console.log(`✉️ Genereren email met tone "${tone}"...`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    
    const email = await generateEmail(prompt, tone as 'zakelijk' | 'vriendelijk' | 'neutraal');

    console.log('✅ Email gegenereerd:', {
      subjectLength: email.subject.length,
      bodyLength: email.body.length,
      tone,
    });

    return NextResponse.json({
      success: true,
      email,
    });
  } catch (error: any) {
    console.error('❌ Fout bij email generatie:', error);
    
    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het genereren van de email',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
