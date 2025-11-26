/**
 * API endpoint to manually trigger product updates or for cron jobs
 * Updates price and stock status for all Bol.com products
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { updateProductsForProject } from '@/scripts/woocommerce-product-update';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    // Check for cron secret (for automated runs)
    const { projectId, cronSecret } = await req.json();
    
    const validCronSecret = process.env.CRON_SECRET || 'writgo-content-automation-secret-2025';
    const isCronJob = cronSecret === validCronSecret;
    
    if (!isCronJob && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    console.log(`\n🔄 Starting product update for project: ${projectId}`);
    console.log(`   Triggered by: ${isCronJob ? 'Cron Job' : session?.user?.email || 'Unknown'}`);

    // Run the update script
    const results = await updateProductsForProject(projectId);

    // Generate summary
    const summary = {
      projectId,
      timestamp: new Date().toISOString(),
      total: results.length,
      updated: results.filter(r => r.updated).length,
      priceChanges: results.filter(r => r.priceChanged).length,
      stockChanges: results.filter(r => r.stockChanged).length,
      errors: results.filter(r => r.error).length,
      results: results.map(r => ({
        sku: r.sku,
        name: r.name,
        priceChanged: r.priceChanged,
        oldPrice: r.oldPrice,
        newPrice: r.newPrice,
        stockChanged: r.stockChanged,
        oldStock: r.oldStock,
        newStock: r.newStock,
        updated: r.updated,
        error: r.error,
      })),
    };

    console.log(`✅ Update complete: ${summary.updated}/${summary.total} products updated`);

    return NextResponse.json({
      success: true,
      message: `Updated ${summary.updated} out of ${summary.total} products`,
      summary,
    });
  } catch (error: any) {
    console.error('Product update error:', error);
    return NextResponse.json(
      { error: 'Update failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      message: 'WooCommerce Product Update API',
      endpoint: '/api/client/woocommerce/update-products',
      method: 'POST',
      parameters: {
        projectId: 'required - Project ID to update products for',
        cronSecret: 'optional - Cron secret for automated runs',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get API info', message: error.message },
      { status: 500 }
    );
  }
}
