/**
 * Cron job script to update WooCommerce products for all projects with auto-update enabled
 * Run weekly: npm run tsx scripts/cron-update-woocommerce-products.ts
 */

import { prisma } from '../lib/db';
import { updateProductsForProject } from './woocommerce-product-update';

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 WOOCOMMERCE PRODUCT UPDATE CRON JOB');
  console.log('='.repeat(70));
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    // Get all projects with auto-update enabled
    const projects = await prisma.project.findMany({
      where: {
        wooCommerceAutoUpdate: true,
        bolcomClientId: { not: null },
        bolcomClientSecret: { not: null },
        // WooCommerce gebruikt WordPress credentials
        wooCommerceEnabled: true,
        wordpressUrl: { not: null },
        wordpressUsername: { not: null },
        wordpressPassword: { not: null },
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`📊 Found ${projects.length} projects with auto-update enabled\n`);

    if (projects.length === 0) {
      console.log('ℹ️  No projects to update. Exiting...\n');
      return;
    }

    const allResults: Array<{
      projectId: string;
      projectName: string;
      clientEmail: string;
      success: boolean;
      summary?: any;
      error?: string;
    }> = [];

    // Update each project
    for (const project of projects) {
      console.log('\n' + '-'.repeat(70));
      console.log(`🏢 Project: ${project.name} (${project.id})`);
      console.log(`👤 Client: ${project.client.name} (${project.client.email})`);
      console.log('-'.repeat(70));

      try {
        const results = await updateProductsForProject(project.id);

        const summary = {
          total: results.length,
          updated: results.filter(r => r.updated).length,
          priceChanges: results.filter(r => r.priceChanged).length,
          stockChanges: results.filter(r => r.stockChanged).length,
          errors: results.filter(r => r.error).length,
        };

        allResults.push({
          projectId: project.id,
          projectName: project.name,
          clientEmail: project.client.email,
          success: true,
          summary,
        });

        console.log(`\n✅ Project ${project.name} completed successfully`);
        console.log(`   - Products checked: ${summary.total}`);
        console.log(`   - Products updated: ${summary.updated}`);
        console.log(`   - Price changes: ${summary.priceChanges}`);
        console.log(`   - Stock changes: ${summary.stockChanges}`);
        if (summary.errors > 0) {
          console.log(`   ⚠️  Errors: ${summary.errors}`);
        }
      } catch (error: any) {
        console.error(`\n❌ Failed to update project ${project.name}:`, error.message);
        allResults.push({
          projectId: project.id,
          projectName: project.name,
          clientEmail: project.client.email,
          success: false,
          error: error.message,
        });
      }

      // Small delay between projects to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total projects: ${allResults.length}`);
    console.log(`Successful: ${allResults.filter(r => r.success).length}`);
    console.log(`Failed: ${allResults.filter(r => !r.success).length}`);
    
    const totalUpdated = allResults
      .filter(r => r.success && r.summary)
      .reduce((sum, r) => sum + r.summary!.updated, 0);
    
    const totalChecked = allResults
      .filter(r => r.success && r.summary)
      .reduce((sum, r) => sum + r.summary!.total, 0);

    console.log(`Total products checked: ${totalChecked}`);
    console.log(`Total products updated: ${totalUpdated}`);
    console.log('='.repeat(70));
    console.log(`⏰ Completed at: ${new Date().toISOString()}\n`);

    // Log failures
    const failures = allResults.filter(r => !r.success);
    if (failures.length > 0) {
      console.log('\n⚠️  FAILED PROJECTS:');
      failures.forEach(f => {
        console.log(`   - ${f.projectName} (${f.clientEmail}): ${f.error}`);
      });
      console.log('\n');
    }

    console.log('✅ Cron job completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Cron job failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { main as updateAllProjects };
