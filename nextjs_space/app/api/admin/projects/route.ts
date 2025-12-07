export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List all admin projects and client projects with WordPress integration
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Fetch admin projects
    const adminProjects = await prisma.adminProject.findMany({
      include: {
        _count: {
          select: {
            blogPosts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedAdminProjects = adminProjects.map((project: any) => ({
      ...project,
      blogPostCount: project._count?.blogPosts || 0,
      projectType: 'admin',
      _count: undefined
    }));

    // Fetch client projects with WordPress configured
    const clientProjectsWithWordPress = await prisma.project.findMany({
      where: {
        AND: [
          { wordpressUrl: { not: null } },
          { wordpressUrl: { not: '' } }
        ]
      },
      include: {
        client: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            savedContent: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedClientProjects = clientProjectsWithWordPress.map((project: any) => ({
      id: project.id,
      name: project.name,
      websiteUrl: project.websiteUrl,
      description: project.description,
      wordpressUrl: project.wordpressUrl,
      wordpressUsername: project.wordpressUsername,
      wordpressPassword: project.wordpressPassword,
      wordpressCategory: project.wordpressCategory,
      wordpressAutoPublish: project.wordpressAutoPublish,
      language: project.language || 'NL', // Use project's language setting
      niche: project.niche,
      targetAudience: project.targetAudience,
      brandVoice: project.brandVoice,
      keywords: Array.isArray(project.keywords) ? project.keywords : [],
      isActive: project.isActive,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      blogPostCount: project._count?.savedContent || 0,
      projectType: 'client',
      clientName: project.client?.name,
      clientEmail: project.client?.email,
    }));

    // Combine both lists
    const allProjects = [...transformedAdminProjects, ...transformedClientProjects];

    return NextResponse.json({
      projects: allProjects,
      count: allProjects.length,
      adminCount: transformedAdminProjects.length,
      clientCount: transformedClientProjects.length
    });

  } catch (error: any) {
    console.error('Error fetching admin projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create new admin project
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const data = await request.json();
    
    // Validation
    if (!data.name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await prisma.adminProject.create({
      data: {
        name: data.name,
        websiteUrl: data.websiteUrl || null,
        description: data.description || null,
        wordpressUrl: data.wordpressUrl || null,
        wordpressUsername: data.wordpressUsername || null,
        wordpressPassword: data.wordpressPassword || null,
        wordpressCategory: data.wordpressCategory || null,
        wordpressAutoPublish: data.wordpressAutoPublish || false,
        language: data.language || 'NL',
        niche: data.niche || null,
        targetAudience: data.targetAudience || null,
        brandVoice: data.brandVoice || null,
        keywords: data.keywords || [],
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      project,
      message: 'Admin project created successfully'
    });

  } catch (error: any) {
    console.error('Error creating admin project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
