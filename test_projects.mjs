import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function testProjects() {
  try {
    const totalProjects = await prisma.project.count();
    console.log(`Total projects: ${totalProjects}`);
    
    const totalClients = await prisma.client.count();
    console.log(`Total clients: ${totalClients}`);
    
    if (totalClients > 0) {
      const client = await prisma.client.findFirst({
        include: { projects: true }
      });
      
      if (client) {
        console.log(`First client email: ${client.email}`);
        console.log(`Projects count: ${client.projects.length}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProjects();
