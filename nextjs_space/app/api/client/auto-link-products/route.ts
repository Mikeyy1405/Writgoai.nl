
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { bulkAddAutoLinkProducts } from '@/lib/auto-link-products';

export const dynamic = 'force-dynamic';

// GET - Get all auto-link products for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const products = await prisma.autoLinkProduct.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching auto-link products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Add auto-link products (single or bulk)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, products } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Handle bulk or single product
    let result;
    if (Array.isArray(products)) {
      // Bulk add
      result = await bulkAddAutoLinkProducts(projectId, products);
      return NextResponse.json({ 
        success: true, 
        count: result,
        message: `${result} producten toegevoegd` 
      });
    } else {
      // Single product add
      const product = await prisma.autoLinkProduct.create({
        data: {
          projectId,
          productName: products.productName,
          searchTerm: products.searchTerm,
          ean: products.ean,
          linkType: products.linkType || 'inline',
          enabled: true,
        },
      });

      return NextResponse.json({ success: true, product });
    }
  } catch (error) {
    console.error('Error adding auto-link products:', error);
    return NextResponse.json(
      { error: 'Failed to add products' },
      { status: 500 }
    );
  }
}

// PATCH - Update an auto-link product
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, ...updates } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.autoLinkProduct.findFirst({
      where: {
        id: productId,
        project: {
          clientId: session.user.id,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.autoLinkProduct.update({
      where: { id: productId },
      data: updates,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Error updating auto-link product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an auto-link product
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify ownership
    const product = await prisma.autoLinkProduct.findFirst({
      where: {
        id: productId,
        project: {
          clientId: session.user.id,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.autoLinkProduct.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting auto-link product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
