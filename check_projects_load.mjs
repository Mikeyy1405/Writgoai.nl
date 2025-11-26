import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config();

const prisma = new PrismaClient();

async function checkProjectsData() {
  try {
    console.log('🔍 Checking Projects data...\n');
    
    const totalProjects = await prisma.project.count();
    console.log(`📊 Total Projects: ${totalProjects}`);
    
    const totalClients = await prisma.client.count();
    console.log(`👥 Total Clients: ${totalClients}`);
    
    if (totalProjects > 0) {
      const projects = await prisma.project.findMany({
        take: 5,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          _count: {
            select: {
              savedContent: true,
              knowledgeBase: true,
              articleIdeas: true
            }
          }
        }
      });
      
      console.log('\n📋 Sample Projects:');
      projects.forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   ID: ${p.id}`);
        console.log(`   Client: ${p.client?.name || 'NO CLIENT'} (${p.client?.email || 'N/A'})`);
        console.log(`   ClientId: ${p.clientId || 'NULL'}`);
        console.log(`   Website: ${p.websiteUrl || 'N/A'}`);
        console.log(`   Content: ${p._count.savedContent} items`);
        console.log(`   Knowledge: ${p._count.knowledgeBase} items`);
        console.log(`   Ideas: ${p._count.articleIdeas} items`);
      });
    }
    
    const orphanProjects = await prisma.project.count({
      where: {
        clientId: null
      }
    });
    
    console.log(`\n⚠️  Projects without clientId: ${orphanProjects}`);
    
    const totalIdeas = await prisma.articleIdea.count();
    console.log(`\n💡 Total Article Ideas: ${totalIdeas}`);
    
    const totalContent = await prisma.savedContent.count();
    console.log(`📝 Total Saved Content: ${totalContent}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjectsData();
