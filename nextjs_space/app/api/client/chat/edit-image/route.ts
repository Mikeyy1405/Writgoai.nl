
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

    const { imageUrl, prompt, conversationId } = await req.json();

    if (!imageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Image URL en prompt zijn vereist' },
        { status: 400 }
      );
    }

    // Get client
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    // Generate new image based on edit prompt
    // Note: Flux Pro doesn't support direct image editing, so we regenerate with enhanced prompt
    const enhancedPrompt = `${prompt} (based on style and composition of previous image)`;
    
    const result = await generateImage({
      prompt: enhancedPrompt,
      model: 'FLUX_PRO',
      width: 1024,
      height: 1024,
      num_images: 1,
    });

    const newImageUrl = result.images?.[0];
    if (!newImageUrl || !result.success) {
      throw new Error(result.error || 'Geen afbeelding gegenereerd');
    }

    // Save to conversation history
    if (conversationId) {
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'assistant',
          content: `![Edited Image](${newImageUrl})\n\n*Bewerkte afbeelding: ${prompt}*`,
          model: 'flux-pro',
        },
      });
    }

    return NextResponse.json({ imageUrl: newImageUrl });
  } catch (error: any) {
    console.error('Image edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Afbeelding bewerken mislukt' },
      { status: 500 }
    );
  }
}
