export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// GET - List all admin projects
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

    const projects = await prisma.adminProject.findMany({
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

    const transformedProjects = projects.map((project: any) => ({
      ...project,
      blogPostCount: project._count?.blogPosts || 0,
      _count: undefined
    }));

    return NextResponse.json({
      projects: transformedProjects,
      count: projects.length
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
