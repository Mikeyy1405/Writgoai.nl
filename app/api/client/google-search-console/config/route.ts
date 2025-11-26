
/**
 * Google Search Console Configuratie API
 * Configureert GSC integratie voor een project
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID ontbreekt' }, { status: 400 });
    }

    // Zoek client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal project op
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
      select: {
        id: true,
        websiteUrl: true,
        googleSearchConsoleSiteUrl: true,
        googleSearchConsoleEnabled: true,
        googleSearchConsoleLastSync: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('GSC config fetch error:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen configuratie' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, siteUrl, enabled } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID ontbreekt' }, { status: 400 });
    }

    // Zoek client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Valideer project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Update GSC configuratie
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        googleSearchConsoleSiteUrl: siteUrl || project.googleSearchConsoleSiteUrl,
        googleSearchConsoleEnabled: enabled ?? project.googleSearchConsoleEnabled,
      },
      select: {
        id: true,
        googleSearchConsoleSiteUrl: true,
        googleSearchConsoleEnabled: true,
        googleSearchConsoleLastSync: true,
      },
    });

    return NextResponse.json({
      success: true,
      project: updatedProject,
    });
  } catch (error: any) {
    console.error('GSC config update error:', error);
    return NextResponse.json(
      { error: 'Fout bij opslaan configuratie' },
      { status: 500 }
    );
  }
}
