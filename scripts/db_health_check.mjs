
// This script must be run from the root directory
// Usage: cd /home/ubuntu/writgo_planning_app && node scripts/db_health_check.mjs

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables from the .env file in current directory
config();

const prisma = new PrismaClient();

async function checkDatabaseHealth() {
  try {
    console.log('🏥 Database Health Check - ' + new Date().toISOString());
    
    // 1. Connection test
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection: OK');
    
    // 2. Critical data counts
    const clientCount = await prisma.client.count();
    const projectCount = await prisma.project.count();
    const contentCount = await prisma.savedContent.count();
    const ideaCount = await prisma.articleIdea.count();
    
    console.log(`📊 Clients: ${clientCount}`);
    console.log(`📊 Projects: ${projectCount}`);
    console.log(`📊 Saved Content: ${contentCount}`);
    console.log(`📊 Article Ideas: ${ideaCount}`);
    
    // 3. Alert if data is critically low
    if (clientCount === 0 || projectCount === 0) {
      console.error('🚨 CRITICAL: Database appears empty!');
      console.error('Expected: 8+ clients, 15+ projects');
      console.error(`Found: ${clientCount} clients, ${projectCount} projects`);
      
      // Try to send alert (non-blocking)
      try {
        await fetch('https://WritgoAI.nl/api/admin/database-alert', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Health-Check': 'true'
          },
          body: JSON.stringify({
            severity: 'CRITICAL',
            message: 'Database appears empty',
            counts: { 
              clients: clientCount, 
              projects: projectCount,
              content: contentCount,
              ideas: ideaCount
            },
            timestamp: new Date().toISOString()
          })
        });
      } catch (alertError) {
        console.error('⚠️  Failed to send alert:', alertError.message);
      }
      
      process.exit(1);
    }
    
    // 4. Warn if data is below expected levels
    if (clientCount < 8) {
      console.warn(`⚠️  WARNING: Client count (${clientCount}) below expected (8+)`);
    }
    if (projectCount < 15) {
      console.warn(`⚠️  WARNING: Project count (${projectCount}) below expected (15+)`);
    }
    
    // 5. Schema validation
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    console.log(`✅ Schema validation: ${tables.length} tables found`);
    
    // 6. Check critical tables exist
    const criticalTables = ['Client', 'Project', 'SavedContent', 'ArticleIdea'];
    const tableNames = tables.map(t => t.tablename);
    
    for (const table of criticalTables) {
      if (!tableNames.includes(table)) {
        console.error(`🚨 CRITICAL: Missing table: ${table}`);
        process.exit(1);
      }
    }
    
    console.log('✅ All critical tables present');
    console.log('✅ Health check PASSED!\n');
    
  } catch (error) {
    console.error('❌ Health check FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseHealth();
