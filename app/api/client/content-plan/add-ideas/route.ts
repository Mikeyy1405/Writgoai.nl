
/**
 * Add Content Ideas by Keyword
 * Allows users to expand their content plan with specific keywords
 */

export const dynamic = "force-dynamic";
export const maxDuration = 180; // 3 minutes

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { checkForDuplicates, batchCheckDuplicates } from '@/lib/sitemap-checker';
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
    const { projectId, keyword, count = 5, language } = body;

    if (!projectId || !keyword) {
      return NextResponse.json(
        { error: 'Project ID en keyword zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    console.log(`🎯 Generating ${count} content ideas for keyword: "${keyword}"`);

    // Use provided language or fallback to project language or default to NL
    const contentLanguage = language || project.language || 'NL';

    // Generate content ideas using AI
    const openai = getOpenAI();

    const prompt = `Je bent een expert SEO content strategist. Genereer ${count} unieke en waardevolle content ideeën gebaseerd op het keyword "${keyword}".

Context:
- Website niche: ${project.niche || project.name}
- Target audience: ${project.targetAudience || 'Breed publiek'}
- Keyword: ${keyword}
- Content taal: ${getLanguageDisplayName(contentLanguage)}

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

Genereer ${count} content ideeën die:
1. Een BEWUSTE MIX hebben van commercieel (±40%) en informatief (±60%)
2. Relevant zijn voor het keyword "${keyword}"
3. Uniek en waardevol zijn
4. Verschillende invalshoeken hebben (zowel verkoop als educatief)
5. Geschikt zijn voor blog artikelen (1200-2000 woorden)
6. Alle titels, keywords en beschrijvingen moeten in ${getLanguageName(contentLanguage)} zijn

CONTENT TYPE OPTIES:
COMMERCIEEL:
- review: Product/service reviews
- comparison: "X vs Y" vergelijkingen
- listicle: "Top 10" of "Beste" lijsten
- buyer-guide: Aankoopadvies artikelen

INFORMATIEF:
- how-to: Stap-voor-stap handleidingen
- guide: Uitgebreide gidsen
- tips: Tips en tricks artikelen
- educational: Educatieve deep-dives

Geef je antwoord in dit EXACT JSON formaat (zonder markdown of extra tekst):
{
  "ideas": [
    {
      "title": "Pakkende titel",
      "focusKeyword": "hoofdkeyword",
      "secondaryKeywords": ["keyword1", "keyword2", "keyword3"],
      "description": "Korte beschrijving van het artikel",
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
      model: 'claude-3-5-sonnet',
      messages: [
        {
          role: 'system',
          content:
            'Je bent een expert SEO strategist. Geef ALLEEN valid JSON zonder markdown.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
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

    console.log(`✅ Generated ${generatedIdeas.length} ideas`);

    // Check for duplicates using sitemap
    console.log('🔍 Checking for duplicates in sitemap...');
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
        error: 'Alle gegenereerde ideeën bestaan al op je website',
        duplicates: duplicateChecks.filter((d) => d.isDuplicate),
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
      aiScore: 75,
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
      message: `${created.count} nieuwe content ideeën toegevoegd`,
      addedCount: created.count,
      duplicatesFiltered: generatedIdeas.length - uniqueIdeas.length,
    });
  } catch (error: any) {
    console.error('Error adding content ideas:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add content ideas' },
      { status: 500 }
    );
  }
}
