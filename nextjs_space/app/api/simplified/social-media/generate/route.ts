import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const AIML_API_URL = 'https://api.aimlapi.com/v1/chat/completions';
const AIML_API_KEY = process.env.AIML_API_KEY;

/**
 * POST /api/simplified/social-media/generate
 * Genereer unieke social media posts per platform met AI
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, topic, platforms, generateImage, tone } = body;

    // Validatie
    if (!projectId || !topic || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'projectId, topic en platforms zijn verplicht' },
        { status: 400 }
      );
    }

    if (!AIML_API_KEY) {
      return NextResponse.json(
        { error: 'AIML API key niet geconfigureerd' },
        { status: 500 }
      );
    }

    // Haal client op
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Haal project op en valideer eigenaar
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        clientId: client.id 
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project niet gevonden' }, { status: 404 });
    }

    // Genereer unieke content per platform
    const posts = [];
    const generatedContents: Record<string, any> = {};

    for (const platform of platforms) {
      try {
        const content = await generateSocialMediaContent({
          platform,
          topic,
          projectName: project.name,
          niche: project.niche || '',
          targetAudience: project.targetAudience || '',
          tone: tone || 'professional',
        });

        generatedContents[platform] = content;

        // Optioneel: genereer image prompt
        let imagePrompt = null;
        if (generateImage) {
          imagePrompt = await generateImagePrompt(topic, platform);
        }

        // Save to database
        const post = await prisma.socialMediaPost.create({
          data: {
            projectId,
            strategyId: 'manual', // Geen strategy, direct project-gebaseerd
            platform,
            title: topic,
            content: content.text,
            hashtags: content.hashtags,
            mediaUrls: imagePrompt ? [imagePrompt] : [],
            status: 'pending',
          },
        });

        posts.push({
          id: post.id,
          platform,
          content: content.text,
          hashtags: content.hashtags,
          imagePrompt,
          characterCount: content.text.length,
        });
      } catch (error) {
        console.error(`Fout bij genereren voor ${platform}:`, error);
        // Continue met andere platforms
      }
    }

    return NextResponse.json({ 
      success: true,
      posts,
      message: `${posts.length} posts gegenereerd voor ${platforms.join(', ')}`
    });
  } catch (error) {
    console.error('Error generating social media posts:', error);
    return NextResponse.json(
      { error: 'Fout bij genereren van posts' },
      { status: 500 }
    );
  }
}

/**
 * Genereer platform-specifieke social media content met AI
 */
async function generateSocialMediaContent(params: {
  platform: string;
  topic: string;
  projectName: string;
  niche: string;
  targetAudience: string;
  tone: string;
}): Promise<{ text: string; hashtags: string[] }> {
  const { platform, topic, projectName, niche, targetAudience, tone } = params;

  // Platform-specifieke prompts en karakterlimieten
  const platformConfig: Record<string, { maxChars: number; style: string }> = {
    twitter: {
      maxChars: 280,
      style: 'kort, pakkend en met emojis. Gebruik maximaal 2-3 hashtags.',
    },
    linkedin: {
      maxChars: 3000,
      style: 'professioneel en informatief. Gebruik 3-5 relevante hashtags. Focus op value en insights.',
    },
    facebook: {
      maxChars: 2000,
      style: 'conversational en engaging. Eindig met een call-to-action. Gebruik emojis en 2-4 hashtags.',
    },
    instagram: {
      maxChars: 2200,
      style: 'visueel en inspirerend. Gebruik 10-15 populaire en niche-specifieke hashtags. Eindig met een vraag of CTA.',
    },
    tiktok: {
      maxChars: 2200,
      style: 'trendy en authentiek. Gebruik trending sounds en hashtags. Max 5 hashtags.',
    },
  };

  const config = platformConfig[platform] || platformConfig.twitter;

  const systemPrompt = `Je bent een social media expert gespecialiseerd in ${platform} content${niche ? ` voor de ${niche} niche` : ''}. Je maakt engaging, authentieke content die past bij ${platform}.`;

  const userPrompt = `Creëer een unieke ${platform} post over: "${topic}"

Context:
- Project: ${projectName}
${niche ? `- Niche: ${niche}` : ''}
${targetAudience ? `- Doelgroep: ${targetAudience}` : ''}
- Toon: ${tone}

Vereisten:
- Maximaal ${config.maxChars} karakters
- Schrijf in een ${config.style}
- Maak het ${platform}-specifiek (niet generiek)
- Gebruik relevante emojis waar passend
- Maak het deelbaar en engaging
- Voeg passende hashtags toe op een natuurlijke manier

Formaat: Geef ALLEEN de post tekst (inclusief hashtags in de tekst). Geen extra uitleg of quotes.`;

  const response = await fetch(AIML_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.8, // Hoger voor meer creativiteit
    }),
  });

  if (!response.ok) {
    throw new Error(`AIML API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();

  // Extract hashtags
  const hashtagMatches = text.match(/#[\w\u00C0-\u017F]+/g) || [];
  const hashtags = hashtagMatches.map((tag: string) => tag.substring(1)); // Remove #

  return { text, hashtags };
}

/**
 * Genereer AI image prompt voor social media afbeelding
 */
async function generateImagePrompt(topic: string, platform: string): Promise<string> {
  const response = await fetch(AIML_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AIML_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het maken van AI image prompts voor social media content.',
        },
        {
          role: 'user',
          content: `Maak een gedetailleerde image prompt voor een ${platform} post over "${topic}". 

De prompt moet:
- Visueel aantrekkelijk zijn voor ${platform}
- Professional en on-brand
- Specifiek genoeg voor goede AI image generation
- Max 150 woorden

Geef ALLEEN de prompt, geen uitleg.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate image prompt`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
