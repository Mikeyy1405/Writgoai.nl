

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import aimlAPI from '@/lib/aiml-api';
import { prisma } from '@/lib/db';


// Analyze URL and generate title
async function analyzeUrl(url: string): Promise<{ title: string; description: string; category: string }> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // Generate title using AI
    const prompt = `Analyseer deze affiliate URL en genereer:
1. Een korte, beschrijvende titel (max 50 tekens)
2. Een korte beschrijving (1-2 zinnen)
3. Een categorie (bijv. "Product", "Service", "Software")

URL: ${url}
Domein: ${domain}
Path: ${pathParts.join(' / ')}

Antwoord in dit exacte JSON formaat:
{
  "title": "Beschrijvende titel hier",
  "description": "Korte beschrijving hier",
  "category": "Categorie hier"
}`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het analyseren van URLs en het genereren van beschrijvende metadata. Antwoord altijd in geldig JSON formaat.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const content = response.choices[0].message.content.trim();
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || domain,
        description: parsed.description || '',
        category: parsed.category || 'Algemeen',
      };
    }
    
    // Fallback
    return {
      title: domain,
      description: `Affiliate link voor ${domain}`,
      category: 'Algemeen',
    };
  } catch (error) {
    console.error('[Affiliate Links] Error analyzing URL:', error);
    
    // Simple fallback
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      return {
        title: domain,
        description: `Affiliate link voor ${domain}`,
        category: 'Algemeen',
      };
    } catch {
      return {
        title: 'Affiliate Link',
        description: '',
        category: 'Algemeen',
      };
    }
  }
}

// Generate keywords from URL and title
async function generateKeywords(url: string, title: string, category: string): Promise<string[]> {
  try {
    const prompt = `Genereer 3-5 relevante Nederlandse keywords voor deze affiliate link.

URL: ${url}
Titel: ${title}
Categorie: ${category}

Return ALLEEN een komma-gescheiden lijst van keywords, niets anders.
Voorbeeld: yoga, meditatie, mindfulness, ontspanning`;

    const response = await aimlAPI.chatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een keyword extractie expert. Genereer relevante Nederlandse keywords.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    const keywords = response.choices[0].message.content
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 2)
      .slice(0, 5);

    return keywords.length > 0 ? keywords : [title.toLowerCase()];
  } catch (error) {
    console.error('[Affiliate Links] Error generating keywords:', error);
    return [title.toLowerCase()];
  }
}

// Extract URLs from text (one per line)
function extractUrls(text: string): string[] {
  const lines = text.split('\n');
  const urls: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to extract URL from the line
    const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
    if (urlMatch) {
      urls.push(urlMatch[1]);
    } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      urls.push(trimmed);
    }
  }

  return urls;
}

// POST - Bulk import affiliate links with progress updates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { urls: urlsInput } = body;

    if (!urlsInput || typeof urlsInput !== 'string') {
      return NextResponse.json({ error: 'URLs zijn verplicht' }, { status: 400 });
    }

    // Extract URLs from input
    const urls = extractUrls(urlsInput);

    if (urls.length === 0) {
      return NextResponse.json({ error: 'Geen geldige URLs gevonden' }, { status: 400 });
    }

    console.log(`[Bulk Import] Starting import of ${urls.length} URLs...`);

    // Get client's project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email as string },
      include: { projects: { take: 1 } },
    });

    if (!client || !client.projects[0]) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const projectId = client.projects[0].id;

    const results = {
      success: [] as any[],
      failed: [] as any[],
      total: urls.length,
    };

    // Process each URL with progress logging
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const progress = i + 1;
      
      console.log(`[Bulk Import] Processing ${progress}/${urls.length}: ${url.substring(0, 50)}...`);
      
      try {
        // Validate URL
        new URL(url);

        // Check for duplicates
        const existing = await prisma.affiliateLink.findFirst({
          where: {
            projectId,
            url,
          },
        });

        if (existing) {
          console.log(`[Bulk Import] ${progress}/${urls.length}: Duplicate found, skipping`);
          results.failed.push({
            url,
            error: 'Deze URL bestaat al',
          });
          continue;
        }

        console.log(`[Bulk Import] ${progress}/${urls.length}: Analyzing URL...`);
        // Analyze URL
        const analyzed = await analyzeUrl(url);
        
        console.log(`[Bulk Import] ${progress}/${urls.length}: Generating keywords...`);
        // Generate keywords
        const keywords = await generateKeywords(url, analyzed.title, analyzed.category);

        console.log(`[Bulk Import] ${progress}/${urls.length}: Saving to database...`);
        // Create affiliate link
        const affiliateLink = await prisma.affiliateLink.create({
          data: {
            projectId,
            url,
            anchorText: analyzed.title,
            description: analyzed.description || null,
            category: analyzed.category || null,
            keywords,
            isActive: true,
          },
        });

        console.log(`[Bulk Import] ${progress}/${urls.length}: ✓ Success - ${analyzed.title}`);
        results.success.push({
          id: affiliateLink.id,
          title: affiliateLink.anchorText,
          url: affiliateLink.url,
          category: affiliateLink.category,
        });
      } catch (error: any) {
        console.error(`[Bulk Import] ${progress}/${urls.length}: ✗ Failed - ${error.message}`);
        results.failed.push({
          url,
          error: error.message || 'Onbekende fout',
        });
      }
    }

    console.log(`[Bulk Import] Completed - ${results.success.length} success, ${results.failed.length} failed`);

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Affiliate Links API] Bulk Import Error:', error);
    return NextResponse.json({ error: 'Failed to import links' }, { status: 500 });
  }
}
