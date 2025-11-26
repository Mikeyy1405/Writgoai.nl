require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function regenerateContentPlan() {
  try {
    console.log('🗑️  Verwijderen oude test data...\n');
    
    // Find client
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' },
      include: {
        MasterContentPlan: true,
        Task: true
      }
    });

    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }

    // Delete old tasks
    if (client.Task.length > 0) {
      await prisma.task.deleteMany({
        where: { clientId: client.id }
      });
      console.log(`✅ ${client.Task.length} oude tasks verwijderd`);
    }

    // Delete old master plan and articles
    if (client.MasterContentPlan) {
      await prisma.masterArticle.deleteMany({
        where: { masterPlanId: client.MasterContentPlan.id }
      });
      await prisma.masterContentPlan.delete({
        where: { id: client.MasterContentPlan.id }
      });
      console.log('✅ Oud Master Content Plan verwijderd');
    }

    console.log('\n🤖 Genereren nieuw Master Content Plan volgens Jim\'s methode...\n');
    console.log('Dit duurt 2-3 minuten...\n');

    // Get AI Profile
    const aiProfile = await prisma.clientAIProfile.findUnique({
      where: { clientId: client.id }
    });

    if (!aiProfile) {
      console.log('❌ Geen AI Profile gevonden');
      return;
    }

    // Create new master plan
    const masterPlan = await prisma.masterContentPlan.create({
      data: {
        clientId: client.id,
        status: 'GENERATING',
        totalArticles: 200,
      },
    });

    // Generate content plan using Jim's method
    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('API key not configured');
    }

    const jimPrompt = `
🎯 **JIM VAN DEN HEUVEL METHODE - CONTENT PLAN GENERATOR**

Je bent een expert SEO content strateeg die de bewezen methode van Jim van den Heuvel toepast.
Jim verdiende €10.000+/maand met affiliate marketing door systematische content planning.

**WEBSITE INFORMATIE:**
- URL: ${aiProfile.websiteUrl}
- Bedrijf: ${aiProfile.websiteName || 'Writgo Media'}
- Beschrijving: ${aiProfile.companyDescription || 'AI Content Agency'}
- Doelgroep: ${aiProfile.targetAudience || 'Ondernemers en bedrijven'}
- Specialisatie: Geautomatiseerde content creatie voor social media, YouTube en websites

**OPDRACHT:**
Genereer een COMPLEET content plan van PRECIES 200 artikelen volgens Jim's methode.

**JIM'S STRATEGIE:**
1. **Content Marketing Focus** - Artikelen over content strategy, social media, automation
2. **Commercieel** - Reviews van tools, vergelijkingen, "beste" lijsten
3. **Problem-solution** - Pain points oplossen (tijdgebrek, lage engagement, etc.)
4. **How-to Guides** - Praktische handleidingen
5. **SEO Focus** - Long-tail keywords met commerciële intent

**CONTENT MIX (200 artikelen):**
- 60 artikelen: Social Media Marketing (Instagram, LinkedIn, Facebook, TikTok)
- 50 artikelen: Content Creatie & AI tools
- 40 artikelen: YouTube & Video Marketing
- 30 artikelen: SEO & Bloggen
- 20 artikelen: Business & Productiviteit

**PRIORITERING:**
- 50 HIGH priority (easy wins, low competition, high commercial value)
- 100 MEDIUM priority (steady traffic builders)
- 50 LOW priority (long-term, competitive keywords)

**OUTPUT FORMAT - JSON:**
Genereer EXACT 200 artikelen in deze JSON structuur:

[
  {
    "articleNumber": 1,
    "title": "Social Media Uitbesteden: 7 Voordelen voor Ondernemers in 2025",
    "topic": "De voordelen van social media uitbesteden uitgelegd",
    "mainKeyword": "social media uitbesteden",
    "lsiKeywords": ["social media automation", "content agency", "online marketing uitbesteden"],
    "targetWordCount": 1800,
    "searchVolume": 720,
    "difficulty": "Easy",
    "category": "Social Media",
    "contentType": "Informational",
    "priority": "HIGH"
  }
]

**BELANGRIJKE EISEN:**
1. Alle titels moeten UNIEK en KLIKWAARDIG zijn
2. Nederlandse keywords met zoekvolume
3. Varieer content types: Informational, How-to, Commercial, Review, Comparison, Listicle
4. Realistische search volumes (100-5000)
5. Mix difficulty: Easy, Medium, Hard
6. Woordenaantal: 1000-2500 woorden
7. Relevante LSI keywords (3-5 per artikel)

**KEYWORD FOCUS VOORBEELDEN:**
- "content automation tools vergelijken"
- "instagram reels laten maken"
- "youtube video ideeën voor bedrijven"
- "social media planning tool"
- "blog schrijven laten doen kosten"
- "faceless youtube kanaal starten"

Genereer nu de volledige JSON array met alle 200 artikelen.
BELANGRIJK: Geef ALLEEN de JSON array terug, geen extra tekst of uitleg!
`;

    console.log('📡 Calling AI to generate content plan...\n');

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
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
            content: 'Je bent een expert SEO content strateeg die complete content plannen genereert volgens Jim van den Heuvel methode. Je genereert ALLEEN geldige JSON arrays, zonder extra tekst.',
          },
          { role: 'user', content: jimPrompt },
        ],
        temperature: 0.8,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON response
    let articles;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      articles = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
      console.error('Failed to parse AI response');
      console.error('Content:', content.substring(0, 500));
      throw error;
    }

    console.log(`📊 Ontvangen ${articles.length} artikelen van AI\n`);

    if (!Array.isArray(articles) || articles.length < 10) {
      throw new Error(`Insufficient articles generated: ${articles.length}`);
    }

    // If we got less than 200, generate more batches
    let allArticles = [...articles];
    let batchNumber = 2;
    
    while (allArticles.length < 200 && batchNumber <= 20) {
      console.log(`🔄 Genereren batch ${batchNumber}... (${allArticles.length}/200)`);
      
      const batchPrompt = `Genereer ALLEEN een JSON array met ${Math.min(20, 200 - allArticles.length)} NIEUWE artikelen voor ${aiProfile.websiteName || 'Writgo Media'}. Geen duplicaten van: ${allArticles.slice(-10).map(a => a.mainKeyword).join(', ')}. Start article number bij ${allArticles.length + 1}. Format: [{articleNumber, title, topic, mainKeyword, lsiKeywords[], targetWordCount, searchVolume, difficulty, category, contentType, priority}]`;
      
      const batchResponse = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Je genereert ALLEEN geldige JSON arrays met artikelen. Geen extra tekst.' },
            { role: 'user', content: batchPrompt },
          ],
          temperature: 0.9,
          max_tokens: 4000,
        }),
      });
      
      if (batchResponse.ok) {
        const batchData = await batchResponse.json();
        const batchContent = batchData.choices[0]?.message?.content || '[]';
        
        try {
          const jsonMatch = batchContent.match(/\[[\s\S]*\]/);
          const batchArticles = JSON.parse(jsonMatch ? jsonMatch[0] : batchContent);
          
          if (Array.isArray(batchArticles) && batchArticles.length > 0) {
            allArticles = [...allArticles, ...batchArticles];
          }
        } catch (e) {
          console.log(`⚠️  Batch ${batchNumber} parsing failed, skipping`);
        }
      }
      
      batchNumber++;
    }
    
    // Take first 200
    articles = allArticles.slice(0, 200);

    console.log(`✅ ${articles.length} artikelen gegenereerd!\n`);
    console.log('💾 Opslaan in database...\n');

    // Insert articles into database
    const articlesToCreate = articles.map((article, index) => ({
      masterPlanId: masterPlan.id,
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
      status: 'LOCKED',
    }));

    // Batch insert
    await prisma.masterArticle.createMany({
      data: articlesToCreate,
    });

    // Update master plan status
    await prisma.masterContentPlan.update({
      where: { id: masterPlan.id },
      data: {
        status: 'READY',
        jimAnalysisData: JSON.stringify(articles),
      },
    });

    console.log('✅ Master Content Plan opgeslagen!\n');
    console.log('📊 OVERZICHT:\n');
    console.log(`Total artikelen: ${articles.length}`);
    
    // Count by priority
    const highPriority = articles.filter(a => a.priority === 'HIGH').length;
    const mediumPriority = articles.filter(a => a.priority === 'MEDIUM').length;
    const lowPriority = articles.filter(a => a.priority === 'LOW').length;
    
    console.log(`HIGH priority: ${highPriority}`);
    console.log(`MEDIUM priority: ${mediumPriority}`);
    console.log(`LOW priority: ${lowPriority}`);
    
    console.log('\n🎯 Eerste 10 HIGH priority artikelen:');
    articles.filter(a => a.priority === 'HIGH').slice(0, 10).forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   Keyword: ${article.mainKeyword} (${article.searchVolume || 'N/A'} searches)`);
      console.log(`   Type: ${article.contentType} | Difficulty: ${article.difficulty}`);
    });

    console.log('\n✅ KLAAR! Het nieuwe Master Content Plan is gegenereerd volgens Jim\'s methode.');
    console.log('\n💡 De eerste 15 artikelen kunnen nu automatisch vrijgegeven worden voor de Pro subscription.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

regenerateContentPlan();
