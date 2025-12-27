import { NextResponse } from 'next/server';
import { generateAICompletion } from '@/lib/ai-client';
import { generateFeaturedImage, generateArticleImage } from '@/lib/aiml-image-generator';
import { CONTENT_PROMPT_RULES, cleanForbiddenWords } from '@/lib/writing-rules';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase-server';
import { getProjectContext, buildContextPrompt, ProjectContext } from '@/lib/project-context';
import {
  searchYouTubeVideo,
  scrapeSitemap,
  formatSitemapLinksForPrompt as formatSitemapLinks,
  createInArticleImageHtml,
  findIntroEndPosition,
  findMiddlePosition,
  insertContentAtPosition,
} from '@/lib/content-enrichment';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

// Create admin client for background jobs
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin as any;
}

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
  const { error } = await getSupabaseAdmin()
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
      const { data: job, error } = await getSupabaseAdmin()
        .from('article_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return NextResponse.json(job);
    }

    if (projectId) {
      const { data: jobs, error } = await getSupabaseAdmin()
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
      website_url,
      model // Accept model parameter from frontend
    } = await request.json();

    if (!title || !keyword) {
      return NextResponse.json({ error: 'Title and keyword are required' }, { status: 400 });
    }

    // Create job in database
    const { data: job, error: createError } = await getSupabaseAdmin()
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
      projectId: project_id,
      model, // Pass model to processArticle
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
  projectId?: string;
  model?: string; // Add model parameter
}) {
  const { title, keyword, description, contentType, wordCount, language, websiteUrl, projectId, model } = params;
  
  try {
    const now = new Date();

    // Get project context (knowledge base, internal links, affiliates)
    let projectContext: ProjectContext | null = null;
    let contextPrompt = '';
    let sitemapLinksPrompt = '';

    if (projectId) {
      try {
        projectContext = await getProjectContext(projectId);
        contextPrompt = buildContextPrompt(projectContext);
        console.log('Project context loaded:', {
          hasKnowledgeBase: !!projectContext.knowledgeBase,
          internalLinksCount: projectContext.internalLinks.length,
          externalLinksCount: projectContext.externalLinks.length,
          hasAffiliate: !!projectContext.affiliateConfig,
        });

        // If no internal links from database, try sitemap scraping as fallback
        if (projectContext.internalLinks.length === 0 && websiteUrl) {
          console.log('No internal links from database, trying sitemap scraping...');
          try {
            const sitemapLinks = await scrapeSitemap(websiteUrl);
            if (sitemapLinks.length > 0) {
              console.log(`Found ${sitemapLinks.length} links from sitemap`);
              sitemapLinksPrompt = formatSitemapLinks(sitemapLinks);
            }
          } catch (e) {
            console.warn('Sitemap scraping failed:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to load project context:', e);
      }
    }

    // If we still don't have internal links but have a website URL, try sitemap
    if (!sitemapLinksPrompt && websiteUrl && (!projectContext || projectContext.internalLinks.length === 0)) {
      try {
        const sitemapLinks = await scrapeSitemap(websiteUrl);
        if (sitemapLinks.length > 0) {
          console.log(`Fallback: Found ${sitemapLinks.length} links from sitemap`);
          sitemapLinksPrompt = formatSitemapLinks(sitemapLinks);
        }
      } catch (e) {
        console.warn('Fallback sitemap scraping failed:', e);
      }
    }

    // Add sitemap links to context if available
    if (sitemapLinksPrompt) {
      contextPrompt = contextPrompt + '\n\n' + sitemapLinksPrompt;
    }
    const langConfig = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['nl'];
    const localeMap: Record<string, string> = { nl: 'nl-NL', en: 'en-US', de: 'de-DE' };
    const currentMonth = now.toLocaleString(localeMap[language] || 'nl-NL', { month: 'long' });
    const currentYear = now.getFullYear();

    // STEP 1: Generate Outline (0-15%)
    await updateJob(jobId, { progress: 5, current_step: '🔍 Outline maken...' });

    const outlinePrompt = `Maak een gedetailleerde outline voor een ${contentType} over: "${title}"
Focus keyword: ${keyword}
${description ? `Context: ${description}` : ''}
Doellengte: STRIKT ${wordCount} woorden (maximaal ${Math.round(wordCount * 1.1)} woorden, NIET meer!)

${langConfig.writingStyle}
${contextPrompt ? `\n${contextPrompt}\n` : ''}

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
        model, // Use selected model
        systemPrompt: `${langConfig.systemPrompt} Output alleen JSON. BELANGRIJK: Plan voor STRIKT ${wordCount} woorden totaal - niet meer!`,
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
${contextPrompt ? `\n${contextPrompt}\n` : ''}

- Start direct met een hook
- Vermeld het keyword in de eerste 100 woorden
- Ongeveer 150-200 woorden
- Voeg waar relevant interne links toe
- BELANGRIJK: GEEN "Inleiding:" of "Introductie:" heading - begin direct met de tekst
- Output als HTML met alleen <p> tags (GEEN headings voor de intro)`;

    let introContent = '';
    try {
      introContent = await generateAICompletion({
        task: 'content',
        model, // Use selected model
        systemPrompt: `${langConfig.systemPrompt} Output alleen HTML. BELANGRIJK: Gebruik GEEN "Inleiding:" of "Introductie:" heading. Start direct met <p> tags.`,
        userPrompt: introPrompt,
        maxTokens: 1000,
        temperature: 0.7,
      });
      introContent = cleanHtmlContent(introContent);
      console.log(`✅ Intro generated: ${introContent.length} characters`);
    } catch (e: any) {
      console.error('❌ Intro generation FAILED:', e?.message || e);
      console.error('Error details:', {
        name: e?.name,
        status: e?.status,
        message: e?.message
      });
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
${contextPrompt ? `\n${contextPrompt}\n` : ''}

- STRIKT ${wordsPerSection} woorden (NIET meer dan ${Math.round(wordsPerSection * 1.15)} woorden!)
- Start met <h2>${section.heading}</h2>
- Gebruik <h3> voor subsecties
- Voeg waar relevant interne links toe naar gerelateerde artikelen
- Als je producten noemt en er is een affiliate configuratie, voeg affiliate links toe
- Output als HTML`;

      try {
        // Calculate max tokens for section (roughly 1.5 tokens per word)
        const sectionMaxTokens = Math.min(Math.round(wordsPerSection * 2) + 200, 3000);
        const sectionContent = await generateAICompletion({
          task: 'content',
          model, // Use selected model
          systemPrompt: `${langConfig.systemPrompt} Output alleen HTML. STRIKT maximaal ${wordsPerSection} woorden voor deze sectie!`,
          userPrompt: sectionPrompt,
          maxTokens: sectionMaxTokens,
          temperature: 0.7,
        });
        const cleanedSection = cleanHtmlContent(sectionContent);
        mainContent += '\n\n' + cleanedSection;
        console.log(`✅ Section ${i + 1} generated: ${cleanedSection.length} characters`);
      } catch (e: any) {
        console.error(`❌ Section ${i + 1} generation FAILED:`, e?.message || e);
        console.error('Error details:', {
          name: e?.name,
          status: e?.status,
          message: e?.message
        });
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
${contextPrompt ? `\n${contextPrompt}\n` : ''}

- Start met <h2>${langConfig.conclusionHeading}</h2>
- Vat de belangrijkste punten samen
- Eindig met een call-to-action
- Voeg een relevante interne link toe als afsluiter
- Ongeveer 150-200 woorden
- Output als HTML`;

    let conclusionContent = '';
    try {
      conclusionContent = await generateAICompletion({
        task: 'content',
        model, // Use selected model
        systemPrompt: `${langConfig.systemPrompt} Output alleen HTML.`,
        userPrompt: conclusionPrompt,
        maxTokens: 1000,
        temperature: 0.7,
      });
      conclusionContent = cleanHtmlContent(conclusionContent);
      console.log(`✅ Conclusion generated: ${conclusionContent.length} characters`);
    } catch (e: any) {
      console.error('❌ Conclusion generation FAILED:', e?.message || e);
      console.error('Error details:', {
        name: e?.name,
        status: e?.status,
        message: e?.message
      });
    }

    await updateJob(jobId, { progress: 80, current_step: '✅ Conclusie klaar' });

    // STEP 5: Search for relevant YouTube video
    await updateJob(jobId, { progress: 82, current_step: '🎬 YouTube video zoeken...' });

    let youtubeEmbed = '';
    try {
      const video = await searchYouTubeVideo(keyword, language);
      if (video) {
        youtubeEmbed = video.embedHtml;
        console.log('Found YouTube video:', video.title);
      }
    } catch (e) {
      console.warn('YouTube search failed:', e);
    }

    // STEP 6: Generate Featured Image and In-Article Image
    await updateJob(jobId, { progress: 85, current_step: '🎨 Afbeeldingen genereren...' });

    let featuredImage = '';
    let inArticleImage = '';
    try {
      // Generate both images in parallel
      const [featuredResult, inArticleResult] = await Promise.all([
        generateFeaturedImage(title, keyword),
        generateArticleImage(`${keyword} illustration, informative diagram`, 'photorealistic'),
      ]);

      featuredImage = featuredResult || '';
      inArticleImage = inArticleResult || '';

      console.log('Images generated:', { hasFeatured: !!featuredImage, hasInArticle: !!inArticleImage });
    } catch (e) {
      console.warn('Image generation failed:', e);
    }

    await updateJob(jobId, { progress: 95, current_step: '🎨 Afbeeldingen klaar' });

    // Generate meta description early (needed for social media post)
    const metaDescription = outline?.metaDescription || `${title} - Lees alles over ${keyword} in dit uitgebreide artikel.`;

    // STEP 7: Generate Social Media Post
    await updateJob(jobId, { progress: 90, current_step: '📱 Social media post genereren...' });

    let socialMediaPost = '';
    try {
      const socialPrompt = `Schrijf een pakkende social media post om dit artikel te promoten:

Titel: ${title}
Keyword: ${keyword}
Samenvatting: ${metaDescription || description || ''}

${langConfig.writingStyle}

Maak een social media post die:
- Begint met een hook die aandacht trekt
- De belangrijkste voordelen/inzichten uit het artikel benadrukt
- Een call-to-action bevat om het artikel te lezen
- 150-280 karakters lang is (geschikt voor Twitter/X en andere platforms)
- Emoji's gebruikt om visuele aandacht te trekken (maar niet overdrijven)
- Een pakkende hashtag bevat

Output alleen de social media post tekst, geen extra uitleg.`;

      socialMediaPost = await generateAICompletion({
        task: 'content',
        model, // Use selected model
        systemPrompt: `${langConfig.systemPrompt} Je bent een social media expert. Output alleen de post tekst.`,
        userPrompt: socialPrompt,
        maxTokens: 500,
        temperature: 0.8,
      });

      // Clean up the social media post
      socialMediaPost = socialMediaPost
        .trim()
        .replace(/^["']|["']$/g, '') // Remove quotes
        .replace(/^(Here is|Here's|Below is|Hier is)/i, '') // Remove intro phrases
        .trim();

      console.log('Social media post generated:', socialMediaPost.substring(0, 100));
    } catch (e) {
      console.warn('Social media post generation failed:', e);
    }

    // STEP 8: Finalize and enrich content
    await updateJob(jobId, { progress: 98, current_step: '✨ Artikel afronden...' });

    // Combine base content
    let fullContent = `${introContent}\n\n${mainContent}\n\n${conclusionContent}`;

    // CRITICAL CHECK: Verify that actual content was generated
    const plainTextContent = fullContent.replace(/<[^>]*>/g, ' ').trim();
    const wordCountCheck = plainTextContent.split(/\s+/).filter(w => w.length > 0).length;

    if (wordCountCheck < 200) {
      // Content generation failed - not enough content was created
      const missingParts = [];
      if (!introContent || introContent.trim().length < 50) missingParts.push('introductie');
      if (!mainContent || mainContent.trim().length < 100) missingParts.push('hoofdcontent');
      if (!conclusionContent || conclusionContent.trim().length < 50) missingParts.push('conclusie');

      const errorMsg = `Artikel generatie gefaald: onvoldoende content gegenereerd (${wordCountCheck} woorden). Ontbrekende delen: ${missingParts.join(', ')}. Dit kan veroorzaakt worden door API limiet, timeout, of lege AI responses.`;
      console.error(errorMsg);
      console.error('Content lengths:', {
        intro: introContent?.length || 0,
        main: mainContent?.length || 0,
        conclusion: conclusionContent?.length || 0,
      });

      throw new Error(errorMsg);
    }

    // Insert YouTube video after intro (before first H2)
    if (youtubeEmbed) {
      const introEndPos = findIntroEndPosition(fullContent);
      if (introEndPos > 0) {
        fullContent = insertContentAtPosition(fullContent, youtubeEmbed, introEndPos);
        console.log('YouTube video inserted after intro');
      }
    }

    // Insert in-article image in the middle of the content
    if (inArticleImage) {
      const middlePos = findMiddlePosition(fullContent);
      if (middlePos > 0) {
        const imageHtml = createInArticleImageHtml(
          inArticleImage,
          `Illustratie over ${keyword}`,
          `Visuele uitleg van ${keyword}`
        );
        fullContent = insertContentAtPosition(fullContent, imageHtml, middlePos);
        console.log('In-article image inserted in middle');
      }
    }
    const wordCountActual = fullContent.split(/\s+/).length;
    const slug = generateSlug(title);

    // Save to articles table for library FIRST (only if we have a project_id)
    let savedArticleId: string | null = null;
    if (projectId) {
      try {
        const { data: article, error: articleError } = await getSupabaseAdmin()
          .from('articles')
          .insert({
            project_id: projectId,
            title,
            content: fullContent,
            featured_image: featuredImage,
            slug,
            excerpt: metaDescription,
            status: 'draft',
            meta_title: title,
            meta_description: metaDescription,
            word_count: wordCountActual,
          })
          .select()
          .single();

        if (articleError) {
          console.error('Failed to save to articles table:', articleError);
        } else {
          savedArticleId = article.id;
          console.log('Article saved to library with ID:', article.id);

          // Trigger affiliate opportunity discovery in the background
          if (article) {
            try {
              console.log('Triggering affiliate opportunity discovery...');

              // Call the discover API endpoint
              await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('/rest/v1', '')}/api/affiliate/discover`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                },
                body: JSON.stringify({
                  project_id: projectId,
                  article_id: article.id,
                  content: fullContent,
                  auto_research: true,
                }),
              }).catch(err => {
                console.error('Affiliate discovery failed (non-blocking):', err);
              });
            } catch (discoveryError) {
              // Don't fail the article generation if affiliate discovery fails
              console.error('Affiliate discovery error (non-blocking):', discoveryError);
            }
          }
        }
      } catch (e) {
        console.error('Error saving to articles:', e);
      }
    }

    // Save completed article to article_jobs with article_id in one atomic update
    await updateJob(jobId, {
      status: 'completed',
      progress: 100,
      current_step: '✅ Artikel voltooid!',
      article_content: fullContent,
      featured_image: featuredImage,
      slug,
      meta_description: metaDescription,
      social_media_post: socialMediaPost, // Include generated social media post
      article_id: savedArticleId, // Include article_id here to avoid race conditions
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
