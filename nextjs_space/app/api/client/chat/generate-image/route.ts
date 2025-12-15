
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateImage } from '@/lib/aiml-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, conversationId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is vereist' }, { status: 400 });
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Generate image using Flux Pro
    const result = await generateImage({
      prompt,
      model: 'FLUX_PRO',
      width: 1024,
      height: 1024,
      num_images: 1,
    });

    const imageUrl = result.images?.[0];
    if (!imageUrl || !result.success) {
      throw new Error(result.error || 'Geen afbeelding gegenereerd');
    }

    // Save to conversation history
    if (conversationId) {
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: `![Generated Image](${imageUrl})\n\n*Gegenereerde afbeelding: ${prompt}*`,
          model: 'flux-pro',
        },
      });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Afbeelding genereren mislukt' },
      { status: 500 }
    );
  }
}
