import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import {

  scrapeWordPressSite,
  generateContentSummary,
  extractTopicsFromAnalysis,
} from '@/lib/wordpress-scraper';

export const dynamic = 'force-dynamic';

/**
 * Parse HTML table to extract topics
 */
function parseHTMLTable(html: string): Array<{
  title: string;
  description: string;
  keywords: string[];
  priority: string;
  reason: string;
}> {
  const topics = [];
  
  // Extract table rows - skip header row
  const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gi;
  let match;
  
  while ((match = rowRegex.exec(html)) !== null) {
    const title = match[1].trim().replace(/<[^>]*>/g, ''); // Remove any HTML tags
    const description = match[2].trim().replace(/<[^>]*>/g, '');
    const keywordsStr = match[3].trim().replace(/<[^>]*>/g, '');
    const priority = match[4].trim().replace(/<[^>]*>/g, '').toLowerCase();
    const reason = match[5].trim().replace(/<[^>]*>/g, '');
    
    // Parse keywords (comma-separated)
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    
    if (title && description && keywords.length > 0 && priority) {
      topics.push({
        title,
        description,
        keywords,
        priority,
        reason: reason || description, // Fallback to description if reason is empty
      });
    }
  }
  
  return topics;
}

/**
 * POST /api/simplified/content-plan/analyze-wordpress
 * Analyseer een WordPress site en genereer automatisch een content plan
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Haal project op met WordPress URL
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.websiteUrl) {
      return NextResponse.json(
        { error: 'Project heeft geen WordPress URL geconfigureerd' },
        { status: 400 }
      );
    }

    console.log(`[WordPress Analyze] Starting analysis for project: ${project.name}`);
    console.log(`[WordPress Analyze] WordPress URL: ${project.websiteUrl}`);

    // Scrape WordPress site
    let analysis;
    try {
      analysis = await scrapeWordPressSite(project.websiteUrl, 50);
    } catch (error: any) {
      console.error('[WordPress Analyze] Scraping error:', error);
      return NextResponse.json(
        { 
          error: 'Kon WordPress site niet analyseren',
          details: error.message 
        },
        { status: 500 }
      );
    }

    // Check if we got any posts
    if (analysis.posts.length === 0) {
      return NextResponse.json(
        { 
          error: 'Geen posts gevonden op deze WordPress site',
          details: 'Zorg ervoor dat de WordPress REST API beschikbaar is'
        },
        { status: 400 }
      );
    }

    console.log(`[WordPress Analyze] Found ${analysis.posts.length} posts`);

    // Generate content summary
    const contentSummary = generateContentSummary(analysis);
    const existingTopics = extractTopicsFromAnalysis(analysis);

    console.log(`[WordPress Analyze] Extracted ${existingTopics.length} existing topics`);

    // Use AI to analyze and generate new content ideas
    const prompt = `Je bent een SEO content strategist die een WordPress site analyseert.

WORDPRESS SITE ANALYSE:
${contentSummary}

BESTAANDE TOPICS/THEMA'S:
${existingTopics.join(', ')}

TAAK:
Analyseer deze WordPress site en:
1. Identificeer de hoofdniche/thema van de site
2. Bepaal welke content gaps er zijn (onderwerpen die nog niet of weinig behandeld zijn)
3. Genereer 15-20 NIEUWE content topics die:
   - Passen bij de niche van de site
   - NOG NIET of weinig behandeld zijn op de site
   - Relevant zijn voor de doelgroep
   - SEO-vriendelijk zijn
   - Goed aansluiten bij de bestaande content

RETURN FORMAT:
Geef ALLEEN een HTML tabel terug met dit exacte format:

<table>
<tr><th>Title</th><th>Description</th><th>Keywords</th><th>Priority</th><th>Reason</th></tr>
<tr><td>Titel 1</td><td>Beschrijving 1</td><td>keyword1, keyword2, keyword3</td><td>high</td><td>Waarom dit relevant is</td></tr>
<tr><td>Titel 2</td><td>Beschrijving 2</td><td>keyword1, keyword2, keyword3</td><td>medium</td><td>Waarom dit relevant is</td></tr>
</table>

REGELS:
- Return ALLEEN de HTML tabel, GEEN andere tekst
- Geen markdown, geen code blocks, geen uitleg
- 15-20 topics minimaal
- Priority moet zijn: high, medium, of low
- Keywords gescheiden door komma's
- Elk topic moet relevant zijn voor: ${project.websiteUrl}

BELANGRIJK:
- Genereer ALLEEN topics die nog niet of nauwelijks behandeld zijn
- Focus op content gaps
- Geef ALLEEN de HTML tabel terug`;

    console.log('[WordPress Analyze] Generating content plan with AI...');

    const response = await chatCompletion({
      model: TEXT_MODELS.GPT5_CHAT,
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    let topics = [];
    try {
      // ✅ FIX: Extract content from correct response structure
      // AIML API returns: { choices: [{ message: { content: "..." } }] }
      const content = response.choices?.[0]?.message?.content || '';
      console.log('[WordPress Analyze] Raw AI response length:', content.length);
      console.log('[WordPress Analyze] Response preview:', content.substring(0, 500));
      
      // Debug: Log full response structure if content is empty
      if (!content) {
        console.error('[WordPress Analyze] ❌ EMPTY CONTENT! Full response structure:', {
          hasChoices: !!response.choices,
          choicesLength: response.choices?.length || 0,
          firstChoice: response.choices?.[0] ? {
            hasMessage: !!response.choices[0].message,
            messageKeys: response.choices[0].message ? Object.keys(response.choices[0].message) : [],
            contentPreview: response.choices[0].message?.content?.substring(0, 100)
          } : 'NO_FIRST_CHOICE',
          responseKeys: Object.keys(response)
        });
        throw new Error('Empty AI response');
      }
      
      // Parse HTML table
      topics = parseHTMLTable(content);
      
      console.log(`[WordPress Analyze] Parsed ${topics.length} topics from HTML table`);
      
      // Valideer dat we topics hebben
      if (topics.length === 0) {
        console.error('[WordPress Analyze] No topics found in HTML table');
        console.error('[WordPress Analyze] Response preview:', content.substring(0, 1000));
        throw new Error('No topics found in AI response');
      }
      
    } catch (error) {
      const responseContent = response.choices?.[0]?.message?.content || '';
      console.error('[WordPress Analyze] Error parsing AI response:', error);
      console.error('[WordPress Analyze] Response content:', responseContent.substring(0, 1000));
      return NextResponse.json(
        { 
          error: 'Kon AI response niet verwerken',
          details: error instanceof Error ? error.message : 'Unknown parsing error',
          rawResponse: responseContent.substring(0, 500) + '...'
        },
        { status: 500 }
      );
    }

    console.log(`[WordPress Analyze] Generated ${topics.length} new topics`);

    // Sla content plan op in project als JSONB
    const contentPlanData = {
      source: 'wordpress-analysis',
      analyzedUrl: project.websiteUrl,
      existingPosts: analysis.posts.length,
      existingCategories: analysis.categories.map(c => c.name),
      existingTags: analysis.tags.slice(0, 20).map(t => t.name),
      topics,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[WordPress Analyze] Updating project with content plan...`);
    
    try {
      // Direct Supabase update to avoid Prisma shim issues
      const { supabaseAdmin } = require('@/lib/supabase');
      const { data: updatedProject, error: updateError } = await supabaseAdmin
        .from('Project')
        .update({
          contentPlan: contentPlanData,
          lastPlanGenerated: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (updateError) {
        console.error('[WordPress Analyze] Update error:', updateError);
        throw updateError;
      }

      console.log(`[WordPress Analyze] ✅ Successfully updated project with ${topics.length} topics`);
    } catch (updateError: any) {
      console.error('[WordPress Analyze] Failed to update project:', updateError);
      // Continue anyway - we still want to return the topics
    }

    return NextResponse.json({
      success: true,
      source: 'wordpress-analysis',
      analyzedUrl: project.websiteUrl,
      existingPosts: analysis.posts.length,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('[WordPress Analyze] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze WordPress site',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
