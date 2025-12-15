
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { translateToEnglish } from '@/lib/prompt-translator';
import { uploadFile } from '@/lib/s3';
import { getBucketConfig } from '@/lib/aws-config';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';

export const dynamic = 'force-dynamic';

export const maxDuration = 300;

// Beschikbare AI modellen voor image generation - ALLEEN WERKENDE MODELLEN
const AVAILABLE_MODELS = [
  {
    id: 'stable-diffusion-v3-medium',
    name: 'Stable Diffusion 3',
    description: 'Goede balans tussen kwaliteit en snelheid',
    cost: 4,
    provider: 'AIML'
  },
  {
    id: 'stable-diffusion-v35-large',
    name: 'Stable Diffusion 3.5',
    description: 'Nieuwste SD versie, AANBEVOLEN voor beste prijs/kwaliteit',
    cost: 4,
    provider: 'AIML'
  },
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Premium kwaliteit, fotorealisme',
    cost: 5,
    provider: 'AIML'
  },
  {
    id: 'flux-realism',
    name: 'Flux Realism',
    description: 'Ultra realistische fotografie',
    cost: 5,
    provider: 'AIML'
  },
  {
    id: 'flux-pro/v1.1-ultra',
    name: 'Flux Pro Ultra',
    description: 'Ultra HD, hoogste resolutie',
    cost: 8,
    provider: 'AIML'
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI creatieve kunstenaar',
    cost: 18,
    provider: 'OpenAI'
  },
  {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    description: 'OpenAI nieuwste image model',
    cost: 18,
    provider: 'OpenAI'
  },
  {
    id: 'imagen-3.0-generate-002',
    name: 'Google Imagen 3',
    description: 'Google flagship image model',
    cost: 6,
    provider: 'Google'
  },
  {
    id: 'recraft-v3',
    name: 'Recraft V3',
    description: 'Gespecialiseerd in design en graphics',
    cost: 5,
    provider: 'Recraft'
  }
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasEmail: !!session?.user?.email,
      email: session?.user?.email
    });
    
    if (!session?.user?.email) {
      console.error('No session or email found');
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client niet gevonden' }, { status: 404 });
    }

    const body = await req.json();
    const { 
      prompt, 
      model = 'stable-diffusion-v35-large', 
      projectId,
      aspectRatio = 'landscape',
      style,
      textOverlay
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is verplicht' }, { status: 400 });
    }

    // Vind model info
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === model);
    if (!modelInfo) {
      return NextResponse.json({ error: 'Ongeldig model' }, { status: 400 });
    }

    // Bepaal credit cost op basis van model
    let creditCost: number;
    if (model.includes('gpt-image') || model.includes('dall-e-3')) {
      creditCost = CREDIT_COSTS.IMAGE_PREMIUM; // 18 credits
    } else if (model.includes('flux-pro')) {
      creditCost = model.includes('ultra') ? 8 : 5; // 8 voor Ultra, 5 voor Pro/Realism
    } else if (model.includes('stable-diffusion')) {
      creditCost = CREDIT_COSTS.IMAGE_BUDGET; // 4 credits
    } else if (model.includes('imagen') || model.includes('recraft')) {
      creditCost = model.includes('imagen') ? 6 : 5; // 6 voor Imagen, 5 voor Recraft
    } else {
      creditCost = CREDIT_COSTS.IMAGE_STANDARD; // Default: 5 credits
    }

    // Check of client genoeg credits heeft
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    if (!hasCredits) {
      return NextResponse.json({ 
        error: `Onvoldoende credits. Je hebt ${creditCost} credits nodig.` 
      }, { status: 402 });
    }

    // Vertaal prompt naar Engels voor betere resultaten
    console.log('Original prompt:', prompt);
    let englishPrompt = await translateToEnglish(prompt);
    console.log('Translated prompt:', englishPrompt);

    // Enhance prompt with style if specified
    if (style && style !== 'none') {
      const styleDescriptions: Record<string, string> = {
        'photorealistic': 'photorealistic, highly detailed, professional photography',
        'cinematic': 'cinematic lighting, dramatic composition, movie scene quality',
        'anime': 'anime style, manga illustration, Japanese animation art',
        'digital-art': 'digital art, modern illustration, concept art',
        'oil-painting': 'oil painting, classical art style, painted texture',
        'watercolor': 'watercolor painting, soft colors, artistic brush strokes',
        '3d-render': '3D render, CGI, photorealistic rendering, high quality graphics',
        'minimalist': 'minimalist design, clean, simple, modern aesthetic',
        'vintage': 'vintage style, retro, nostalgic, aged look',
        'comic': 'comic book style, bold lines, graphic novel art',
        'neon': 'neon lights, cyberpunk aesthetic, glowing colors, futuristic',
      };
      
      const styleModifier = styleDescriptions[style];
      if (styleModifier) {
        englishPrompt = `${englishPrompt}, ${styleModifier}`;
        console.log('Enhanced with style:', englishPrompt);
      }
    }

    // Add text overlay to prompt if specified
    if (textOverlay) {
      englishPrompt = `${englishPrompt}, with prominent text overlay saying "${textOverlay}"`;
      console.log('Enhanced with text overlay:', englishPrompt);
    }

    // Determine image size based on aspect ratio
    let imageSize = '1024x1024'; // default square
    if (aspectRatio === 'landscape') {
      imageSize = '1792x1024'; // 16:9 landscape
    } else if (aspectRatio === 'portrait') {
      imageSize = '1024x1792'; // 9:16 portrait
    }
    console.log('Image size:', imageSize);

    // Genereer afbeelding
    let imageUrl: string;
    let imageBuffer: Buffer;

    if (modelInfo.provider === 'AIML') {
      // Check if API key exists
      if (!process.env.AIML_API_KEY) {
        console.error('AIML_API_KEY is not set in environment variables');
        throw new Error('AIML API key is niet geconfigureerd. Neem contact op met de beheerder.');
      }
      
      // Gebruik AIML API
      console.log('Using AIML API key:', process.env.AIML_API_KEY?.substring(0, 10) + '...');
      const response = await fetch('https://api.aimlapi.com/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: englishPrompt,
          n: 1,
          size: imageSize,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('AIML API error:', error);
        throw new Error('Image generation mislukt');
      }

      const data = await response.json();
      imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('Geen image URL ontvangen');
      }

      // Download image
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);

    } else if (modelInfo.provider === 'OpenAI') {
      // DALL-E 3 heeft beperkte size opties: 1024x1024, 1792x1024, 1024x1792
      let dalleSize = imageSize;
      if (!['1024x1024', '1792x1024', '1024x1792'].includes(imageSize)) {
        // Fallback to square if unsupported
        dalleSize = '1024x1024';
      }
      
      // Gebruik OpenAI DALL-E 3
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: englishPrompt,
          n: 1,
          size: dalleSize,
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error('Image generation mislukt');
      }

      const data = await response.json();
      imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('Geen image URL ontvangen');
      }

      // Download image
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('Onbekende provider');
    }

    // Upload naar S3
    const { folderPrefix } = getBucketConfig();
    const fileName = `${folderPrefix}images/${Date.now()}-${model}.png`;
    const s3Key = await uploadFile(imageBuffer, fileName);

    // Deduct credits
    const deductResult = await deductCredits(
      client.id,
      creditCost,
      `Afbeelding gegenereerd met ${modelInfo.name}`,
      { model: model }
    );

    if (!deductResult.success) {
      console.error('Failed to deduct credits:', deductResult.error);
      // Continue anyway, image is already generated
    }

    // Save to database als project is specified
    if (projectId) {
      await prisma.generatedImage.create({
        data: {
          projectId,
          clientId: client.id,
          prompt: prompt,
          translatedPrompt: englishPrompt,
          model: model,
          imageUrl: s3Key,
          cost: creditCost,
        },
      });
    }

    console.log(`✅ Image generated successfully. Credits deducted: ${creditCost}, New balance: ${deductResult.newBalance}`);

    // Generate signed URL voor directe toegang
    const { getDownloadUrl } = await import('@/lib/s3');
    const signedUrl = await getDownloadUrl(s3Key);

    return NextResponse.json({
      success: true,
      imageUrl: s3Key,  // S3 key voor opslag
      signedUrl: signedUrl,  // Signed URL voor directe weergave
      model: modelInfo.name,
      cost: creditCost,
      creditsUsed: creditCost,
      newBalance: deductResult.newBalance,
      originalPrompt: prompt,
      translatedPrompt: englishPrompt,
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Er is een fout opgetreden' 
    }, { status: 500 });
  }
}

// Get available models
export async function GET() {
  return NextResponse.json({ models: AVAILABLE_MODELS });
}
