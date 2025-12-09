import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
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

// GET - Fetch all affiliate links for the client
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client's project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email as string },
      include: { 
        projects: { 
          take: 1,
          include: {
            affiliateLinks: {
              orderBy: { createdAt: 'desc' }
            }
          }
        } 
      },
    });

    if (!client || !client.projects[0]) {
      return NextResponse.json([]);
    }

    // Map to UI format
    const links = client.projects[0].affiliateLinks.map(link => ({
      id: link.id,
      title: link.anchorText,
      url: link.url,
      description: link.description,
      category: link.category,
      isActive: link.isActive,
      usageCount: link.usageCount,
      createdAt: link.createdAt.toISOString(),
    }));

    return NextResponse.json(links);
  } catch (error) {
    console.error('[Affiliate Links API] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

// POST - Create new affiliate link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    let { title, url, description, category } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: 'URL is verplicht' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Ongeldige URL' }, { status: 400 });
    }

    // Get client's project
    const client = await prisma.client.findUnique({
      where: { email: session.user.email as string },
      include: { projects: { take: 1 } },
    });

    if (!client || !client.projects[0]) {
      return NextResponse.json({ error: 'No project found' }, { status: 404 });
    }

    const projectId = client.projects[0].id;

    // If no title provided, analyze URL
    if (!title || title.trim() === '') {
      const analyzed = await analyzeUrl(url);
      title = analyzed.title;
      if (!description) description = analyzed.description;
      if (!category) category = analyzed.category;
    }

    // Generate keywords
    const keywords = await generateKeywords(url, title, category || 'Algemeen');

    // Create affiliate link
    const affiliateLink = await prisma.affiliateLink.create({
      data: {
        projectId,
        url,
        anchorText: title,
        description: description || null,
        category: category || null,
        keywords,
        isActive: true,
      },
    });

    return NextResponse.json({
      id: affiliateLink.id,
      title: affiliateLink.anchorText,
      url: affiliateLink.url,
      description: affiliateLink.description,
      category: affiliateLink.category,
      isActive: affiliateLink.isActive,
      usageCount: affiliateLink.usageCount,
      createdAt: affiliateLink.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[Affiliate Links API] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}
