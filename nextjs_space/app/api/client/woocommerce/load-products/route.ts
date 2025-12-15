
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');
    const search = searchParams.get('search') || undefined;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is verplicht' },
        { status: 400 }
      );
    }

    // Get project with WooCommerce settings
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Check for WordPress credentials (WooCommerce gebruikt WordPress authenticatie)
    const wpUrl = project.wordpressUrl;
    const wpUsername = project.wordpressUsername;
    const wpPassword = project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      return NextResponse.json(
        { error: 'WordPress credentials niet gevonden. WooCommerce gebruikt de WordPress instellingen.' },
        { status: 400 }
      );
    }

    // Create WooCommerce client (gebruikt WordPress credentials)
    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    // Get products from WooCommerce
    console.log('🔍 Loading WooCommerce products with params:', {
      url: wpUrl,
      page,
      per_page: perPage,
      search,
    });
    
    const products = await wooClient.getProducts({
      page,
      per_page: perPage,
      search,
      orderby: 'date',
      order: 'desc',
    });

    console.log('📦 WooCommerce API returned:', {
      productsCount: products?.length || 0,
      isArray: Array.isArray(products),
      hasPagination: !!(products as any)._pagination,
      pagination: (products as any)._pagination,
      firstProduct: products?.[0] ? {
        id: products[0].id,
        name: products[0].name,
        type: products[0].type
      } : null
    });

    // Sync with local database
    if (products && products.length > 0) {
      for (const product of products) {
        if (product.id) {
          await prisma.wooCommerceProduct.upsert({
            where: {
              projectId_wooProductId: {
                projectId,
                wooProductId: product.id,
              },
            },
            create: {
              projectId,
              wooProductId: product.id,
              name: product.name,
              sku: product.sku || null,
              price: product.price || '0',
              stockStatus: product.stock_status || 'instock',
              importSource: 'existing',
            },
            update: {
              name: product.name,
              price: product.price || '0',
              stockStatus: product.stock_status || 'instock',
            },
          });
        }
      }
    }

    // Transform products for frontend
    const transformedProducts = products.map((product: any) => ({
      id: product.id,
      name: product.name,
      type: product.type,
      status: product.status,
      price: product.price,
      regularPrice: product.regular_price,
      salePrice: product.sale_price,
      stockStatus: product.stock_status,
      stockQuantity: product.stock_quantity,
      sku: product.sku,
      categories: product.categories,
      tags: product.tags,
      images: product.images,
      description: product.description,
      shortDescription: product.short_description,
      externalUrl: product.external_url,
      buttonText: product.button_text,
      permalink: product.permalink,
      dateCreated: product.date_created,
      dateModified: product.date_modified,
    }));

    // Extract pagination from products array
    const pagination = (products as any)._pagination || {
      totalPages: 1,
      total: transformedProducts.length,
      currentPage: page,
    };

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination,
    });
  } catch (error: any) {
    console.error('Error loading products from WooCommerce:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij laden van WooCommerce producten' },
      { status: 500 }
    );
  }
}
