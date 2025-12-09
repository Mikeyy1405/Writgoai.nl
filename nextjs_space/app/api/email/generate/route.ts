
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';


interface GenerateEmailRequest {
  emailType: string;
  recipient?: string;
  recipientName?: string;
  subject?: string;
  originalContext?: string;
  customInstructions: string;
  tone: string;
  length: string;
  language: 'NL' | 'EN';
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body: GenerateEmailRequest = await req.json();
    const {
      emailType,
      recipient,
      recipientName,
      subject,
      originalContext,
      customInstructions,
      tone,
      length,
      language,
    } = body;

    // Build AI prompt based on inputs
    const prompt = buildEmailPrompt({
      emailType,
      recipient,
      recipientName,
      subject,
      originalContext,
      customInstructions,
      tone,
      length,
      language,
    });

    // Call AIML API
    const response = await fetch(process.env.AIML_API_URL || 'https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        messages: [
          {
            role: 'system',
            content: `You are a professional email writing assistant. Generate emails in ${language === 'NL' ? 'Dutch' : 'English'} that are well-structured, professional, and tailored to the context provided.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: length === 'short' ? 500 : length === 'medium' ? 1000 : 1500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate email');
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || 0;

    // Generate subject if not provided
    let generatedSubject = subject || '';
    if (!generatedSubject && emailType === 'new') {
      const subjectMatch = generatedContent.match(/Subject: (.+)/i);
      if (subjectMatch) {
        generatedSubject = subjectMatch[1].trim();
      }
    }

    return NextResponse.json({
      success: true,
      content: generatedContent,
      subject: generatedSubject,
      tokensUsed,
      model: 'claude-sonnet-4-5',
    });
  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}

function buildEmailPrompt(params: GenerateEmailRequest): string {
  const {
    emailType,
    recipient,
    recipientName,
    subject,
    originalContext,
    customInstructions,
    tone,
    length,
    language,
  } = params;

  const toneDescriptions = {
    professional: language === 'NL' ? 'professioneel en zakelijk' : 'professional and business-like',
    casual: language === 'NL' ? 'casual en toegankelijk' : 'casual and approachable',
    formal: language === 'NL' ? 'formeel en beleefd' : 'formal and polite',
    friendly: language === 'NL' ? 'vriendelijk en warm' : 'friendly and warm',
  };

  const lengthDescriptions = {
    short: language === 'NL' ? 'kort en bondig (max 150 woorden)' : 'short and concise (max 150 words)',
    medium: language === 'NL' ? 'gemiddeld (200-300 woorden)' : 'medium length (200-300 words)',
    long: language === 'NL' ? 'uitgebreid (400-500 woorden)' : 'detailed (400-500 words)',
  };

  let prompt = '';

  if (language === 'NL') {
    prompt = `Schrijf een ${toneDescriptions[tone as keyof typeof toneDescriptions]} email in het Nederlands.

Lengte: ${lengthDescriptions[length as keyof typeof lengthDescriptions]}

`;

    if (emailType === 'reply' && originalContext) {
      prompt += `Dit is een antwoord op de volgende email:
---
${originalContext}
---

`;
    }

    if (recipientName) {
      prompt += `Ontvanger: ${recipientName}\n`;
    }

    if (recipient) {
      prompt += `Email adres: ${recipient}\n`;
    }

    if (subject) {
      prompt += `Onderwerp: ${subject}\n`;
    }

    prompt += `\nInstructies: ${customInstructions}

Schrijf een volledige, professionele email die klaar is om te verzenden. Begin met een passende aanhef en eindig met een passende afsluiting. Gebruik de afzender "info@WritgoAI.nl" als afzender.

Email:`;
  } else {
    prompt = `Write a ${toneDescriptions[tone as keyof typeof toneDescriptions]} email in English.

Length: ${lengthDescriptions[length as keyof typeof lengthDescriptions]}

`;

    if (emailType === 'reply' && originalContext) {
      prompt += `This is a reply to the following email:
---
${originalContext}
---

`;
    }

    if (recipientName) {
      prompt += `Recipient: ${recipientName}\n`;
    }

    if (recipient) {
      prompt += `Email address: ${recipient}\n`;
    }

    if (subject) {
      prompt += `Subject: ${subject}\n`;
    }

    prompt += `\nInstructions: ${customInstructions}

Write a complete, professional email that is ready to send. Start with an appropriate greeting and end with an appropriate closing. Use "info@WritgoAI.nl" as the sender.

Email:`;
  }

  return prompt;
}
