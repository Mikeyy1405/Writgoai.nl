/**
 * Flux Pro Image Generator
 * - Featured images for articles
 * - Custom prompts based on content
 * - High-quality output (1920x1080)
 * - Upload to AWS S3
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const AIML_API_KEY = process.env.AIML_API_KEY || '';
const AIML_BASE_URL = 'https://api.aimlapi.com';

// AWS S3 Configuration
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'writgo-content-images';
const AWS_REGION = process.env.AWS_REGION || 'eu-west-1';

if (!AIML_API_KEY) {
  console.warn('⚠️ AIML_API_KEY not set. Image generation will not work.');
}

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS credentials not set. S3 upload will not work.');
}

// Initialize S3 client
let s3Client: S3Client | null = null;
if (AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  });
}

export interface FluxImageOptions {
  prompt: string;
  articleTitle?: string;
  keywords?: string[];
  style?: 'photorealistic' | 'illustration' | 'digital-art' | 'minimalist';
  aspectRatio?: '16:9' | '1:1' | '4:3';
  seed?: number;
}

export interface FluxImageResult {
  imageUrl: string; // S3 URL
  localPath?: string;
  prompt: string;
  width: number;
  height: number;
  generatedAt: Date;
}

/**
 * Generate a featured image for an article using Flux Pro
 */
export async function generateArticleImage(
  articleTitle: string,
  keywords: string[],
  options?: Partial<FluxImageOptions>
): Promise<FluxImageResult> {
  console.log(`🎨 Generating image for article: "${articleTitle}"`);

  const {
    style = 'photorealistic',
    aspectRatio = '16:9',
    seed,
  } = options || {};

  // Generate a smart prompt based on the article title and keywords
  const imagePrompt = await generateImagePrompt(articleTitle, keywords, style);

  console.log(`📝 Image prompt: "${imagePrompt}"`);

  // Generate the image with Flux Pro
  const imageData = await generateFluxImage({
    prompt: imagePrompt,
    style,
    aspectRatio,
    seed,
  });

  // Upload to S3
  const s3Url = await uploadImageToS3(
    imageData,
    `articles/${Date.now()}-${slugify(articleTitle)}.png`
  );

  console.log(`✅ Image generated and uploaded: ${s3Url}`);

  return {
    imageUrl: s3Url,
    prompt: imagePrompt,
    width: aspectRatio === '16:9' ? 1920 : aspectRatio === '1:1' ? 1024 : 1600,
    height: aspectRatio === '16:9' ? 1080 : aspectRatio === '1:1' ? 1024 : 1200,
    generatedAt: new Date(),
  };
}

/**
 * Generate an optimized image prompt based on article content
 */
async function generateImagePrompt(
  articleTitle: string,
  keywords: string[],
  style: string
): Promise<string> {
  // Use AI to generate a creative, detailed image prompt
  const { chatCompletion, TEXT_MODELS } = await import('../aiml-api');

  const systemPrompt = `You are an expert at creating detailed image generation prompts for Flux Pro AI.

Style guidelines:
- Photorealistic: Focus on realistic photography, natural lighting, professional quality
- Illustration: Digital illustration, vibrant colors, artistic style
- Digital-art: Modern digital art, creative composition, artistic flair
- Minimalist: Clean, simple, minimal elements, focus on key subject

Create prompts that are:
- Specific and detailed
- Visually appealing
- Professional quality
- Relevant to the article topic
- Appropriate for featured images (16:9 aspect ratio)`;

  const userPrompt = `Create a detailed Flux Pro image generation prompt for this article:

ARTICLE TITLE: ${articleTitle}
KEYWORDS: ${keywords.join(', ')}
STYLE: ${style}

Requirements:
- Create a visually striking image that represents the article topic
- Include specific details about composition, lighting, colors
- Make it professional and eye-catching
- Keep it under 200 characters
- Don't include any text or words in the image
- Focus on visual elements only

Return only the prompt text, nothing else.`;

  try {
    const response = await chatCompletion({
      model: TEXT_MODELS.FAST, // Use GPT-4o-mini for speed
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // More creative
      max_tokens: 200,
    });

    const prompt = response.choices?.[0]?.message?.content?.trim() || '';
    
    if (prompt) {
      return prompt;
    }
  } catch (error) {
    console.warn('Failed to generate AI prompt, using fallback:', error);
  }

  // Fallback to a simple prompt
  return generateFallbackPrompt(articleTitle, keywords, style);
}

/**
 * Generate a fallback prompt without AI
 */
function generateFallbackPrompt(
  articleTitle: string,
  keywords: string[],
  style: string
): string {
  const styleDescriptors = {
    photorealistic: 'professional photography, high quality, realistic, natural lighting',
    illustration: 'digital illustration, vibrant colors, artistic style, detailed',
    'digital-art': 'modern digital art, creative composition, colorful, professional',
    minimalist: 'minimalist design, clean, simple, professional, modern',
  };

  const descriptor = styleDescriptors[style as keyof typeof styleDescriptors] || styleDescriptors.photorealistic;
  const subject = keywords[0] || articleTitle;

  return `${subject}, ${descriptor}, featured image, high quality, 16:9 aspect ratio`;
}

/**
 * Generate image using Flux Pro via AIML API
 */
async function generateFluxImage(
  options: FluxImageOptions
): Promise<Buffer> {
  const { prompt, aspectRatio = '16:9', seed } = options;

  // Determine dimensions based on aspect ratio
  const dimensions = {
    '16:9': { width: 1920, height: 1080 },
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1600, height: 1200 },
  };

  const { width, height } = dimensions[aspectRatio];

  console.log(`🎨 Calling Flux Pro API...`);

  try {
    const response = await fetch(`${AIML_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AIML_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'flux-pro', // or 'black-forest-labs/FLUX.1-pro'
        prompt,
        n: 1,
        size: `${width}x${height}`,
        response_format: 'b64_json', // Get base64 encoded image
        ...(seed && { seed }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flux Pro API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const imageB64 = data.data?.[0]?.b64_json;

    if (!imageB64) {
      // Try URL format
      const imageUrl = data.data?.[0]?.url;
      if (imageUrl) {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new Error('Failed to download image from URL');
        }
        const arrayBuffer = await imageResponse.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      throw new Error('No image data received from Flux Pro');
    }

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(imageB64, 'base64');

    console.log(`✅ Image generated: ${imageBuffer.length} bytes`);

    return imageBuffer;
  } catch (error) {
    console.error('❌ Error generating image with Flux Pro:', error);
    throw error;
  }
}

/**
 * Upload image to AWS S3
 */
export async function uploadImageToS3(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Check AWS credentials.');
  }

  console.log(`📤 Uploading to S3: ${filename}`);

  try {
    const command = new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: filename,
      Body: imageBuffer,
      ContentType: 'image/png',
      // Note: ACL removed for better security - use bucket policies instead
    });

    await s3Client.send(command);

    // Construct the public URL (assumes bucket has public read policy)
    const s3Url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${filename}`;

    console.log(`✅ Uploaded to S3: ${s3Url}`);

    return s3Url;
  } catch (error) {
    console.error('❌ Error uploading to S3:', error);
    throw error;
  }
}

/**
 * Generate image with retry logic
 */
export async function generateArticleImageWithRetry(
  articleTitle: string,
  keywords: string[],
  options?: Partial<FluxImageOptions>,
  maxRetries: number = 3
): Promise<FluxImageResult> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🎨 Image generation attempt ${attempt}/${maxRetries}`);
      return await generateArticleImage(articleTitle, keywords, options);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to generate image after retries');
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}
