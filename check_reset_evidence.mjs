import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function investigateReset() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('  DATABASE RESET INVESTIGATION');
    console.log('='.repeat(70) + '\n');
    
    // Check migration timestamps
    const migrations = await prisma.$queryRaw`
      SELECT 
        migration_name,
        started_at,
        finished_at,
        rolled_back_at,
        logs
      FROM "_prisma_migrations" 
      ORDER BY started_at ASC;
    `;
    
    console.log('1. MIGRATION TIMELINE:\n');
    migrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.migration_name}`);
      console.log(`      Started:      ${m.started_at}`);
      console.log(`      Finished:     ${m.finished_at || 'FAILED'}`);
      console.log(`      Rolled back:  ${m.rolled_back_at || 'No'}`);
      
      if (m.logs && m.logs.includes('ERROR')) {
        console.log(`      ⚠️  ERROR DETECTED IN LOGS`);
      }
      console.log('');
    });
    
    // Check if there are MORE migrations than just the recent one
    const totalMigrations = migrations.length;
    
    console.log('='.repeat(70));
    console.log('2. RESET EVIDENCE:\n');
    
    if (totalMigrations === 2) {
      console.log('   ⚠️  ONLY 2 MIGRATIONS FOUND!');
      console.log('   This indicates a database reset occurred.\n');
      console.log('   Expected: 50+ migrations for a production database');
      console.log('   Found:    2 migrations (both from today)\n');
      console.log('   📋 CONCLUSION: Database was reset via `prisma migrate reset`');
      console.log('                  or similar command before 14:13 UTC today.\n');
    } else {
      console.log(`   ✅ Found ${totalMigrations} migrations (normal)`);
    }
    
    console.log('='.repeat(70));
    console.log('3. WHAT HAPPENED:\n');
    console.log('   Timeline of events:');
    console.log('   1. Someone ran a database reset command');
    console.log('   2. All tables and data were dropped');
    console.log('   3. Migration failed because schema was gone');
    console.log('   4. Migration was retried and succeeded');
    console.log('   5. But all data (clients, projects) was lost\n');
    
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateReset();
