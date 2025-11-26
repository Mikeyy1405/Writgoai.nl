// Test API route direct
import { prisma } from './lib/db';

async function testAPI() {
  try {
    // Test 1: Check if Client model exists and has projects
    const clients = await prisma.client.findMany({
      include: {
        projects: true
      },
      take: 5
    });
    
    console.log('=== CLIENTS WITH PROJECTS ===');
    clients.forEach(client => {
      console.log(`\nClient: ${client.email}`);
      console.log(`  Projects count: ${client.projects.length}`);
      client.projects.forEach(p => {
        console.log(`    - ${p.name} (${p.id})`);
      });
    });
    
    // Test 2: Direct project count
    const projectCount = await prisma.project.count();
    console.log(`\n=== TOTAL PROJECTS: ${projectCount} ===`);
    
    // Test 3: Get all projects with client info
    const allProjects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('\n=== ALL PROJECTS ===');
    allProjects.forEach(p => {
      console.log(`${p.name} - ${p.client.email}`);
    });
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
