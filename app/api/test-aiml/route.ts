import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.AIML_API_KEY!,
      baseURL: 'https://api.aimlapi.com/v1',
    });

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4.5',
      max_tokens: 50,
      messages: [
        { role: 'user', content: 'Say "AIML API werkt!" in Dutch' }
      ],
    });

    return NextResponse.json({
      success: true,
      model: 'anthropic/claude-sonnet-4.5',
      response: completion.choices[0]?.message?.content,
      provider: 'AIML API',
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
