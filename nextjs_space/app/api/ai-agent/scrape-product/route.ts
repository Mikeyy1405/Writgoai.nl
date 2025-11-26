

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';

// AI-powered product info extraction (intelligent fallback for protected websites)
async function extractProductInfoWithAI(url: string) {
  try {
    const aiResponse = await fetch(`${AIML_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Je bent een product data extractor. Analyseer de product URL en geef actuele product informatie terug op basis van de URL en jouw meest recente kennis.

Geef ALLEEN een JSON object terug met dit formaat:
{
  "name": "Product naam",
  "price": "€XX.XX",
  "description": "Gedetailleerde product beschrijving",
  "image": "",
  "rating": "4.5/5"
}

Gebruik je kennis om actuele prijzen en productinformatie te geven. Als je geen afbeelding URL hebt, laat dan leeg.
Geen extra tekst, alleen JSON.`
          },
          {
            role: 'user',
            content: `Extract actuele product informatie voor deze URL: ${url}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI extraction failed');
    }

    const data = await aiResponse.json();
    let content = data.choices[0].message.content.trim();
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const productInfo = JSON.parse(content);
    
    return productInfo;
  } catch (error) {
    // Return minimal info based on URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
    const productName = pathParts[pathParts.length - 1]
      ?.replace(/-/g, ' ')
      ?.replace(/_/g, ' ')
      ?.substring(0, 50) || 'Product';
    
    return {
      name: productName,
      price: '',
      description: `Product van ${urlObj.hostname}`,
      image: '',
      rating: ''
    };
  }
}

// Simple HTML scraping function
async function scrapeProductInfo(url: string) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    // Enhanced browser-like headers to avoid blocking
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0',
        'DNT': '1',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract product information using regex patterns
    const productInfo: any = {
      name: '',
      price: '',
      description: '',
      image: '',
      rating: ''
    };

    // Extract title/name - try multiple patterns
    const titlePatterns = [
      /<h1[^>]*data-test="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<h1[^>]*class="[^"]*page-heading[^"]*"[^>]*>([^<]+)<\/h1>/i,
      /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /<title[^>]*>([^<]+)<\/title>/i
    ];

    for (const pattern of titlePatterns) {
      const titleMatch = html.match(pattern);
      if (titleMatch) {
        productInfo.name = titleMatch[1].trim()
          .replace(/\s*-\s*bol\.com$/i, '')
          .replace(/\s*\|\s*.*$/i, '')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .substring(0, 100);
        if (productInfo.name.length > 5) {
          break;
        }
      }
    }

    // Extract price - multiple patterns for different formats
    const pricePatterns = [
      // Bol.com specific patterns
      /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
      /data-test="[^"]*price[^"]*"[^>]*>.*?€?\s*(\d+[\.,]\d{2})/i,
      // Generic patterns
      /["']price["']:\s*["']?(\d+[\.,]\d{2})["']?/i,
      /€\s*(\d+[\.,]\d{2})/,
      /<[^>]*class="[^"]*price[^"]*"[^>]*>.*?(\d+[\.,]\d{2})/is,
      /\bprice["\s:]+.*?(\d+[\.,]\d{2})/i
    ];

    for (const pattern of pricePatterns) {
      const priceMatch = html.match(pattern);
      if (priceMatch) {
        const priceValue = priceMatch[1].replace(',', '.');
        productInfo.price = priceValue.includes('€') ? priceValue : '€' + priceValue;
        break;
      }
    }

    // Extract description
    const descPatterns = [
      /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
      /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
      /<div[^>]*data-test="[^"]*description[^"]*"[^>]*>([^<]+)<\/div>/i,
      /<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i
    ];

    for (const pattern of descPatterns) {
      const descMatch = html.match(pattern);
      if (descMatch) {
        productInfo.description = descMatch[1].trim()
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .substring(0, 250);
        if (productInfo.description.length > 10) {
          break;
        }
      }
    }

    // Extract image - with specific patterns for common stores
    const imagePatterns = [
      // Bol.com specific - media.s-bol.com images
      /<img[^>]*src="(https:\/\/media\.s-bol\.com\/[^"]+)"/i,
      /<img[^>]*id="[^"]*zoom[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*data-test="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      // Generic patterns
      /<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i,
      /<img[^>]*class="[^"]*product[^"]*"[^>]*src="([^"]+)"/i,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*product[^"]*"/i,
      // Any large image
      /<img[^>]*src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i
    ];

    for (const pattern of imagePatterns) {
      const imageMatch = html.match(pattern);
      if (imageMatch) {
        let imgUrl = imageMatch[1];
        // Ensure absolute URL
        if (imgUrl.startsWith('//')) {
          imgUrl = 'https:' + imgUrl;
        } else if (imgUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imgUrl = urlObj.origin + imgUrl;
        }
        productInfo.image = imgUrl;
        break;
      }
    }

    // Extract rating
    const ratingPatterns = [
      // Bol.com specific
      /<meta[^>]*property="product:rating:value"[^>]*content="([^"]+)"/i,
      /data-test="[^"]*rating[^"]*"[^>]*>.*?(\d+\.?\d*)/i,
      // Generic patterns
      /["']ratingValue["']:\s*["']?(\d+\.?\d*)["']?/i,
      /(\d+\.?\d*)\s*\/\s*5/i,
      /<[^>]*class="[^"]*rating[^"]*"[^>]*>.*?(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*(?:van|out of)\s*5\s*(?:sterren|stars)/i
    ];

    for (const pattern of ratingPatterns) {
      const ratingMatch = html.match(pattern);
      if (ratingMatch) {
        const ratingValue = parseFloat(ratingMatch[1]);
        if (ratingValue >= 0 && ratingValue <= 5) {
          productInfo.rating = ratingValue.toFixed(1) + '/5';
          break;
        }
      }
    }

    return productInfo;
  } catch (error: any) {
    const errorMessage = error.name === 'AbortError' 
      ? 'Timeout' 
      : error.message || 'Scraping blocked';
    throw new Error(errorMessage);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    let productInfo;
    let method = 'scraping';
    let statusMessage = '';
    
    // Try direct scraping first
    try {
      productInfo = await scrapeProductInfo(url);
      
      // If scraping succeeded but got minimal data, try AI
      if (!productInfo.name || productInfo.name.length < 3) {
        throw new Error('Minimal data from scraping');
      }
      
      statusMessage = 'Direct scraping succesvol';
    } catch (scrapingError: any) {
      // Website blocks direct scraping - use smart AI extraction instead
      try {
        productInfo = await extractProductInfoWithAI(url);
        method = 'ai';
        statusMessage = 'AI extractie gebruikt (actuele productdata)';
      } catch (aiError: any) {
        // Last resort: return basic info from URL (ALWAYS succeeds)
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p.length > 0);
        const productName = pathParts[pathParts.length - 1]
          ?.replace(/-/g, ' ')
          ?.replace(/_/g, ' ')
          ?.substring(0, 100) || 'Product';
        
        productInfo = {
          name: productName.charAt(0).toUpperCase() + productName.slice(1),
          price: '',
          description: `Product van ${urlObj.hostname}. Vul handmatig aan met productdetails.`,
          image: '',
          rating: ''
        };
        method = 'url-parsing';
        statusMessage = 'Basis productinfo - handmatige invoer aanbevolen';
      }
    }

    return NextResponse.json({
      success: true,
      data: productInfo,
      method,
      status: statusMessage
    });
  } catch (error: any) {
    console.error('Unexpected error in product scraper:', error);
    
    // Even in case of catastrophic failure, return something useful
    return NextResponse.json({
      success: true,
      data: {
        name: 'Product (handmatig invoeren)',
        price: '',
        description: 'Vul productinformatie handmatig in.',
        image: '',
        rating: ''
      },
      method: 'manual',
      status: 'Handmatige invoer vereist'
    });
  }
}
