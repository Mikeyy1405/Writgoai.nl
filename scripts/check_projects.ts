import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { email: 'info@writgo.nl' },
      include: {
        projects: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });
    
    if (!client) {
      console.log('❌ Client info@writgo.nl not found in database');
      return;
    }
    
    console.log('✅ Client found:', {
      id: client.id,
      email: client.email,
      name: client.name,
      projectCount: client.projects.length
    });
    
    if (client.projects.length === 0) {
      console.log('⚠️  No projects found for this client');
    } else {
      console.log('\n📁 Projects:');
      client.projects.forEach((proj, idx) => {
        console.log(`${idx + 1}. ${proj.name} (${proj.websiteUrl})`);
        console.log(`   ID: ${proj.id}`);
        console.log(`   Primary: ${proj.isPrimary}`);
        console.log(`   Active: ${proj.isActive}`);
        console.log('');
      });
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
