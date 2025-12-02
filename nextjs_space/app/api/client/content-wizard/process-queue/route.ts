import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import fs from 'fs';

const AUTH_SECRETS_PATH = '/home/ubuntu/.config/abacusai_auth_secrets.json';

function getSecrets() {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_SECRETS_PATH, 'utf-8'));
    return {
      aimlApiKey: data?.['aiml api']?.secrets?.api_key?.value || null,
      bolcomClientId: data?.['bol.com']?.secrets?.client_id?.value || null,
      bolcomClientSecret: data?.['bol.com']?.secrets?.client_secret?.value || null,
    };
  } catch {
    return { aimlApiKey: null, bolcomClientId: null, bolcomClientSecret: null };
  }
}

async function searchBolcomProducts(query: string, clientId: string, clientSecret: string, affiliateId: string): Promise<any[]> {
  try {
    // Get access token
    const authResponse = await fetch('https://login.bol.com/token?grant_type=client_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!authResponse.ok) return [];
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    // Search products
    const searchResponse = await fetch(
      `https://api.bol.com/retailer/products/list?q=${encodeURIComponent(query)}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.retailer.v10+json'
        }
      }
    );
    
    if (!searchResponse.ok) return [];
    
    const searchData = await searchResponse.json();
    const products = searchData.products || [];
    
    return products.slice(0, 3).map((product: any) => ({
      title: product.title || product.name,
      price: product.offerData?.offers?.[0]?.priceAmount || 'Prijs op aanvraag',
      rating: product.rating || 0,
      url: `https://partner.bol.com/click/click?p=1&t=url&s=${affiliateId}&url=https://www.bol.com/nl/p/-/${product.ean}/`,
      ean: product.ean,
      description: product.shortDescription || ''
    }));
  } catch (error) {
    console.error('Bol.com search error:', error);
    return [];
  }
}

async function generateArticle(
  item: any, 
  apiKey: string, 
  bolcomProducts: any[],
  project: any
): Promise<{ content: string; metaDescription: string; excerpt: string }> {
  
  // Build product section for reviews/listicles
  let productSection = '';
  if (bolcomProducts.length > 0 && (item.type === 'review' || item.type === 'listicle' || item.type === 'comparison')) {
    productSection = `\n\nBOL.COM PRODUCTEN OM TE INTEGREREN:\n${bolcomProducts.map((p, i) => 
      `${i + 1}. ${p.title}\n   Prijs: €${p.price}\n   Rating: ${p.rating}/5\n   Link: ${p.url}`
    ).join('\n\n')}`;
  }
  
  // Get internal links from project
  let internalLinksSection = '';
  if (project?.sitemap && typeof project.sitemap === 'object') {
    const sitemap = project.sitemap as any;
    const urls = sitemap.urls?.slice(0, 10) || [];
    const titles = sitemap.titles?.slice(0, 10) || [];
    if (urls.length > 0) {
      internalLinksSection = `\n\nINTERNE LINKS OM TE GEBRUIKEN (kies 2-3 relevante):\n${urls.map((url: string, i: number) => 
        `- ${titles[i] || 'Pagina'}: ${url}`
      ).join('\n')}`;
    }
  }
  
  const typeInstructions: Record<string, string> = {
    'pillar': 'Dit is een PILLAR PAGE - een uitgebreide, authoritative gids over het hoofdonderwerp. Maak het 2500-3500 woorden met duidelijke secties.',
    'cluster': 'Dit is een CLUSTER ARTIKEL - ondersteunend artikel dat linkt naar de pillar page. Maak het 1200-1800 woorden.',
    'listicle': 'Dit is een LIJSTJE artikel ("Beste X", "Top 10") - rangschik producten met voor- en nadelen. Integreer de Bol.com producten met affiliate links. Maak het 1500-2000 woorden.',
    'review': 'Dit is een REVIEW artikel - diepgaande productreview. Integreer het Bol.com product met affiliate link. Maak het 1200-1800 woorden.',
    'comparison': 'Dit is een VERGELIJKING artikel - vergelijk meerdere producten. Gebruik de Bol.com producten. Maak het 1500-2000 woorden.',
    'how-to': 'Dit is een HOW-TO artikel - stap-voor-stap handleiding. Maak het 1000-1500 woorden met genummerde stappen.',
    'guide': 'Dit is een GUIDE/GIDS - informatief artikel voor beginners. Maak het 1200-1800 woorden.',
    'blog': 'Dit is een BLOG artikel - informatief en engaging. Maak het 1000-1500 woorden.'
  };
  
  const prompt = `Schrijf een compleet, SEO-geoptimaliseerd artikel in het Nederlands.

TITEL: ${item.title}
TYPE: ${item.type}
KEYWORDS: ${item.keywords?.join(', ') || ''}
CATEGORIE: ${item.category}
ZOEKINTENTIE: ${item.searchIntent}

${typeInstructions[item.type] || typeInstructions['blog']}
${productSection}
${internalLinksSection}

VEREISTEN:
1. Begin DIRECT met de inhoud, geen "Hier is je artikel" of andere introductie
2. Gebruik H2 en H3 koppen voor structuur
3. Schrijf in een vriendelijke, deskundige toon
4. ${bolcomProducts.length > 0 ? 'VERPLICHT: Integreer de Bol.com producten met hun affiliate links in de tekst' : ''}
5. ${internalLinksSection ? 'Voeg 2-3 interne links toe waar relevant' : ''}
6. Eindig met een sterke conclusie/samenvatting
7. Maak het artikel minimaal ${item.estimatedWords || 1200} woorden
8. Gebruik bullet points en lijstjes waar gepast
9. Voeg een korte FAQ sectie toe met 3-4 veelgestelde vragen

OUTPUT FORMAT:
Begin direct met de content in Markdown format.`;
  
  const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    throw new Error('AI generation failed');
  }
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  // Generate meta description
  const metaPrompt = `Schrijf een SEO meta description (max 155 karakters) voor dit artikel:\n\nTitel: ${item.title}\nKeywords: ${item.keywords?.join(', ')}\n\nGeef alleen de meta description, geen extra tekst.`;
  
  const metaResponse = await fetch('https://api.aimlapi.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: metaPrompt }],
      max_tokens: 200,
      temperature: 0.5
    })
  });
  
  const metaData = await metaResponse.json();
  const metaDescription = metaData.choices?.[0]?.message?.content?.trim() || '';
  
  // Generate excerpt
  const excerpt = content.split('\n\n')[0]?.replace(/^#+ /gm, '').substring(0, 200) + '...';
  
  return { content, metaDescription, excerpt };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { clientId, limit = 5 } = body;
    
    // Verify client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email }
    });
    
    if (!client || (clientId && client.id !== clientId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const secrets = getSecrets();
    if (!secrets.aimlApiKey) {
      return NextResponse.json({ error: 'AI configuratie niet gevonden' }, { status: 500 });
    }
    
    // Get queued items
    const queuedItems = await prisma.contentQueue.findMany({
      where: {
        clientId: client.id,
        status: { in: ['queued', 'scheduled'] },
        scheduledFor: { lte: new Date() }
      },
      orderBy: [{ priority: 'desc' }, { position: 'asc' }],
      take: limit
    });
    
    if (queuedItems.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'Geen items in queue' });
    }
    
    let processed = 0;
    const errors: string[] = [];
    
    for (const item of queuedItems) {
      try {
        // Mark as processing
        await prisma.contentQueue.update({
          where: { id: item.id },
          data: { status: 'processing' }
        });
        
        // Get project if available
        let project = null;
        if (item.projectId) {
          project = await prisma.project.findUnique({
            where: { id: item.projectId }
          });
        }
        
        // Search Bol.com products if enabled and productKeyword exists
        let bolcomProducts: any[] = [];
        if (item.bolcomEnabled && item.productKeyword && secrets.bolcomClientId && secrets.bolcomClientSecret) {
          bolcomProducts = await searchBolcomProducts(
            item.productKeyword,
            secrets.bolcomClientId,
            secrets.bolcomClientSecret,
            item.bolcomAffiliateId || ''
          );
        }
        
        // Generate article
        const { content, metaDescription, excerpt } = await generateArticle(
          item,
          secrets.aimlApiKey,
          bolcomProducts,
          project
        );
        
        // Calculate word count
        const wordCount = content.split(/\s+/).length;
        
        // Save to content library
        const savedContent = await prisma.savedContent.create({
          data: {
            clientId: client.id,
            projectId: item.projectId,
            title: item.title,
            type: item.type,
            content,
            metaDesc: metaDescription,
            description: excerpt,
            keywords: item.keywords,
            category: item.category,
            wordCount,
            language: 'NL'
          }
        });
        
        // Update queue item
        await prisma.contentQueue.update({
          where: { id: item.id },
          data: { 
            status: 'completed',
            completedAt: new Date(),
            savedContentId: savedContent.id
          }
        });
        
        // Auto-publish to WordPress if enabled
        if (item.autoPublish && project?.wordpressUrl && project?.wordpressUsername && project?.wordpressPassword) {
          try {
            const wpResponse = await fetch(`${project.wordpressUrl}/wp-json/wp/v2/posts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${project.wordpressUsername}:${project.wordpressPassword}`).toString('base64')}`
              },
              body: JSON.stringify({
                title: item.title,
                content,
                excerpt,
                status: 'publish'
              })
            });
            
            if (wpResponse.ok) {
              const wpData = await wpResponse.json();
              await prisma.savedContent.update({
                where: { id: savedContent.id },
                data: { 
                  publishedUrl: wpData.link,
                  publishedAt: new Date()
                }
              });
            }
          } catch (wpError) {
            console.error('WordPress publish error:', wpError);
          }
        }
        
        processed++;
        
      } catch (error: any) {
        console.error(`Error processing item ${item.id}:`, error);
        errors.push(`${item.title}: ${error.message}`);
        
        await prisma.contentQueue.update({
          where: { id: item.id },
          data: { 
            status: 'failed',
            errorMessage: error.message
          }
        });
      }
    }
    
    // Check if there are more items to process
    const remainingItems = await prisma.contentQueue.count({
      where: {
        clientId: client.id,
        status: { in: ['queued', 'scheduled'] },
        scheduledFor: { lte: new Date() }
      }
    });
    
    // If bulk mode and more items, continue processing
    if (remainingItems > 0) {
      // Schedule next batch
      setTimeout(async () => {
        try {
          await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/client/content-wizard/process-queue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: client.id, limit: 3 })
          });
        } catch (e) {
          console.error('Failed to trigger next batch:', e);
        }
      }, 5000);
    }
    
    return NextResponse.json({
      success: true,
      processed,
      remaining: remainingItems,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error: any) {
    console.error('Error processing queue:', error);
    return NextResponse.json(
      { error: error.message || 'Processing failed' },
      { status: 500 }
    );
  }
}
