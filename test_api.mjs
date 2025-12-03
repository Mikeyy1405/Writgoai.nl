import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('Testing projects API response...\n');
    
    // Simuleer wat de API doet
    const client = await prisma.client.findFirst({
      where: { email: 'info@WritgoAI.nl' }
    });
    
    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }
    
    console.log('✅ Client gevonden:', client.email);
    
    const projects = await prisma.project.findMany({
      where: {
        clientId: client.id
      },
      include: {
        _count: {
          select: {
            savedContent: true,
            knowledgeBase: true
          }
        }
      }
    });
    
    console.log('\n✅ Projecten voor client:', projects.length);
    projects.forEach(p => {
      console.log(`  - ${p.name} (${p._count.savedContent} saved, ${p._count.knowledgeBase} knowledge)`);
    });
    
  } catch (error) {
    console.error('❌ API test fout:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();
