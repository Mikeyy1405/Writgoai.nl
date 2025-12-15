
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateVideoScript } from '@/lib/video-script-generator';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, duration, language, style } = body;

    if (!topic) {
      return NextResponse.json({ error: 'Topic is verplicht' }, { status: 400 });
    }

    console.log('Generating video script for:', topic);
    const script = await generateVideoScript(topic, duration || '30-60', language || 'Dutch', style || 'Cinematic');

    return NextResponse.json({
      success: true,
      script,
    });

  } catch (error) {
    console.error('Script generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
