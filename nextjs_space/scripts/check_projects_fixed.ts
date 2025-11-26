import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load .env
config();

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    console.log('🔍 Checking for client info@writgo.nl...\n');
    
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
      console.log('\n⚠️  No projects found for this client');
    } else {
      console.log('\n📁 Projects:');
      client.projects.forEach((proj: any, idx: number) => {
        console.log(`\n${idx + 1}. ${proj.name}`);
        console.log(`   URL: ${proj.websiteUrl}`);
        console.log(`   ID: ${proj.id}`);
        console.log(`   Primary: ${proj.isPrimary ? '✅' : '❌'}`);
        console.log(`   Active: ${proj.isActive ? '✅' : '❌'}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
