import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function getFullLogs() {
  try {
    const migrations = await prisma.$queryRaw`
      SELECT 
        id,
        migration_name,
        started_at,
        finished_at,
        rolled_back_at,
        logs
      FROM "_prisma_migrations" 
      ORDER BY started_at DESC;
    `;
    
    console.log('\n========================================');
    console.log('  FULL MIGRATION LOGS');
    console.log('========================================\n');
    
    migrations.forEach((m, i) => {
      console.log(`Migration ${i + 1}: ${m.migration_name}`);
      console.log(`Started: ${m.started_at}`);
      console.log(`Finished: ${m.finished_at || 'NULL'}`);
      console.log(`Rolled back: ${m.rolled_back_at || 'No'}`);
      console.log('\nLogs:');
      console.log(m.logs || 'No logs');
      console.log('\n' + '='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getFullLogs();
