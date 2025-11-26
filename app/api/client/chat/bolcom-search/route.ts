
/**
 * Bol.com Product Search for Chat (simplified version)
 * Uses general Bol.com credentials from auth secrets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

interface BolProduct {
  id: string;
  title: string;
  summary?: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  rating?: number;
  inStock?: boolean;
}

// Read Bol.com credentials from auth secrets (server-side only)
function getBolcomCredentials() {
  try {
    if (typeof window !== 'undefined') return null;
    
    const fs = require('fs');
    const path = require('path');
    const secretsPath = path.join(process.env.HOME || '/home/ubuntu', '.config', 'abacusai_auth_secrets.json');
    const secretsData = fs.readFileSync(secretsPath, 'utf-8');
    const secrets = JSON.parse(secretsData);
    
    if (secrets['bol.com']?.secrets) {
      const bolSecrets = secrets['bol.com'].secrets;
      return {
        clientId: bolSecrets.client_id?.value,
        clientSecret: bolSecrets.client_secret?.value,
      };
    }
  } catch (error) {
    console.error('Error reading Bol.com credentials:', error);
  }
  return null;
}

// Get OAuth token from Bol.com
async function getBolcomToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get Bol.com access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Search products on Bol.com
async function searchBolcomProducts(query: string, token: string, maxResults: number = 10): Promise<BolProduct[]> {
  const response = await fetch(`https://api.bol.com/retailer/marketing/products?q=${encodeURIComponent(query)}&limit=${maxResults}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search products on Bol.com');
  }

  const data = await response.json();
  
  // Transform Bol.com response to our format
  return (data.results || [])
    .filter((item: any) => item.inStock !== false)
    .map((item: any) => ({
      id: String(item.bolProductId || item.ean),
      title: item.title,
      summary: item.description?.substring(0, 150),
      price: item.offer?.price ? `€${item.offer.price.toFixed(2)}` : 'Prijs onbekend',
      imageUrl: item.image?.url || '',
      productUrl: item.url || `https://www.bol.com/nl/p/${item.bolProductId}`,
      rating: item.rating,
      inStock: item.inStock !== false,
    }));
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Zoekterm is vereist' },
        { status: 400 }
      );
    }

    // Get Bol.com credentials
    const credentials = getBolcomCredentials();
    if (!credentials || !credentials.clientId || !credentials.clientSecret) {
      return NextResponse.json(
        { error: 'Bol.com credentials niet beschikbaar' },
        { status: 500 }
      );
    }

    console.log('🔍 Searching Bol.com products:', query);

    // Get access token
    const token = await getBolcomToken(credentials.clientId, credentials.clientSecret);

    // Search products
    const products = await searchBolcomProducts(query, token, 20);

    console.log(`✅ Found ${products.length} products`);

    return NextResponse.json({
      success: true,
      products,
    });

  } catch (error: any) {
    console.error('Bol.com search error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij zoeken naar producten' },
      { status: 500 }
    );
  }
}
