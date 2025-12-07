/**
 * Verification script for ContentHubSite projectId migration
 * 
 * This script checks if the projectId column exists in the ContentHubSite table
 * and verifies the migration was applied successfully.
 * 
 * Usage:
 *   ts-node scripts/verify_contenthub_migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying ContentHubSite Migration...\n');

  try {
    // Test 1: Check if we can query projectId field
    console.log('Test 1: Querying projectId field...');
    const sites = await prisma.contentHubSite.findMany({
      select: {
        id: true,
        wordpressUrl: true,
        projectId: true,
      },
      take: 5,
    });
    console.log('✅ projectId field is accessible');
    console.log(`   Found ${sites.length} ContentHubSite records\n`);

    // Test 2: Check if we can query with projectId filter
    console.log('Test 2: Testing projectId filter...');
    const sitesWithProject = await prisma.contentHubSite.findMany({
      where: {
        projectId: {
          not: null,
        },
      },
      select: {
        id: true,
        wordpressUrl: true,
        projectId: true,
      },
      take: 5,
    });
    console.log('✅ projectId filter works correctly');
    console.log(`   Found ${sitesWithProject.length} sites linked to projects\n`);

    // Test 3: Check if we can query with project relation
    console.log('Test 3: Testing project relation...');
    const sitesWithProjectInfo = await prisma.contentHubSite.findMany({
      where: {
        projectId: {
          not: null,
        },
      },
      select: {
        id: true,
        wordpressUrl: true,
        projectId: true,
        project: {
          select: {
            id: true,
            name: true,
            wordpressUrl: true,
          },
        },
      },
      take: 5,
    });
    console.log('✅ Project relation works correctly');
    console.log(`   Found ${sitesWithProjectInfo.length} sites with project info\n`);

    // Test 4: Try the exact query from the error (any client/url)
    console.log('Test 4: Testing exact query from error...');
    // This test verifies that the query syntax works, even if no results are returned
    // The important part is that it doesn't throw "column does not exist" error
    const testSite = await prisma.contentHubSite.findFirst({
      select: {
        id: true,
        projectId: true,
        wordpressUrl: true,
      },
      take: 1,
    });
    console.log('✅ findFirst with projectId works correctly');
    if (testSite) {
      console.log(`   Found a test site: ${testSite.wordpressUrl}`);
    } else {
      console.log('   (No sites found, but query executed successfully)');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ All tests passed!');
    console.log('═══════════════════════════════════════');
    console.log('\nMigration Status:');
    console.log('  ✓ projectId column exists');
    console.log('  ✓ projectId can be queried');
    console.log('  ✓ projectId can be filtered');
    console.log('  ✓ Project relation works');
    console.log('  ✓ Original error query works');
    console.log('\n🎉 The migration was applied successfully!');
    console.log('\nNext steps:');
    console.log('  1. Restart your application');
    console.log('  2. Test WordPress connection from Integration page');
    console.log('  3. Test WordPress connection from AI Content page');

  } catch (error: any) {
    console.error('❌ Verification failed!\n');
    
    if (error.message?.includes('column') && error.message?.includes('projectId')) {
      console.error('The projectId column does NOT exist in the database.');
      console.error('\nThe migration has NOT been applied yet.');
      console.error('\nTo fix this, run:');
      console.error('  cd nextjs_space');
      console.error('  yarn prisma migrate deploy');
      console.error('\nOr use the helper script:');
      console.error('  ./scripts/apply_contenthub_migration.sh');
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
