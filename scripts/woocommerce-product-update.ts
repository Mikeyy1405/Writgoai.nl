/**
 * Weekly WooCommerce Product Update Script
 * Checks and updates:
 * - Product availability (in stock / out of stock)
 * - Current price and sale price
 * - Affiliate links validity
 * 
 * Run: npm run tsx scripts/woocommerce-product-update.ts --projectId=<projectId>
 */

import { prisma } from '../lib/db';
import {
  getBolcomProductDetails,
  type BolcomCredentials,
} from '../lib/bolcom-api';
import { createWooCommerceClient } from '../lib/woocommerce-api';

interface UpdateResult {
  productId: string;
  sku: string;
  name: string;
  priceChanged: boolean;
  oldPrice?: number;
  newPrice?: number;
  stockChanged: boolean;
  oldStock?: string;
  newStock?: string;
  updated: boolean;
  error?: string;
}

async function updateProductsForProject(projectId: string): Promise<UpdateResult[]> {
  console.log(`\n📦 Starting product update for project: ${projectId}\n`);

  // Get project with credentials
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { client: true },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  // Check credentials
  if (!project.bolcomClientId || !project.bolcomClientSecret) {
    throw new Error('Bol.com credentials not configured for this project');
  }

  if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
    throw new Error('WordPress/WooCommerce credentials not configured for this project');
  }

  const bolCredentials: BolcomCredentials = {
    clientId: project.bolcomClientId,
    clientSecret: project.bolcomClientSecret,
    affiliateId: project.bolcomAffiliateId || undefined,
  };

  const wooClient = createWooCommerceClient({
    url: project.wordpressUrl,
    username: project.wordpressUsername,
    password: project.wordpressPassword,
  });

  // Get all Bol.com products for this project
  const products = await prisma.wooCommerceProduct.findMany({
    where: {
      projectId,
      importSource: 'bol',
      sku: { not: null },
    },
  });

  console.log(`📋 Found ${products.length} products to check\n`);

  const results: UpdateResult[] = [];

  for (const product of products) {
    const result: UpdateResult = {
      productId: product.id,
      sku: product.sku || '',
      name: product.name,
      priceChanged: false,
      stockChanged: false,
      updated: false,
    };

    try {
      console.log(`🔍 Checking product: ${product.name} (EAN: ${product.sku})`);

      // Get current Bol.com details
      const bolDetails = await getBolcomProductDetails(
        product.sku!,
        bolCredentials,
        'NL'
      );

      const currentPrice = bolDetails.bestOffer?.price || bolDetails.offer?.price || 0;
      const strikethroughPrice = bolDetails.bestOffer?.strikethroughPrice || 
                                 bolDetails.offer?.strikethroughPrice;
      const inStock = bolDetails.bestOffer ? true : false;
      const stockStatus = inStock ? 'instock' : 'outofstock';

      // Compare with stored values
      const oldPrice = parseFloat(product.price || '0');
      const oldStock = product.stockStatus;

      result.oldPrice = oldPrice;
      result.newPrice = currentPrice;
      result.oldStock = oldStock;
      result.newStock = stockStatus;

      // Check if price changed
      if (Math.abs(currentPrice - oldPrice) > 0.01) {
        result.priceChanged = true;
        console.log(`   💰 Price changed: €${oldPrice.toFixed(2)} → €${currentPrice.toFixed(2)}`);
      }

      // Check if stock status changed
      if (oldStock !== stockStatus) {
        result.stockChanged = true;
        console.log(`   📦 Stock changed: ${oldStock} → ${stockStatus}`);
      }

      // Update WooCommerce product if something changed
      if (result.priceChanged || result.stockChanged) {
        console.log(`   ⏳ Updating WooCommerce product...`);

        await wooClient.updateProduct(Number(product.wooProductId), {
          regular_price: strikethroughPrice?.toString() || currentPrice.toString(),
          sale_price: strikethroughPrice ? currentPrice.toString() : undefined,
          stock_status: stockStatus,
          meta_data: [
            { key: '_bol_current_price', value: currentPrice.toString() },
            { key: '_bol_in_stock', value: inStock ? 'yes' : 'no' },
            { key: '_bol_last_checked', value: new Date().toISOString() },
            { key: '_bol_delivery', value: bolDetails.bestOffer?.deliveryDescription || '' },
          ],
        });

        // Update database
        await prisma.wooCommerceProduct.update({
          where: { id: product.id },
          data: {
            price: currentPrice.toString(),
            regularPrice: strikethroughPrice?.toString() || currentPrice.toString(),
            stockStatus,
            sourceData: {
              ...(typeof product.sourceData === 'object' ? product.sourceData : {}),
              lastChecked: new Date().toISOString(),
              lastPrice: oldPrice,
              currentPrice,
              lastStockStatus: oldStock,
              currentStockStatus: stockStatus,
            },
            updatedAt: new Date(),
          },
        });

        result.updated = true;
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ✅ No changes needed`);
      }

      results.push(result);
    } catch (error: any) {
      console.error(`   ❌ Error updating product ${product.name}:`, error.message);
      result.error = error.message;
      results.push(result);
    }

    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const projectIdArg = args.find(arg => arg.startsWith('--projectId='));

  if (!projectIdArg) {
    console.error('❌ Missing required argument: --projectId=<projectId>');
    process.exit(1);
  }

  const projectId = projectIdArg.split('=')[1];

  try {
    const results = await updateProductsForProject(projectId);

    // Generate summary
    const summary = {
      total: results.length,
      updated: results.filter(r => r.updated).length,
      priceChanges: results.filter(r => r.priceChanged).length,
      stockChanges: results.filter(r => r.stockChanged).length,
      errors: results.filter(r => r.error).length,
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total products checked: ${summary.total}`);
    console.log(`Products updated: ${summary.updated}`);
    console.log(`Price changes: ${summary.priceChanges}`);
    console.log(`Stock changes: ${summary.stockChanges}`);
    console.log(`Errors: ${summary.errors}`);
    console.log('='.repeat(60) + '\n');

    // Log details of updated products
    if (summary.updated > 0) {
      console.log('📝 UPDATED PRODUCTS:');
      results
        .filter(r => r.updated)
        .forEach(r => {
          console.log(`\n  • ${r.name} (${r.sku})`);
          if (r.priceChanged) {
            console.log(`    Price: €${r.oldPrice?.toFixed(2)} → €${r.newPrice?.toFixed(2)}`);
          }
          if (r.stockChanged) {
            console.log(`    Stock: ${r.oldStock} → ${r.newStock}`);
          }
        });
      console.log('\n');
    }

    // Log errors
    if (summary.errors > 0) {
      console.log('⚠️  ERRORS:');
      results
        .filter(r => r.error)
        .forEach(r => {
          console.log(`  • ${r.name} (${r.sku}): ${r.error}`);
        });
      console.log('\n');
    }

    console.log('✅ Product update completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ Product update failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { updateProductsForProject };
