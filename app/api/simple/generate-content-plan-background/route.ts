import { NextResponse } from 'next/server';
import { generateAICompletion, analyzeWithPerplexityJSON } from '@/lib/ai-client';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { getRelatedKeywords } from '@/lib/dataforseo-client';

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
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

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
    } else if (projectId) {
      // Get active/processing job for project (exclude cancelled jobs)
      let query = supabaseAdmin
        .from('content_plan_jobs')
        .select('*')
        .eq('project_id', projectId)
        .not('status', 'eq', 'cancelled') // Never return cancelled jobs
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Filter by status if provided (e.g., 'processing')
      if (status) {
        query = query.in('status', ['processing', 'pending']);
      }

      const { data: jobs, error } = await query;

      if (error || !jobs || jobs.length === 0) {
        return NextResponse.json({ error: 'No jobs found' }, { status: 404 });
      }

      return NextResponse.json(jobs[0]);
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

    return NextResponse.json({ error: 'Job ID, Project ID, or User ID is required' }, { status: 400 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Cancel a job
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Update job status to cancelled
    const { error } = await supabaseAdmin
      .from('content_plan_jobs')
      .update({ 
        status: 'cancelled',
        current_step: 'Geannuleerd door gebruiker',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId)
      .in('status', ['pending', 'processing']); // Only cancel active jobs

    if (error) {
      console.error('Failed to cancel job:', error);
      return NextResponse.json({ error: 'Failed to cancel job' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Job cancelled' });
  } catch (error: any) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update job in database
async function updateJob(jobId: string, updates: any) {
  // Check first if job is cancelled - if so, don't update
  // This prevents unnecessary database writes and log spam
  const { data: currentJob } = await supabaseAdmin
    .from('content_plan_jobs')
    .select('status')
    .eq('id', jobId)
    .single();
  
  if (currentJob?.status === 'cancelled') {
    console.log(`Job ${jobId} is cancelled, skipping update`);
    return;
  }
  
  const { error } = await supabaseAdmin
    .from('content_plan_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .not('status', 'eq', 'cancelled'); // Extra safeguard against race conditions
  
  if (error) {
    console.error('Failed to update job:', error);
  }
}

// Check if job is cancelled
async function isJobCancelled(jobId: string): Promise<boolean> {
  const { data: job } = await supabaseAdmin
    .from('content_plan_jobs')
    .select('status')
    .eq('id', jobId)
    .single();
  
  return job?.status === 'cancelled';
}

// Background processing function
async function processContentPlan(jobId: string, websiteUrl: string) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Check if already cancelled before starting
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before processing`);
      return;
    }

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
      await updateJob(jobId, { progress: 18, current_step: '🔍 Website content verzameld' });
    } catch (e) {
      console.warn('Website scraping failed:', e);
      await updateJob(jobId, { progress: 18, current_step: '🔍 Website analyse (fallback)' });
    }

    await updateJob(jobId, { progress: 20, current_step: '🎯 Niche detecteren met AI...' });

    const currentMonth = now.toLocaleString(language === 'nl' ? 'nl-NL' : 'en-US', { month: 'long' });

    // Use Perplexity Sonar Pro for accurate niche detection with real-time web access
    const nichePrompt = `Analyseer de website ${websiteUrl} en bepaal de EXACTE niche.

Bezoek de website en analyseer de daadwerkelijke content.

${languageInstructions[language]}

BELANGRIJK: 
- Bepaal de niche op basis van de DAADWERKELIJKE content van de website
- Als de website over yoga gaat, is de niche "Yoga" of "Yoga voor beginners"
- Als de website over koken gaat, is de niche "Koken" of "Recepten"
- NOOIT "Content Marketing" als niche tenzij de website echt over content marketing gaat

Output als JSON:
{
  "niche": "Specifieke niche naam (bijv. Yoga, Fitness, Koken, Software)",
  "competitionLevel": "low|medium|high|very_high",
  "pillarTopics": [
    {
      "topic": "Pillar topic naam relevant voor de niche",
      "estimatedArticles": 30,
      "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
    }
  ],
  "totalArticlesNeeded": 500,
  "reasoning": "Uitleg waarom deze niche is gekozen"
}`;

    let nicheData: any = {
      niche: 'Algemeen',
      competitionLevel: 'medium',
      pillarTopics: [],
      totalArticlesNeeded: 500,
      reasoning: 'Default'
    };

    try {
      // Use Perplexity Sonar Pro for real-time website analysis
      console.log('Analyzing website with Perplexity:', websiteUrl);
      nicheData = await analyzeWithPerplexityJSON<any>(nichePrompt);
      console.log('Perplexity niche result:', nicheData.niche);
    } catch (e) {
      console.warn('Perplexity niche detection failed, using fallback:', e);
      
      // Fallback to Claude if Perplexity fails
      try {
        const fallbackPrompt = `Analyseer deze website en bepaal de EXACTE niche:

Website URL: ${websiteUrl}
${websiteContent ? `\n--- WEBSITE CONTENT ---\n${websiteContent}\n--- EINDE CONTENT ---\n` : ''}

${languageInstructions[language]}

Output als JSON:
{
  "niche": "Specifieke niche naam",
  "competitionLevel": "medium",
  "pillarTopics": [],
  "totalArticlesNeeded": 500,
  "reasoning": "Uitleg"
}`;

        const nicheResponse = await generateAICompletion({
          task: 'content',
          systemPrompt: `SEO expert. ${languageInstructions[language]} Output JSON.`,
          userPrompt: fallbackPrompt,
          maxTokens: 2000,
          temperature: 0.5,
        });

        const jsonMatch = nicheResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          nicheData = { ...nicheData, ...JSON.parse(jsonMatch[0]) };
        }
      } catch (fallbackError) {
        console.warn('Fallback niche detection also failed:', fallbackError);
      }
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
    if (!nicheData.pillarTopics || nicheData.pillarTopics.length < 5) {
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
          const parsedTopics = JSON.parse(jsonMatch[0]);
          if (parsedTopics && parsedTopics.length > 0) {
            nicheData.pillarTopics = parsedTopics;
          }
        }
      } catch (e) {
        console.warn('Topics generation failed:', e);
      }

      // Fallback: generate default topics if still empty
      if (!nicheData.pillarTopics || nicheData.pillarTopics.length === 0) {
        console.log('Using fallback pillar topics for:', nicheData.niche);
        nicheData.pillarTopics = [
          { topic: `${nicheData.niche} Basis`, estimatedArticles: 30, subtopics: ['introductie', 'beginnen', 'tips'] },
          { topic: `${nicheData.niche} Gids`, estimatedArticles: 30, subtopics: ['handleiding', 'stappenplan', 'voorbeelden'] },
          { topic: `${nicheData.niche} Tips`, estimatedArticles: 30, subtopics: ['beste praktijken', 'fouten vermijden', 'optimaliseren'] },
          { topic: `${nicheData.niche} Vergelijkingen`, estimatedArticles: 20, subtopics: ['alternatieven', 'reviews', 'keuzes'] },
          { topic: `${nicheData.niche} FAQ`, estimatedArticles: 20, subtopics: ['veelgestelde vragen', 'problemen', 'oplossingen'] },
        ];
      }
    }

    await updateJob(jobId, { progress: 35, current_step: `✅ ${nicheData.pillarTopics?.length || 0} pillar topics` });

    // Step 4: Generate content clusters
    await updateJob(jobId, { progress: 38, current_step: '📝 Content clusters voorbereiden...' });
    
    const clusters: any[] = [];
    const allArticles: any[] = [];
    const pillarCount = nicheData.pillarTopics.length;

    for (let i = 0; i < pillarCount; i++) {
      // Check if job was cancelled
      if (await isJobCancelled(jobId)) {
        console.log(`Job ${jobId} was cancelled during cluster generation`);
        return;
      }

      const pillarData = nicheData.pillarTopics[i];
      const pillarTopic = typeof pillarData === 'string' ? pillarData : pillarData.topic;
      const subtopics = typeof pillarData === 'object' ? pillarData.subtopics : [];
      const estimatedArticles = typeof pillarData === 'object' ? pillarData.estimatedArticles : Math.ceil(targetCount / pillarCount);
      
      // More granular progress: 40-75% for clusters
      const progress = 40 + Math.round((i / pillarCount) * 35);
      await updateJob(jobId, { 
        progress, 
        current_step: `📝 Cluster ${i + 1}/${pillarCount}: ${pillarTopic.substring(0, 30)}${pillarTopic.length > 30 ? '...' : ''}` 
      });

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

      // Update progress after each cluster
      const clusterProgress = 40 + Math.round(((i + 1) / pillarCount) * 35);
      await updateJob(jobId, { 
        progress: clusterProgress, 
        current_step: `✅ Cluster ${i + 1}/${pillarCount} voltooid (${allArticles.length} artikelen)` 
      });

      // Check cancellation immediately after update
      if (await isJobCancelled(jobId)) {
        console.log(`Job ${jobId} was cancelled after cluster ${i + 1}`);
        return;
      }

      // Small delay between clusters
      if (i < pillarCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    await updateJob(jobId, { progress: 76, current_step: `✅ ${clusters.length} clusters met ${allArticles.length} artikelen` });

    // Check cancellation before long-tail
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before long-tail generation`);
      return;
    }

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

    // Check cancellation before DataForSEO
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before DataForSEO enrichment`);
      return;
    }

    // Step 6: DataForSEO enrichment (85-95%)
    await updateJob(jobId, { progress: 85, current_step: '📊 SEO data ophalen (DataForSEO)...' });

    const hasDataForSEO = process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD;
    let enrichedArticles = [...allArticles];

    if (hasDataForSEO) {
      try {
        // Get seed keywords from pillar topics
        const seedKeywords = nicheData.pillarTopics
          .map((p: any) => typeof p === 'string' ? p : p.topic)
          .slice(0, 10);

        await updateJob(jobId, { progress: 87, current_step: '📊 Keyword data ophalen...' });

        const dataForSEOResults = await getRelatedKeywords(
          seedKeywords,
          langConfig.locationCode,
          language
        );

        if (dataForSEOResults && dataForSEOResults.length > 0) {
          // Create a map of keywords to their data
          const keywordMap = new Map<string, any>();
          for (const kw of dataForSEOResults) {
            if (kw.keyword) {
              keywordMap.set(kw.keyword.toLowerCase(), kw);
            }
          }

          await updateJob(jobId, { progress: 90, current_step: `📊 ${dataForSEOResults.length} keywords verrijkt` });

          // Enrich articles with SEO data
          enrichedArticles = allArticles.map(article => {
            const titleLower = article.title.toLowerCase();
            const keywordLower = (article.keywords[0] || '').toLowerCase();

            // Try to find matching keyword data
            let matchedData = keywordMap.get(keywordLower) || keywordMap.get(titleLower);

            // If no direct match, try partial matching
            if (!matchedData) {
              for (const [key, data] of keywordMap.entries()) {
                if (titleLower.includes(key) || key.includes(keywordLower)) {
                  matchedData = data;
                  break;
                }
              }
            }

            if (matchedData) {
              return {
                ...article,
                searchVolume: matchedData.searchVolume || null,
                competition: matchedData.competition || null,
                cpc: matchedData.cpc || null,
                competitionIndex: matchedData.competitionIndex || null,
              };
            }

            return article;
          });

          await updateJob(jobId, { progress: 93, current_step: '✅ SEO data toegevoegd' });
        } else {
          await updateJob(jobId, { progress: 93, current_step: '⚠️ Geen DataForSEO data beschikbaar' });
        }
        
        // Check cancellation after DataForSEO enrichment
        if (await isJobCancelled(jobId)) {
          console.log(`Job ${jobId} was cancelled after DataForSEO enrichment`);
          return;
        }
      } catch (dataForSEOError) {
        console.warn('DataForSEO enrichment failed:', dataForSEOError);
        await updateJob(jobId, { progress: 93, current_step: '⚠️ DataForSEO overgeslagen' });
      }
    } else {
      await updateJob(jobId, { progress: 93, current_step: '⏭️ DataForSEO niet geconfigureerd' });
    }

    await updateJob(jobId, { progress: 95, current_step: '🎯 Afronden...' });

    // Final cancellation check before saving
    if (await isJobCancelled(jobId)) {
      console.log(`Job ${jobId} was cancelled before final save`);
      return;
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueArticles = enrichedArticles.filter(article => {
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
