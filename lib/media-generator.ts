
/**
 * Media Generator Library
 * Generates images and videos for social media posts using AI/ML API
 */

import { searchPixabayImages, getPixabayImageForTopic } from './pixabay-api';
import { createAIVideo, getVideoUrl } from './vadoo';
import { chatCompletion, selectOptimalModelForTask, generateVideo, checkVideoStatus, VIDEO_MODELS } from './aiml-api';

interface MediaStyle {
  id: string;
  name: string;
  icon?: string;
}

// Vadoo AI Image Styles - exact match with Vadoo API
export const IMAGE_STYLES: MediaStyle[] = [
  { id: 'None', name: 'None', icon: '⚪' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'photographic', name: 'Photographic', icon: '📸' },
  { id: 'digital art', name: 'Digital Art', icon: '🎨' },
  { id: 'fantasy art', name: 'Fantasy Art', icon: '🧙' },
  { id: '3d model', name: '3D Model', icon: '🎲' },
  { id: 'neon punk', name: 'Neon Punk', icon: '⚡' },
  { id: 'analog film', name: 'Analog Film', icon: '📹' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎭' },
  { id: 'comic book', name: 'Comic Book', icon: '📚' },
  { id: 'craft clay', name: 'Craft Clay', icon: '🏺' },
  { id: 'isometric', name: 'Isometric', icon: '📐' },
  { id: 'line art', name: 'Line Art', icon: '✏️' },
  { id: 'low poly', name: 'Low Poly', icon: '🔷' },
  { id: 'origami', name: 'Origami', icon: '🦢' },
  { id: 'pixel art', name: 'Pixel Art', icon: '🎮' },
  { id: 'playground', name: 'Playground', icon: '🎪' },
  { id: 'texture', name: 'Texture', icon: '🧱' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
];

// Video styles (also used by Vadoo)
export const VIDEO_STYLES: MediaStyle[] = [
  { id: 'None', name: 'None', icon: '⚪' },
  { id: 'cinematic', name: 'Cinematic', icon: '🎬' },
  { id: 'photographic', name: 'Photographic', icon: '📸' },
  { id: 'digital art', name: 'Digital Art', icon: '🎨' },
  { id: 'fantasy art', name: 'Fantasy Art', icon: '🧙' },
  { id: '3d model', name: '3D Model', icon: '🎲' },
  { id: 'neon punk', name: 'Neon Punk', icon: '⚡' },
  { id: 'analog film', name: 'Analog Film', icon: '📹' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: 'cartoon', name: 'Cartoon', icon: '🎭' },
  { id: 'comic book', name: 'Comic Book', icon: '📚' },
  { id: 'craft clay', name: 'Craft Clay', icon: '🏺' },
  { id: 'isometric', name: 'Isometric', icon: '📐' },
  { id: 'line art', name: 'Line Art', icon: '✏️' },
  { id: 'low poly', name: 'Low Poly', icon: '🔷' },
  { id: 'origami', name: 'Origami', icon: '🦢' },
  { id: 'pixel art', name: 'Pixel Art', icon: '🎮' },
  { id: 'playground', name: 'Playground', icon: '🎪' },
  { id: 'texture', name: 'Texture', icon: '🧱' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
];

/**
 * Generate an image based on the content and style
 * Uses AI to extract relevant keywords, then searches Pixabay
 */
export async function generateMediaImage(
  content: string,
  style: string = 'None'
): Promise<string> {
  try {
    console.log('🖼️ Generating image for content:', content.slice(0, 100));
    
    // Use AI to extract smart keywords that match the content
    const keywords = await extractSmartKeywords(content);
    console.log('🔍 AI extracted keywords:', keywords);
    
    // Map style to search terms
    const styleSearchTerms: Record<string, string> = {
      'None': '',
      'cinematic': 'cinematic film movie scene',
      'photographic': 'professional photography high quality',
      'digital art': 'digital art illustration',
      'fantasy art': 'fantasy art magical',
      '3d model': '3d render model',
      'neon punk': 'neon cyberpunk futuristic',
      'analog film': 'vintage film retro',
      'anime': 'anime style japanese',
      'cartoon': 'cartoon illustration',
      'comic book': 'comic book superhero',
      'craft clay': 'clay craft handmade',
      'isometric': 'isometric design flat',
      'line art': 'line art sketch drawing',
      'low poly': 'low poly geometric',
      'origami': 'origami paper art',
      'pixel art': 'pixel art retro game',
      'playground': 'colorful playful bright',
      'texture': 'texture pattern abstract',
      'watercolor': 'watercolor painting art',
    };
    
    // Build search query (limit to 100 characters max for Pixabay)
    const styleTerms = styleSearchTerms[style] || '';
    let searchQuery = styleTerms ? `${keywords} ${styleTerms}` : keywords;
    
    // Pixabay has a limit on query length, truncate if needed
    if (searchQuery.length > 100) {
      searchQuery = keywords.slice(0, 80); // Use just keywords if combined query is too long
    }
    
    console.log('🔎 Searching Pixabay with:', searchQuery);
    
    // Try to get image from Pixabay
    const results = await searchPixabayImages(searchQuery, {
      orientation: 'horizontal',
      perPage: 5,
    });
    
    if (results && results.hits && results.hits.length > 0) {
      console.log('✅ Found', results.hits.length, 'images');
      // Return the first image URL
      return results.hits[0].largeImageURL;
    }
    
    // Fallback: try with just keywords
    console.log('⚠️ No results, trying fallback search...');
    const fallbackImage = await getPixabayImageForTopic(keywords);
    if (fallbackImage) {
      console.log('✅ Fallback image found');
      return fallbackImage;
    }
    
    // If all fails, throw error
    throw new Error('No images found for the given content');
  } catch (error) {
    console.error('Error generating media image:', error);
    throw error;
  }
}

/**
 * Extract smart keywords using AI to match content
 */
async function extractSmartKeywords(content: string): Promise<string> {
  try {
    const model = selectOptimalModelForTask('content_analysis', 'simple', 'speed');
    
    const prompt = `Analyseer deze social media post en geef de beste zoektermen voor een relevante afbeelding.

Post: "${content}"

Geef alleen de zoektermen (3-5 woorden) die het beste bij deze post passen voor het vinden van een relevante afbeelding. Geen hashtags, geen speciale karakters, alleen eenvoudige Engelse zoektermen gescheiden door spaties.

Voorbeeld output: "business meeting team office" of "healthy food vegetables fresh" of "travel mountains landscape"

Zoektermen:`;
    
    const response = await chatCompletion({
      model: model.primary.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 50,
    });
    
    const keywords = response.choices?.[0]?.message?.content?.trim() || '';
    
    // Fallback to simple extraction if AI fails
    if (!keywords || keywords.length < 5) {
      return extractKeywords(content);
    }
    
    return keywords;
  } catch (error) {
    console.error('Error extracting smart keywords, using fallback:', error);
    return extractKeywords(content);
  }
}

/**
 * Generate a video based on the content and selected model using AI/ML API
 */
export async function generateMediaVideo(
  content: string,
  modelId: string = 'alibaba/wan2.1-t2v-turbo'
): Promise<string> {
  try {
    console.log('🎥 Generating video with AI/ML API:', { content: content.slice(0, 100), modelId });
    
    // Use AI to create an optimized video prompt
    const videoPrompt = await generateVideoPrompt(content);
    console.log('📝 AI generated video prompt:', videoPrompt);
    
    // Ensure prompt is not too long (max 1000 characters)
    const finalPrompt = videoPrompt.length > 1000 ? videoPrompt.slice(0, 1000) : videoPrompt;
    
    // Map the model ID to the VIDEO_MODELS key
    const modelKey = getVideoModelKey(modelId);
    
    // Generate video using the correct AI/ML API function
    const result = await generateVideo({
      model: modelKey,
      prompt: finalPrompt,
      duration: 5,
      aspectRatio: '16:9',
    });
    
    if (!result.success || !result.videoId) {
      throw new Error(result.error || 'Failed to initiate video generation');
    }
    
    console.log('✅ Video generation initiated:', result.videoId);
    
    // Poll for video completion (max 300 seconds = 5 minutes)
    const maxAttempts = 60; // 60 * 5 seconds = 300 seconds
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
      
      const status = await checkVideoStatus(result.videoId);
      
      console.log(`⏳ Checking video status (attempt ${attempts + 1}/${maxAttempts}):`, status.status);
      
      if (status.status === 'completed' && status.videoUrl) {
        console.log('✅ Video generation complete:', status.videoUrl);
        return status.videoUrl;
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Video generation failed. Please try again or select a different model.');
      }
      
      attempts++;
    }
    
    // If we reach here, video is still processing
    throw new Error('Video generation timed out. The video may still be processing - please try again in a few minutes.');
  } catch (error) {
    console.error('❌ Error generating media video:', error);
    
    // Provide more helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('AI/ML API key is invalid. Please contact support.');
      }
      if (error.message.includes('402') || error.message.includes('credits') || error.message.includes('insufficient')) {
        throw new Error('Insufficient AI/ML API credits. Please add credits to your AI/ML account.');
      }
    }
    
    throw error;
  }
}

/**
 * Map model ID to VIDEO_MODELS key
 */
function getVideoModelKey(modelId: string): keyof typeof VIDEO_MODELS {
  // Map of model IDs to VIDEO_MODELS keys
  const modelMap: Record<string, keyof typeof VIDEO_MODELS> = {
    'video-01': 'MINIMAX_01',
    'klingai/v2.1-master-text-to-video': 'KLING_PRO',
    'kling-video/v2.1/standard/text-to-video': 'KLING_STANDARD',
    'alibaba/wan2.1-t2v-turbo': 'MINIMAX_01', // Default fallback
  };
  
  return modelMap[modelId] || 'MINIMAX_01';
}

/**
 * Generate an optimized video prompt using AI
 */
async function generateVideoPrompt(content: string): Promise<string> {
  try {
    const model = selectOptimalModelForTask('video_script', 'simple', 'speed');
    
    const prompt = `Maak een video script prompt voor deze social media post. De prompt moet duidelijk beschrijven wat er visueel in de video moet worden getoond.

Social Media Post:
"${content}"

Geef een korte, duidelijke prompt (max 200 woorden) die beschrijft welke beelden en scenes er in de video moeten komen. Focus op visuele elementen die de boodschap ondersteunen.

Voorbeeld format:
"Show a professional office setting with a team collaborating around a table. Transition to close-up shots of people working on computers. End with a successful team celebration."

Video Prompt:`;
    
    const response = await chatCompletion({
      model: model.primary.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
    });
    
    const videoPrompt = response.choices?.[0]?.message?.content?.trim() || '';
    
    // Fallback to simple version if AI fails
    if (!videoPrompt || videoPrompt.length < 20) {
      return content.slice(0, 500);
    }
    
    return videoPrompt;
  } catch (error) {
    console.error('Error generating video prompt, using content directly:', error);
    return content.slice(0, 500);
  }
}

/**
 * Extract keywords from content for image/video search
 */
function extractKeywords(content: string): string {
  // Remove hashtags and special characters
  const cleaned = content
    .replace(/#\w+/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  
  // Get first 5 meaningful words
  const words = cleaned
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 5);
  
  return words.join(' ');
}

export default {
  IMAGE_STYLES,
  VIDEO_STYLES,
  generateMediaImage,
  generateMediaVideo,
};
