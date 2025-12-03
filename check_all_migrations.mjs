import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function checkAllMigrations() {
  try {
    console.log('\n========================================');
    console.log('  COMPLETE MIGRATION HISTORY');
    console.log('========================================\n');
    
    const migrations = await prisma.$queryRaw`
      SELECT 
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      FROM "_prisma_migrations" 
      ORDER BY started_at ASC
    `;
    
    console.log(`Total migrations: ${migrations.length}\n`);
    
    migrations.forEach((m, i) => {
      console.log(`${i + 1}. ${m.migration_name}`);
      console.log(`   ID: ${m.id}`);
      console.log(`   Started:      ${m.started_at}`);
      console.log(`   Finished:     ${m.finished_at || 'NULL (FAILED!)'}`);
      console.log(`   Rolled back:  ${m.rolled_back_at || 'No'}`);
      console.log(`   Steps:        ${m.applied_steps_count}`);
      if (m.logs) {
        console.log(`   Logs:         ${m.logs.substring(0, 100)}...`);
      }
      console.log('');
    });
    
    // Check for failed migrations
    const failedMigrations = migrations.filter(m => !m.finished_at);
    if (failedMigrations.length > 0) {
      console.log('⚠️  FAILED MIGRATIONS DETECTED:');
      failedMigrations.forEach(m => {
        console.log(`   - ${m.migration_name}`);
      });
      console.log('');
    }
    
    console.log('========================================\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllMigrations();
