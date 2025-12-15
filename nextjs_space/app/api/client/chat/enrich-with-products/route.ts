
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { findBestProducts, quickProductSearch } from '@/lib/bolcom-product-finder';
import { generateProductBoxHTML } from '@/lib/affiliate-display-html';
import type { BolcomCredentials } from '@/lib/bolcom-api';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Enrich content with Bol.com products
 * POST /api/client/chat/enrich-with-products
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
    const { content, searchQuery, templateId } = body;

    if (!content || !searchQuery) {
      return NextResponse.json(
        { error: 'Content en searchQuery zijn verplicht' },
        { status: 400 }
      );
    }

    // Get Bol.com credentials
    const authSecretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config/abacusai_auth_secrets.json');
    let credentials: BolcomCredentials | null = null;

    try {
      const authSecrets = JSON.parse(fs.readFileSync(authSecretsPath, 'utf-8'));
      if (authSecrets['bol.com']?.secrets) {
        const bolSecrets = authSecrets['bol.com'].secrets;
        credentials = {
          clientId: bolSecrets.client_id?.value || '',
          clientSecret: bolSecrets.client_secret?.value || '',
          affiliateId: '50638', // Default affiliate ID
        };
      }
    } catch (error) {
      console.error('Could not load Bol.com credentials:', error);
    }

    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return NextResponse.json(
        { error: 'Bol.com API credentials niet geconfigureerd' },
        { status: 400 }
      );
    }

    console.log('🔍 Zoeken naar producten voor:', searchQuery);

    // Determine number of products based on template
    let maxProducts = 3;
    if (templateId === 'top-10') {
      maxProducts = 5;
    } else if (templateId === 'product-review') {
      maxProducts = 3;
    } else if (templateId === 'how-to') {
      maxProducts = 2;
    }

    // Search for products
    let products;
    try {
      // Use quickProductSearch for faster results
      products = await quickProductSearch(searchQuery, credentials, maxProducts);
      
      if (!products || products.length === 0) {
        console.log('⚠️ Geen producten gevonden');
        return NextResponse.json({
          enrichedContent: content,
          productsAdded: 0,
          message: 'Geen producten gevonden',
        });
      }

      console.log(`✅ ${products.length} producten gevonden`);
    } catch (error) {
      console.error('Error searching products:', error);
      return NextResponse.json({
        enrichedContent: content,
        productsAdded: 0,
        error: 'Fout bij zoeken naar producten',
      });
    }

    // Generate product boxes HTML
    let productsSectionHTML = '\n\n---\n\n## 🛒 Aanbevolen Producten\n\n';
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      const productData = {
        id: product.ean,
        title: product.title,
        price: `€${product.price.toFixed(2)}`,
        rating: product.rating,
        reviewCount: product.ratingCount,
        image: product.image.url,
        affiliateUrl: product.affiliateUrl,
        description: product.summary || product.description,
        pros: product.pros,
        cons: product.cons,
      };

      const productHTML = generateProductBoxHTML(productData);
      productsSectionHTML += productHTML + '\n\n';
      
      if (i < products.length - 1) {
        productsSectionHTML += '---\n\n'; // Separator between products
      }
    }

    // Insert products section before the conclusion/FAQ section
    let enrichedContent = content;
    
    // Try to find conclusion section
    const conclusionRegex = /(##\s*(Conclusie|Samenvatting|Eindconclusie|Tot slot|Afsluiting))/i;
    const faqRegex = /(##\s*(FAQ|Veelgestelde vragen|Frequently Asked Questions))/i;
    
    let insertPosition = -1;
    
    // Try conclusion first
    const conclusionMatch = enrichedContent.match(conclusionRegex);
    if (conclusionMatch && conclusionMatch.index !== undefined) {
      insertPosition = conclusionMatch.index;
    }
    
    // If no conclusion, try FAQ
    if (insertPosition === -1) {
      const faqMatch = enrichedContent.match(faqRegex);
      if (faqMatch && faqMatch.index !== undefined) {
        insertPosition = faqMatch.index;
      }
    }
    
    // Insert products section
    if (insertPosition !== -1) {
      enrichedContent = 
        enrichedContent.slice(0, insertPosition) +
        productsSectionHTML +
        enrichedContent.slice(insertPosition);
    } else {
      // No specific section found, append at the end
      enrichedContent += productsSectionHTML;
    }

    console.log(`✅ ${products.length} producten toegevoegd aan content`);

    return NextResponse.json({
      enrichedContent,
      productsAdded: products.length,
      products: products.map(p => ({
        title: p.title,
        price: p.price,
        url: p.affiliateUrl,
      })),
    });
  } catch (error: any) {
    console.error('Error enriching content with products:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij verrijken van content' },
      { status: 500 }
    );
  }
}
