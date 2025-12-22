import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage } from '@/lib/aiml-image-generator';
import { CONTENT_PROMPT_RULES, cleanForbiddenWords } from '@/lib/writing-rules';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Create admin client for background jobs
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Language-specific instructions
const LANGUAGE_INSTRUCTIONS: Record<string, {
  systemPrompt: string;
  conclusionHeading: string;
  writingStyle: string;
}> = {
  nl: {
    systemPrompt: 'Je bent een Nederlandse SEO content schrijver. Schrijf in het Nederlands met "je" en "jij" (informeel).',
    conclusionHeading: 'Tot slot',
    writingStyle: 'Schrijf in het Nederlands. Gebruik "je" en "jij" (informeel). Alle content moet in het Nederlands zijn.',
  },
  en: {
    systemPrompt: 'You are an English SEO content writer. Write in English.',
    conclusionHeading: 'Final thoughts',
    writingStyle: 'Write in English. All content must be in English.',
  },
  de: {
    systemPrompt: 'Du bist ein deutscher SEO Content Writer. Schreibe auf Deutsch mit "du" (informell).',
    conclusionHeading: 'Fazit',
    writingStyle: 'Schreibe auf Deutsch. Verwende "du" (informell). Alle Inhalte müssen auf Deutsch sein.',
  },
};

// Update job in database
async function updateJob(jobId: string, updates: any) {
  const { error } = await supabaseAdmin
    .from('article_jobs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', jobId);
  
  if (error) {
    console.error('Failed to update job:', error);
  }
}

// Convert markdown to HTML
function markdownToHtml(content: string): string {
  let html = content;
  html = html.replace(/```html\s*/gi, '');
  html = html.replace(/```\s*/g, '');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return html;
}

// Clean HTML content
function cleanHtmlContent(content: string): string {
  let cleaned = markdownToHtml(content);
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/^(Here is|Here's|Below is|Hier is|Hieronder)[^<]*</i, '<');
  cleaned = cleanForbiddenWords(cleaned);
  return cleaned;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}

// GET - Check job status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('job_id');
  const projectId = searchParams.get('project_id');

  try {
    if (jobId) {
      const { data: job, error } = await supabaseAdmin
        .from('article_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return NextResponse.json(job);
    }

    if (projectId) {
      const { data: jobs, error } = await supabaseAdmin
        .from('article_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return NextResponse.json({ jobs });
    }

    return NextResponse.json({ error: 'Job ID or Project ID required' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Start background article generation
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      project_id, 
      title, 
      keyword, 
      description, 
      content_type = 'article',
      word_count = 2000, 
      language = 'nl',
      website_url 
    } = await request.json();

    if (!title || !keyword) {
      return NextResponse.json({ error: 'Title and keyword are required' }, { status: 400 });
    }

    // Create job in database
    const { data: job, error: createError } = await supabaseAdmin
      .from('article_jobs')
      .insert({
        project_id,
        user_id: user.id,
        title,
        keyword,
        description,
        content_type,
        word_count,
        language,
        status: 'processing',
        progress: 0,
        current_step: '🚀 Artikel generatie gestart...',
      })
      .select()
      .single();

    if (createError) throw createError;

    // Start background processing (don't await)
    processArticle(job.id, {
      title,
      keyword,
      description,
      contentType: content_type,
      wordCount: word_count,
      language,
      websiteUrl: website_url,
    }).catch(err => {
      console.error('Background article generation failed:', err);
      updateJob(job.id, { status: 'failed', error: err.message });
    });

    return NextResponse.json({ 
      success: true, 
      job_id: job.id,
      message: 'Artikel generatie gestart. Je kunt deze pagina verlaten.' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Background processing function
async function processArticle(jobId: string, params: {
  title: string;
  keyword: string;
  description?: string;
  contentType: string;
  wordCount: number;
  language: string;
  websiteUrl?: string;
}) {
  const { title, keyword, description, contentType, wordCount, language, websiteUrl } = params;
  
  try {
    const now = new Date();
    const langConfig = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['nl'];
    const localeMap: Record<string, string> = { nl: 'nl-NL', en: 'en-US', de: 'de-DE' };
    const currentMonth = now.toLocaleString(localeMap[language] || 'nl-NL', { month: 'long' });
    const currentYear = now.getFullYear();

    // STEP 1: Generate Outline (0-15%)
    await updateJob(jobId, { progress: 5, current_step: '🔍 Outline maken...' });

    const outlinePrompt = `Maak een gedetailleerde outline voor een ${contentType} over: "${title}"
Focus keyword: ${keyword}
${description ? `Context: ${description}` : ''}
Doellengte: ${wordCount} woorden

${langConfig.writingStyle}

Geef een JSON outline:
{
  "mainHeading": "H1 titel met keyword",
  "metaDescription": "SEO meta description (max 160 tekens)",
  "sections": [
    {
      "heading": "H2 heading",
      "keyPoints": ["punt 1", "punt 2", "punt 3"]
    }
  ]
}`;

    let outline: any = null;
    try {
      const outlineResponse = await generateAICompletion({
        task: 'content',
        systemPrompt: `${langConfig.systemPrompt} Output alleen JSON.`,
        userPrompt: outlinePrompt,
        maxTokens: 2000,
        temperature: 0.6,
      });

      const jsonMatch = outlineResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Outline generation failed:', e);
    }

    await updateJob(jobId, { progress: 15, current_step: '✅ Outline klaar' });

    // STEP 2: Write Introduction (15-30%)
    await updateJob(jobId, { progress: 20, current_step: '✍️ Introductie schrijven...' });

    const introPrompt = `Schrijf een pakkende introductie voor een artikel over: "${title}"
Focus keyword: ${keyword}

${langConfig.writingStyle}
${CONTENT_PROMPT_RULES}

- Start direct met een hook
- Vermeld het keyword in de eerste 100 woorden
- Ongeveer 150-200 woorden
- Output als HTML met <p> tags`;

    let introContent = '';
    try {
      introContent = await generateAICompletion({
        task: 'content',
        systemPrompt: `${langConfig.systemPrompt} Output alleen HTML.`,
        userPrompt: introPrompt,
        maxTokens: 1000,
        temperature: 0.7,
      });
      introContent = cleanHtmlContent(introContent);
    } catch (e) {
      console.warn('Intro generation failed:', e);
    }

    await updateJob(jobId, { progress: 30, current_step: '✅ Introductie klaar' });

    // STEP 3: Write Main Content (30-70%)
    await updateJob(jobId, { progress: 35, current_step: '📝 Hoofdcontent schrijven...' });

    const sections = outline?.sections || [
      { heading: `Wat is ${keyword}?`, keyPoints: ['Definitie', 'Belang', 'Toepassingen'] },
      { heading: `Voordelen van ${keyword}`, keyPoints: ['Voordeel 1', 'Voordeel 2', 'Voordeel 3'] },
      { heading: `Hoe ${keyword} toepassen`, keyPoints: ['Stap 1', 'Stap 2', 'Stap 3'] },
    ];

    let mainContent = '';
    const wordsPerSection = Math.floor((wordCount - 400) / sections.length);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const progress = 35 + Math.round((i / sections.length) * 35);
      await updateJob(jobId, { 
        progress, 
        current_step: `📝 Sectie ${i + 1}/${sections.length}: ${section.heading?.substring(0, 30)}...` 
      });

      const sectionPrompt = `Schrijf sectie "${section.heading}" voor artikel over "${title}"
Focus keyword: ${keyword}
Key points: ${section.keyPoints?.join(', ') || 'Belangrijke informatie'}

${langConfig.writingStyle}
${CONTENT_PROMPT_RULES}

- Ongeveer ${wordsPerSection} woorden
- Start met <h2>${section.heading}</h2>
- Gebruik <h3> voor subsecties
- Output als HTML`;

      try {
        const sectionContent = await generateAICompletion({
          task: 'content',
          systemPrompt: `${langConfig.systemPrompt} Output alleen HTML.`,
          userPrompt: sectionPrompt,
          maxTokens: 3000,
          temperature: 0.7,
        });
        mainContent += '\n\n' + cleanHtmlContent(sectionContent);
      } catch (e) {
        console.warn(`Section ${i + 1} generation failed:`, e);
      }

      // Small delay between sections
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await updateJob(jobId, { progress: 70, current_step: '✅ Hoofdcontent klaar' });

    // STEP 4: Write Conclusion (70-80%)
    await updateJob(jobId, { progress: 75, current_step: '🎯 Conclusie schrijven...' });

    const conclusionPrompt = `Schrijf een krachtige conclusie voor artikel over: "${title}"
Focus keyword: ${keyword}

${langConfig.writingStyle}
${CONTENT_PROMPT_RULES}

- Start met <h2>${langConfig.conclusionHeading}</h2>
- Vat de belangrijkste punten samen
- Eindig met een call-to-action
- Ongeveer 150-200 woorden
- Output als HTML`;

    let conclusionContent = '';
    try {
      conclusionContent = await generateAICompletion({
        task: 'content',
        systemPrompt: `${langConfig.systemPrompt} Output alleen HTML.`,
        userPrompt: conclusionPrompt,
        maxTokens: 1000,
        temperature: 0.7,
      });
      conclusionContent = cleanHtmlContent(conclusionContent);
    } catch (e) {
      console.warn('Conclusion generation failed:', e);
    }

    await updateJob(jobId, { progress: 80, current_step: '✅ Conclusie klaar' });

    // STEP 5: Generate Featured Image (80-95%)
    await updateJob(jobId, { progress: 85, current_step: '🎨 Featured image genereren...' });

    let featuredImage = '';
    try {
      const imagePrompt = `Professional blog header image for article about ${keyword}. Clean, modern design with subtle ${keyword} theme. No text overlay.`;
      featuredImage = await generateFeaturedImage(imagePrompt, keyword);
    } catch (e) {
      console.warn('Image generation failed:', e);
    }

    await updateJob(jobId, { progress: 95, current_step: '🎨 Featured image klaar' });

    // STEP 6: Finalize (95-100%)
    await updateJob(jobId, { progress: 98, current_step: '✨ Artikel afronden...' });

    // Combine all content
    const fullContent = `${introContent}\n\n${mainContent}\n\n${conclusionContent}`;
    const wordCountActual = fullContent.split(/\s+/).length;
    const slug = generateSlug(title);
    const metaDescription = outline?.metaDescription || `${title} - Lees alles over ${keyword} in dit uitgebreide artikel.`;

    // Save completed article
    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      current_step: '✅ Artikel voltooid!',
      article_content: fullContent,
      featured_image: featuredImage,
      slug,
      meta_description: metaDescription,
    });

    console.log(`Article job ${jobId} completed with ${wordCountActual} words`);

  } catch (error: any) {
    console.error('Article generation error:', error);
    await updateJob(jobId, {
      status: 'failed',
      error: error.message || 'Er is een fout opgetreden',
    });
  }
}
