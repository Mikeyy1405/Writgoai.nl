
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { videoProjectId } = body;

    if (!videoProjectId) {
      return NextResponse.json({ error: 'Video project ID is verplicht' }, { status: 400 });
    }

    // Haal video project op
    const videoProject = await prisma.videoProject.findUnique({
      where: { id: videoProjectId },
    });

    if (!videoProject || videoProject.clientId !== client.id) {
      return NextResponse.json({ error: 'Video project niet gevonden' }, { status: 404 });
    }

    // Update export status
    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: {
        exportStatus: 'processing',
      },
    });

    // In een echte implementatie zou hier de video rendering gebeuren
    // Voor nu maken we een JSON export met de configuratie
    const exportData = {
      title: videoProject.title,
      script: videoProject.scriptText,
      videoClips: videoProject.videoClips,
      music: videoProject.musicTrack,
      voiceovers: videoProject.voiceoverSegments,
      effects: videoProject.effects,
      duration: videoProject.totalDuration,
      exportedAt: new Date().toISOString(),
    };

    // Simuleer export processing
    const exportJson = JSON.stringify(exportData, null, 2);
    const exportBlob = Buffer.from(exportJson).toString('base64');
    const exportUrl = `data:application/json;base64,${exportBlob}`;

    // Update met export URL
    await prisma.videoProject.update({
      where: { id: videoProjectId },
      data: {
        exportStatus: 'completed',
        exportUrl,
        exportedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Video configuratie geëxporteerd!',
      exportUrl,
      exportData,
    });

  } catch (error) {
    console.error('Video export error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Export mislukt' 
    }, { status: 500 });
  }
}
