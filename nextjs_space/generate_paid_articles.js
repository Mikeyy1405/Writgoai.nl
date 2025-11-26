require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generatePaidArticles() {
  try {
    console.log('🔍 Checking Mike\'s subscription...\n');
    
    const client = await prisma.client.findUnique({
      where: { email: 'mikeschonewille@gmail.com' },
      include: {
        ClientSubscription: {
          include: { Package: true }
        },
        AIProfile: true,
        Task: true,
        MasterContentPlan: true
      }
    });

    if (!client) {
      console.log('❌ Client niet gevonden');
      return;
    }

    // Get any user to assign as creator
    let adminUser = await prisma.user.findFirst();

    if (!adminUser) {
      console.log('⚠️  Geen user gevonden, aanmaken admin user...');
      const bcrypt = require('bcryptjs');
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@WritgoAI.nl',
          name: 'WritGo Admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user aangemaakt\n');
    }

    // Get subscription info
    const subscription = client.ClientSubscription?.[0];
    const articlesPerMonth = subscription?.Package?.articlesPerMonth || 15;
    const packageName = subscription?.Package?.name || 'Pro (default)';

    console.log(`📦 Subscription: ${packageName}`);
    console.log(`📊 Artikelen per maand: ${articlesPerMonth}\n`);

    // Check existing tasks
    const existingTasks = client.Task.length;
    console.log(`📝 Bestaande tasks: ${existingTasks}`);

    if (existingTasks >= articlesPerMonth) {
      console.log(`✅ Client heeft al genoeg artikelen (${existingTasks}/${articlesPerMonth})`);
      return;
    }

    const toGenerate = articlesPerMonth - existingTasks;
    console.log(`🎯 Te genereren: ${toGenerate} nieuwe artikelen\n`);

    // Clean up old master plan if exists
    if (client.MasterContentPlan) {
      await prisma.masterArticle.deleteMany({
        where: { masterPlanId: client.MasterContentPlan.id }
      });
      await prisma.masterContentPlan.delete({
        where: { id: client.MasterContentPlan.id }
      });
      console.log('🗑️  Oude Master Content Plan verwijderd\n');
    }

    // Get AI Profile
    const aiProfile = client.AIProfile;
    if (!aiProfile) {
      console.log('❌ Geen AI Profile gevonden');
      return;
    }

    console.log('🤖 Genereren artikelen volgens Jim\'s methode...\n');

    const jimPrompt = `
🎯 **JIM VAN DEN HEUVEL METHODE - CONTENT PLAN**

Genereer ${toGenerate} artikelen voor een AI Content Agency (WritGo).

**BEDRIJFSINFO:**
- Website: ${aiProfile.websiteUrl || 'WritgoAI.nl'}
- Bedrijf: ${aiProfile.websiteName || 'WritGo Media'}
- Niche: AI-gedreven content automatisering, social media, YouTube automation
- Doelgroep: Nederlandse ondernemers en bedrijven die content willen uitbesteden

**JIM'S STRATEGIE:**
Focus op commerciële keywords met koopintentie en praktische how-to content.

**CONTENT MIX:**
- 40% Social Media Marketing & Automatisering
- 30% Content Creatie & AI Tools
- 20% YouTube & Video Marketing  
- 10% SEO & Business tips

**PRIORITERING:**
- Prioriteer "easy win" keywords (zoekvolume 200-1000, lage competitie)
- Mix van informatief en commercieel
- Nederlandse long-tail keywords

**OUTPUT FORMAT - Genereer EXACT ${toGenerate} artikelen als JSON array:**

[
  {
    "title": "Social Media Automatiseren: 5 Tools voor Ondernemers (2025)",
    "topic": "Beste tools voor social media automatisering uitgelegd",
    "mainKeyword": "social media automatiseren",
    "lsiKeywords": ["social media planning tool", "content automatisering", "buffer alternative"],
    "targetWordCount": 1800,
    "searchVolume": 590,
    "difficulty": "Easy",
    "category": "Social Media",
    "contentType": "Tool Review",
    "priority": "HIGH"
  }
]

**BELANGRIJKE EISEN:**
- Alle titels uniek en klikwaardig met jaartal (2025)
- Nederlandse keywords met realistische zoekvolume
- Content types: How-to, Tool Review, Listicle, Comparison, Guide
- Woordaantal: 1200-2000 woorden
- Mix difficulty: vooral Easy en Medium
- Relevante LSI keywords (3-5 per artikel)

Genereer nu de JSON array met PRECIES ${toGenerate} artikelen.
BELANGRIJK: Geef ALLEEN de JSON array terug, geen extra tekst!
`;

    const openaiApiKey = process.env.ABACUSAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('API key not configured');
    }

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
            content: 'Je bent een SEO expert die content plannen maakt volgens Jim van den Heuvel methode. Je genereert ALLEEN geldige JSON arrays.',
          },
          { role: 'user', content: jimPrompt },
        ],
        temperature: 0.85,
        max_tokens: 6000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse JSON
    let articles;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      articles = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
      console.error('❌ Failed to parse AI response');
      console.error('Content:', content.substring(0, 500));
      throw error;
    }

    if (!Array.isArray(articles) || articles.length < 1) {
      throw new Error(`No articles generated`);
    }

    console.log(`✅ ${articles.length} artikelen gegenereerd!\n`);

    // Create tasks directly (no master plan needed)
    console.log('💾 Aanmaken tasks in database...\n');

    for (let i = 0; i < Math.min(articles.length, toGenerate); i++) {
      const article = articles[i];
      
      await prisma.task.create({
        data: {
          clientId: client.id,
          createdById: adminUser.id,
          title: article.title || `Artikel ${i + 1}`,
          description: `**Topic:** ${article.topic || ''}\n\n**Main Keyword:** ${article.mainKeyword || ''}\n\n**LSI Keywords:** ${(article.lsiKeywords || []).join(', ')}\n\n**Target Word Count:** ${article.targetWordCount || 1500}\n\n**Content Type:** ${article.contentType || 'Article'}\n\n**Category:** ${article.category || 'General'}`,
          status: 'TODO',
          category: 'CONTENT_AUTOMATION',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          notes: JSON.stringify({
            mainKeyword: article.mainKeyword,
            lsiKeywords: article.lsiKeywords,
            targetWordCount: article.targetWordCount,
            searchVolume: article.searchVolume,
            difficulty: article.difficulty,
            contentCategory: article.category,
            contentType: article.contentType,
            priority: article.priority,
            jimMethod: true
          }),
        },
      });

      console.log(`  ✓ ${i + 1}. ${article.title}`);
    }

    console.log(`\n✅ ${Math.min(articles.length, toGenerate)} tasks aangemaakt!\n`);
    console.log('📊 OVERZICHT:\n');
    
    // Show summary
    const tasksByPriority = {};
    articles.slice(0, toGenerate).forEach(a => {
      tasksByPriority[a.priority] = (tasksByPriority[a.priority] || 0) + 1;
    });

    Object.entries(tasksByPriority).forEach(([priority, count]) => {
      console.log(`${priority}: ${count} artikelen`);
    });

    console.log('\n🎯 Eerste 5 artikelen:');
    articles.slice(0, Math.min(5, toGenerate)).forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   Keyword: ${article.mainKeyword} (${article.searchVolume || 'N/A'} zoekvolume)`);
      console.log(`   Type: ${article.contentType} | Difficulty: ${article.difficulty} | Priority: ${article.priority}`);
    });

    console.log(`\n✅ KLAAR! ${toGenerate} artikelen gegenereerd volgens Jim's methode voor ${packageName} subscription.`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

generatePaidArticles();
