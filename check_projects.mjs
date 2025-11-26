import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkProjects() {
  try {
    const client = await prisma.client.findUnique({
      where: { email: 'info@WritgoAI.nl' },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            autopilotPublishToWritgoaiBlog: true
          }
        }
      }
    });
    
    if (client) {
      console.log('Projects voor info@WritgoAI.nl:');
      console.log(JSON.stringify(client.projects, null, 2));
    } else {
      console.log('Client niet gevonden');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProjects();
