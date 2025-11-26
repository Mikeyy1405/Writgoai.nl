
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { createWooCommerceClient } from '@/lib/woocommerce-api';

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

    const { projectId } = await req.json();

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

    console.log('🔍 Testing WooCommerce connection (via WordPress):', {
      projectId,
      projectName: project.name,
      hasUrl: !!wpUrl,
      hasUsername: !!wpUsername,
      hasPassword: !!wpPassword,
      url: wpUrl ? wpUrl.substring(0, 30) + '...' : 'NOT SET',
    });

    if (!wpUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'WordPress URL niet ingesteld',
          details: 'Ga naar Project Instellingen en voer een WordPress URL in. WooCommerce gebruikt de WordPress credentials.',
        },
        { status: 400 }
      );
    }

    if (!wpUsername || !wpPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'WordPress credentials niet ingesteld',
          details: 'Ga naar Project Instellingen en voer WordPress username en password (of application password) in.',
        },
        { status: 400 }
      );
    }

    // Create WooCommerce client (gebruikt WordPress credentials)
    const wooClient = createWooCommerceClient({
      url: wpUrl,
      username: wpUsername,
      password: wpPassword,
    });

    // Test connection and get store info
    try {
      const connectionTest = await wooClient.testConnection();
      
      if (!connectionTest.success) {
        console.error('❌ WooCommerce connection failed:', connectionTest.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Kan geen verbinding maken met WooCommerce',
            details: connectionTest.message,
          },
          { status: 400 }
        );
      }

      // Try to get products
      const products = await wooClient.getProducts({ per_page: 5 });
      
      console.log('✅ WooCommerce connection successful:', {
        storeInfo: connectionTest.storeInfo,
        productsCount: products?.length || 0,
      });

      return NextResponse.json({
        success: true,
        message: 'WooCommerce verbinding succesvol!',
        storeInfo: connectionTest.storeInfo,
        productsFound: products?.length || 0,
        sampleProduct: products?.[0] ? {
          id: products[0].id,
          name: products[0].name,
          type: products[0].type,
        } : null,
      });
    } catch (error: any) {
      console.error('❌ WooCommerce API error:', error);
      
      // Check if it's a 401/403 error
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authenticatie fout',
            details: 'Je WordPress username en/of password zijn incorrect. Probeer een Application Password aan te maken in WordPress.',
          },
          { status: 400 }
        );
      }

      // Check if it's a 404 error
      if (error.message.includes('404')) {
        return NextResponse.json(
          {
            success: false,
            error: 'WooCommerce REST API niet gevonden',
            details: 'De WooCommerce REST API is niet beschikbaar op deze URL. Controleer of WooCommerce correct is geïnstalleerd.',
          },
          { status: 400 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: 'Onbekende fout',
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Test connection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Fout bij testen van verbinding',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
