

export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { loadWordPressSitemap } from '@/lib/sitemap-loader';

// GET - Alle projecten van client ophalen (inclusief collaborator projecten)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          include: {
            _count: {
              select: {
                savedContent: true,
                knowledgeBase: true
              }
            }
          },
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Get projects where the user is a collaborator
    const collaboratorProjects = await prisma.projectCollaborator.findMany({
      where: {
        email: session.user.email,
        status: 'active',
        revokedAt: null,
      },
      include: {
        project: {
          include: {
            _count: {
              select: {
                savedContent: true,
                knowledgeBase: true
              }
            }
          }
        }
      }
    });

    // Transform owned projects
    const ownedProjects = client.projects.map((project: any) => ({
      ...project,
      knowledgeBaseCount: project._count?.knowledgeBase || 0,
      savedContentCount: project._count?.savedContent || 0,
      isOwner: true,
      isCollaborator: false,
      _count: undefined
    }));

    // Transform collaborator projects
    const collabProjects = collaboratorProjects.map((collab: any) => ({
      ...collab.project,
      knowledgeBaseCount: collab.project._count?.knowledgeBase || 0,
      savedContentCount: collab.project._count?.savedContent || 0,
      isOwner: false,
      isCollaborator: true,
      collaboratorRole: collab.role,
      _count: undefined
    }));

    // Combine both lists (owned projects first, then collaborator projects)
    const allProjects = [...ownedProjects, ...collabProjects];

    return NextResponse.json({
      projects: allProjects,
      ownedCount: ownedProjects.length,
      collaboratorCount: collabProjects.length,
    });

  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Fout bij ophalen projecten' },
      { status: 500 }
    );
  }
}

// POST - Nieuw project aanmaken
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const data = await request.json();
    
    // Validatie
    if (!data.name || !data.websiteUrl) {
      return NextResponse.json(
        { error: 'Naam en website URL zijn verplicht' },
        { status: 400 }
      );
    }

    // Controleer of dit het eerste project is
    const projectCount = await prisma.project.count({
      where: { clientId: client.id }
    });

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        name: data.name,
        websiteUrl: data.websiteUrl,
        description: data.description || null,
        targetAudience: data.targetAudience || null,
        brandVoice: data.brandVoice || null,
        niche: data.niche || null,
        keywords: data.keywords || [],
        contentPillars: data.contentPillars || [],
        writingStyle: data.writingStyle || null,
        customInstructions: data.customInstructions || null,
        isPrimary: projectCount === 0, // Eerste project wordt automatisch primary
        isActive: true
      }
    });

    // Automatisch sitemap laden in de achtergrond
    // Dit blokkeert de response niet, maar wordt wel uitgevoerd
    loadWordPressSitemap(data.websiteUrl)
      .then((sitemapData) => {
        console.log(`[Project Creation] Sitemap loaded for ${project.name}: ${sitemapData.pages?.length || 0} pages`);
        
        // Update project met sitemap data
        return prisma.project.update({
          where: { id: project.id },
          data: {
            sitemap: sitemapData as any,
            sitemapScannedAt: new Date(),
          },
        });
      })
      .catch((error) => {
        console.error(`[Project Creation] Failed to load sitemap for ${project.name}:`, error);
        // Niet fataal - project is al aangemaakt
      });

    return NextResponse.json({
      success: true,
      project,
      message: 'Project aangemaakt! Sitemap wordt automatisch geladen...'
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Fout bij aanmaken project' },
      { status: 500 }
    );
  }
}
