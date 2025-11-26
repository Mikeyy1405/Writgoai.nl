
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendChatCompletion } from '@/lib/aiml-chat-client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
    }

    const body = await req.json();
    const { code, instruction, language, conversationId, settings } = body;

    if (!code || !instruction || !language) {
      return NextResponse.json(
        { error: 'Code, instruction en language zijn verplicht' },
        { status: 400 }
      );
    }

    // Build the refinement prompt
    const prompt = `Je bent een expert ${language.toUpperCase()} developer. 

Huidige ${language.toUpperCase()} code:
\`\`\`${language}
${code}
\`\`\`

Verfijningsopdracht: ${instruction}

Lever ALLEEN de verbeterde ${language.toUpperCase()} code op, zonder extra uitleg of markdown code blocks. Geef de pure code terug.`;

    // Apply personality and settings if provided
    let systemPrompt = 'Je bent een expert code developer die helpt met het schrijven en verbeteren van code.';
    
    if (settings?.personality) {
      systemPrompt += ` ${settings.personality}`;
    }

    // Generate refined code using GPT-5.1 or selected model
    const response = await sendChatCompletion({
      model: settings?.model || 'gpt-5.1',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: settings?.temperature || 0.7,
      max_tokens: 4000,
      stream: false,
    });

    // Type guard to check if response is not a stream
    if (!('choices' in response)) {
      throw new Error('Onverwachte response type');
    }

    const refinedCodeRaw = response.choices[0]?.message?.content || '';
    if (!refinedCodeRaw) {
      throw new Error('Geen verfijnde code ontvangen');
    }

    let refinedCode = refinedCodeRaw.trim();

    // Remove markdown code blocks if present
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\n?([\\s\\S]*?)\\n?\`\`\``, 'i');
    const match = refinedCode.match(codeBlockRegex);
    if (match) {
      refinedCode = match[1].trim();
    }

    // Also try generic code block
    const genericMatch = refinedCode.match(/```\n?([\s\S]*?)\n?```/);
    if (genericMatch) {
      refinedCode = genericMatch[1].trim();
    }

    return NextResponse.json({
      refinedCode,
      success: true,
    });
  } catch (error: any) {
    console.error('Code refinement error:', error);
    return NextResponse.json(
      { error: error.message || 'Code refinement mislukt' },
      { status: 500 }
    );
  }
}
