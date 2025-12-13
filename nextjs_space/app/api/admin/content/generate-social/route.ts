import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

const PLATFORM_TEMPLATES: Record<string, (topic: string, brand: string) => string> = {
  facebook: (topic, brand) => `🎯 ${topic}\n\nOntdek hoe ${brand} jou kan helpen met praktische tips en inzichten!\n\n👉 Lees meer op onze website`,
  instagram: (topic, brand) => `✨ ${topic}\n\n💡 Swipe voor meer tips\n📸 Tag ons in je stories`,
  twitter: (topic, brand) => `🚀 ${topic}\n\nKlaar voor de volgende stap? ${brand} helpt je verder!`,
  linkedin: (topic, brand) => `${topic}\n\nIn de professionele wereld is het belangrijk om up-to-date te blijven. Bij ${brand} delen we regelmatig waardevolle inzichten en best practices.\n\nWat is jouw ervaring hiermee?`,
};

const PLATFORM_HASHTAGS: Record<string, string> = {
  facebook: '',
  instagram: '#marketing #business #tips #entrepreneur',
  twitter: '#business #marketing',
  linkedin: '#professionaldevelopment #business',
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, topic, platforms } = body;

    if (!projectId || !topic || !platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'ProjectId, topic, and platforms are required' }, { status: 400 });
    }

    // Fetch project for context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // TODO: Implement AI social post generation using:
    // - project.niche
    // - project.targetAudience  
    // - project.brandVoice
    // - topic
    // - platforms
    
    // For now, return mock responses
    const brandName = project.name;
    const posts = platforms.map((platform: string) => {
      const template = PLATFORM_TEMPLATES[platform] || PLATFORM_TEMPLATES.facebook;
      return {
        platform,
        content: template(topic, brandName),
        hashtags: PLATFORM_HASHTAGS[platform] || '',
      };
    });

    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('Error generating social posts:', error);
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 });
  }
}
