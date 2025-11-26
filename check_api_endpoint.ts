// Simuleer API call zoals de browser dat zou doen
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './lib/auth-options';
import { prisma } from './lib/db';

async function testProjectsAPI() {
  try {
    // Simuleer een ingelogde gebruiker (info@WritgoAI.nl heeft 13 projecten)
    const testEmail = 'info@WritgoAI.nl';
    
    console.log(`\n=== Testing API for: ${testEmail} ===\n`);
    
    const client = await prisma.client.findUnique({
      where: { email: testEmail },
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
      console.log('❌ Client not found');
      return;
    }

    console.log(`✅ Client found: ${client.email}`);
    console.log(`✅ Projects count: ${client.projects.length}`);
    
    // Get collaborator projects
    const collaboratorProjects = await prisma.projectCollaborator.findMany({
      where: {
        email: testEmail,
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

    console.log(`✅ Collaborator projects: ${collaboratorProjects.length}`);
    
    // Transform data like the API does
    const ownedProjects = client.projects.map((project: any) => ({
      ...project,
      knowledgeBaseCount: project._count?.knowledgeBase || 0,
      savedContentCount: project._count?.savedContent || 0,
      isOwner: true,
      isCollaborator: false,
      _count: undefined
    }));

    const collabProjects = collaboratorProjects.map((collab: any) => ({
      ...collab.project,
      knowledgeBaseCount: collab.project._count?.knowledgeBase || 0,
      savedContentCount: collab.project._count?.savedContent || 0,
      isOwner: false,
      isCollaborator: true,
      collaboratorRole: collab.role,
      _count: undefined
    }));

    const allProjects = [...ownedProjects, ...collabProjects];
    
    console.log(`\n✅ Total projects to return: ${allProjects.length}`);
    console.log('\nProjects:');
    allProjects.forEach(p => {
      console.log(`  - ${p.name} (${p.isOwner ? 'owner' : 'collaborator'})`);
    });
    
    // Check if this matches what the API would return
    const apiResponse = {
      projects: allProjects,
      ownedCount: ownedProjects.length,
      collaboratorCount: collabProjects.length,
    };
    
    console.log(`\n=== API Response Summary ===`);
    console.log(`Owned: ${apiResponse.ownedCount}`);
    console.log(`Collaborator: ${apiResponse.collaboratorCount}`);
    console.log(`Total: ${apiResponse.projects.length}`);
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsAPI();
