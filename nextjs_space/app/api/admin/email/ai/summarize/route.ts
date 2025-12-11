/**
 * API Route: POST /api/admin/email/ai/summarize
 * Genereer AI samenvatting van email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { summarizeEmail } from '@/lib/email/ai-email-service';

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
    const { emailContent, subject } = body;

    // Validatie
    if (!emailContent || typeof emailContent !== 'string') {
      return NextResponse.json(
        { error: 'Email content is verplicht' },
        { status: 400 }
      );
    }

    if (emailContent.length < 10) {
      return NextResponse.json(
        { error: 'Email content is te kort om samen te vatten' },
        { status: 400 }
      );
    }

    // Genereer samenvatting
    console.log(`📝 Genereren samenvatting voor email (${emailContent.length} chars)...`);
    
    const summary = await summarizeEmail(emailContent, subject);

    console.log('✅ Samenvatting gegenereerd:', {
      summaryLength: summary.summary.length,
      keyPointsCount: summary.keyPoints.length,
      actionItemsCount: summary.actionItems.length,
      sentiment: summary.sentiment,
    });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    console.error('❌ Fout bij email samenvatting:', error);
    
    return NextResponse.json(
      {
        error: 'Er ging iets mis bij het genereren van de samenvatting',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
