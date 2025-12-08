import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';
import { deductCredits } from '@/lib/credits';

// Lazy initialization to avoid build-time errors when env vars are not available
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface GenerateRequest {
  config: {
    contentType: string;
    topic: string;
    targetAudience?: string;
    tone?: string;
    length?: string;
    keywords?: string[];
    outline?: string;
    additionalInstructions?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

       // Get client from database
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptionCredits: true,
        topUpCredits: true,
        isUnlimited: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    const body: GenerateRequest = await req.json();
    const { config } = body;

    if (!config?.contentType || !config?.topic) {
      return NextResponse.json(
        { error: 'Content type and topic are required' },
        { status: 400 }
      );
    }

    // Calculate credits needed based on length
    let creditsNeeded = 5; // Default for short content
    if (config.length === 'medium') {
      creditsNeeded = 10;
    } else if (config.length === 'long') {
      creditsNeeded = 15;
    }

    // Calculate total available credits
    const totalCredits = (client.subscriptionCredits || 0) + (client.topUpCredits || 0);

    // Check if client has enough credits
    if (!client.isUnlimited && totalCredits < creditsNeeded) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          creditsNeeded,
          creditsAvailable: totalCredits
        },
        { status: 402 }
      );
    }

    // Build the prompt
    const prompt = buildPrompt(config);

    // Generate content using OpenAI
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content writer who creates high-quality, engaging content tailored to specific audiences and purposes. You follow instructions carefully and produce well-structured, informative content.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(config.length),
    });

    const generatedContent = completion.choices[0]?.message?.content;

    if (!generatedContent) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Parse the generated content to extract sections
    const sections = parseGeneratedContent(generatedContent, config.contentType);

    // Deduct credits AFTER successful generation
    const deductResult = await deductCredits(
      client.id, 
      creditsNeeded, 
      `Ultimate Writer: ${config.contentType} - ${config.topic}`,
      {
        tool: 'ultimate_writer'
      }
    );

    if (!deductResult.success) {
      console.error('Failed to deduct credits:', deductResult.error);
      // Note: Content was already generated, so we'll return it anyway
      // but log the error for investigation
    }

    return NextResponse.json({
      success: true,
      sections,
      creditsUsed: creditsNeeded,
      creditsRemaining: deductResult.newBalance ?? totalCredits - creditsNeeded,
    });

  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function buildPrompt(config: GenerateRequest['config']): string {
  let prompt = `Create a ${config.contentType} about "${config.topic}".`;

  if (config.targetAudience) {
    prompt += ` The target audience is: ${config.targetAudience}.`;
  }

  if (config.tone) {
    prompt += ` Use a ${config.tone} tone.`;
  }

  if (config.length) {
    const lengthDescriptions = {
      short: '500-800 words',
      medium: '1000-1500 words',
      long: '2000+ words',
    };
    prompt += ` The content should be approximately ${lengthDescriptions[config.length as keyof typeof lengthDescriptions] || 'medium length'}.`;
  }

  if (config.keywords && config.keywords.length > 0) {
    prompt += ` Include these keywords naturally: ${config.keywords.join(', ')}.`;
  }

  if (config.outline) {
    prompt += ` Follow this outline or structure: ${config.outline}.`;
  }

  if (config.additionalInstructions) {
    prompt += ` Additional instructions: ${config.additionalInstructions}.`;
  }

  prompt += '\n\nPlease structure the content with clear headings and sections. Make it engaging, informative, and well-organized.';

  return prompt;
}

function getMaxTokens(length?: string): number {
  const tokenLimits = {
    short: 1500,
    medium: 3000,
    long: 4000,
  };
  return tokenLimits[length as keyof typeof tokenLimits] || 3000;
}

function parseGeneratedContent(content: string, contentType: string) {
  // Split content into sections based on headers (lines starting with # or ##)
  const lines = content.split('\n');
  const sections: Array<{ title: string; content: string }> = [];
  let currentSection: { title: string; content: string } | null = null;

  for (const line of lines) {
    // Check if line is a header
    if (line.match(/^#{1,3}\s+/)) {
      // Save previous section if exists
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      const title = line.replace(/^#{1,3}\s+/, '').trim();
      currentSection = { title, content: '' };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content += line + '\n';
    } else {
      // Content before first header - create intro section
      if (!currentSection) {
        currentSection = { title: 'Introduction', content: line + '\n' };
      }
    }
  }

  // Add the last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ title: contentType, content }];
}
