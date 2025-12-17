import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/ai-utils';

/**
 * POST /api/simplified/rewrite
 * 
 * Herschrijft een bestaande WordPress post met AI-verbeteringen
 * 
 * Body:
 * - postUrl: URL van de post om te herschrijven
 * - projectId: Project ID
 * - improvements: Array van verbetering opties
 */
export async function POST(request: Request) {
  try {
    // Check authenticatie
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }

    // Vind client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { postUrl, projectId, improvements = [] } = body;

    if (!postUrl || !projectId) {
      return NextResponse.json(
        { error: 'postUrl en projectId zijn verplicht' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project niet gevonden of geen toegang' },
        { status: 404 }
      );
    }

    console.log(`[Rewrite API] Fetching content from: ${postUrl}`);

    // Fetch de originele post content
    let originalContent = '';
    let originalTitle = '';
    
    try {
      const response = await fetch(postUrl);
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      originalTitle = titleMatch ? titleMatch[1].replace(/ - .*$/, '').trim() : 'Untitled';
      
      // Extract main content (simple extraction - works for most WordPress themes)
      const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) || 
                          html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
                          html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (contentMatch) {
        // Remove script and style tags
        originalContent = contentMatch[1]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      }
    } catch (error) {
      console.error('[Rewrite API] Error fetching post:', error);
      return NextResponse.json(
        { error: 'Kon originele post niet ophalen' },
        { status: 500 }
      );
    }

    if (!originalContent) {
      return NextResponse.json(
        { error: 'Geen content gevonden in de originele post' },
        { status: 400 }
      );
    }

    console.log(`[Rewrite API] Original content length: ${originalContent.length} characters`);

    // Build improvement instructions
    const improvementInstructions = [];
    
    if (improvements.includes('improveSeo')) {
      improvementInstructions.push('- Optimaliseer voor SEO met relevante keywords en semantische variaties');
    }
    if (improvements.includes('addInternalLinks')) {
      improvementInstructions.push('- Voeg 3-5 suggesties toe voor interne links (gebruik placeholder tekst [INTERNAL LINK: anchor tekst -> gerelateerd onderwerp])');
    }
    if (improvements.includes('makeLonger')) {
      improvementInstructions.push('- Maak de content 500-1000 woorden langer met meer diepgang en details');
    }
    if (improvements.includes('improveStructure')) {
      improvementInstructions.push('- Verbeter de structuur met duidelijke H2/H3 kopjes en logische paragrafen');
    }

    const prompt = `Je bent een professionele content schrijver. Herschrijf het volgende artikel met deze verbeteringen:

${improvementInstructions.join('\n')}

ORIGINELE TITEL:
${originalTitle}

ORIGINELE CONTENT:
${originalContent}

INSTRUCTIES:
1. Behoud de kern boodschap en tone of voice
2. Maak de content interessanter en makkelijker te lezen
3. Gebruik Nederlandse taal (nl-NL)
4. Voeg waar relevant voorbeelden en details toe
5. Gebruik markdown formatting voor structuur

Geef het herschreven artikel in dit formaat:

NIEUWE TITEL:
[verbeterde titel]

CONTENT:
[herschreven content in markdown]`;

    console.log('[Rewrite API] Generating rewritten content with AI...');

    // Generate herschreven content met AI
    const aiResponse = await chatCompletion({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      temperature: 0.7,
    });

    const rewrittenText = aiResponse.content || '';

    // Extract nieuwe titel en content
    const newTitleMatch = rewrittenText.match(/NIEUWE TITEL:\s*\n(.+?)(?=\n\nCONTENT:)/s);
    const newContentMatch = rewrittenText.match(/CONTENT:\s*\n([\s\S]+)/);

    const newTitle = newTitleMatch ? newTitleMatch[1].trim() : originalTitle;
    const newContent = newContentMatch ? newContentMatch[1].trim() : rewrittenText;

    console.log('[Rewrite API] Rewritten content generated, saving to database...');

    // Sla herschreven content op als nieuwe SavedContent (draft)
    const savedContent = await prisma.savedContent.create({
      data: {
        title: newTitle,
        content: newContent,
        projectId: projectId,
        status: 'draft',
        type: 'rewrite',
        wordCount: newContent.split(/\s+/).length,
        language: 'nl',
        // Store metadata about the rewrite
        metadata: {
          originalUrl: postUrl,
          improvements: improvements,
          rewrittenAt: new Date().toISOString(),
        },
      },
    });

    console.log(`[Rewrite API] Content saved successfully with ID: ${savedContent.id}`);

    return NextResponse.json({
      success: true,
      contentId: savedContent.id,
      title: newTitle,
      message: 'Content succesvol herschreven! Je kunt het nu bewerken en publiceren.',
    });
  } catch (error) {
    console.error('[Rewrite API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Er is een fout opgetreden bij het herschrijven',
        details: error instanceof Error ? error.message : 'Onbekende fout'
      },
      { status: 500 }
    );
  }
}
