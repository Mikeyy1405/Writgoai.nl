/**
 * Site Manager API - Individual Item Operations
 * GET, PUT, DELETE operations voor specifieke WordPress/WooCommerce items
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient, getWooCommerceConfig } from '@/lib/woocommerce-api';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/client/site-manager/[id]
 * Haal specifiek item op
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'post';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get project and WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email }
      },
      include: {
        client: {
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
    const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
    const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie ontbreekt' 
      }, { status: 400 });
    }

    const itemId = parseInt(params.id);

    if (type === 'product') {
      const wooConfig = getWooCommerceConfig(project);
      if (!wooConfig) {
        return NextResponse.json({ error: 'WooCommerce niet geconfigureerd' }, { status: 400 });
      }

      const wooClient = createWooCommerceClient(wooConfig);
      const product = await wooClient.getProduct(itemId);

      return NextResponse.json({
        item: {
          id: product.id,
          type: 'product',
          title: product.name,
          content: product.description || '',
          excerpt: product.short_description || '',
          status: product.status,
          price: product.price || product.regular_price,
          salePrice: product.sale_price,
          stockStatus: product.stock_status,
          stockQuantity: product.stock_quantity,
          sku: product.sku,
          categories: product.categories,
          images: product.images,
        }
      });
    } else {
      const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
      const endpoint = type === 'post' ? 'posts' : 'pages';
      const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${itemId}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress API fout: ${response.status}`);
      }

      const data = await response.json();

      return NextResponse.json({
        item: {
          id: data.id,
          type: type,
          title: data.title.rendered,
          content: data.content.rendered,
          excerpt: data.excerpt.rendered,
          status: data.status,
          link: data.link,
          date: data.date,
          modified: data.modified,
        }
      });
    }

  } catch (error: any) {
    console.error('Error in GET:', error);
    return NextResponse.json({ 
      error: 'Fout bij ophalen item',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT /api/client/site-manager/[id]
 * Update item naar WordPress
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, type, data } = body;

    if (!projectId || !type) {
      return NextResponse.json({ 
        error: 'Project ID en type zijn verplicht' 
      }, { status: 400 });
    }

    // Get project and WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email }
      },
      include: {
        client: {
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
    const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
    const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie ontbreekt' 
      }, { status: 400 });
    }

    const itemId = parseInt(params.id);

    if (type === 'product') {
      const wooConfig = getWooCommerceConfig(project);
      if (!wooConfig) {
        return NextResponse.json({ error: 'WooCommerce niet geconfigureerd' }, { status: 400 });
      }

      const wooClient = createWooCommerceClient(wooConfig);
      
      const updateData: any = {};
      if (data.title) updateData.name = data.title;
      if (data.content) updateData.description = data.content;
      if (data.excerpt) updateData.short_description = data.excerpt;
      if (data.status) updateData.status = data.status;
      if (data.price) updateData.regular_price = data.price;
      if (data.sale_price) updateData.sale_price = data.sale_price;
      if (data.stock_quantity !== undefined) updateData.stock_quantity = data.stock_quantity;

      const updatedProduct = await wooClient.updateProduct(itemId, updateData);

      return NextResponse.json({
        success: true,
        message: 'Product bijgewerkt',
        item: updatedProduct
      });
    } else {
      const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
      const endpoint = type === 'post' ? 'posts' : 'pages';
      const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${itemId}`;

      const updateData: any = {};
      if (data.title) updateData.title = data.title;
      if (data.content) updateData.content = data.content;
      if (data.excerpt) updateData.excerpt = data.excerpt;
      if (data.status) updateData.status = data.status;
      if (data.meta_description) {
        updateData.meta = {
          _yoast_wpseo_metadesc: data.meta_description
        };
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`WordPress API fout: ${response.status}`);
      }

      const updatedData = await response.json();

      return NextResponse.json({
        success: true,
        message: `${type} bijgewerkt`,
        item: updatedData
      });
    }

  } catch (error: any) {
    console.error('Error in PUT:', error);
    return NextResponse.json({ 
      error: 'Fout bij updaten item',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/client/site-manager/[id]
 * Verwijder item
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'post';
    const force = searchParams.get('force') === 'true';

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Get project and WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        client: { email: session.user.email }
      },
      include: {
        client: {
          select: {
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    const wordpressUrl = project.wordpressUrl || project.client.wordpressUrl;
    const wordpressUsername = project.wordpressUsername || project.client.wordpressUsername;
    const wordpressPassword = project.wordpressPassword || project.client.wordpressPassword;

    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      return NextResponse.json({ 
        error: 'WordPress configuratie ontbreekt' 
      }, { status: 400 });
    }

    const itemId = parseInt(params.id);

    if (type === 'product') {
      const wooConfig = getWooCommerceConfig(project);
      if (!wooConfig) {
        return NextResponse.json({ error: 'WooCommerce niet geconfigureerd' }, { status: 400 });
      }

      const wooClient = createWooCommerceClient(wooConfig);
      await wooClient.deleteProduct(itemId, force);

      return NextResponse.json({
        success: true,
        message: 'Product verwijderd'
      });
    } else {
      const auth = Buffer.from(`${wordpressUsername}:${wordpressPassword}`).toString('base64');
      const endpoint = type === 'post' ? 'posts' : 'pages';
      const apiUrl = `${wordpressUrl}/wp-json/wp/v2/${endpoint}/${itemId}?force=${force}`;

      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`WordPress API fout: ${response.status}`);
      }

      return NextResponse.json({
        success: true,
        message: `${type} verwijderd`
      });
    }

  } catch (error: any) {
    console.error('Error in DELETE:', error);
    return NextResponse.json({ 
      error: 'Fout bij verwijderen item',
      details: error.message 
    }, { status: 500 });
  }
}
