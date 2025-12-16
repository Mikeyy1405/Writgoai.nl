import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { trackUsage } from '@/lib/usage-tracking';
import { CREDIT_COSTS } from '@/lib/credits';

export const dynamic = 'force-dynamic';

// Platform-specific content optimization rules
const PLATFORM_RULES = {
  linkedin: {
    minChars: 500,
    maxChars: 1500,
    tone: 'professioneel en informatief',
    features: 'gebruik alinea\'s, bullet points waar relevant',
  },
  instagram: {
    minChars: 150,
    maxChars: 300,
    tone: 'visueel en engaging',
    features: 'gebruik emoji\'s en hashtags (5-10)',
  },
  twitter: {
    minChars: 50,
    maxChars: 280,
    tone: 'puntig en direct',
    features: 'kort en krachtig, maximaal 2 hashtags',
  },
  tiktok: {
    minChars: 50,
    maxChars: 150,
    tone: 'trending en energiek',
    features: 'begin met een hook, gebruik trending formats',
  },
  facebook: {
    minChars: 200,
    maxChars: 500,
    tone: 'conversational en engaging',
    features: 'gebruik call-to-action, emoties aanspreken',
  },
};

/**
 * POST - Generate platform-specific content with AI (streaming support)
 * Body: { projectId, topic, platforms[], tone?, includeHashtags?, generateImage?, generateVideo? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      projectId, 
      topic, 
      platforms = ['linkedin'], 
      tone = 'professional',
      includeHashtags = true,
      generateImage = false,
      generateVideo = false
    } = body;

    if (!projectId || !topic) {
      return NextResponse.json(
        { error: 'Project ID and topic are required' },
        { status: 400 }
      );
    }

    // Verify project belongs to client
    const project = await prisma.project.findUnique({
      where: { id: projectId, clientId: client.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate credits needed
    const CREDITS = {
      SINGLE_PLATFORM: 5,
      MULTI_PLATFORM: 10,
      IMAGE: 10,
      VIDEO: 25,
    };
    
    const contentCredits = platforms.length === 1 ? CREDITS.SINGLE_PLATFORM : CREDITS.MULTI_PLATFORM;
    const imageCredits = generateImage ? CREDITS.IMAGE : 0;
    const videoCredits = generateVideo ? CREDITS.VIDEO : 0;
    const totalCredits = contentCredits + imageCredits + videoCredits;

    // Track usage for billing
    await trackUsage({
      clientId: client.id,
      projectId,
      tool: 'social_content_generation',
      action: `Generated social content for ${platforms.join(', ')}`,
      details: {
        platforms,
        generateImage,
        generateVideo,
        creditsUsed: totalCredits,
      },
    });

    // Generate content for each platform
    const generatedContent: Record<string, string> = {};

    for (const platform of platforms) {
      const rules = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES] || PLATFORM_RULES.linkedin;
      
      const prompt = `Je bent een expert social media content creator. Genereer een engaging post voor ${platform}.

ONDERWERP: ${topic}

PLATFORM REGELS voor ${platform}:
- Lengte: ${rules.minChars}-${rules.maxChars} karakters
- Tone: ${rules.tone}
- Features: ${rules.features}
- Taal: Nederlands

${includeHashtags && platform !== 'twitter' ? 'Voeg relevante hashtags toe aan het einde.' : ''}
${platform === 'twitter' ? 'Maximaal 280 karakters!' : ''}

Maak de content:
1. Platform-geoptimaliseerd
2. Engaging en actionable
3. Met duidelijke waarde voor de lezer
4. In perfecte Nederlandse taal

Return ALLEEN de post content, geen extra uitleg.`;

      try {
        const response = await chatCompletion({
          messages: [
            { 
              role: 'system', 
              content: 'Je bent een expert social media content creator die engaging posts schrijft voor verschillende platforms.' 
            },
            { role: 'user', content: prompt }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.8,
        });

        const content = response.choices[0]?.message?.content?.trim() || '';
        generatedContent[platform] = content;
      } catch (error: any) {
        console.error(`Error generating content for ${platform}:`, error);
        generatedContent[platform] = `Error: ${error.message}`;
      }
    }

    // TODO: Implement image generation if requested
    let imageUrl = null;
    if (generateImage) {
      // Placeholder for image generation
      imageUrl = null;
    }

    // TODO: Implement video generation if requested
    let videoUrl = null;
    if (generateVideo) {
      // Placeholder for video generation
      videoUrl = null;
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      imageUrl,
      videoUrl,
      creditsUsed: totalCredits,
    });

  } catch (error: any) {
    console.error('Error generating social content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
