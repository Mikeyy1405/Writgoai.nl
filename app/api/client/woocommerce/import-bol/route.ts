
/**
 * Import products from Bol.com to WooCommerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';
import { 
  searchBolcomProducts, 
  getBolcomProductDetails,
  generateBolcomAffiliateLink 
} from '@/lib/bolcom-api';

export const dynamic = 'force-dynamic';

interface ImportBolRequest {
  projectId: string;
  searchQuery?: string;
  eans?: string[];
  autoPublish?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ImportBolRequest = await req.json();
    const { projectId, searchQuery, eans, autoPublish = false } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    if (!searchQuery && (!eans || eans.length === 0)) {
      return NextResponse.json(
        { error: 'Either searchQuery or eans is required' },
        { status: 400 }
      );
    }

    // Get project with credentials
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check ownership
    if (project.client.email !== session.user?.email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check Bol.com credentials
    if (!project.bolcomClientId || !project.bolcomClientSecret) {
      return NextResponse.json(
        { 
          error: 'Bol.com credentials not configured',
          message: 'Please configure Bol.com credentials in project settings'
        },
        { status: 400 }
      );
    }

    // Check WooCommerce credentials
    if (!project.wordpressUrl || !project.wordpressUsername || !project.wordpressPassword) {
      return NextResponse.json(
        { 
          error: 'WooCommerce credentials not configured',
          message: 'Please configure WooCommerce credentials in project settings'
        },
        { status: 400 }
      );
    }

    const bolCredentials = {
      clientId: project.bolcomClientId,
      clientSecret: project.bolcomClientSecret,
      affiliateId: project.bolcomAffiliateId || undefined,
    };

    const wooClient = createWooCommerceClient({
      url: project.wordpressUrl,
      username: project.wordpressUsername,
      password: project.wordpressPassword,
    });

    let bolProducts: any[] = [];

    // Search or fetch by EANs with full details
    if (searchQuery) {
      const searchResult = await searchBolcomProducts(
        searchQuery,
        bolCredentials,
        {
          page: 1,
          resultsPerPage: 50,
        }
      );
      bolProducts = searchResult.results || [];
    } else if (eans) {
      // Fetch each EAN individually with full details
      for (const ean of eans) {
        try {
          const product = await getBolcomProductDetails(ean, bolCredentials, 'NL');
          if (product) {
            bolProducts.push(product);
          }
        } catch (error) {
          console.warn(`Failed to fetch EAN ${ean}:`, error);
        }
      }
    }

    if (bolProducts.length === 0) {
      return NextResponse.json(
        { message: 'No products found', imported: [] },
        { status: 200 }
      );
    }

    const imported: any[] = [];
    const errors: any[] = [];

    // Import each product with full details
    for (const bolProduct of bolProducts) {
      try {
        // Get full product details if not already fetched
        let productDetails = bolProduct;
        if (!bolProduct.categories || !bolProduct.images || bolProduct.images.length === 0) {
          try {
            productDetails = await getBolcomProductDetails(bolProduct.ean, bolCredentials, 'NL');
          } catch (error) {
            console.warn(`Could not fetch full details for ${bolProduct.ean}, using basic info`);
          }
        }

        // Prepare high-resolution images
        const images: Array<{ src: string; alt: string }> = [];
        
        if (productDetails.images && productDetails.images.length > 0) {
          productDetails.images.forEach((image: any) => {
            if (image.url) {
              images.push({
                src: image.url,
                alt: productDetails.title || 'Product image',
              });
            }
          });
        } else if (productDetails.image?.url) {
          // Fallback to basic image
          images.push({
            src: productDetails.image.url,
            alt: productDetails.title || 'Product image',
          });
        }

        // Use affiliate link from details or generate new one
        const affiliateLink = productDetails.affiliateLink || generateBolcomAffiliateLink(
          productDetails.url,
          project.bolcomAffiliateId,
          productDetails.title
        );

        // Build product description with specifications
        let description = `${productDetails.description || ''}\n\n`;
        
        // Add specifications if available
        if (productDetails.specificationGroups && productDetails.specificationGroups.length > 0) {
          description += '<h3>Specificaties</h3>\n';
          productDetails.specificationGroups.forEach((group: any) => {
            description += `<h4>${group.name}</h4>\n<ul>\n`;
            group.specifications.forEach((spec: any) => {
              description += `<li><strong>${spec.name}:</strong> ${spec.value}</li>\n`;
            });
            description += '</ul>\n';
          });
        }
        
        description += `\n<p><a href="${affiliateLink}" target="_blank" rel="nofollow noopener" class="button">Bekijk dit product op Bol.com</a></p>`;
        description = description.trim();

        // Get current price
        const currentPrice = productDetails.bestOffer?.price || 
                           productDetails.offer?.price || 
                           0;
        
        const strikethroughPrice = productDetails.bestOffer?.strikethroughPrice || 
                                  productDetails.offer?.strikethroughPrice;

        // Prepare WooCommerce categories
        const wooCategories: Array<{ name: string }> = [];
        if (productDetails.categories && productDetails.categories.length > 0) {
          // Use the most specific category (highest level)
          const mainCategory = productDetails.categories.reduce((prev, current) => 
            (current.level > prev.level) ? current : prev
          );
          wooCategories.push({ name: mainCategory.name });
        }

        // Create WooCommerce product
        const wooProduct = await wooClient.createProduct({
          name: productDetails.title,
          type: 'external',
          status: autoPublish ? 'publish' : 'draft',
          description,
          short_description: productDetails.description?.substring(0, 150) || '',
          sku: productDetails.ean,
          external_url: affiliateLink,
          button_text: 'Bekijk op Bol.com',
          regular_price: strikethroughPrice?.toString() || currentPrice.toString(),
          sale_price: strikethroughPrice ? currentPrice.toString() : undefined,
          images,
          categories: wooCategories,
          meta_data: [
            { key: '_bol_ean', value: productDetails.ean },
            { key: '_bol_product_id', value: productDetails.bolProductId.toString() },
            { key: '_bol_affiliate_link', value: affiliateLink },
            { key: '_bol_current_price', value: currentPrice.toString() },
            { key: '_bol_in_stock', value: productDetails.bestOffer ? 'yes' : 'no' },
            { key: '_bol_delivery', value: productDetails.bestOffer?.deliveryDescription || '' },
            { key: '_bol_last_checked', value: new Date().toISOString() },
          ],
        });

        if (!wooProduct.id) {
          throw new Error('Failed to create WooCommerce product');
        }

        // Save to database with full details
        await prisma.wooCommerceProduct.create({
          data: {
            projectId,
            wooProductId: wooProduct.id,
            sku: productDetails.ean,
            name: productDetails.title,
            description,
            shortDescription: productDetails.description?.substring(0, 150) || undefined,
            price: currentPrice.toString(),
            regularPrice: strikethroughPrice?.toString() || currentPrice.toString(),
            stockStatus: productDetails.bestOffer ? 'instock' : 'outofstock',
            images: images.length > 0 ? images : undefined,
            importSource: 'bol',
            sourceUrl: productDetails.url,
            sourceData: {
              ...productDetails,
              lastChecked: new Date().toISOString(),
              affiliateLink,
            },
            status: autoPublish ? 'publish' : 'draft',
            permalink: wooProduct.id ? `${project.wordpressUrl}/product/${wooProduct.id}` : undefined,
          },
        });

        imported.push({
          ean: bolProduct.ean,
          title: bolProduct.title,
          wooProductId: wooProduct.id,
          status: 'success',
        });

        console.log(`✅ Imported ${bolProduct.title} (EAN: ${bolProduct.ean})`);
      } catch (error: any) {
        console.error(`Failed to import ${bolProduct.ean}:`, error);
        errors.push({
          ean: bolProduct.ean,
          title: bolProduct.title,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Imported ${imported.length} products`,
      imported,
      errors,
      total: bolProducts.length,
    });
  } catch (error: any) {
    console.error('Bol.com import error:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error.message },
      { status: 500 }
    );
  }
}
