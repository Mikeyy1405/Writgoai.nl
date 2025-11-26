import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function checkMigrations() {
  try {
    console.log('\n========================================');
    console.log('  DATABASE MIGRATION HISTORY');
    console.log('========================================\n');
    
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name, 
        started_at, 
        finished_at,
        applied_steps_count
      FROM "_prisma_migrations" 
      ORDER BY started_at DESC
      LIMIT 10
    `;
    
    console.log('Recent migrations:\n');
    migrations.forEach((m, i) => {
      console.log(`${i + 1}. ${m.migration_name}`);
      console.log(`   Started:  ${m.started_at}`);
      console.log(`   Finished: ${m.finished_at}`);
      console.log(`   Steps:    ${m.applied_steps_count}`);
      console.log('');
    });
    
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrations();
