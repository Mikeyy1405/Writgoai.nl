import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function finalCheck() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('  FINAL DATABASE VERIFICATION');
    console.log('='.repeat(60) + '\n');
    
    // 1. Check database connection
    console.log('1. Database Connection Test...');
    try {
      await prisma.$connect();
      console.log('   ✅ Connected to database');
      console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}\n`);
    } catch (e) {
      console.log('   ❌ Connection failed:', e.message);
      return;
    }
    
    // 2. Count all major entities
    console.log('2. Entity Count Verification...');
    const counts = {
      'Clients': await prisma.client.count(),
      'Projects': await prisma.project.count(),
      'Article Ideas': await prisma.articleIdea.count(),
      'Saved Content': await prisma.savedContent.count(),
      'Autopilot Jobs': await prisma.autopilotJob.count(),
      'Social Media Posts': await prisma.socialMediaPost.count(),
      'Knowledge Base Items': await prisma.projectKnowledge.count(),
    };
    
    let totalRecords = 0;
    Object.entries(counts).forEach(([name, count]) => {
      console.log(`   ${name.padEnd(25)}: ${count}`);
      totalRecords += count;
    });
    
    console.log(`\n   TOTAL DATA RECORDS: ${totalRecords}\n`);
    
    // 3. Check migrations
    console.log('3. Migration Status...');
    const migrations = await prisma.$queryRaw`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN finished_at IS NULL THEN 1 END) as failed
      FROM "_prisma_migrations"
    `;
    console.log(`   Total migrations: ${migrations[0].total}`);
    console.log(`   Failed migrations: ${migrations[0].failed}\n`);
    
    // 4. Final verdict
    console.log('='.repeat(60));
    console.log('  VERDICT');
    console.log('='.repeat(60) + '\n');
    
    if (totalRecords === 0) {
      console.log('❌ DATABASE IS EMPTY');
      console.log('\n🔍 POSSIBLE CAUSES:');
      console.log('   1. Database was reset before today\'s migration');
      console.log('   2. Using wrong DATABASE_URL (dev vs prod)');
      console.log('   3. All users were deleted by accident');
      console.log('\n💡 SOLUTION:');
      console.log('   • Check if prod database has data: WritgoAI.nl');
      console.log('   • Users need to re-register if prod is also empty');
      console.log('   • Restore from backup if available\n');
    } else {
      console.log('✅ DATABASE HAS DATA');
      console.log(`   ${totalRecords} total records found\n`);
    }
    
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheck();
