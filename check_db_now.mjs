import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  try {
    const clientCount = await prisma.client.count();
    const projectCount = await prisma.project.count();
    const savedContentCount = await prisma.savedContent.count();
    const articleIdeaCount = await prisma.articleIdea.count();
    
    console.log('📊 DATABASE STATUS:');
    console.log('==================');
    console.log(`Klanten: ${clientCount}`);
    console.log(`Projecten: ${projectCount}`);
    console.log(`Opgeslagen Content: ${savedContentCount}`);
    console.log(`Artikel Ideeën: ${articleIdeaCount}`);
    
    if (clientCount > 0) {
      const clients = await prisma.client.findMany({
        take: 10,
        select: {
          email: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' }
      });
      
      console.log('\n📋 Laatste 10 klanten:');
      clients.forEach(c => {
        console.log(`  - ${c.name} (${c.email}) - Aangemaakt: ${c.createdAt.toISOString()}`);
      });
    } else {
      console.log('\n⚠️  GEEN KLANTEN GEVONDEN IN DATABASE');
    }
    
  } catch (error) {
    console.error('❌ Database fout:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStatus();
