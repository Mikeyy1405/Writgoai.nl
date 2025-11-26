
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

// Generate and publish a single article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { masterArticleId, publishMode } = await request.json();

    if (!masterArticleId) {
      return NextResponse.json(
        { error: 'Master article ID required' },
        { status: 400 }
      );
    }

    // Get master article
    const masterArticle = await prisma.masterArticle.findUnique({
      where: { id: masterArticleId },
      include: {
        MasterPlan: {
          include: {
            Client: {
              include: {
                AIProfile: true,
                WordPressConfig: true,
                AffiliateLinks: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!masterArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    if (masterArticle.MasterPlan.clientId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (!masterArticle.isReleased) {
      return NextResponse.json(
        { error: 'Article not released yet' },
        { status: 400 }
      );
    }

    // Update status to generating
    await prisma.masterArticle.update({
      where: { id: masterArticleId },
      data: { status: 'GENERATING' },
    });

    const client = masterArticle.MasterPlan.Client;
    const aiProfile = client.AIProfile;

    if (!aiProfile) {
      throw new Error('AI Profile not found');
    }

    // Generate article content using AI
    const articleContent = await generateArticleContent(
      masterArticle,
      aiProfile,
      client.AffiliateLinks
    );

    // Create published article
    const slug = generateSlug(masterArticle.title);
    
    const publishedArticle = await prisma.publishedArticle.create({
      data: {
        masterArticleId: masterArticle.id,
        clientId: client.id,
        title: articleContent.title,
        slug,
        content: articleContent.content,
        excerpt: articleContent.excerpt,
        seoTitle: articleContent.seoTitle,
        metaDescription: articleContent.metaDescription,
        keywords: masterArticle.lsiKeywords,
        publishStatus: publishMode === 'IMMEDIATE' ? 'PUBLISHED' : 'DRAFT',
        internalLinks: articleContent.internalLinks,
        affiliateLinksUsed: articleContent.affiliateLinks,
      },
    });

    // Update master article
    await prisma.masterArticle.update({
      where: { id: masterArticleId },
      data: {
        status: 'GENERATED',
        generatedContent: articleContent.content,
        publishedArticleId: publishedArticle.id,
      },
    });

    // Don't auto-publish to WordPress - let user do it manually from UI

    return NextResponse.json({
      success: true,
      article: {
        id: publishedArticle.id,
        title: publishedArticle.title,
        status: publishedArticle.publishStatus,
        wordpressUrl: publishedArticle.wordpressUrl,
      },
      message: `Artikel ${publishMode === 'IMMEDIATE' ? 'gepubliceerd' : 'opgeslagen als concept'}!`,
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return NextResponse.json(
      { error: 'Failed to generate article', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Generate article content using AI
async function generateArticleContent(
  masterArticle: any,
  aiProfile: any,
  affiliateLinks: any[]
) {
  const openaiApiKey = process.env.ABACUSAI_API_KEY;
  if (!openaiApiKey) throw new Error('API key not configured');

  // Build affiliate links context
  const affiliateContext = affiliateLinks.length > 0
    ? `
    
**AFFILIATE LINKS (gebruik waar relevant):**
${affiliateLinks.map((link: any) => `- ${link.title}: ${link.url}`).join('\n')}
`
    : '';

  const prompt = `
Je bent een professionele SEO copywriter. Schrijf een complete blog artikel volgens deze specificaties:

**ARTIKEL INFORMATIE:**
- Titel: ${masterArticle.title}
- Onderwerp: ${masterArticle.topic}
- Hoofd Keyword: ${masterArticle.mainKeyword}
- LSI Keywords: ${masterArticle.lsiKeywords.join(', ')}
- Doel Woordenaantal: ${masterArticle.targetWordCount}
- Content Type: ${masterArticle.contentType}

**BEDRIJF/WEBSITE CONTEXT:**
- Website: ${aiProfile.websiteName || 'Niet bekend'}
- Beschrijving: ${aiProfile.companyDescription || ''}
- Doelgroep: ${aiProfile.targetAudience || ''}
- Tone of Voice: ${aiProfile.toneOfVoice || 'Vriendelijk en informatief'}
- Schrijfstijl: ${aiProfile.contentStyle?.join(', ') || 'Professional'}
${affiliateContext}

**SCHRIJFREGELS:**
1. Nederlands taal, informele stijl (je/jij)
2. Korte alinea's (max 3-4 zinnen)
3. Gebruik koppen (H2, H3) voor structuur
4. Praktische tips en voorbeelden
5. Verwerk keywords natuurlijk
6. Voeg affiliate links toe waar relevant (natuurlijk in de tekst)
7. Voeg internal linking suggesties toe [INTERNAL: ankertekst]
8. SEO-geoptimaliseerd
9. Unieke, originele content
10. Engaging en leesbaar

**FORMAT:**
Genereer een JSON object met:
{
  "title": "Definitieve artikel titel (SEO-geoptimaliseerd)",
  "seoTitle": "SEO title (50-60 karakters)",
  "metaDescription": "Meta description (120-155 karakters)",
  "excerpt": "Korte samenvatting (150 karakters)",
  "content": "Volledige artikel content in Markdown format met H2/H3 koppen",
  "internalLinks": ["lijst", "van", "suggesties", "voor", "interne", "links"],
  "affiliateLinks": ["gebruikte", "affiliate", "link", "titles"]
}

BELANGRIJK:
- Content moet ${masterArticle.targetWordCount} woorden zijn (±10%)
- Gebruik Markdown formatting (##, ###, **bold**, - lists)
- Verwerk alle LSI keywords natuurlijk
- Maak het praktisch en waardevol voor de lezer
- GEEN zinnen zoals "In deze blog..." of "Welkom bij..."
- Start direct met waarde

Genereer nu het complete artikel. Geef ALLEEN het JSON object terug!
`;

  const response = await fetch('https://v1.abacus.ai/chat/completions', {
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
          content: 'Je bent een expert SEO copywriter die high-quality blog artikelen schrijft.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error('AI content generation failed');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  // Parse JSON
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    return parsed;
  } catch (error) {
    console.error('Failed to parse AI content:', error);
    throw new Error('Invalid content format');
  }
}



// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 200);
}
