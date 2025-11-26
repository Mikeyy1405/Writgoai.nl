import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function fullCheck() {
  try {
    console.log('\n========================================');
    console.log('  WRITGOAI DATABASE STATUS');
    console.log('========================================\n');
    
    // Check all tables
    const counts = {
      'Clients': await prisma.client.count(),
      'Projects': await prisma.project.count(),
      'Saved Content': await prisma.savedContent.count(),
      'Article Ideas': await prisma.articleIdea.count(),
      'Autopilot Jobs': await prisma.autopilotJob.count(),
    };
    
    let totalRecords = 0;
    for (const [name, count] of Object.entries(counts)) {
      console.log(`${name.padEnd(20)} : ${count}`);
      totalRecords += count;
    }
    
    console.log('\n========================================');
    console.log(`TOTAL RECORDS: ${totalRecords}`);
    console.log('========================================\n');
    
    if (totalRecords === 0) {
      console.log('⚠️  DATABASE IS EMPTY!');
      console.log('\nPossible causes:');
      console.log('  1. Database was recently reset');
      console.log('  2. No users have registered yet');
      console.log('  3. Connected to wrong database');
      console.log('\nSolution:');
      console.log('  - Users need to register/login');
      console.log('  - Or run seed script if in development\n');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fullCheck();
