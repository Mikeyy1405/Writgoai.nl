import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Check all major tables
    const results = {
      Client: await prisma.client.count(),
      Project: await prisma.project.count(),
      SavedContent: await prisma.savedContent.count(),
      ArticleIdea: await prisma.articleIdea.count(),
      AutopilotJob: await prisma.autopilotJob.count(),
      SocialMediaConfig: await prisma.socialMediaConfig.count(),
    };
    
    console.log('\n=== TABLE COUNTS ===');
    for (const [table, count] of Object.entries(results)) {
      console.log(`${table}: ${count}`);
    }
    console.log('===================\n');
    
    // Check if _prisma_migrations exists
    const migrations = await prisma.$queryRaw`SELECT COUNT(*) FROM "_prisma_migrations"`;
    console.log('Migrations:', migrations);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();
