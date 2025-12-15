import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ✅ ONLY SUPABASE - NO PRISMA
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Parse HTML table to extract topics
 */
function parseHTMLTable(html: string): Array<{
  title: string;
  description: string;
  keywords: string[];
  priority: string;
}> {
  const topics = [];
  
  // Extract table rows - skip header row
  const rowRegex = /<tr>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<td>(.*?)<\/td>\s*<\/tr>/gi;
  let match;
  
  while ((match = rowRegex.exec(html)) !== null) {
    const title = match[1].trim().replace(/<[^>]*>/g, ''); // Remove any HTML tags
    const description = match[2].trim().replace(/<[^>]*>/g, '');
    const keywordsStr = match[3].trim().replace(/<[^>]*>/g, '');
    const priority = match[4].trim().replace(/<[^>]*>/g, '').toLowerCase();
    
    // Parse keywords (comma-separated)
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    
    if (title && description && keywords.length > 0 && priority) {
      topics.push({
        title,
        description,
        keywords,
        priority,
      });
    }
  }
  
  return topics;
}

/**
 * POST /api/simplified/content-plan
 * Genereer een content plan op basis van een keyword
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { keyword, projectId } = body;

    if (!keyword) {
      return NextResponse.json(
        { error: 'Keyword is required' },
        { status: 400 }
      );
    }

    // ✅ Haal client op via SUPABASE
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[Content Plan] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Genereer topical authority map met AIML API
    const prompt = `Je bent een SEO content strategist. Maak een topical authority map voor het keyword "${keyword}".

Genereer 15-20 gerelateerde topics die samen een complete kennisstructuur vormen.

RETURN FORMAT:
Geef ALLEEN een HTML tabel terug met dit exacte format:

<table>
<tr><th>Title</th><th>Description</th><th>Keywords</th><th>Priority</th></tr>
<tr><td>Titel 1</td><td>Beschrijving 1</td><td>keyword1, keyword2, keyword3</td><td>high</td></tr>
<tr><td>Titel 2</td><td>Beschrijving 2</td><td>keyword1, keyword2, keyword3</td><td>medium</td></tr>
</table>

REGELS:
- Return ALLEEN de HTML tabel, GEEN andere tekst
- Geen markdown, geen code blocks, geen uitleg
- 15-20 topics minimaal
- Priority moet zijn: high, medium, of low
- Keywords gescheiden door komma's
- Elk topic moet gerelateerd zijn aan: ${keyword}

BELANGRIJK:
- Geef ALLEEN de HTML tabel terug`;

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
      console.log('[Content Plan] Raw AI response length:', content.length);
      console.log('[Content Plan] Response preview:', content.substring(0, 500));
      
      // Debug: Log full response structure if content is empty
      if (!content) {
        console.error('[Content Plan] ❌ EMPTY CONTENT! Full response structure:', {
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
      
      console.log(`[Content Plan] Parsed ${topics.length} topics from HTML table`);
      
      // Valideer dat we topics hebben
      if (topics.length === 0) {
        console.error('[Content Plan] No topics found in HTML table');
        console.error('[Content Plan] Response preview:', content.substring(0, 1000));
        throw new Error('No topics found in AI response');
      }
      
    } catch (error) {
      const responseContent = response.choices?.[0]?.message?.content || '';
      console.error('[Content Plan] Error parsing AI response:', error);
      console.error('[Content Plan] Response content:', responseContent.substring(0, 1000));
      return NextResponse.json(
        { 
          error: 'Kon AI response niet verwerken',
          details: error instanceof Error ? error.message : 'Unknown parsing error',
          rawResponse: responseContent.substring(0, 500) + '...'
        },
        { status: 500 }
      );
    }

    // Sla content plan op in project (als projectId is meegegeven)
    const contentPlanData = {
      source: 'manual-keyword',
      keyword,
      topics,
      generatedAt: new Date().toISOString(),
    };

    console.log(`[Content Plan] Saving content plan...`);
    
    try {
      // ✅ Direct Supabase update
      if (projectId) {
        const { data: updatedProject, error: updateError } = await supabase
          .from('Project')
          .update({
            contentPlan: contentPlanData,
            lastPlanGenerated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', projectId)
          .select()
          .single();

        if (updateError) {
          console.error('[Content Plan] Project update error:', updateError);
          console.error('[Content Plan] Update error details:', JSON.stringify(updateError, null, 2));
          throw updateError;
        }

        console.log(`[Content Plan] ✅ Successfully updated project with ${topics.length} topics`);
      } else {
        // Sla op in client als er geen project is
        const { data: updatedClient, error: updateError } = await supabase
          .from('Client')
          .update({
            contentPlan: contentPlanData,
            lastPlanGenerated: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', client.id)
          .select()
          .single();

        if (updateError) {
          console.error('[Content Plan] Client update error:', updateError);
          console.error('[Content Plan] Update error details:', JSON.stringify(updateError, null, 2));
          throw updateError;
        }

        console.log(`[Content Plan] ✅ Successfully updated client with ${topics.length} topics`);
      }
    } catch (updateError: any) {
      console.error('[Content Plan] Failed to save content plan:', updateError);
      return NextResponse.json(
        { 
          error: 'Failed to save content plan',
          details: updateError.message || 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      keyword,
      topics,
      count: topics.length,
    });
  } catch (error) {
    console.error('Error generating content plan:', error);
    return NextResponse.json(
      { error: 'Failed to generate content plan' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/simplified/content-plan
 * Haal bestaande content plans op
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Haal client op via SUPABASE
    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (clientError || !client) {
      console.error('[Content Plan GET] Client not found:', clientError);
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // ✅ Haal content plans op van client en alle projecten via SUPABASE
    const { data: projects, error: projectsError } = await supabase
      .from('Project')
      .select('id, name, contentPlan, lastPlanGenerated')
      .eq('clientId', client.id)
      .not('contentPlan', 'is', null);

    const plans = [];

    // Client plan
    if (client.contentPlan) {
      plans.push({
        id: 'client',
        source: 'account',
        name: 'Account Plan',
        plan: client.contentPlan,
        lastGenerated: client.lastPlanGenerated,
      });
    }

    // Project plans
    if (projects && projects.length > 0) {
      projects.forEach((project: any) => {
        plans.push({
          id: project.id,
          source: 'project',
          name: project.name,
          plan: project.contentPlan,
          lastGenerated: project.lastPlanGenerated,
        });
      });
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('[Content Plan GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content plans' },
      { status: 500 }
    );
  }
}
