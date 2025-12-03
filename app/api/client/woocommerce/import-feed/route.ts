
/**
 * Import products from CSV/XML datafeed to WooCommerce
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';
import { parse } from 'csv-parse/sync';

export const dynamic = 'force-dynamic';

interface ImportFeedRequest {
  projectId: string;
  feedData: string;
  feedType: 'csv' | 'xml';
  fieldMapping?: {
    name?: string;
    description?: string;
    price?: string;
    sku?: string;
    image?: string;
    category?: string;
    url?: string;
  };
  autoPublish?: boolean;
}

/**
 * Parse CSV feed
 */
function parseCSVFeed(csvData: string, fieldMapping: any): any[] {
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return records.map((record: any) => ({
    name: record[fieldMapping.name || 'name'] || record.name || record.title,
    description: record[fieldMapping.description || 'description'] || record.description,
    price: record[fieldMapping.price || 'price'] || record.price,
    sku: record[fieldMapping.sku || 'sku'] || record.sku || record.id,
    image: record[fieldMapping.image || 'image'] || record.image || record.image_url,
    category: record[fieldMapping.category || 'category'] || record.category,
    url: record[fieldMapping.url || 'url'] || record.url || record.link,
    _raw: record,
  }));
}

/**
 * Parse XML feed (basic implementation)
 */
function parseXMLFeed(xmlData: string, fieldMapping: any): any[] {
  // Basic XML parsing - can be enhanced with xml2js if needed
  const products: any[] = [];
  
  // Simple regex-based XML parsing for common patterns
  const productRegex = /<product[^>]*>(.*?)<\/product>/gis;
  const matches = xmlData.matchAll(productRegex);

  for (const match of matches) {
    const productXml = match[1];
    
    const getName = (xml: string) => {
      const m = xml.match(/<(?:name|title)[^>]*>(.*?)<\/(?:name|title)>/i);
      return m ? m[1].trim() : '';
    };
    
    const getDescription = (xml: string) => {
      const m = xml.match(/<description[^>]*>(.*?)<\/description>/i);
      return m ? m[1].trim() : '';
    };
    
    const getPrice = (xml: string) => {
      const m = xml.match(/<price[^>]*>(.*?)<\/price>/i);
      return m ? m[1].trim() : '';
    };
    
    const getSku = (xml: string) => {
      const m = xml.match(/<(?:sku|id)[^>]*>(.*?)<\/(?:sku|id)>/i);
      return m ? m[1].trim() : '';
    };
    
    const getImage = (xml: string) => {
      const m = xml.match(/<(?:image|image_url)[^>]*>(.*?)<\/(?:image|image_url)>/i);
      return m ? m[1].trim() : '';
    };
    
    const getUrl = (xml: string) => {
      const m = xml.match(/<(?:url|link)[^>]*>(.*?)<\/(?:url|link)>/i);
      return m ? m[1].trim() : '';
    };

    products.push({
      name: getName(productXml),
      description: getDescription(productXml),
      price: getPrice(productXml),
      sku: getSku(productXml),
      image: getImage(productXml),
      url: getUrl(productXml),
      _raw: productXml,
    });
  }

  return products;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ImportFeedRequest = await req.json();
    const { projectId, feedData, feedType, fieldMapping = {}, autoPublish = false } = body;

    if (!projectId || !feedData || !feedType) {
      return NextResponse.json(
        { error: 'Project ID, feed data, and feed type are required' },
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

    const wooClient = createWooCommerceClient({
      url: project.wordpressUrl,
      username: project.wordpressUsername,
      password: project.wordpressPassword,
    });

    // Parse feed
    let feedProducts: any[] = [];
    
    try {
      if (feedType === 'csv') {
        feedProducts = parseCSVFeed(feedData, fieldMapping);
      } else if (feedType === 'xml') {
        feedProducts = parseXMLFeed(feedData, fieldMapping);
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to parse feed', message: error.message },
        { status: 400 }
      );
    }

    if (feedProducts.length === 0) {
      return NextResponse.json(
        { message: 'No products found in feed', imported: [] },
        { status: 200 }
      );
    }

    const imported: any[] = [];
    const errors: any[] = [];

    // Import each product
    for (const feedProduct of feedProducts) {
      try {
        if (!feedProduct.name) {
          throw new Error('Product name is required');
        }

        // Prepare images
        const images: Array<{ src: string; alt: string }> = [];
        if (feedProduct.image) {
          images.push({
            src: feedProduct.image,
            alt: feedProduct.name,
          });
        }

        // Determine product type
        const productType = feedProduct.url ? 'external' : 'simple';

        // Create WooCommerce product
        const wooProduct = await wooClient.createProduct({
          name: feedProduct.name,
          type: productType,
          status: autoPublish ? 'publish' : 'draft',
          description: feedProduct.description || '',
          short_description: feedProduct.description?.substring(0, 150) || '',
          sku: feedProduct.sku || undefined,
          regular_price: feedProduct.price || undefined,
          external_url: feedProduct.url || undefined,
          button_text: feedProduct.url ? 'Bekijk Product' : undefined,
          images,
          meta_data: [
            { key: '_imported_from_feed', value: 'true' },
            { key: '_feed_type', value: feedType },
          ],
        });

        if (!wooProduct.id) {
          throw new Error('Failed to create WooCommerce product');
        }

        // Save to database
        await prisma.wooCommerceProduct.create({
          data: {
            projectId,
            wooProductId: wooProduct.id,
            sku: feedProduct.sku || undefined,
            name: feedProduct.name,
            description: feedProduct.description || undefined,
            shortDescription: feedProduct.description?.substring(0, 150) || undefined,
            price: feedProduct.price || undefined,
            regularPrice: feedProduct.price || undefined,
            stockStatus: 'instock',
            images: images.length > 0 ? images : undefined,
            importSource: 'datafeed',
            sourceUrl: feedProduct.url || undefined,
            sourceData: feedProduct._raw || feedProduct,
            status: autoPublish ? 'publish' : 'draft',
            permalink: wooProduct.id ? `${project.wordpressUrl}/product/${wooProduct.id}` : undefined,
          },
        });

        imported.push({
          sku: feedProduct.sku,
          name: feedProduct.name,
          wooProductId: wooProduct.id,
          status: 'success',
        });

        console.log(`✅ Imported ${feedProduct.name} from ${feedType} feed`);
      } catch (error: any) {
        console.error(`Failed to import ${feedProduct.name}:`, error);
        errors.push({
          name: feedProduct.name,
          sku: feedProduct.sku,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      message: `Imported ${imported.length} products from ${feedType} feed`,
      imported,
      errors,
      total: feedProducts.length,
    });
  } catch (error: any) {
    console.error('Feed import error:', error);
    return NextResponse.json(
      { error: 'Import failed', message: error.message },
      { status: 500 }
    );
  }
}
