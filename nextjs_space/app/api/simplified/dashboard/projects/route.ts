import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * GET /api/simplified/dashboard/projects
 * Haal project overzicht op voor dashboard met content counts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal projecten op met content count
    const projects = await prisma.project.findMany({
      where: { 
        clientId: client.id,
        isActive: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Voor elk project, haal het aantal savedContent items op
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const contentCount = await prisma.savedContent.count({
          where: { projectId: project.id },
        });

        return {
          ...project,
          _count: {
            savedContent: contentCount,
          },
        };
      })
    );

    return NextResponse.json({
      projects: projectsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching dashboard projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
