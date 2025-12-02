import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import fs from 'fs';

const AUTH_SECRETS_PATH = '/home/ubuntu/.config/abacusai_auth_secrets.json';

function getAIMLApiKey(): string | null {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_SECRETS_PATH, 'utf-8'));
    return data?.['aiml api']?.secrets?.api_key?.value || null;
  } catch {
    return null;
  }
}

interface ContentItem {
  id: string;
  title: string;
  type: 'pillar' | 'cluster' | 'blog' | 'listicle' | 'review' | 'comparison' | 'how-to' | 'guide';
  category: string;
  keywords: string[];
  searchIntent: string;
  selected: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedWords: number;
  productKeyword?: string;
}

interface Category {
  name: string;
  pillars: ContentItem[];
  clusters: ContentItem[];
  supportingContent: ContentItem[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { projectId, websiteUrl, niche, targetArticles, contentMix, existingPages } = body;
    
    const apiKey = getAIMLApiKey();
    if (!apiKey) {
      return NextResponse.json({ error: 'AI configuratie niet gevonden' }, { status: 500 });
    }
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (progress: number, message?: string) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress, message })}\n\n`));
        };
        
        try {
          sendProgress(5, 'Niche analyseren...');
          
          // Load existing project data if available
          let existingTopics: string[] = [];
          if (projectId) {
            const client = await prisma.client.findUnique({
              where: { email: session.user.email }
            });
            
            if (client) {
              const project = await prisma.project.findFirst({
                where: { id: projectId, clientId: client.id }
              });
              
              if (project?.sitemap && typeof project.sitemap === 'object') {
                const sitemap = project.sitemap as any;
                existingTopics = sitemap.titles || [];
              }
            }
          }
          
          sendProgress(10, 'Topical map structuur opbouwen...');
          
          // Calculate content distribution
          const distribution = {
            informational: contentMix.informational ? 0.35 : 0,
            listicles: contentMix.listicles ? 0.25 : 0,
            reviews: contentMix.reviews ? 0.20 : 0,
            howTo: contentMix.howTo ? 0.15 : 0,
            comparisons: contentMix.comparisons ? 0.05 : 0,
          };
          
          // Normalize distribution
          const total = Object.values(distribution).reduce((a, b) => a + b, 0);
          if (total > 0) {
            for (const key of Object.keys(distribution)) {
              distribution[key as keyof typeof distribution] /= total;
            }
          }
          
          sendProgress(20, 'AI prompt voorbereiden...');
          
          // Generate topical map with AI
          const prompt = `Je bent een SEO expert en content strateeg. Genereer een volledige topical map voor een website in de niche: "${niche || 'Algemeen'}".

Website: ${websiteUrl || 'Nieuwe website'}
Bestaande pagina's: ${existingPages || 0}
Gewenst aantal artikelen: ${targetArticles}

Content mix percentages:
- Informatief: ${Math.round(distribution.informational * 100)}%
- Beste lijstjes (Top X, Beste Y): ${Math.round(distribution.listicles * 100)}%
- Reviews (product reviews): ${Math.round(distribution.reviews * 100)}%
- How-to guides: ${Math.round(distribution.howTo * 100)}%
- Vergelijkingen: ${Math.round(distribution.comparisons * 100)}%

${existingTopics.length > 0 ? `BELANGRIJK: Deze onderwerpen bestaan al en moeten NIET opnieuw worden voorgesteld:\n${existingTopics.slice(0, 30).join('\n')}\n` : ''}

Genereer een JSON object met de volgende structuur:
{
  "categories": [
    {
      "name": "Categorie naam",
      "pillars": [
        {
          "title": "Pillar page titel",
          "type": "pillar",
          "keywords": ["keyword1", "keyword2"],
          "searchIntent": "informational",
          "estimatedWords": 3000
        }
      ],
      "clusters": [
        {
          "title": "Cluster artikel titel",
          "type": "cluster" of "listicle" of "review" of "how-to" of "comparison",
          "keywords": ["keyword1", "keyword2"],
          "searchIntent": "informational" of "commercial" of "transactional",
          "estimatedWords": 1500,
          "productKeyword": "product zoekwoord voor Bol.com" (alleen bij reviews/listicles)
        }
      ],
      "supportingContent": [
        {
          "title": "Supporting content titel",
          "type": "blog" of "how-to" of "guide",
          "keywords": ["keyword1"],
          "searchIntent": "informational",
          "estimatedWords": 1000
        }
      ]
    }
  ]
}

Regels:
1. Maak 5-8 hoofdcategorieën relevant voor de niche
2. Elke categorie heeft 1-2 pillar pages
3. Elke categorie heeft 5-15 cluster artikelen
4. Elke categorie heeft 5-20 supporting content items
5. Totaal MOET minimaal ${targetArticles} artikelen zijn
6. Voor reviews en lijstjes, voeg altijd "productKeyword" toe voor Bol.com producten
7. Gebruik Nederlandse titels met goede SEO keywords
8. Pillar pages zijn 2500-4000 woorden, clusters 1000-2000, supporting 800-1500
9. NIET dezelfde onderwerpen als bestaande content
10. Maak titels specifiek en zoekbaar (bijv. "Beste laptops voor studenten 2024" niet "Laptops")

Retourneer ALLEEN valid JSON, geen extra tekst.`;
          
          sendProgress(30, 'Topical map genereren met AI...');
          
          const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'claude-3-5-sonnet',
              messages: [
                { role: 'user', content: prompt }
              ],
              max_tokens: 16000,
              temperature: 0.7
            })
          });
          
          if (!response.ok) {
            throw new Error('AI API request failed');
          }
          
          sendProgress(60, 'AI response verwerken...');
          
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          // Extract JSON from response
          let jsonContent = content;
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          } else {
            // Try to find JSON object directly
            const startIdx = content.indexOf('{');
            const endIdx = content.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
              jsonContent = content.substring(startIdx, endIdx + 1);
            }
          }
          
          sendProgress(70, 'Topical map structureren...');
          
          let topicalMapData;
          try {
            topicalMapData = JSON.parse(jsonContent);
          } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error('Kon AI response niet verwerken');
          }
          
          sendProgress(80, 'Content items verrijken...');
          
          // Process and enrich the topical map
          const categories: Category[] = topicalMapData.categories.map((cat: any) => {
            const pillars: ContentItem[] = (cat.pillars || []).map((item: any) => ({
              id: generateId(),
              title: item.title,
              type: 'pillar' as const,
              category: cat.name,
              keywords: item.keywords || [],
              searchIntent: item.searchIntent || 'informational',
              selected: true,
              priority: 'high' as const,
              estimatedWords: item.estimatedWords || 3000,
              productKeyword: item.productKeyword
            }));
            
            const clusters: ContentItem[] = (cat.clusters || []).map((item: any) => ({
              id: generateId(),
              title: item.title,
              type: item.type || 'cluster',
              category: cat.name,
              keywords: item.keywords || [],
              searchIntent: item.searchIntent || 'informational',
              selected: true,
              priority: item.type === 'review' || item.type === 'listicle' ? 'high' as const : 'medium' as const,
              estimatedWords: item.estimatedWords || 1500,
              productKeyword: item.productKeyword
            }));
            
            const supportingContent: ContentItem[] = (cat.supportingContent || []).map((item: any) => ({
              id: generateId(),
              title: item.title,
              type: item.type || 'blog',
              category: cat.name,
              keywords: item.keywords || [],
              searchIntent: item.searchIntent || 'informational',
              selected: true,
              priority: 'low' as const,
              estimatedWords: item.estimatedWords || 1000,
              productKeyword: item.productKeyword
            }));
            
            return {
              name: cat.name,
              pillars,
              clusters,
              supportingContent
            };
          });
          
          sendProgress(90, 'Statistieken berekenen...');
          
          // Calculate totals
          let totalItems = 0;
          let informationalCount = 0;
          let listicleCount = 0;
          let reviewCount = 0;
          let howToCount = 0;
          
          categories.forEach(cat => {
            const allItems = [...cat.pillars, ...cat.clusters, ...cat.supportingContent];
            totalItems += allItems.length;
            
            allItems.forEach(item => {
              if (item.type === 'pillar' || item.type === 'cluster' || item.type === 'blog' || item.type === 'guide') {
                informationalCount++;
              } else if (item.type === 'listicle') {
                listicleCount++;
              } else if (item.type === 'review' || item.type === 'comparison') {
                reviewCount++;
              } else if (item.type === 'how-to') {
                howToCount++;
              }
            });
          });
          
          const topicalMap = {
            categories,
            totalItems,
            informationalCount,
            listicleCount,
            reviewCount,
            howToCount
          };
          
          sendProgress(100, 'Voltooid!');
          
          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ topicalMap })}\n\n`));
          
        } catch (error: any) {
          console.error('Error generating topical map:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error.message || 'Genereren mislukt' })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });
    
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
    
  } catch (error: any) {
    console.error('Error in topical map generation:', error);
    return NextResponse.json(
      { error: error.message || 'Genereren mislukt' },
      { status: 500 }
    );
  }
}
