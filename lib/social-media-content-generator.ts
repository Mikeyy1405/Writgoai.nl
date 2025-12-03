
/**
 * Social Media Content Generator
 * Generates platform-specific content using AI
 */

import { chatCompletion } from './aiml-api';
import { uploadFile } from './s3';

interface GeneratedSocialPost {
  content: string;
  hashtags: string[];
  suggestedTime?: string;
}

interface BlogPromotionData {
  title: string;
  excerpt: string;
  url: string;
  keywords: string[];
}

interface ProductHighlightData {
  productName: string;
  productUrl: string;
  benefits: string[];
  price?: string;
}

/**
 * Generate character limits per platform
 */
const PLATFORM_LIMITS = {
  linkedin: 3000,
  facebook: 63206,
  instagram: 2200,
  twitter: 280,
  youtube: 5000, // Community post
};

/**
 * Generate a blog promotional post
 */
export async function generateBlogPromoPost(
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube',
  blogData: BlogPromotionData,
  projectContext: {
    brandVoice?: string;
    targetAudience?: string;
    niche?: string;
    tone?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  }
): Promise<GeneratedSocialPost> {
  const charLimit = PLATFORM_LIMITS[platform];
  
  const prompt = `Je bent een social media content specialist. Creëer een engagerende ${platform} post die een nieuw blogartikel promoot.

Blog Informatie:
- Titel: ${blogData.title}
- Excerpt: ${blogData.excerpt}
- URL: ${blogData.url}
- Kernwoorden: ${blogData.keywords.join(', ')}

Project Context:
- Doelgroep: ${projectContext.targetAudience || 'algemeen publiek'}
- Niche: ${projectContext.niche || 'algemeen'}
- Brand Voice: ${projectContext.brandVoice || 'professioneel en informatief'}
- Tone: ${projectContext.tone || 'professional'}

Platform Specifieke Vereisten:
${getPlatformRequirements(platform)}

BELANGRIJKE REGELS:
1. Post moet EXACT ${charLimit} karakters of minder zijn
2. Gebruik ${projectContext.includeEmojis ? 'relevante emojis' : 'GEEN emojis'}
3. Maak de post engaging en actionable
4. Voeg een duidelijke call-to-action toe
5. Gebruik ${projectContext.tone || 'professionele'} toon
6. Post moet in het NEDERLANDS zijn
7. Gebruik GEEN Engelse of Duitse woorden

${projectContext.includeHashtags ? `
HASHTAGS:
- Voeg 3-5 relevante hashtags toe
- Hashtags moeten aan het einde van de post staan
- Gebruik populaire en niche-specifieke hashtags
` : 'Gebruik GEEN hashtags'}

Return ALLEEN een JSON object in dit formaat:
{
  "content": "De volledige post tekst met emojis en formatting",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'Je bent een expert social media content creator die engaging posts schrijft in het Nederlands.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleaned);

    return {
      content: result.content,
      hashtags: result.hashtags || [],
      suggestedTime: getSuggestedPostTime(platform),
    };
  } catch (error) {
    console.error('Error generating blog promo post:', error);
    throw new Error('Failed to generate social media post');
  }
}

/**
 * Generate a product highlight post
 */
export async function generateProductHighlightPost(
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube',
  productData: ProductHighlightData,
  projectContext: {
    brandVoice?: string;
    targetAudience?: string;
    niche?: string;
    tone?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  }
): Promise<GeneratedSocialPost> {
  const charLimit = PLATFORM_LIMITS[platform];
  
  const prompt = `Je bent een social media content specialist. Creëer een engagerende ${platform} post die een product promoot.

Product Informatie:
- Naam: ${productData.productName}
- URL: ${productData.productUrl}
- Voordelen: ${productData.benefits.join(', ')}
${productData.price ? `- Prijs: ${productData.price}` : ''}

Project Context:
- Doelgroep: ${projectContext.targetAudience || 'algemeen publiek'}
- Niche: ${projectContext.niche || 'algemeen'}
- Brand Voice: ${projectContext.brandVoice || 'professioneel en informatief'}
- Tone: ${projectContext.tone || 'professional'}

Platform Specifieke Vereisten:
${getPlatformRequirements(platform)}

BELANGRIJKE REGELS:
1. Post moet EXACT ${charLimit} karakters of minder zijn
2. Gebruik ${projectContext.includeEmojis ? 'relevante emojis' : 'GEEN emojis'}
3. Focus op de voordelen en waarde voor de lezer
4. Voeg een duidelijke call-to-action toe (bijv. "Bekijk het product")
5. Gebruik ${projectContext.tone || 'professionele'} toon
6. Post moet in het NEDERLANDS zijn
7. Gebruik GEEN Engelse of Duitse woorden

${projectContext.includeHashtags ? `
HASHTAGS:
- Voeg 3-5 relevante hashtags toe
- Hashtags moeten aan het einde van de post staan
- Gebruik populaire en niche-specifieke hashtags
` : 'Gebruik GEEN hashtags'}

Return ALLEEN een JSON object in dit formaat:
{
  "content": "De volledige post tekst met emojis en formatting",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'Je bent een expert social media content creator die engaging posts schrijft in het Nederlands.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleaned);

    return {
      content: result.content,
      hashtags: result.hashtags || [],
      suggestedTime: getSuggestedPostTime(platform),
    };
  } catch (error) {
    console.error('Error generating product highlight post:', error);
    throw new Error('Failed to generate social media post');
  }
}

/**
 * Generate a tips & tricks post
 */
export async function generateTipsPost(
  platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'youtube',
  topic: string,
  projectContext: {
    brandVoice?: string;
    targetAudience?: string;
    niche?: string;
    tone?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  }
): Promise<GeneratedSocialPost> {
  const charLimit = PLATFORM_LIMITS[platform];
  
  const prompt = `Je bent een social media content specialist. Creëer een waardevolle ${platform} post met tips & tricks.

Onderwerp: ${topic}

Project Context:
- Doelgroep: ${projectContext.targetAudience || 'algemeen publiek'}
- Niche: ${projectContext.niche || 'algemeen'}
- Brand Voice: ${projectContext.brandVoice || 'professioneel en informatief'}
- Tone: ${projectContext.tone || 'professional'}

Platform Specifieke Vereisten:
${getPlatformRequirements(platform)}

BELANGRIJKE REGELS:
1. Post moet EXACT ${charLimit} karakters of minder zijn
2. Gebruik ${projectContext.includeEmojis ? 'relevante emojis' : 'GEEN emojis'}
3. Geef 3-5 praktische tips die direct toepasbaar zijn
4. Maak het waardevol en informatief
5. Gebruik ${projectContext.tone || 'professionele'} toon
6. Post moet in het NEDERLANDS zijn
7. Gebruik GEEN Engelse of Duitse woorden

${projectContext.includeHashtags ? `
HASHTAGS:
- Voeg 3-5 relevante hashtags toe
- Hashtags moeten aan het einde van de post staan
- Gebruik populaire en niche-specifieke hashtags
` : 'Gebruik GEEN hashtags'}

Return ALLEEN een JSON object in dit formaat:
{
  "content": "De volledige post tekst met tips en emojis",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}`;

  try {
    const response = await chatCompletion({
      messages: [
        { role: 'system', content: 'Je bent een expert social media content creator die waardevolle tips deelt in het Nederlands.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || '{}';
    const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
    const result = JSON.parse(cleaned);

    return {
      content: result.content,
      hashtags: result.hashtags || [],
      suggestedTime: getSuggestedPostTime(platform),
    };
  } catch (error) {
    console.error('Error generating tips post:', error);
    throw new Error('Failed to generate social media post');
  }
}

/**
 * Get platform-specific requirements
 */
function getPlatformRequirements(platform: string): string {
  const requirements: Record<string, string> = {
    linkedin: `
- Professionele en zakelijke toon
- Focus op business value en expertise
- Gebruik line breaks voor leesbaarheid
- Voeg een call-to-action toe aan het einde
- LinkedIn ondersteunt emoji's en bullet points`,
    
    facebook: `
- Persoonlijke en conversational toon
- Verhalen vertellen werkt goed
- Vragen stellen om engagement te verhogen
- BELANGRIJK: Gebruik GEEN markdown formatting (**, __, ~~)
- BELANGRIJK: Gebruik GEEN bold/italic syntax
- Facebook ondersteunt emoji's maar GEEN markdown
- Schrijf gewone tekst zonder speciale formatting tekens`,
    
    instagram: `
- Visuele en inspirerende taal
- Gebruik emoji's om aandacht te trekken
- Kortere paragrafen voor mobile reading
- Start met een sterke opening zin
- Hashtags zijn cruciaal voor reach`,
    
    twitter: `
- Kort en krachtig (max 280 karakters)
- Gebruik emoji's spaarzaam
- Elke tweet moet standalone waarde hebben
- Overweeg een thread voor langere content`,
    
    youtube: `
- Community post format
- Gebruik emoji's om secties te scheiden
- Polls en vragen werken goed
- Kan langer zijn dan andere platforms`
  };

  return requirements[platform] || 'Standaard social media best practices';
}

/**
 * Remove markdown formatting for Facebook
 */
export function removeMarkdownForFacebook(content: string): string {
  // Remove bold (**text** or __text__)
  content = content.replace(/\*\*(.+?)\*\*/g, '$1');
  content = content.replace(/__(.+?)__/g, '$1');
  
  // Remove italic (*text* or _text_)
  content = content.replace(/\*(.+?)\*/g, '$1');
  content = content.replace(/_(.+?)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  content = content.replace(/~~(.+?)~~/g, '$1');
  
  // Remove code blocks (```code```)
  content = content.replace(/```(.+?)```/gs, '$1');
  content = content.replace(/`(.+?)`/g, '$1');
  
  return content;
}

/**
 * Get suggested posting time based on platform
 */
function getSuggestedPostTime(platform: string): string {
  const suggestedTimes: Record<string, string> = {
    linkedin: '09:00', // Werkdagen ochtend
    facebook: '13:00', // Lunch tijd
    instagram: '19:00', // Avond
    twitter: '12:00',   // Lunch tijd
    youtube: '18:00',   // Na werk
  };

  return suggestedTimes[platform] || '09:00';
}

/**
 * Generate AI image for social media post using flux-pro
 */
export async function generateSocialMediaImage(
  postContent: string,
  projectContext: {
    niche?: string;
    brandVoice?: string;
  }
): Promise<string | null> {
  try {
    console.log('🎨 Generating AI image for social media post...');
    
    // Create image prompt based on post content
    const imagePromptRequest = await chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Je bent een expert in het creëren van visueel aantrekkelijke social media afbeeldingen. Genereer een korte, beschrijvende prompt voor een AI image generator.'
        },
        {
          role: 'user',
          content: `Creëer een korte, visueel aantrekkelijke prompt voor een social media afbeelding gebaseerd op deze post content:

Post: ${postContent.substring(0, 500)}

Project Context:
- Niche: ${projectContext.niche || 'algemeen'}
- Brand Voice: ${projectContext.brandVoice || 'professioneel'}

BELANGRIJKE REGELS voor de prompt:
1. Maximaal 200 karakters
2. Focus op visuele elementen (kleuren, compositie, sfeer)
3. Vermeld GEEN tekst in de afbeelding
4. Gebruik concrete, visuele beschrijvingen
5. Maak het professioneel en aantrekkelijk
6. Prompt moet in het ENGELS zijn (voor beste AI resultaten)

Return ALLEEN de image prompt, niets anders.`
        }
      ],
      model: 'gpt-4o-mini',
      temperature: 0.7,
    });

    const imagePrompt = imagePromptRequest.choices[0]?.message?.content?.trim() || '';
    
    if (!imagePrompt) {
      console.error('❌ Failed to generate image prompt');
      return null;
    }

    console.log(`📝 Image prompt: ${imagePrompt}`);

    // Generate image with GPT Image 1
    const imageResponse = await fetch('https://api.aimlapi.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIML_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'stable-diffusion-3',  // Cost-optimized: $0.037 vs $0.18 for GPT-image-1
        prompt: imagePrompt,
        size: '1024x1024', // Square format for social media
        style: 'realistic_image', // vivid colors for social media
        quality: 'high',
        n: 1,
      }),
    });

    if (!imageResponse.ok) {
      console.error('❌ Image generation failed:', await imageResponse.text());
      return null;
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data?.[0]?.url;

    if (!imageUrl) {
      console.error('❌ No image URL in response');
      return null;
    }

    console.log('✅ Image generated, downloading...');

    // Download image
    const downloadResponse = await fetch(imageUrl);
    if (!downloadResponse.ok) {
      console.error('❌ Failed to download image');
      return null;
    }

    const imageBuffer = Buffer.from(await downloadResponse.arrayBuffer());

    // Upload to S3
    const timestamp = Date.now();
    const fileName = `social-media/post-${timestamp}.png`;
    const s3Key = await uploadFile(imageBuffer, fileName, 'image/png');

    console.log(`✅ Image uploaded to S3: ${s3Key}`);

    return s3Key;
  } catch (error) {
    console.error('❌ Error generating social media image:', error);
    return null;
  }
}
