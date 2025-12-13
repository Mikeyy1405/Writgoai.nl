import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma-shim';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, topic, keywords } = body;

    if (!projectId || !topic) {
      return NextResponse.json({ error: 'ProjectId and topic are required' }, { status: 400 });
    }

    // Fetch project for context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // TODO: Implement AI blog generation using:
    // - project.niche
    // - project.targetAudience
    // - project.brandVoice
    // - topic
    // - keywords
    
    // For now, return a mock response
    const mockPost = {
      title: `${topic} - Complete Gids`,
      excerpt: `Een uitgebreide gids over ${topic} voor ${project.targetAudience || 'je doelgroep'}.`,
      content: `<h2>Introductie</h2>\n<p>In deze uitgebreide gids gaan we dieper in op ${topic}.</p>\n\n<h2>Hoofdstuk 1: De Basis</h2>\n<p>Laten we beginnen met de fundamenten van ${topic}...</p>\n\n<h2>Hoofdstuk 2: Best Practices</h2>\n<p>Hier zijn enkele best practices die je direct kunt toepassen...</p>\n\n<h2>Conclusie</h2>\n<p>Samenvattend kunnen we stellen dat ${topic} een belangrijk onderwerp is voor ${project.targetAudience || 'je doelgroep'}.</p>`,
      metaDescription: `Ontdek alles over ${topic} in deze complete gids. Praktische tips en best practices voor ${project.targetAudience || 'je doelgroep'}.`,
      focusKeyword: keywords?.[0] || topic.split(' ')[0],
    };

    return NextResponse.json({ success: true, post: mockPost });
  } catch (error) {
    console.error('Error generating blog post:', error);
    return NextResponse.json({ error: 'Failed to generate blog post' }, { status: 500 });
  }
}
