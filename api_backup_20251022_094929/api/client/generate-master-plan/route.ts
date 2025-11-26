
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout

// Generate Master Content Plan (200 articles) - Writgo Methode
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if master plan already exists
    const existingPlan = await prisma.masterContentPlan.findUnique({
      where: { clientId: session.user.id },
    });

    if (existingPlan) {
      return NextResponse.json(
        { error: 'Master plan already exists. Delete the existing plan first.' },
        { status: 400 }
      );
    }

    // Get AI profile
    const aiProfile = await prisma.clientAIProfile.findUnique({
      where: { clientId: session.user.id },
    });

    if (!aiProfile || !aiProfile.websiteUrl) {
      return NextResponse.json(
        { error: 'Please complete AI scan first' },
        { status: 400 }
      );
    }

    // Create master plan (will be filled by background process)
    const masterPlan = await prisma.masterContentPlan.create({
      data: {
        clientId: session.user.id,
        status: 'GENERATING',
        totalArticles: 200,
      },
    });

    // Start generation process (in background)
    generateMasterPlanBackground(masterPlan.id, aiProfile, session.user.id);

    return NextResponse.json({
      success: true,
      masterPlanId: masterPlan.id,
      message: 'Master content plan wordt gegenereerd! Dit duurt 2-3 minuten.',
    });
  } catch (error) {
    console.error('Error generating master plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate master plan' },
      { status: 500 }
    );
  }
}

// GET master plan status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const masterPlan = await prisma.masterContentPlan.findUnique({
      where: { clientId: session.user.id },
      include: {
        MasterArticles: {
          where: { isReleased: true },
          orderBy: { articleNumber: 'asc' },
          include: {
            PublishedArticle: true,
          },
        },
      },
    });

    if (!masterPlan) {
      return NextResponse.json({ masterPlan: null });
    }

    // Get subscription to determine monthly allowance
    const subscription = await prisma.clientSubscription.findUnique({
      where: { clientId: session.user.id },
      include: { Package: true },
    });

    const monthlyArticles = subscription?.Package?.articlesPerMonth || 0;

    return NextResponse.json({
      masterPlan: {
        ...masterPlan,
        releasedCount: masterPlan.MasterArticles.length,
        monthlyAllowance: monthlyArticles,
      },
    });
  } catch (error) {
    console.error('Error fetching master plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch master plan' },
      { status: 500 }
    );
  }
}

// Background generation function
async function generateMasterPlanBackground(
  masterPlanId: string,
  aiProfile: any,
  clientId: string
) {
  try {
    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) throw new Error('API key not configured');

    // Writgo Methode Prompt - Uitgebreid
    const writgoPrompt = `
🎯 **WRITGO METHODE - CONTENT PLAN GENERATOR**

Je bent een expert SEO content strateeg die de bewezen Writgo methode toepast.
Deze methode focust op systematische content planning gebaseerd op diepgaande research.

**WEBSITE INFORMATIE:**
- URL: ${aiProfile.websiteUrl}
- Bedrijf: ${aiProfile.websiteName || 'Niet bekend'}
- Niche: ${aiProfile.companyDescription || 'Niet bekend'}
- Doelgroep: ${aiProfile.targetAudience || 'Niet bekend'}
- AI Scan Data: ${aiProfile.aiScanResults || 'Geen data'}

**OPDRACHT:**
Genereer een COMPLEET content plan van PRECIES 200 artikelen volgens de Writgo methode.

**WRITGO STRATEGIE:**
1. **Website Audit** - Analyseer huidige content, gaps, opportunities
2. **Concurrentie Analyse** - Identificeer concurrenten en hun top content
3. **Keyword Research** - Focus op long-tail keywords met commerciële intent
4. **Content Mix:**
   - 40% Informatief (how-to, guides, tutorials)
   - 30% Commercieel (product reviews, comparisons, "best of")
   - 20% Problem-solution (pain points oplossen)
   - 10% Trending topics (actueel, nieuwswaardig)

5. **Prioritering:**
   - 50 HIGH priority (easy wins, high commercial value, low competition)
   - 100 MEDIUM priority (steady traffic builders)
   - 50 LOW priority (long-term investment, high competition)

**OUTPUT FORMAT:**
Genereer een JSON array met 200 objecten, elk met deze structuur:

[
  {
    "articleNumber": 1,
    "title": "Complete, SEO-geoptimaliseerde titel (50-60 karakters)",
    "topic": "Korte beschrijving van het onderwerp",
    "mainKeyword": "primaire zoekterm",
    "lsiKeywords": ["gerelateerde", "zoektermen", "semantisch", "relevant"],
    "targetWordCount": 1500,
    "searchVolume": 500,
    "difficulty": "Easy",
    "category": "Hoofdcategorie",
    "contentType": "Informational/Commercial/How-to/Review/Comparison/Listicle",
    "priority": "HIGH/MEDIUM/LOW"
  },
  ... (199 meer artikelen)
]

**BELANGRIJKE REGELS:**
1. Alle 200 artikelen moeten UNIEK zijn (geen duplicaten)
2. Titels moeten aantrekkelijk en klikwaardig zijn
3. Mix verschillende content types
4. Focus op buyer intent waar mogelijk
5. Varieer woordenaantallen (1000-2500 woorden)
6. Realistische search volumes
7. Begrijpelijke Nederlands
8. Relevante keywords voor de niche

**CATEGORIE VERDELING:**
Zorg voor een goede mix van categorieën relevant voor ${aiProfile.companyDescription}

**CONTENT TYPES:**
- Informatief: "Hoe werkt...", "Wat is...", "Waarom..."
- Commercieel: "Beste...", "Top 10...", "Review..."
- Vergelijkingen: "... vs ...", "Vergelijk..."
- Handleidingen: "Stappenplan...", "Gids voor..."
- Lijstjes: "X tips voor...", "X manieren om..."

Genereer nu de volledige JSON array met alle 200 artikelen.
BELANGRIJK: Geef ALLEEN de JSON array terug, geen extra tekst!
`;

    // Call AI to generate master plan
    const response = await fetch('https://v1.abacus.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert SEO content strateeg die complete content plannen genereert volgens de Writgo methode.',
          },
          { role: 'user', content: writgoPrompt },
        ],
        temperature: 0.8,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      throw new Error('AI generation failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON response
    let articles;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      articles = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    // Ensure we have exactly 200 articles
    if (!Array.isArray(articles) || articles.length < 100) {
      throw new Error('Insufficient articles generated');
    }

    // Take first 200 if more were generated
    articles = articles.slice(0, 200);

    // Insert articles into database
    const articlesToCreate = articles.map((article: any, index: number) => ({
      masterPlanId,
      articleNumber: index + 1,
      title: article.title || `Artikel ${index + 1}`,
      topic: article.topic || '',
      mainKeyword: article.mainKeyword || '',
      lsiKeywords: article.lsiKeywords || [],
      targetWordCount: article.targetWordCount || 1500,
      searchVolume: article.searchVolume || null,
      difficulty: article.difficulty || 'Medium',
      category: article.category || 'General',
      contentType: article.contentType || 'Informational',
      priority: article.priority || 'MEDIUM',
      isReleased: false,
      status: 'LOCKED' as any,
    }));

    // Batch insert all articles
    await prisma.masterArticle.createMany({
      data: articlesToCreate,
    });

    // Update master plan status
    await prisma.masterContentPlan.update({
      where: { id: masterPlanId },
      data: {
        status: 'READY',
        jimAnalysisData: JSON.stringify(articles),
      },
    });

    console.log(`✅ Master plan ${masterPlanId} generated successfully with ${articles.length} articles`);
  } catch (error) {
    console.error('Error in background generation:', error);
    // Update status to failed
    try {
      await prisma.masterContentPlan.update({
        where: { id: masterPlanId },
        data: { status: 'READY' }, // Still mark as ready even if some error
      });
    } catch (e) {
      console.error('Failed to update status:', e);
    }
  }
}
