import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import fs from 'fs';

const AUTH_SECRETS_PATH = '/home/ubuntu/.config/abacusai_auth_secrets.json';

function getApiKeys(): { aiml?: string; openai?: string } {
  try {
    const data = JSON.parse(fs.readFileSync(AUTH_SECRETS_PATH, 'utf-8'));
    return {
      aiml: data?.['aiml api']?.secrets?.api_key?.value,
      openai: data?.['openai']?.secrets?.api_key?.value
    };
  } catch (e) {
    console.error('[Topical Map] Error reading API keys:', e);
    return {};
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

function topicExists(newTopic: string, existingTopics: string[]): boolean {
  const normalized = newTopic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (existingTopics.includes(normalized)) return true;
  
  for (const existing of existingTopics) {
    const words1 = new Set(normalized.split(' '));
    const words2 = new Set(existing.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    if (intersection.size / union.size > 0.75) return true;
  }
  
  return false;
}

async function callLLM(prompt: string, apiKeys: { aiml?: string; openai?: string }): Promise<string> {
  // Try AIML API first with Claude 3.7 Sonnet
  if (apiKeys.aiml) {
    try {
      console.log('[Topical Map] Trying AIML API...');
      const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.aiml}`
        },
        body: JSON.stringify({
          model: 'claude-3-7-sonnet-latest',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 16000,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
      
      const error = await response.text();
      console.log('[Topical Map] AIML API failed:', error);
    } catch (e) {
      console.error('[Topical Map] AIML API error:', e);
    }
  }
  
  // Fallback to OpenAI
  if (apiKeys.openai) {
    try {
      console.log('[Topical Map] Trying OpenAI API...');
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 16000,
          temperature: 0.7
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
      
      const error = await response.text();
      console.error('[Topical Map] OpenAI API failed:', error);
    } catch (e) {
      console.error('[Topical Map] OpenAI API error:', e);
    }
  }
  
  throw new Error('Geen werkende AI API beschikbaar - controleer je API keys en credits');
}

export async function POST(request: NextRequest) {
  console.log('[Topical Map] Starting request...');
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }
    
    const body = await request.json();
    const { projectId, websiteUrl, niche, targetArticles, contentMix, existingTopics: clientExistingTopics } = body;
    
    const apiKeys = getApiKeys();
    if (!apiKeys.aiml && !apiKeys.openai) {
      return NextResponse.json({ error: 'Geen AI API keys gevonden' }, { status: 500 });
    }
    
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendProgress = (progress: number, message?: string) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress, message })}\n\n`));
          } catch (e) {
            console.error('[Topical Map] Error sending progress:', e);
          }
        };
        
        try {
          sendProgress(5, 'Bestaande content analyseren...');
          
          let existingTopics: string[] = clientExistingTopics || [];
          let projectNiche = niche;
          
          if (projectId) {
            try {
              const client = await prisma.client.findUnique({
                where: { email: session.user.email }
              });
              
              if (client) {
                const project = await prisma.project.findFirst({
                  where: { id: projectId, clientId: client.id }
                });
                
                if (project?.sitemap && typeof project.sitemap === 'object') {
                  const sitemap = project.sitemap as any;
                  const sitemapTopics = sitemap.topics || sitemap.titles || [];
                  existingTopics = [...new Set([...existingTopics, ...sitemapTopics])];
                }
                
                if (project?.niche && !projectNiche) {
                  projectNiche = project.niche;
                }
              }
            } catch (e) {
              console.error('[Topical Map] Error loading project:', e);
            }
          }
          
          sendProgress(10, `${existingTopics.length} bestaande onderwerpen gevonden...`);
          
          // Calculate distribution
          const distribution = {
            informational: contentMix?.informational ? 0.30 : 0,
            listicles: contentMix?.listicles ? 0.25 : 0,
            reviews: contentMix?.reviews ? 0.20 : 0,
            howTo: contentMix?.howTo ? 0.15 : 0,
            comparisons: contentMix?.comparisons ? 0.10 : 0,
          };
          
          const total = Object.values(distribution).reduce((a, b) => a + b, 0);
          if (total > 0) {
            for (const key of Object.keys(distribution)) {
              distribution[key as keyof typeof distribution] /= total;
            }
          }
          
          sendProgress(15, 'Content strategie voorbereiden...');
          
          const exclusionList = existingTopics.slice(0, 80).join('\n- ');
          
          const prompt = `Je bent een SEO expert. Genereer een uitgebreide topical map.

## WEBSITE INFO
- Niche: "${projectNiche || 'Algemeen'}"
- Website: ${websiteUrl || 'Nieuwe website'}
- Gewenst aantal artikelen: MINIMAAL ${targetArticles}

## CONTENT MIX
- Informatief: ${Math.round(distribution.informational * 100)}%
- Lijstjes (Top X, Beste Y): ${Math.round(distribution.listicles * 100)}%
- Reviews: ${Math.round(distribution.reviews * 100)}%
- How-to guides: ${Math.round(distribution.howTo * 100)}%
- Vergelijkingen (A vs B): ${Math.round(distribution.comparisons * 100)}%

${existingTopics.length > 0 ? `## BESTAANDE CONTENT - NIET HERHALEN!\n- ${exclusionList}` : ''}

## OUTPUT FORMAT
Retourneer ALLEEN valid JSON:
{
  "categories": [
    {
      "name": "Categorie naam",
      "pillars": [
        {"title": "Complete Gids voor [Onderwerp]", "type": "pillar", "keywords": ["kw1", "kw2"], "searchIntent": "informational", "estimatedWords": 3000}
      ],
      "clusters": [
        {"title": "10 Beste [Producten] voor [Doel]", "type": "listicle", "keywords": ["kw1"], "searchIntent": "commercial", "estimatedWords": 1500, "productKeyword": "zoekterm voor bol.com"},
        {"title": "[Product] Review: Eerlijke Ervaring", "type": "review", "keywords": ["kw1"], "searchIntent": "commercial", "estimatedWords": 1500, "productKeyword": "product naam"},
        {"title": "[Product A] vs [Product B]: Welke is Beter?", "type": "comparison", "keywords": ["kw1"], "searchIntent": "commercial", "estimatedWords": 2000, "productKeyword": "product categorie"}
      ],
      "supportingContent": [
        {"title": "Hoe [Taak] in [X] Stappen", "type": "how-to", "keywords": ["kw1"], "searchIntent": "informational", "estimatedWords": 1000}
      ]
    }
  ]
}

## REGELS
1. Genereer MINIMAAL ${targetArticles} unieke artikelen verdeeld over 6-10 categorieën
2. Elke categorie: 1-2 pillar pages, 10-20 clusters, 10-30 supporting content
3. Voeg ALTIJD "productKeyword" toe bij reviews, listicles en comparisons (voor Bol.com)
4. Maak titels SPECIFIEK met Nederlandse SEO keywords
5. VERMIJD alle onderwerpen uit de bestaande content lijst
6. Gebruik de juiste type voor elk artikel: pillar, cluster, blog, listicle, review, comparison, how-to, guide

Retourneer ALLEEN valid JSON, geen tekst ervoor of erna.`;
          
          sendProgress(25, 'Topical map genereren met AI...');
          
          const content = await callLLM(prompt, apiKeys);
          
          if (!content) {
            throw new Error('Geen response van AI API');
          }
          
          sendProgress(55, 'AI response verwerken...');
          
          // Extract JSON
          let jsonContent = content;
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          } else {
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
            console.error('[Topical Map] JSON parse error');
            console.error('[Topical Map] Content preview:', jsonContent.substring(0, 300));
            throw new Error('Kon AI response niet verwerken - probeer opnieuw');
          }
          
          sendProgress(75, 'Content items verwerken...');
          
          let duplicatesRemoved = 0;
          
          const categories: Category[] = (topicalMapData.categories || []).map((cat: any) => {
            const pillars: ContentItem[] = (cat.pillars || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title || '', existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
                id: generateId(),
                title: item.title || 'Untitled',
                type: 'pillar' as const,
                category: cat.name || 'General',
                keywords: item.keywords || [],
                searchIntent: item.searchIntent || 'informational',
                selected: true,
                priority: 'high' as const,
                estimatedWords: item.estimatedWords || 3000,
                productKeyword: item.productKeyword
              }));
            
            const clusters: ContentItem[] = (cat.clusters || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title || '', existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
                id: generateId(),
                title: item.title || 'Untitled',
                type: item.type || 'cluster',
                category: cat.name || 'General',
                keywords: item.keywords || [],
                searchIntent: item.searchIntent || 'informational',
                selected: true,
                priority: ['review', 'listicle', 'comparison'].includes(item.type) ? 'high' as const : 'medium' as const,
                estimatedWords: item.estimatedWords || 1500,
                productKeyword: item.productKeyword
              }));
            
            const supportingContent: ContentItem[] = (cat.supportingContent || [])
              .filter((item: any) => {
                const isDuplicate = topicExists(item.title || '', existingTopics);
                if (isDuplicate) duplicatesRemoved++;
                return !isDuplicate;
              })
              .map((item: any) => ({
                id: generateId(),
                title: item.title || 'Untitled',
                type: item.type || 'blog',
                category: cat.name || 'General',
                keywords: item.keywords || [],
                searchIntent: item.searchIntent || 'informational',
                selected: true,
                priority: 'low' as const,
                estimatedWords: item.estimatedWords || 1000,
                productKeyword: item.productKeyword
              }));
            
            return { name: cat.name || 'General', pillars, clusters, supportingContent };
          });
          
          sendProgress(85, 'Statistieken berekenen...');
          
          let totalItems = 0, informationalCount = 0, listicleCount = 0, reviewCount = 0, howToCount = 0, comparisonCount = 0;
          
          categories.forEach(cat => {
            const allItems = [...cat.pillars, ...cat.clusters, ...cat.supportingContent];
            totalItems += allItems.length;
            
            allItems.forEach(item => {
              switch (item.type) {
                case 'pillar': case 'cluster': case 'blog': case 'guide':
                  informationalCount++; break;
                case 'listicle':
                  listicleCount++; break;
                case 'review':
                  reviewCount++; break;
                case 'comparison':
                  comparisonCount++; break;
                case 'how-to':
                  howToCount++; break;
              }
            });
          });
          
          const topicalMap = {
            categories,
            totalItems,
            informationalCount,
            listicleCount,
            reviewCount: reviewCount + comparisonCount,
            howToCount,
            duplicatesRemoved
          };
          
          console.log(`[Topical Map] Generated ${totalItems} items (${duplicatesRemoved} duplicates removed)`);
          
          sendProgress(100, 'Voltooid!');
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
    console.error('[Topical Map] Fatal error:', error);
    return NextResponse.json({ error: error.message || 'Genereren mislukt' }, { status: 500 });
  }
}
