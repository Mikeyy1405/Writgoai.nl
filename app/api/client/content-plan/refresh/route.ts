
/**
 * Refresh Content Plan - Generate fresh content ideas
 * Checks sitemap to avoid duplicates
 */

export const dynamic = "force-dynamic";
export const maxDuration = 180; // 3 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { batchCheckDuplicates } from '@/lib/sitemap-checker';
import { getLanguageName, getLanguageDisplayName } from '@/lib/language-utils';
import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.AIML_API_KEY;
  if (!apiKey) {
    throw new Error('AIML_API_KEY niet gevonden');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.aimlapi.com/v1',
    timeout: 120000,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { projectId, count = 10, language } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is verplicht' }, { status: 400 });
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    console.log(`🔄 Refreshing content plan for project: ${project.name}`);

    // Get existing article ideas to avoid similar content
    const existingIdeas = await prisma.articleIdea.findMany({
      where: { projectId, clientId: client.id },
      select: { title: true, focusKeyword: true },
    });

    console.log(`📚 Found ${existingIdeas.length} existing ideas`);

    // Generate fresh content ideas using AI
    const openai = getOpenAI();

    // Use provided language or fallback to project language or default to NL
    const contentLanguage = language || project.language || 'NL';
    
    const prompt = `Je bent een expert SEO content strategist. Genereer ${count} NIEUWE en VERSE content ideeën voor deze website.

Context:
- Website niche: ${project.niche || project.name}
- Target audience: ${project.targetAudience || 'Breed publiek'}
- Website URL: ${project.websiteUrl || 'niet beschikbaar'}
- Content taal: ${getLanguageDisplayName(contentLanguage)}

BELANGRIJK: Vermijd deze onderwerpen die al behandeld zijn:
${existingIdeas.slice(0, 20).map((idea) => `- ${idea.title} (keyword: ${idea.focusKeyword})`).join('\n')}

CONTENT MIX VEREISTEN:
Maak een strategische balans tussen COMMERCIËLE en INFORMATIEVE content:

📈 COMMERCIËLE CONTENT (40% van totaal):
- Product reviews en vergelijkingen
- "Beste [product] voor [doel]" lijsten
- Buyer's guides en aankoopadvies
- "X vs Y" vergelijkingen
- Product roundups en top 10 lijsten
- Affiliate-vriendelijke content met duidelijke CTA's
- Search intent: "commercial" of "transactional"

📚 INFORMATIEVE CONTENT (60% van totaal):
- How-to guides en tutorials
- Probleemoplossende artikelen
- Educatieve deep-dives
- Tips, tricks en best practices
- Trendy onderwerpen en nieuws
- Search intent: "informational"

Genereer ${count} VERSE content ideeën die:
1. Een BEWUSTE MIX hebben van commercieel (±40%) en informatief (±60%)
2. Compleet nieuw en anders zijn dan bestaande content
3. Actueel en relevant zijn voor ${new Date().getFullYear()}
4. Verschillende invalshoeken en perspectieven hebben
5. Geschikt zijn voor uitgebreide blog artikelen (1200-2000 woorden)
6. Alle titels, keywords en beschrijvingen moeten in ${getLanguageName(contentLanguage)} zijn

CONTENT TYPE DISTRIBUTIE:
- review: Product/service reviews (commercieel)
- comparison: "X vs Y" vergelijkingen (commercieel)
- listicle: "Top 10" of "Beste" lijsten (commercieel)
- buyer-guide: Aankoopadvies artikelen (commercieel)
- how-to: Stap-voor-stap handleidingen (informatief)
- guide: Uitgebreide gidsen (informatief)
- tips: Tips en tricks artikelen (informatief)
- educational: Educatieve deep-dives (informatief)

Geef je antwoord in dit EXACT JSON formaat (zonder markdown of extra tekst):
{
  "ideas": [
    {
      "title": "Pakkende en unieke titel",
      "focusKeyword": "specifiek hoofdkeyword",
      "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
      "description": "Korte beschrijving wat het artikel behandelt",
      "contentType": "review",
      "contentCategory": "commercial",
      "priority": "high",
      "searchIntent": "commercial",
      "estimatedDifficulty": 50
    }
  ]
}

IMPORTANT: 
- Return ONLY valid JSON, no markdown formatting, no code blocks, no extra text
- Zorg voor ongeveer 40% commercial content (contentCategory: "commercial")
- Zorg voor ongeveer 60% informational content (contentCategory: "informational")
- Varieer in contentType binnen elke categorie`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'Je bent een expert SEO strategist. Geef ALLEEN valid JSON zonder markdown. Vermijd bestaande content.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9, // Higher temperature for more creative/fresh ideas
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Parse JSON (remove markdown if present)
    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '').replace(/```\n?$/g, '');
    }
    
    const parsed = JSON.parse(jsonContent);
    const generatedIdeas = parsed.ideas || [];

    console.log(`✅ Generated ${generatedIdeas.length} fresh ideas`);

    // Check for duplicates using sitemap
    console.log('🔍 Checking sitemap for duplicates...');
    const duplicateChecks = await batchCheckDuplicates(
      projectId,
      generatedIdeas.map((idea: any) => ({
        title: idea.title,
        focusKeyword: idea.focusKeyword,
      }))
    );

    // Filter out duplicates
    const uniqueIdeas = generatedIdeas.filter(
      (_: any, index: number) => !duplicateChecks[index].isDuplicate
    );

    console.log(`✅ ${uniqueIdeas.length}/${generatedIdeas.length} ideas are unique`);

    if (uniqueIdeas.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Alle gegenereerde ideeën bestaan al op je website of in je contentplan',
      });
    }

    // Save unique ideas to database
    const articleIdeasData = uniqueIdeas.map((idea: any) => ({
      clientId: client.id,
      projectId: projectId,
      title: idea.title,
      slug: idea.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      focusKeyword: idea.focusKeyword,
      topic: idea.description,
      secondaryKeywords: idea.secondaryKeywords || [],
      searchIntent: idea.searchIntent || 'informational',
      difficulty: idea.estimatedDifficulty || 50,
      contentType: idea.contentType || 'guide',
      contentCategory: idea.contentCategory || 'informational', // Store content category
      priority: idea.priority || 'medium',
      aiScore: 80,
      trending: false,
      competitorGap: false,
      status: 'idea',
    }));

    const created = await prisma.articleIdea.createMany({
      data: articleIdeasData,
    });

    console.log(`💾 Saved ${created.count} new article ideas`);

    return NextResponse.json({
      success: true,
      message: `Content plan vernieuwd met ${created.count} nieuwe ideeën`,
      addedCount: created.count,
      duplicatesFiltered: generatedIdeas.length - uniqueIdeas.length,
    });
  } catch (error: any) {
    console.error('Error refreshing content plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh content plan' },
      { status: 500 }
    );
  }
}
