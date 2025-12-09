import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { generateImage, IMAGE_MODELS } from '@/lib/aiml-api';
import { deductCredits, getClientCredits } from '@/lib/credits';
import { prisma } from '@/lib/db';

// Afbeelding modellen met kwaliteit en prijzen
const IMAGE_MODEL_OPTIONS = [
  {
    id: 'FLUX_SCHNELL',
    name: 'Flux Schnell',
    description: 'Snelste AI afbeelding generatie',
    quality: 'Standaard',
    speed: '⚡⚡⚡ Super Snel',
    credits: 3,
    recommended: true,
  },
  {
    id: 'FLUX_DEV',
    name: 'Flux Dev',
    description: 'Goede balans tussen kwaliteit en snelheid',
    quality: 'Hoog',
    speed: '⚡⚡ Snel',
    credits: 5,
    recommended: false,
  },
  {
    id: 'FLUX_PRO',
    name: 'Flux Pro',
    description: 'Professionele kwaliteit voor beste resultaten',
    quality: 'Premium',
    speed: '⚡ Normaal',
    credits: 8,
    recommended: false,
  },
  {
    id: 'FLUX_REALISM',
    name: 'Flux Realism',
    description: 'Ultra-realistische foto\'s',
    quality: 'Ultra Realistisch',
    speed: '⚡ Normaal',
    credits: 10,
    recommended: false,
  },
  {
    id: 'DALLE_3',
    name: 'DALL-E 3',
    description: 'OpenAI\'s premium afbeelding generator',
    quality: 'Premium',
    speed: '⚡ Normaal',
    credits: 12,
    recommended: false,
  },
  {
    id: 'IMAGEN_3',
    name: 'Google Imagen 3',
    description: 'Google\'s geavanceerde AI afbeeldingen',
    quality: 'Premium',
    speed: '⚡ Normaal',
    credits: 10,
    recommended: false,
  },
  {
    id: 'SD_35',
    name: 'Stable Diffusion 3.5',
    description: 'Open-source high-quality generatie',
    quality: 'Hoog',
    speed: '⚡⚡ Snel',
    credits: 6,
    recommended: false,
  },
] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    // Return available models and their pricing
    return NextResponse.json({
      success: true,
      models: IMAGE_MODEL_OPTIONS,
    });
  } catch (error: any) {
    console.error('Error fetching image models:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij het ophalen van modellen' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const { prompt, model = 'FLUX_SCHNELL' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is verplicht' },
        { status: 400 }
      );
    }

    // Find model configuration
    const modelConfig = IMAGE_MODEL_OPTIONS.find(m => m.id === model);
    if (!modelConfig) {
      return NextResponse.json(
        { error: 'Ongeldig model geselecteerd' },
        { status: 400 }
      );
    }

    console.log(`🎨 Generating image with ${modelConfig.name} (${modelConfig.credits} credits)`);
    console.log(`🖼️ Original prompt: ${prompt}`);

    // Enhance prompt with quality instructions for better results
    const enhancedPrompt = `${prompt}

Important: Create a unique, contextually relevant image that matches the specific content described above. Avoid generic stock imagery. Focus on visual storytelling that enhances the written content.`;

    console.log(`✨ Enhanced prompt: ${enhancedPrompt}`);

    // Get client ID from email
    const { prisma } = await import('@/lib/db');
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    // Check if user has enough credits
    const creditInfo = await getClientCredits(client.id);
    if (!creditInfo) {
      return NextResponse.json({ error: 'Kan credits niet ophalen' }, { status: 500 });
    }

    const availableCredits = creditInfo.subscriptionCredits + creditInfo.topUpCredits;
    
    if (!creditInfo.isUnlimited && availableCredits < modelConfig.credits) {
      return NextResponse.json(
        { 
          error: 'Onvoldoende credits',
          required: modelConfig.credits,
          available: availableCredits,
        },
        { status: 402 }
      );
    }

    // Generate image with AIML API using enhanced prompt
    const result = await generateImage({
      prompt: enhancedPrompt,
      model: model as keyof typeof IMAGE_MODELS,
      num_images: 1,
    });

    if (!result.success || !result.images || result.images.length === 0) {
      throw new Error(result.error || 'Geen afbeelding gegenereerd');
    }

    // Deduct credits
    await deductCredits(
      client.id,
      modelConfig.credits,
      `AI Afbeelding: ${modelConfig.name}`,
      { model: modelConfig.name }
    );

    return NextResponse.json({
      success: true,
      imageUrl: result.images[0],
      model: modelConfig.name,
      creditsUsed: modelConfig.credits,
    });
  } catch (error: any) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij het genereren van afbeelding' },
      { status: 500 }
    );
  }
}
