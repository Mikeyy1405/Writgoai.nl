

export const dynamic = "force-dynamic";
/**
 * 📝 Article Generation API
 * 
 * Generates a complete blog article based on prompt/topic
 * Uses AIML API with web search for current, accurate information
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateBlog } from '@/lib/aiml-agent';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { prisma } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      topic, 
      prompt,
      keywords = [],
      targetAudience,
      toneOfVoice,
      minWords = 800,
      maxWords = 1500,
      includeImages = true,
      includeReferences = true,
      clientId,
      projectId // Optional project ID for knowledge base context
    } = body;

    const finalClientId = clientId || session.user.id;

    if (!topic && !prompt) {
      return NextResponse.json(
        { error: 'Topic of prompt is vereist' },
        { status: 400 }
      );
    }

    console.log('📝 Generating article:', { topic, prompt });

    // Check credits
    const creditCost = 5; // Article generation kost 5 credits
    const hasCredits = await hasEnoughCredits(finalClientId, creditCost);
    
    if (!hasCredits) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          message: 'Je hebt niet genoeg credits. Artikel generatie kost 5 credits.',
          requiredCredits: creditCost
        },
        { status: 402 }
      );
    }

    // Get client info for personalization
    const client = await prisma.client.findUnique({
      where: { id: finalClientId },
      select: {
        targetAudience: true,
        brandVoice: true,
        keywords: true,
        companyName: true,
        name: true,
      },
    });

    // Build article generation parameters
    const articleParams = {
      topic: topic || prompt,
      keywords: keywords.length > 0 ? keywords : (client?.keywords || []),
      targetAudience: targetAudience || client?.targetAudience || 'algemeen publiek',
      toneOfVoice: toneOfVoice || client?.brandVoice || 'professioneel en informatief',
      minWords,
      maxWords,
      includeImages,
      includeReferences,
      companyName: client?.companyName || client?.name,
    };

    console.log('Article parameters:', articleParams);

    // Load knowledge base content if projectId is provided
    let knowledgeBaseContext = '';
    if (projectId) {
      try {
        console.log('📚 Loading knowledge base content for project...');
        const knowledgeItems = await prisma.projectKnowledge.findMany({
          where: {
            projectId: projectId,
            project: {
              clientId: finalClientId, // Verify ownership
            },
          },
          select: {
            title: true,
            content: true,
            type: true,
            category: true,
            importance: true,
          },
        });

        if (knowledgeItems.length > 0) {
          // Filter by importance and build context
          const importantItems = knowledgeItems.filter(
            item => item.importance === 'high' || item.importance === 'critical'
          );
          const regularItems = knowledgeItems.filter(item => item.importance === 'normal');
          
          // Prioritize critical/high importance items
          const itemsToInclude = [...importantItems, ...regularItems].slice(0, 5); // Max 5 items
          
          knowledgeBaseContext = itemsToInclude
            .map(item => `[${item.type.toUpperCase()}] ${item.title}${item.category ? ` (${item.category})` : ''}\n${item.content}`)
            .join('\n\n---\n\n');
          
          console.log(`✅ Loaded ${itemsToInclude.length} knowledge base items`);
        }
      } catch (error) {
        console.error('❌ Error loading knowledge base:', error);
        // Continue without knowledge base if loading fails
      }
    }

    // Generate article using AIML agent
    const brandInfo = client?.companyName 
      ? `${client.companyName} - ${articleParams.targetAudience}`
      : undefined;
    
    const articleContent = await generateBlog(
      articleParams.topic,
      articleParams.keywords,
      articleParams.toneOfVoice,
      brandInfo,
      {
        knowledgeBase: knowledgeBaseContext || undefined, // 📚 Knowledge base context
      }
    );

    // Extract title from content (first h1 or h2)
    const titleMatch = articleContent.match(/<h[12]>(.*?)<\/h[12]>/);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : articleParams.topic;
    
    // Create meta description (first 160 chars of text content)
    const textContent = articleContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const metaDescription = textContent.substring(0, 160) + (textContent.length > 160 ? '...' : '');
    
    // Calculate word count and read time
    const wordCount = textContent.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min

    // Deduct credits after successful generation
    await deductCredits(
      finalClientId,
      creditCost,
      'Artikel generatie'
    );

    console.log('✅ Article generated successfully');

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      article: {
        title,
        content: articleContent,
        metaDescription,
        keywords: articleParams.keywords,
        readTime: `${readTime} min`,
        wordCount,
      },
      creditsUsed: creditCost,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('Article generation error:', error);
    await prisma.$disconnect();
    
    return NextResponse.json(
      {
        error: 'Kon artikel niet genereren',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Article Generation API',
    features: [
      'Blog article generation',
      'SEO optimization',
      'Web search integration',
      'Image suggestions',
    ],
  });
}
