import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, siteUrl, niche, targetAudience, brandVoice, wordpressUrl, wordpressUsername, wordpressPassword, getlateProfileId, getlateAccessToken, clientId } = body;

    if (!name || !clientId) {
      return NextResponse.json({ error: 'Name and clientId are required' }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        clientId,
        name,
        siteUrl,
        niche,
        targetAudience,
        brandVoice,
        wordpressUrl,
        wordpressUsername,
        wordpressPassword,
        getlateProfileId,
        getlateAccessToken,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
