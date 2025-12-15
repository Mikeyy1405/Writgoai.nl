
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
    const {
      title,
      description,
      scriptText,
      scriptLanguage,
      videoClips,
      musicTrack,
      voiceoverSegments,
      effects,
      totalDuration,
      projectId,
    } = body;

    if (!title || !scriptText) {
      return NextResponse.json({ error: 'Titel en script zijn verplicht' }, { status: 400 });
    }

    // Sla video configuratie op
    const videoProject = await prisma.videoProject.create({
      data: {
        clientId: client.id,
        projectId: projectId || null,
        title,
        description: description || null,
        scriptText,
        scriptLanguage: scriptLanguage || 'Dutch',
        videoClips: videoClips || [],
        musicTrack: musicTrack || null,
        voiceoverSegments: voiceoverSegments || [],
        effects: effects || [],
        totalDuration: totalDuration || 0,
        exportStatus: 'draft',
      },
    });

    return NextResponse.json({
      success: true,
      videoProject: {
        id: videoProject.id,
        title: videoProject.title,
        createdAt: videoProject.createdAt,
      },
    });

  } catch (error) {
    console.error('Video save error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    const videoProjects = await prisma.videoProject.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        totalDuration: true,
        exportStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      projects: videoProjects,
    });

  } catch (error) {
    console.error('Video projects list error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}
