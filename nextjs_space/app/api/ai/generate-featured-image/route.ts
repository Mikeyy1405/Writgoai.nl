
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { topic, style = 'realistic' } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    console.log('🖼️ Generating featured image with text overlay for:', topic);

    // Style prompts
    const stylePrompts: Record<string, string> = {
      'realistic': 'photorealistic, professional photography, high-quality, modern',
      'illustration': 'digital illustration, vibrant colors, artistic style, professional design',
      'minimalist': 'minimalist design, clean, simple, professional, modern aesthetic',
      'abstract': 'abstract art, creative, modern, professional design',
    };

    const stylePrompt = stylePrompts[style] || stylePrompts['realistic'];

    // Create a prompt that encourages text overlay similar to the examples
    const prompt = `Create a professional featured image with text overlay for an article about "${topic}". 
Style: ${stylePrompt}.
The image should include:
- Eye-catching main visual element (relevant icon, graphic, or imagery)
- Bold text overlay with the article topic or key phrase
- Professional graphic design with good typography
- Suitable as a blog header or social media preview
- Attractive color scheme that pops
- Money/business elements if relevant (stacks of cash, coins, etc.)
- High-quality, modern design aesthetic similar to YouTube thumbnails
Make it visually striking and professional, with clear readable text integrated into the design.`;

    console.log('   - Image prompt:', prompt);

    // Call OpenAI DALL-E API
    const imageResponse = await fetch('https://i.ytimg.com/vi/4d_M5y9Lowc/hqdefault.jpg?v=645270e8', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1792x1024', // Wide format for featured images
        quality: 'standard',
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      console.error(`❌ Image generation failed (${imageResponse.status}):`, errorText);
      throw new Error('Failed to generate image');
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url || '';

    if (!imageUrl) {
      console.error('❌ No URL in image response:', imageData);
      throw new Error('No image URL returned');
    }

    console.log('✅ Featured image generated successfully');

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl
    });

  } catch (error: any) {
    console.error('❌ Error generating featured image:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate featured image',
        details: error.stack
      },
      { status: 500 }
    );
  }
}
