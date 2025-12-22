import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Create admin client for background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Language configuration
const LANGUAGE_CONFIG: Record<string, {
  name: string;
  locationCode: number;
  modifiers: string[];
}> = {
  nl: {
    name: 'Nederlands',
    locationCode: 2528,
    modifiers: [
      'hoe', 'wat is', 'waarom', 'wanneer', 'welke', 'hoeveel',
      'vs', 'versus', 'of', 'beste', 'top 10', 'top 5', 'vergelijking',
      'kopen', 'gratis', 'goedkoop', 'premium', 'review', 'ervaringen', 'kosten', 'prijzen',
      'beginners', 'gevorderden', 'professionals', 'bedrijven', 'mkb', 'starters',
      'tips', 'handleiding', 'checklist', 'template', 'voorbeeld', 'stappenplan',
    ],
  },
  en: {
    name: 'English',
    locationCode: 2840,
    modifiers: [
      'how to', 'what is', 'why', 'when', 'which', 'how much',
      'vs', 'versus', 'or', 'best', 'top 10', 'top 5', 'comparison',
      'buy', 'free', 'cheap', 'premium', 'review', 'reviews', 'cost', 'pricing',
      'beginners', 'advanced', 'professionals', 'business', 'enterprise', 'startups',
      'tips', 'guide', 'checklist', 'template', 'example', 'step by step',
    ],
  },
  de: {
    name: 'Deutsch',
    locationCode: 2276,
    modifiers: [
      'wie', 'was ist', 'warum', 'wann', 'welche', 'wie viel',
      'vs', 'versus', 'oder', 'beste', 'top 10', 'top 5', 'vergleich',
      'kaufen', 'kostenlos', 'günstig', 'premium', 'bewertung', 'erfahrungen', 'kosten', 'preise',
    ],
  },
  fr: {
    name: 'Français',
    locationCode: 2250,
    modifiers: [
      'comment', 'qu\'est-ce que', 'pourquoi', 'quand', 'quel', 'combien',
      'vs', 'versus', 'ou', 'meilleur', 'top 10', 'top 5', 'comparaison',
      'acheter', 'gratuit', 'pas cher', 'premium', 'avis', 'expériences', 'coût', 'prix',
    ],
  },
  es: {
    name: 'Español',
    locationCode: 2724,
    modifiers: [
      'cómo', 'qué es', 'por qué', 'cuándo', 'cuál', 'cuánto',
      'vs', 'versus', 'o', 'mejor', 'top 10', 'top 5', 'comparación',
      'comprar', 'gratis', 'barato', 'premium', 'reseña', 'opiniones', 'costo', 'precios',
    ],
  },
};

// Detect website language
async function detectWebsiteLanguage(websiteUrl: string): Promise<{ language: string; languageName: string }> {
  try {
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const html = await response.text();
      
      const langMatch = html.match(/<html[^>]*lang=["']([a-z]{2})/i);
      if (langMatch) {
        const lang = langMatch[1].toLowerCase();
        if (LANGUAGE_CONFIG[lang]) {
          return { language: lang, languageName: LANGUAGE_CONFIG[lang].name };
        }
      }
      
      const url = new URL(websiteUrl);
      const tld = url.hostname.split('.').pop()?.toLowerCase();
      if (tld === 'nl') return { language: 'nl', languageName: 'Nederlands' };
      if (tld === 'de' || tld === 'at' || tld === 'ch') return { language: 'de', languageName: 'Deutsch' };
      if (tld === 'fr') return { language: 'fr', languageName: 'Français' };
      if (tld === 'es') return { language: 'es', languageName: 'Español' };
    }
  } catch (e) {
    console.warn('Language detection failed:', e);
  }
  
  try {
    const url = new URL(websiteUrl);
    if (url.hostname.endsWith('.nl')) {
      return { language: 'nl', languageName: 'Nederlands' };
    }
  } catch {}
  
  return { language: 'en', languageName: 'English' };
}

// Start background job
export async function POST(request: Request) {
  try {
    const { website_url, project_id, user_id } = await request.json();

    if (!website_url) {
      return NextResponse.json({ error: 'Website URL is required' }, { status: 400 });
    }

    // Get user from session if not provided
    let userId = user_id;
    if (!userId) {
      const supabase = createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    }

    // Create job in database
    const { data: job, error: insertError } = await supabaseAdmin
      .from('content_plan_jobs')
      .insert({
        user_id: userId,
        project_id,
        website_url,
        status: 'processing',
        progress: 0,
        current_step: 'Initialiseren...',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to create job:', insertError);
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    // Start background processing (don't await - fire and forget)
    processContentPlan(job.id, website_url).catch(err => {
      console.error('Background job error:', err);
      supabaseAdmin
        .from('content_plan_jobs')
        .update({ 
          status: 'failed', 
          error: err.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id)
        .then(() => {});
    });

    return NextResponse.json({ jobId: job.id, status: 'processing' });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get job status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId');

    if (jobId) {
      // Get specific job
      const { data: job, error } = await supabaseAdmin
        .from('content_plan_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error || !job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return NextResponse.json(job);
    } else if (userId) {
      // Get latest job for user
      const { data: jobs, error } = await supabaseAdmin
        .from('content_plan_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !jobs || jobs.length === 0) {
        return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
      }

      return NextResponse.json(jobs[0]);
    }

    return NextResponse.json({ error: 'Job ID or User ID is required' }, { status: 400 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update job in database
async function updateJob(jobId: string, updates: any) {
  const { error } = await supabaseAdmin
    .from('content_plan_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  
  if (error) {
    console.error('Failed to update job:', error);
  }
}

// Background processing function
async function processContentPlan(jobId: string, websiteUrl: string) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Step 1: Detect language
    await updateJob(jobId, { progress: 5, current_step: '🌍 Taal detecteren...' });
    const { language, languageName } = await detectWebsiteLanguage(websiteUrl);
    const langConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG['en'];

    await updateJob(jobId, { 
      progress: 10, 
      current_step: `🌍 Taal gedetecteerd: ${languageName}`,
      language,
    });

    const languageInstructions: Record<string, string> = {
      nl: 'Schrijf ALLES in het Nederlands. Gebruik "je" en "jij" (informeel).',
      en: 'Write EVERYTHING in English.',
      de: 'Schreibe ALLES auf Deutsch. Verwende "du" (informell).',
      fr: 'Écrivez TOUT en français. Utilisez "tu" (informel).',
      es: 'Escribe TODO en español. Usa "tú" (informal).',
    };

    // Step 2: Scrape website content for better niche detection
    await updateJob(jobId, { progress: 15, current_step: '🔍 Website content analyseren...' });

    let websiteContent = '';
    try {
      const response = await fetch(websiteUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WritGoBot/1.0)' },
        signal: AbortSignal.timeout(15000),
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Extract title
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        
        // Extract meta description
        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
        const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';
        
        // Extract headings
        const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
        const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
        const headings = [...h1Matches, ...h2Matches]
          .map(h => h.replace(/<[^>]+>/g, '').trim())
          .filter(h => h.length > 3)
          .slice(0, 20);
        
        // Extract main text content (remove scripts, styles, etc.)
        let textContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
          .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
          .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 5000);
        
        websiteContent = `
Titel: ${title}
Meta beschrijving: ${metaDesc}
Koppen: ${headings.join(', ')}
Content: ${textContent.slice(0, 3000)}
`.trim();
      }
    } catch (e) {
      console.warn('Website scraping failed:', e);
    }

    const currentMonth = now.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'long' });

    const nichePrompt = `Analyseer deze website en bepaal de EXACTE niche op basis van de content:

Website URL: ${websiteUrl}
${websiteContent ? `\n--- WEBSITE CONTENT ---\n${websiteContent}\n--- EINDE CONTENT ---\n` : ''}
Datum: ${currentMonth} ${currentYear}

${languageInstructions[language]}

BELANGRIJK: Bepaal de niche op basis van de DAADWERKELIJKE content van de website, NIET op basis van de URL alleen.
Als de website over yoga gaat, is de niche "Yoga" of "Yoga en mindfulness", NIET "Content marketing".
Als de website over koken gaat, is de niche "Koken" of "Recepten", etc.

Output als JSON:
{
  "niche": "Specifieke niche naam in ${languageName} (bijv. Yoga, Fitness, Koken, etc.)",
  "competitionLevel": "low|medium|high|very_high",
  "pillarTopics": [
    {
      "topic": "Pillar topic naam relevant voor de niche",
      "estimatedArticles": 30,
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ],
  "totalArticlesNeeded": 500,
  "reasoning": "Uitleg waarom deze niche is gekozen in ${languageName}"
}`;

    let nicheData: any = {
      niche: 'Content Marketing',
      competitionLevel: 'medium',
      pillarTopics: [],
      totalArticlesNeeded: 500,
      reasoning: 'Default'
    };

    try {
      const nicheResponse = await generateAICompletion({
        task: 'content',
        systemPrompt: `SEO expert. ${languageInstructions[language]} Output JSON.`,
        userPrompt: nichePrompt,
        maxTokens: 2000,
        temperature: 0.6,
      });

      const jsonMatch = nicheResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nicheData = { ...nicheData, ...JSON.parse(jsonMatch[0]) };
      }
    } catch (e) {
      console.warn('Niche detection failed:', e);
    }

    const targetCount = Math.min(Math.max(nicheData.totalArticlesNeeded || 500, 100), 2000);

    await updateJob(jobId, { 
      progress: 25, 
      current_step: `✅ Niche: ${nicheData.niche}`,
      niche: nicheData.niche,
      target_count: targetCount,
      competition_level: nicheData.competitionLevel,
      reasoning: nicheData.reasoning,
    });

    // Step 3: Generate pillar topics if needed
    if (nicheData.pillarTopics.length < 5) {
      await updateJob(jobId, { progress: 30, current_step: '📊 Pillar topics genereren...' });

      try {
        const topicsPrompt = `Genereer 15-20 pillar topics voor: "${nicheData.niche}"
${languageInstructions[language]}

Output als JSON array:
[{"topic": "Topic naam", "estimatedArticles": 30, "subtopics": ["sub1", "sub2"]}]`;

        const topicsResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `${languageInstructions[language]} Output JSON.`,
          userPrompt: topicsPrompt,
          maxTokens: 3000,
          temperature: 0.7,
        });

        const jsonMatch = topicsResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          nicheData.pillarTopics = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Topics generation failed:', e);
      }
    }

    await updateJob(jobId, { progress: 35, current_step: `✅ ${nicheData.pillarTopics.length} pillar topics` });

    // Step 4: Generate content clusters
    const clusters: any[] = [];
    const allArticles: any[] = [];
    const pillarCount = nicheData.pillarTopics.length;

    for (let i = 0; i < pillarCount; i++) {
      const pillarData = nicheData.pillarTopics[i];
      const pillarTopic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
      const subtopics = typeof pillarData === 'object' ? pillarData.subtopics : [];
      const estimatedArticles = typeof pillarData === 'object' ? pillarData.estimatedArticles : Math.ceil(targetCount / pillarCount);
      
      const progress = 35 + Math.round((i / pillarCount) * 40);
      await updateJob(jobId, { progress, current_step: `📝 Cluster ${i + 1}/${pillarCount}: ${pillarTopic}` });

      try {
        const clusterPrompt = `Genereer content cluster voor: "${pillarTopic}"
Niche: ${nicheData.niche}
Subtopics: ${subtopics.join(', ')}
Aantal: ${estimatedArticles}
${languageInstructions[language]}

Output als JSON:
{
  "pillarTitle": "Complete Gids: ${pillarTopic}",
  "pillarDescription": "Beschrijving",
  "pillarKeywords": ["kw1", "kw2"],
  "supportingContent": [
    {"title": "Titel", "description": "Beschrijving", "keywords": ["kw1"], "contentType": "how-to|guide|comparison|list|faq", "difficulty": "beginner|intermediate|advanced", "searchIntent": "informational|commercial|transactional"}
  ]
}`;

        const clusterResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `SEO content strategist. ${languageInstructions[language]} Output JSON.`,
          userPrompt: clusterPrompt,
          maxTokens: 8000,
          temperature: 0.8,
        });

        const jsonMatch = clusterResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const cluster = JSON.parse(jsonMatch[0]);

          clusters.push({
            pillarTopic,
            pillarTitle: cluster.pillarTitle,
            articleCount: (cluster.supportingContent?.length || 0) + 1,
          });

          allArticles.push({
            title: cluster.pillarTitle,
            category: pillarTopic,
            description: cluster.pillarDescription,
            keywords: cluster.pillarKeywords || [],
            contentType: 'pillar',
            cluster: pillarTopic,
            priority: 'high',
          });

          for (const article of (cluster.supportingContent || [])) {
            allArticles.push({
              title: article.title,
              category: pillarTopic,
              description: article.description,
              keywords: article.keywords || [],
              contentType: article.contentType || 'guide',
              cluster: pillarTopic,
              priority: article.contentType === 'how-to' ? 'high' : 'medium',
              difficulty: article.difficulty || 'intermediate',
              searchIntent: article.searchIntent || 'informational',
            });
          }
        }
      } catch (e) {
        console.error('Cluster generation error:', e);
      }

      // Small delay between clusters
      if (i < pillarCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    await updateJob(jobId, { progress: 75, current_step: `✅ ${clusters.length} clusters gegenereerd` });

    // Step 5: Generate long-tail variations
    await updateJob(jobId, { progress: 80, current_step: '🔄 Long-tail variaties genereren...' });

    if (allArticles.length < targetCount) {
      const modifiers = langConfig.modifiers;
      const contentTypes = ['how-to', 'guide', 'comparison', 'list', 'faq'];

      for (const pillarData of nicheData.pillarTopics) {
        const topic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
        
        for (const modifier of modifiers) {
          if (allArticles.length >= targetCount) break;

          const title = `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} ${topic}`;
          
          allArticles.push({
            title,
            category: topic,
            description: `${title} - Uitgebreide informatie.`,
            keywords: [`${topic.toLowerCase()} ${modifier}`.trim(), topic.toLowerCase()],
            contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
            cluster: topic,
            priority: 'low',
          });
        }
      }
    }

    await updateJob(jobId, { progress: 90, current_step: '🎯 Afronden...' });

    // Deduplicate
    const seen = new Set<string>();
    const uniqueArticles = allArticles.filter(article => {
      const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Calculate stats
    const stats = {
      totalArticles: uniqueArticles.length,
      pillarPages: uniqueArticles.filter(a => a.contentType === 'pillar').length,
      clusters: clusters.length,
      byContentType: {
        pillar: uniqueArticles.filter(a => a.contentType === 'pillar').length,
        'how-to': uniqueArticles.filter(a => a.contentType === 'how-to').length,
        guide: uniqueArticles.filter(a => a.contentType === 'guide').length,
        comparison: uniqueArticles.filter(a => a.contentType === 'comparison').length,
        list: uniqueArticles.filter(a => a.contentType === 'list').length,
        faq: uniqueArticles.filter(a => a.contentType === 'faq').length,
      },
    };

    // Complete - save everything to database
    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      current_step: '✅ Content plan voltooid!',
      plan: uniqueArticles,
      clusters,
      stats,
    });

    console.log(`Job ${jobId} completed with ${uniqueArticles.length} articles`);

  } catch (error: any) {
    console.error('Content plan generation error:', error);
    await updateJob(jobId, {
      status: 'failed',
      error: error.message || 'Er is een fout opgetreden',
    });
  }
}
