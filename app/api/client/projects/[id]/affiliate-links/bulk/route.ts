

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';

// POST - Bulk import van affiliate links (met AI titel generatie)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = params;
    const body = await req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email! }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        clientId: client.id
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`[Bulk Import] Processing ${urls.length} URLs for project ${projectId}`);

    // Process alle URLs met AI
    const results = [];
    const errors = [];

    for (const url of urls) {
      try {
        // Check if URL is valid
        if (!url || typeof url !== 'string' || url.trim().length === 0) {
          errors.push({ url, error: 'Invalid URL' });
          continue;
        }

        const cleanUrl = url.trim();

        // Check for duplicates
        const existing = await prisma.affiliateLink.findFirst({
          where: {
            projectId,
            url: cleanUrl
          }
        });

        if (existing) {
          console.log(`[Bulk Import] Skipping duplicate URL: ${cleanUrl}`);
          errors.push({ url: cleanUrl, error: 'Duplicate URL' });
          continue;
        }

        // Genereer metadata met AI
        let anchorText = cleanUrl;
        let category = null;
        let description = null;
        let keywords: string[] = [];

        try {
          console.log(`[Bulk Import] Generating metadata for: ${cleanUrl}`);

          const aiPrompt = `Analyseer deze affiliate URL en genereer professionele metadata: ${cleanUrl}

Geef het antwoord in het volgende JSON formaat:
{
  "anchorText": "Een korte, aantrekkelijke titel (max 60 tekens)",
  "category": "Een relevante categorie",
  "description": "Een korte beschrijving (1-2 zinnen)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}

Zorg ervoor dat:
- De anchor text natuurlijk klinkt en niet spam-achtig is
- De categorie relevant is voor de niche
- De keywords nuttig zijn voor content matching`;

          const aiResponse = await chatCompletion({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Je bent een SEO expert die professionele metadata genereert voor affiliate links. Antwoord altijd in valid JSON formaat.'
              },
              {
                role: 'user',
                content: aiPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 500
          });

          const aiText = aiResponse.choices[0]?.message?.content || '{}';
          
          // Parse AI response
          const jsonMatch = aiText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const aiData = JSON.parse(jsonMatch[0]);
            anchorText = aiData.anchorText || anchorText;
            category = aiData.category;
            description = aiData.description;
            keywords = aiData.keywords || [];
          }

          console.log(`[Bulk Import] Generated title: ${anchorText}`);
        } catch (aiError) {
          console.error(`[Bulk Import] AI error for ${cleanUrl}:`, aiError);
          // Fallback: gebruik domain name als titel
          anchorText = cleanUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
        }

        // Create affiliate link
        const link = await prisma.affiliateLink.create({
          data: {
            projectId,
            url: cleanUrl,
            anchorText,
            category,
            description,
            keywords
          }
        });

        results.push(link);
        console.log(`[Bulk Import] Successfully created link: ${anchorText}`);

        // Kleine delay om rate limiting te voorkomen
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`[Bulk Import] Error processing URL ${url}:`, error);
        errors.push({ url, error: 'Processing failed' });
      }
    }

    console.log(`[Bulk Import] Complete. Created: ${results.length}, Errors: ${errors.length}`);

    return NextResponse.json({
      success: true,
      created: results.length,
      errors: errors.length,
      links: results,
      errorDetails: errors
    });
  } catch (error) {
    console.error('[Bulk Import] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 }
    );
  }
}
