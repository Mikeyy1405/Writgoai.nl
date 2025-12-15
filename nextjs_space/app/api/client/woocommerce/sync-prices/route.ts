

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';
import { searchBolcomProducts } from '@/lib/bolcom-api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/client/woocommerce/sync-prices
 * Sync prices from Bol.com to WooCommerce products
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { projectId, productIds, autoSync = false } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Get Bol.com credentials
    const bolClientId = project.bolcomClientId || (client as any).bolcomClientId;
    const bolClientSecret = project.bolcomClientSecret || (client as any).bolcomClientSecret;

    if (!bolClientId || !bolClientSecret) {
      return NextResponse.json(
        { error: 'Bol.com credentials niet gevonden' },
        { status: 400 }
      );
    }

    // Check for WordPress credentials
    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials niet gevonden' },
        { status: 400 }
      );
    }

    // Create WooCommerce client
    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    // Get products to sync
    const whereClause: any = {
      projectId,
      importSource: 'bol',
      ean: { not: null },
    };

    if (productIds && productIds.length > 0) {
      whereClause.id = { in: productIds };
    }

    const productsToSync = await prisma.wooCommerceProduct.findMany({
      where: whereClause,
      take: autoSync ? 50 : undefined, // Limit auto-sync to 50 products at a time
    });

    console.log(`🔄 Syncing prices for ${productsToSync.length} products`);

    const results = {
      total: productsToSync.length,
      updated: 0,
      unchanged: 0,
      errors: 0,
      details: [] as Array<{
        productId: string;
        name: string;
        status: 'updated' | 'unchanged' | 'error';
        oldPrice?: string;
        newPrice?: string;
        message?: string;
      }>,
    };

    // Process each product
    for (const product of productsToSync) {
      try {
        // Search for product on Bol.com by EAN
        const searchResult = await searchBolcomProducts(
          product.ean!,
          {
            clientId: bolClientId,
            clientSecret: bolClientSecret,
          }
        );

        if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
          console.log(`⚠️ Product ${product.name} niet gevonden op Bol.com (EAN: ${product.ean})`);
          results.details.push({
            productId: product.id,
            name: product.name,
            status: 'error',
            message: 'Product niet gevonden op Bol.com',
          });
          results.errors++;
          continue;
        }

        const bolProduct = searchResult.results[0];
        const newPrice = bolProduct.offer?.price?.toString();
        const oldPrice = product.price;

        // Check if price has changed
        if (newPrice && newPrice !== oldPrice) {
          console.log(`💰 Price update for ${product.name}: €${oldPrice} → €${newPrice}`);

          // Update WooCommerce product
          await wooClient.updateProduct(product.wooProductId, {
            regular_price: newPrice,
          });

          // Update database
          await prisma.wooCommerceProduct.update({
            where: { id: product.id },
            data: {
              price: newPrice,
              regularPrice: newPrice,
              bolPrice: newPrice,
              lastBolSync: new Date(),
            },
          });

          results.details.push({
            productId: product.id,
            name: product.name,
            status: 'updated',
            oldPrice: oldPrice || undefined,
            newPrice: newPrice,
          });
          results.updated++;
        } else {
          console.log(`✓ Price unchanged for ${product.name}: €${oldPrice}`);
          
          // Update last sync time
          await prisma.wooCommerceProduct.update({
            where: { id: product.id },
            data: {
              lastBolSync: new Date(),
              bolPrice: newPrice || product.bolPrice,
            },
          });

          results.details.push({
            productId: product.id,
            name: product.name,
            status: 'unchanged',
            oldPrice: oldPrice || undefined,
          });
          results.unchanged++;
        }
      } catch (error: any) {
        console.error(`❌ Error syncing ${product.name}:`, error);
        results.details.push({
          productId: product.id,
          name: product.name,
          status: 'error',
          message: error.message,
        });
        results.errors++;
      }
    }

    const message = autoSync
      ? `Automatische prijssync voltooid: ${results.updated} bijgewerkt, ${results.unchanged} ongewijzigd, ${results.errors} fouten`
      : `Prijssync voltooid: ${results.updated} producten bijgewerkt, ${results.unchanged} ongewijzigd`;

    return NextResponse.json({
      success: true,
      message,
      results,
    });
  } catch (error: any) {
    console.error('Error syncing prices:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij synchroniseren van prijzen' },
      { status: 500 }
    );
  }
}

