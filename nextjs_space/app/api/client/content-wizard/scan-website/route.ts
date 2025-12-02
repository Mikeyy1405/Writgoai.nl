import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

// Function to fetch and parse sitemap
async function fetchSitemap(baseUrl: string): Promise<{ urls: string[]; titles: string[] }> {
  const urls: string[] = [];
  const titles: string[] = [];
  
  const sitemapUrls = [
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/post-sitemap.xml`,
    `${baseUrl}/page-sitemap.xml`,
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': 'WritGo Bot/1.0' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const text = await response.text();
        
        // Extract URLs from sitemap
        const locMatches = text.matchAll(/<loc>([^<]+)<\/loc>/g);
        for (const match of locMatches) {
          const url = match[1];
          if (!url.includes('sitemap') && !url.endsWith('.xml')) {
            urls.push(url);
            
            // Extract title from URL slug
            const path = new URL(url).pathname;
            const slug = path.split('/').filter(Boolean).pop() || '';
            const title = slug
              .replace(/-/g, ' ')
              .replace(/\d+/g, '')
              .trim();
            if (title) titles.push(title);
          }
        }
      }
    } catch (e) {
      // Continue to next sitemap URL
    }
  }
  
  return { urls, titles: [...new Set(titles)] };
}

// Function to detect niche from website content
async function detectNiche(url: string, existingTitles: string[]): Promise<string> {
  try {
    // Fetch homepage for meta tags
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WritGo Bot/1.0' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract meta description
      const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      const metaDesc = metaMatch ? metaMatch[1] : '';
      
      // Extract title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1] : '';
      
      // Combine all text for analysis
      const allText = `${pageTitle} ${metaDesc} ${existingTitles.join(' ')}`.toLowerCase();
      
      // Simple niche detection based on keywords
      const nicheKeywords: Record<string, string[]> = {
        'Technologie': ['laptop', 'computer', 'smartphone', 'tech', 'software', 'hardware', 'gaming', 'monitor', 'tablet'],
        'Gezondheid & Fitness': ['gezondheid', 'fitness', 'sport', 'voeding', 'dieet', 'workout', 'wellness', 'yoga'],
        'Financiën': ['geld', 'beleggen', 'sparen', 'financieel', 'hypotheek', 'verzekering', 'pensioen', 'crypto'],
        'Reizen': ['reizen', 'vakantie', 'hotel', 'vlucht', 'bestemming', 'travel', 'stedentrip'],
        'Huis & Tuin': ['huis', 'tuin', 'wonen', 'interieur', 'meubel', 'keuken', 'badkamer', 'verbouwen'],
        'Mode & Beauty': ['mode', 'kleding', 'beauty', 'makeup', 'skincare', 'fashion', 'schoenen'],
        'Food & Recepten': ['recept', 'koken', 'eten', 'food', 'restaurant', 'bakken', 'ingrediënt'],
        'Kinderen & Gezin': ['kinderen', 'baby', 'ouders', 'gezin', 'opvoeding', 'zwanger', 'speelgoed'],
        'Auto & Mobiliteit': ['auto', 'motor', 'fiets', 'elektrisch', 'transport', 'voertuig', 'rijden'],
        'Huisdieren': ['hond', 'kat', 'huisdier', 'voer', 'dier', 'puppy', 'kitten'],
        'Business & Marketing': ['marketing', 'business', 'ondernemen', 'sales', 'startup', 'seo', 'social media'],
        'Hobby & DIY': ['hobby', 'diy', 'knutselen', 'fotografie', 'muziek', 'kunst', 'creatief'],
      };
      
      let bestNiche = 'Algemeen';
      let maxScore = 0;
      
      for (const [niche, keywords] of Object.entries(nicheKeywords)) {
        const score = keywords.filter(kw => allText.includes(kw)).length;
        if (score > maxScore) {
          maxScore = score;
          bestNiche = niche;
        }
      }
      
      return bestNiche;
    }
  } catch (e) {
    console.error('Error detecting niche:', e);
  }
  
  return 'Algemeen';
}

// Function to suggest topics based on niche
function suggestTopics(niche: string): string[] {
  const topicSuggestions: Record<string, string[]> = {
    'Technologie': [
      'Beste laptops', 'Smartphone vergelijking', 'Gaming accessoires', 
      'Software reviews', 'Tech nieuws', 'Gadget guides'
    ],
    'Gezondheid & Fitness': [
      'Workout routines', 'Voedingsadvies', 'Supplementen reviews',
      'Mentale gezondheid', 'Fitness apparatuur', 'Gezond afvallen'
    ],
    'Financiën': [
      'Beleggen voor beginners', 'Sparen tips', 'Hypotheek advies',
      'Verzekeringen vergelijken', 'Pensioen planning', 'Budgetteren'
    ],
    'Huis & Tuin': [
      'Interieur tips', 'Tuin onderhoud', 'DIY projecten',
      'Meubels kopen', 'Verbouwen', 'Smart home'
    ],
    'Reizen': [
      'Bestemmingen', 'Reistips', 'Hotel reviews',
      'Vliegtickets', 'Stedentrips', 'Camping guides'
    ],
    'Algemeen': [
      'How-to guides', 'Product reviews', 'Vergelijkingen',
      'Tips & tricks', 'Nieuws', 'Interviews'
    ]
  };
  
  return topicSuggestions[niche] || topicSuggestions['Algemeen'];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { websiteUrl, projectId } = body;
    
    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website URL is verplicht' }, { status: 400 });
    }
    
    // Normalize URL
    let normalizedUrl = websiteUrl.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    // Fetch sitemap
    const { urls, titles } = await fetchSitemap(normalizedUrl);
    
    // Detect niche
    const niche = await detectNiche(normalizedUrl, titles);
    
    // Get suggested topics
    const suggestedTopics = suggestTopics(niche);
    
    // Update project if provided
    if (projectId) {
      const client = await prisma.client.findUnique({
        where: { email: session.user.email }
      });
      
      if (client) {
        await prisma.project.updateMany({
          where: { 
            id: projectId,
            clientId: client.id
          },
          data: {
            sitemap: { urls, titles },
            sitemapScannedAt: new Date(),
            niche
          }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      niche,
      existingPages: urls.length,
      existingTitles: titles.slice(0, 50), // Limit to 50
      suggestedTopics
    });
    
  } catch (error: any) {
    console.error('Error scanning website:', error);
    return NextResponse.json(
      { error: error.message || 'Website scan mislukt' },
      { status: 500 }
    );
  }
}
