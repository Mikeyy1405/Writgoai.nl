import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.count();
    const clients = await prisma.client.count();
    
    console.log(`\n=== DATABASE CHECK ===`);
    console.log(`Total Projects: ${projects}`);
    console.log(`Total Clients: ${clients}`);
    
    if (clients > 0) {
      const firstClient = await prisma.client.findFirst({
        include: { projects: true }
      });
      console.log(`\nFirst Client: ${firstClient.email}`);
      console.log(`Projects for client: ${firstClient.projects.length}`);
      
      if (firstClient.projects.length > 0) {
        console.log(`\nProjects list:`);
        firstClient.projects.forEach(p => {
          console.log(`  - ${p.name} (ID: ${p.id})`);
        });
      }
    }
    
    console.log(`\n===================\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
