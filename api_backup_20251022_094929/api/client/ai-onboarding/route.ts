
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Deze API voert de volledige AI-gestuurde onboarding uit
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, website, companyName } = body;

    if (!clientId || !website) {
      return NextResponse.json(
        { error: 'Client ID en website zijn verplicht' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting AI onboarding for client ${clientId} - ${website}`);

    // STEP 1: Scan de website en analyseer met AI
    const scanResults = await performComprehensiveWebsiteScan(website, companyName);
    
    // STEP 2: Genereer of update AI profiel met de scan resultaten
    const aiProfile = await createOrUpdateAIProfile(clientId, scanResults);
    
    // STEP 3: Genereer Master Content Plan met 200 artikelen
    const masterPlan = await generateMasterContentPlan(clientId, scanResults);
    
    // STEP 4: Update client status
    await prisma.client.update({
      where: { id: clientId },
      data: { onboardingCompleted: true },
    });

    console.log(`✅ AI onboarding completed for client ${clientId}`);

    return NextResponse.json({
      success: true,
      aiProfile: {
        id: aiProfile.id,
        websiteName: aiProfile.websiteName,
        companyDescription: aiProfile.companyDescription,
      },
      masterPlan: {
        id: masterPlan.id,
        totalArticles: masterPlan.totalArticles,
        status: masterPlan.status,
      },
    });
  } catch (error) {
    console.error('Error in AI onboarding:', error);
    return NextResponse.json(
      { error: 'AI onboarding mislukt' },
      { status: 500 }
    );
  }
}

async function performComprehensiveWebsiteScan(website: string, companyName: string) {
  console.log(`📡 Scanning website: ${website}`);
  
  try {
    // Fetch website content
    const response = await fetch(website, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WritgoAI/1.0; +https://writgoai.nl)'
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch ${website}: ${response.status}`);
      throw new Error(`Website niet bereikbaar: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract metadata
    const metadata = extractMetadata(html);
    
    // Analyze with AI
    const aiAnalysis = await analyzeWithAI(html, metadata, website, companyName);
    
    return {
      website,
      companyName,
      metadata,
      aiAnalysis,
      scannedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('Website scan error:', error);
    
    // Fallback: Generate profile based on company name and website URL only
    const fallbackAnalysis = await generateFallbackProfile(website, companyName);
    
    return {
      website,
      companyName,
      metadata: { title: companyName, description: '' },
      aiAnalysis: fallbackAnalysis,
      scannedAt: new Date().toISOString(),
      scanFailed: true,
    };
  }
}

function extractMetadata(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const keywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  
  // Extract headings
  const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)];
  const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi)];
  
  return {
    title: titleMatch?.[1]?.trim() || '',
    description: descMatch?.[1]?.trim() || '',
    keywords: keywordsMatch?.[1]?.trim() || '',
    h1Tags: h1Matches.map(m => m[1].trim()).slice(0, 5),
    h2Tags: h2Matches.map(m => m[1].trim()).slice(0, 10),
  };
}

async function analyzeWithAI(html: string, metadata: any, website: string, companyName: string) {
  // Trim HTML to relevant content (max 8000 chars for API)
  const contentSample = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000);

  const prompt = `Je bent een expert in bedrijfsanalyse en content strategie. Analyseer deze website en geef een VOLLEDIG en GEDETAILLEERD profiel.

WEBSITE: ${website}
BEDRIJF: ${companyName}

METADATA:
- Titel: ${metadata.title}
- Beschrijving: ${metadata.description}
- H1: ${metadata.h1Tags.join(', ')}
- H2: ${metadata.h2Tags.slice(0, 5).join(', ')}

CONTENT SAMPLE:
${contentSample}

Geef een COMPLETE analyse in JSON formaat met ALLE velden ingevuld:

{
  "websiteName": "Exacte naam van de website/bedrijf",
  "companyDescription": "Uitgebreide beschrijving van het bedrijf (min 200 woorden) - wat doen ze, hun missie, hun aanpak",
  "targetAudience": "Gedetailleerde beschrijving van de doelgroep (min 100 woorden) - wie zijn de ideale klanten, hun kenmerken, behoeften",
  "problemStatement": "Welk specifiek probleem lossen ze op voor hun klanten? (min 80 woorden)",
  "solutionStatement": "Hoe lost dit bedrijf het probleem op? Wat maakt hun oplossing uniek? (min 100 woorden)",
  "uniqueFeatures": ["Feature 1", "Feature 2", "Feature 3", "..."] (minimaal 5 unieke features),
  "contentStyle": ["Conversational", "Professional", "Informative"] (kies 1-3),
  "toneOfVoice": "Gedetailleerde beschrijving van de gewenste tone of voice voor content (min 50 woorden)",
  "brandAccentColor": "Primaire merkkleur (hex code of naam)",
  "suggestedKeywords": ["keyword1", "keyword2", "..."] (minimaal 20 relevante keywords),
  "contentTopics": ["Topic 1", "Topic 2", "..."] (minimaal 15 content onderwerpen),
  "competitorInsights": "Analyse van mogelijke concurrenten en positionering (min 100 woorden)",
  "seoOpportunities": "SEO kansen en aanbevelingen (min 100 woorden)"
}

BELANGRIJK: 
- Vul ALLE velden volledig in
- Wees specifiek en gedetailleerd
- Minimale woordaantallen zijn VERPLICHT
- Als informatie niet beschikbaar is, maak dan educate guesses gebaseerd op de industrie en bedrijfsnaam`;

  try {
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert business analyst die gedetailleerde bedrijfsprofielen maakt. Geef altijd complete, uitgebreide antwoorden in perfect JSON formaat.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // Extract JSON from response (may be wrapped in markdown)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log('✅ AI analysis completed successfully');
    
    return analysis;
  } catch (error) {
    console.error('AI analysis error:', error);
    return await generateFallbackProfile(website, companyName);
  }
}

async function generateFallbackProfile(website: string, companyName: string) {
  // Simplified fallback profile based on company name
  const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  
  return {
    websiteName: companyName || domain,
    companyDescription: `${companyName} is een innovatief bedrijf dat hoogwaardige diensten levert aan hun klanten. Ze onderscheiden zich door hun klantgerichte aanpak en expertise in hun vakgebied. Met jaren ervaring helpen ze bedrijven en particulieren met professionele oplossingen die écht werken.`,
    targetAudience: `De doelgroep van ${companyName} bestaat uit moderne professionals en bedrijven die op zoek zijn naar betrouwbare, kwalitatieve diensten. Dit zijn mensen die waarde hechten aan expertise, service en resultaat.`,
    problemStatement: `Klanten worstelen vaak met het vinden van een betrouwbare partner die écht begrijpt wat ze nodig hebben en dit ook kan leveren met de juiste kwaliteit en service.`,
    solutionStatement: `${companyName} biedt de perfecte oplossing door een combinatie van ervaring, expertise en persoonlijke aandacht. Ze werken nauw samen met elke klant om maatwerk oplossingen te leveren die écht resultaat opleveren.`,
    uniqueFeatures: [
      'Persoonlijke aanpak en maatwerk',
      'Jaren ervaring in het vakgebied',
      'Klantgerichte service',
      'Bewezen resultaten',
      'Transparante communicatie'
    ],
    contentStyle: ['Professional', 'Informative'],
    toneOfVoice: 'Professioneel maar toegankelijk. We gebruiken "je/jij" om de drempel laag te houden, maar blijven deskundig en betrouwbaar overkomen.',
    brandAccentColor: '#FF6B35',
    suggestedKeywords: [
      companyName.toLowerCase(),
      `${companyName.toLowerCase()} diensten`,
      `beste ${companyName.toLowerCase()}`,
      'professionele dienstverlening',
      'betrouwbare service'
    ],
    contentTopics: [
      'Introductie en bedrijfsoverzicht',
      'Diensten en oplossingen',
      'Waarom kiezen voor ons',
      'Succesverhalen en cases',
      'Veelgestelde vragen'
    ],
    competitorInsights: `In deze markt is er veel concurrentie, maar ${companyName} onderscheidt zich door focus op kwaliteit en klantbeleving.`,
    seoOpportunities: `Focus op long-tail keywords en lokale SEO kan goede resultaten opleveren. Content over specifieke diensten en veel gestelde vragen helpt bij vindbaarheid.`
  };
}

async function createOrUpdateAIProfile(clientId: string, scanResults: any) {
  const { aiAnalysis, metadata } = scanResults;
  
  // Check if profile exists
  const existing = await prisma.clientAIProfile.findUnique({
    where: { clientId },
  });

  const profileData = {
    websiteName: aiAnalysis.websiteName,
    websiteUrl: scanResults.website,
    companyDescription: aiAnalysis.companyDescription,
    targetAudience: aiAnalysis.targetAudience,
    problemStatement: aiAnalysis.problemStatement,
    solutionStatement: aiAnalysis.solutionStatement,
    uniqueFeatures: aiAnalysis.uniqueFeatures || [],
    contentStyle: aiAnalysis.contentStyle || ['Professional'],
    toneOfVoice: aiAnalysis.toneOfVoice,
    brandAccentColor: aiAnalysis.brandAccentColor,
    contentLanguage: 'Dutch',
    imageSize: '1536x1024',
    imageStyle: 'Modern Gradient Illustration',
    aiScanCompleted: true,
    lastAIScanAt: new Date(),
    aiScanResults: JSON.stringify(aiAnalysis),
  };

  if (existing) {
    return await prisma.clientAIProfile.update({
      where: { clientId },
      data: profileData,
    });
  } else {
    return await prisma.clientAIProfile.create({
      data: {
        ...profileData,
        clientId,
      },
    });
  }
}

async function generateMasterContentPlan(clientId: string, scanResults: any) {
  console.log(`📝 Generating Master Content Plan for client ${clientId}`);
  
  const { aiAnalysis } = scanResults;
  
  // Check if master plan exists
  const existing = await prisma.masterContentPlan.findUnique({
    where: { clientId },
  });

  if (existing) {
    console.log('✅ Master Content Plan already exists');
    return existing;
  }

  // Generate 200 article topics using AI
  const articles = await generateArticleTopics(clientId, aiAnalysis);
  
  // Create master plan
  const masterPlan = await prisma.masterContentPlan.create({
    data: {
      clientId,
      totalArticles: 200,
      status: 'READY',
      jimAnalysisData: JSON.stringify({
        method: 'Writgo Methode',
        analysisDate: new Date().toISOString(),
        keywords: aiAnalysis.suggestedKeywords || [],
        topics: aiAnalysis.contentTopics || [],
      }),
      websiteAnalysis: JSON.stringify(scanResults),
      keywordResearch: JSON.stringify({
        primaryKeywords: aiAnalysis.suggestedKeywords?.slice(0, 50) || [],
        lsiKeywords: aiAnalysis.suggestedKeywords?.slice(50) || [],
      }),
      seoStrategy: aiAnalysis.seoOpportunities || 'SEO strategie wordt verder ontwikkeld',
    },
  });

  // Create all 200 master articles
  const masterArticles = articles.map((article: any, index: number) => ({
    masterPlanId: masterPlan.id,
    articleNumber: index + 1,
    title: article.title,
    topic: article.topic,
    mainKeyword: article.mainKeyword,
    lsiKeywords: article.lsiKeywords,
    targetWordCount: article.wordCount || 1500,
    difficulty: article.difficulty || 'MEDIUM',
    category: article.category,
    contentType: article.contentType,
    priority: index < 20 ? 'HIGH' : index < 100 ? 'MEDIUM' : 'LOW',
    status: 'LOCKED',
  }));

  await prisma.masterArticle.createMany({
    data: masterArticles,
  });

  console.log(`✅ Created Master Content Plan with ${masterArticles.length} articles`);
  
  return masterPlan;
}

async function generateArticleTopics(clientId: string, aiAnalysis: any) {
  console.log('🤖 Generating 200 article topics with AI...');
  
  const prompt = `Je bent een content strategie expert. Genereer een COMPLETE content strategie met 200 artikel titels voor dit bedrijf.

BEDRIJF PROFIEL:
- Naam: ${aiAnalysis.websiteName}
- Beschrijving: ${aiAnalysis.companyDescription}
- Doelgroep: ${aiAnalysis.targetAudience}
- Probleem: ${aiAnalysis.problemStatement}
- Oplossing: ${aiAnalysis.solutionStatement}
- Keywords: ${aiAnalysis.suggestedKeywords?.slice(0, 20).join(', ')}

Maak 200 artikel titels verdeeld over deze categorieën volgens de Writgo methode:

1. INFORMATIEF (40 artikelen) - Educatieve content over het vakgebied
2. PROBLEEM/OPLOSSING (40 artikelen) - Specifieke problemen en oplossingen
3. HOW-TO GUIDES (40 artikelen) - Praktische handleidingen
4. VERGELIJKINGEN (20 artikelen) - Product/service vergelijkingen
5. LIJST ARTIKELEN (20 artikelen) - Top 10, best practices, etc.
6. CASE STUDIES (20 artikelen) - Voorbeelden en succesverhalen
7. TRENDS & NIEUWS (20 artikelen) - Actuele ontwikkelingen

Geef output in dit JSON formaat (array van 200 artikelen):
[
  {
    "title": "Volledige artikel titel",
    "topic": "Kort topic",
    "mainKeyword": "hoofd keyword",
    "lsiKeywords": ["lsi1", "lsi2", "lsi3"],
    "wordCount": 1500,
    "difficulty": "Easy|Medium|Hard",
    "category": "INFORMATIEF|PROBLEEM_OPLOSSING|HOW_TO|VERGELIJKING|LIJST|CASE_STUDY|TRENDS",
    "contentType": "Informational|Commercial|How-to|Comparison|Listicle"
  }
]

BELANGRIJKE REGELS:
- Alle titels moeten SEO-geoptimaliseerd zijn
- Gebruik long-tail keywords
- Zorg voor variatie in moeilijkheidsgraad
- Elk artikel moet uniek en waardevol zijn
- Focus op de doelgroep en hun vragen`;

  try {
    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert content strateeg die complete content plannen maakt met 200 artikelen. Geef altijd perfect geformatteerd JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // Extract JSON array
    const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }
    
    let articles = JSON.parse(jsonMatch[0]);
    
    // Ensure we have exactly 200 articles
    while (articles.length < 200) {
      articles.push({
        title: `${aiAnalysis.websiteName} - Artikel ${articles.length + 1}`,
        topic: `Topic ${articles.length + 1}`,
        mainKeyword: aiAnalysis.suggestedKeywords?.[articles.length % 20] || 'algemeen',
        lsiKeywords: ['related1', 'related2', 'related3'],
        wordCount: 1500,
        difficulty: 'MEDIUM',
        category: 'INFORMATIEF',
        contentType: 'Informational',
      });
    }
    
    articles = articles.slice(0, 200);
    
    console.log(`✅ Generated ${articles.length} article topics`);
    return articles;
    
  } catch (error) {
    console.error('Error generating article topics:', error);
    
    // Fallback: Generate basic article structure
    return generateFallbackArticles(aiAnalysis);
  }
}

function generateFallbackArticles(aiAnalysis: any) {
  const articles = [];
  const categories = [
    { name: 'INFORMATIEF', count: 40, type: 'Informational' },
    { name: 'PROBLEEM_OPLOSSING', count: 40, type: 'Problem-Solution' },
    { name: 'HOW_TO', count: 40, type: 'How-to' },
    { name: 'VERGELIJKING', count: 20, type: 'Comparison' },
    { name: 'LIJST', count: 20, type: 'Listicle' },
    { name: 'CASE_STUDY', count: 20, type: 'Case Study' },
    { name: 'TRENDS', count: 20, type: 'Trends' },
  ];

  const keywords = aiAnalysis.suggestedKeywords || ['algemeen', 'diensten', 'oplossingen'];
  const topics = aiAnalysis.contentTopics || ['Algemeen', 'Diensten', 'Producten'];

  let articleNumber = 1;
  for (const cat of categories) {
    for (let i = 0; i < cat.count; i++) {
      const keyword = keywords[articleNumber % keywords.length] || 'algemeen';
      const topic = topics[articleNumber % topics.length] || 'Algemeen';
      
      articles.push({
        title: `${topic} - ${cat.type} ${articleNumber}`,
        topic: topic,
        mainKeyword: keyword,
        lsiKeywords: [
          `${keyword} tips`,
          `${keyword} gids`,
          `${keyword} informatie`
        ],
        wordCount: 1500,
        difficulty: i < 10 ? 'Easy' : i < 30 ? 'Medium' : 'Hard',
        category: cat.name,
        contentType: cat.type,
      });
      
      articleNumber++;
    }
  }

  return articles;
}
