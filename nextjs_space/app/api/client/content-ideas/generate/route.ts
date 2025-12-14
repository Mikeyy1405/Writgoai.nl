import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { performCompleteContentResearch } from '@/lib/intelligent-content-planner';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await req.json();
    
    if (!projectId || typeof projectId !== 'string') {
      return NextResponse.json({ error: 'Valid project ID is required' }, { status: 400 });
    }
    
    // Get client ID from session
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Get project details and verify ownership
    const project = await prisma.project.findUnique({
      where: { 
        id: projectId,
        clientId: client.id // Ensure project belongs to the client
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
        niche: true,
        targetAudience: true,
        keywords: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Generate content ideas using the intelligent content planner
    const result = await performCompleteContentResearch(
      project.websiteUrl || '',
      project.niche || 'algemeen',
      project.targetAudience || 'algemeen publiek',
      project.keywords || [],
      project.name
    );

    return NextResponse.json({
      success: true,
      ideas: result.contentIdeas,
      summary: result.summary,
    });

  } catch (error: any) {
    console.error('Error generating content ideas:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate content ideas' 
    }, { status: 500 });
  }
}
