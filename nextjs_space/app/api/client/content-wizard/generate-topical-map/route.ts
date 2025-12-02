import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import fs from 'fs';
import { topicExists } from '@/lib/wordpress-scanner';

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
    const { projectId, websiteUrl, niche, targetArticles, contentMix, existingTopics: clientExistingTopics } = body;
    
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
          sendProgress(5, 'Bestaande content analyseren...');
          
          // Load existing project data if available
          let existingTopics: string[] = clientExistingTopics || [];
          let existingCategories: string[] = [];
          let projectNiche = niche;
          
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
                // Combine topics from sitemap with client-provided topics
                const sitemapTopics = sitemap.topics || sitemap.titles || [];
                existingTopics = [...new Set([...existingTopics, ...sitemapTopics])];
                existingCategories = sitemap.categories || [];
                
                console.log(`[Topical Map] Found ${existingTopics.length} existing topics to avoid`);
              }
              
              // Use project niche if available
              if (project?.niche && !projectNiche) {
                projectNiche = project.niche;
              }
            }
          }
          
          sendProgress(10, `${existingTopics.length} bestaande onderwerpen gevonden...`);
          
          // Calculate content distribution based on enabled types
          const enabledTypes = Object.entries(contentMix).filter(([_, enabled]) => enabled);
          const typeCount = enabledTypes.length || 1;
          
          const distribution = {
            informational: contentMix.informational ? 0.30 : 0,
            listicles: contentMix.listicles ? 0.25 : 0,
            reviews: contentMix.reviews ? 0.20 : 0,
            howTo: contentMix.howTo ? 0.15 : 0,
            comparisons: contentMix.comparisons ? 0.10 : 0,
          };
          
          // Normalize distribution
          const total = Object.values(distribution).reduce((a, b) => a + b, 0);
          if (total > 0) {
            for (const key of Object.keys(distribution)) {
              distribution[key as keyof typeof distribution] /= total;
            }
          }
          
          sendProgress(15, 'Content strategie voorbereiden...');
          
          // Build exclusion list for AI prompt (max 100 items to keep prompt manageable)
          const exclusionList = existingTopics.slice(0, 100).join('\n- ');
          
          // Generate topical map with AI
          const prompt = `Je bent een SEO expert en content strateeg. Genereer een uitgebreide topical map voor een website.

## WEBSITE INFO
- Niche: "${projectNiche || 'Algemeen'}"
- Website: ${websiteUrl || 'Nieuwe website'}
- Gewenst aantal artikelen: MINIMAAL ${targetArticles} (genereer meer dan gevraagd!)

## CONTENT MIX (verdeling over types)
- Informatieve artikelen: ${Math.round(distribution.informational * 100)}% (educatief, guides, uitleg)
- Beste lijstjes (Top X producten): ${Math.round(distribution.listicles * 100)}% (bijv. "10 Beste Laptops voor Studenten")
- Product reviews: ${Math.round(distribution.reviews * 100)}% (gedetailleerde reviews van specifieke producten)
- How-to guides: ${Math.round(distribution.howTo * 100)}% (stap-voor-stap instructies)
- Vergelijkingen: ${Math.round(distribution.comparisons * 100)}% (Product A vs Product B)

## BESTAANDE CONTENT - NIET HERHALEN!
${existingTopics.length > 0 ? `De volgende onderwerpen bestaan AL op de website. Genereer GEEN duplicates:\n- ${exclusionList}` : 'Geen bestaande content.'}

${existingCategories.length > 0 ? `Bestaande categorieën: ${existingCategories.join(', ')}` : ''}

## OUTPUT FORMAT
Retourneer ALLEEN een valid JSON object met deze structuur:
{
  "categories": [
    {
      "name": "Categorie naam",
      "pillars": [
        {
          "title": "Uitgebreide pillar page titel met SEO keywords",
          "type": "pillar",
          "keywords": ["hoofdkeyword", "secundair keyword", "long-tail"],
          "searchIntent": "informational",
          "estimatedWords": 3000
        }
      ],
      "clusters": [
        {
          "title": "Cluster artikel titel",
          "type": "listicle",
          "keywords": ["keyword1", "keyword2"],
          "searchIntent": "commercial",
          "estimatedWords": 1800,
          "productKeyword": "laptop studenten" 
        },
        {
          "title": "Review artikel titel",
          "type": "review",
          "keywords": ["product naam", "review"],
          "searchIntent": "commercial",
          "estimatedWords": 1500,
          "productKeyword": "macbook air m2"
        },
        {
          "title": "Vergelijking artikel",
          "type": "comparison",
          "keywords": ["product a vs product b"],
          "searchIntent": "commercial",
          "estimatedWords": 2000,
          "productKeyword": "macbook vs windows laptop"
        }
      ],
      "supportingContent": [
        {
          "title": "How-to guide titel",
          "type": "how-to",
          "keywords": ["how to", "keyword"],
          "searchIntent": "informational",
          "estimatedWords": 1200
        }
      ]
    }
  ]
}

## BELANGRIJKE REGELS
1. Genereer MINIMAAL ${targetArticles} unieke artikelen verdeeld over 6-10 categorieën
2. Elke categorie MOET hebben:
   - 1-2 pillar pages (2500-4000 woorden) - uitgebreide gidsen
   - 8-15 cluster artikelen met MIX van types (listicles, reviews, comparisons, etc.)
   - 10-25 supporting content items
3. Voor REVIEWS en LISTICLES: voeg ALTIJD "productKeyword" toe voor Bol.com zoeken
   - Bij listicles: zoekterm voor productcategorie (bijv. "laptop studenten", "koptelefoon bluetooth")
   - Bij reviews: specifiek productnaam (bijv. "macbook air m2", "sony wh-1000xm5")
   - Bij comparisons: beide producten (bijv. "macbook air vs dell xps")
4. Maak titels SPECIFIEK en ZOEKBAAR:
   - GOED: "Beste Laptops voor Studenten 2024: Top 10 Aanraders"
   - SLECHT: "Laptops"
5. Gebruik NEDERLANDSE titels met relevante zoekwoorden
6. Varieer in type per categorie - niet alle clusters hetzelfde type!
7. VERMIJD alle bestaande onderwerpen uit de lijst hierboven
8. SearchIntent types: "informational", "commercial", "transactional", "navigational"

Retourneer ALLEEN valid JSON, geen andere tekst of uitleg.`;
          
          sendProgress(25, 'Topical map genereren met AI...');
          
          console.log('[Topical Map] Calling AI API...');
          
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
            const errorText = await response.text();
            console.error('[Topical Map] AI API error:', errorText);
            throw new Error('AI API request failed');
          }
          
          sendProgress(55, 'AI response verwerken...');
          
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || '';
          
          console.log('[Topical Map] Received AI response, parsing JSON...');
          
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
          
          sendProgress(65, 'Topical map structureren...');
          
          let topicalMapData;
          try {
            topicalMapData = JSON.parse(jsonContent);
          } catch (e) {
            console.error('[Topical Map] JSON parse error:', e);
            console.error('[Topical Map] Raw content:', jsonContent.substring(0, 500));
            throw new Error('Kon AI response niet verwerken');
          }
          
          sendProgress(75, 'Content items verrijken en duplicates verwijderen...');
          
          // Process and enrich the topical map, filtering out duplicates
          let duplicatesRemoved = 0;
          
          const categories: Category[] = topicalMapData.categories.map((cat: any) => {
            const pillars: ContentItem[] = (cat.pillars || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title, existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
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
            
            const clusters: ContentItem[] = (cat.clusters || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title, existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
                id: generateId(),
                title: item.title,
                type: item.type || 'cluster',
                category: cat.name,
                keywords: item.keywords || [],
                searchIntent: item.searchIntent || 'informational',
                selected: true,
                priority: ['review', 'listicle', 'comparison'].includes(item.type) ? 'high' as const : 'medium' as const,
                estimatedWords: item.estimatedWords || 1500,
                productKeyword: item.productKeyword
              }));
            
            const supportingContent: ContentItem[] = (cat.supportingContent || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title, existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
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
          
          console.log(`[Topical Map] Removed ${duplicatesRemoved} duplicate topics`);
          
          sendProgress(85, 'Statistieken berekenen...');
          
          // Calculate totals by type
          let totalItems = 0;
          let informationalCount = 0;
          let listicleCount = 0;
          let reviewCount = 0;
          let howToCount = 0;
          let comparisonCount = 0;
          
          categories.forEach(cat => {
            const allItems = [...cat.pillars, ...cat.clusters, ...cat.supportingContent];
            totalItems += allItems.length;
            
            allItems.forEach(item => {
              switch (item.type) {
                case 'pillar':
                case 'cluster':
                case 'blog':
                case 'guide':
                  informationalCount++;
                  break;
                case 'listicle':
                  listicleCount++;
                  break;
                case 'review':
                  reviewCount++;
                  break;
                case 'comparison':
                  comparisonCount++;
                  break;
                case 'how-to':
                  howToCount++;
                  break;
              }
            });
          });
          
          const topicalMap = {
            categories,
            totalItems,
            informationalCount,
            listicleCount,
            reviewCount: reviewCount + comparisonCount, // Combine for display
            howToCount,
            duplicatesRemoved
          };
          
          console.log(`[Topical Map] Generated ${totalItems} items: ${informationalCount} info, ${listicleCount} lists, ${reviewCount} reviews, ${comparisonCount} comparisons, ${howToCount} how-to`);
          
          sendProgress(100, 'Voltooid!');
          
          // Send final result
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ topicalMap })}\n\n`));
          
        } catch (error: any) {
          console.error('[Topical Map] Error:', error);
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
    console.error('[Topical Map] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Genereren mislukt' },
      { status: 500 }
    );
  }
}
