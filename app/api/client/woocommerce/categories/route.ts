

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

/**
 * GET /api/client/woocommerce/categories
 * Load WooCommerce product categories
 */
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

    // Get categories from WooCommerce
    console.log('🔍 Loading WooCommerce categories for project:', projectId);
    
    const categories = await wooClient.getCategories({
      per_page: 100,
      orderby: 'name',
      order: 'asc',
      hide_empty: false,
    });

    console.log('📦 WooCommerce categories loaded:', categories?.length || 0);

    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error: any) {
    console.error('Error loading categories from WooCommerce:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij laden van categorieën' },
      { status: 500 }
    );
  }
}

