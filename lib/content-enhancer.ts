/**
 * Content Enhancer - Adds images and videos to article content
 * - Inserts images every 500 words using AIML Flux Pro 1.1
 * - Finds and embeds relevant YouTube video using Perplexity
 */

import { generateArticleImage } from './aiml-image-generator';
import { analyzeWithPerplexity } from './ai-client';

interface ContentEnhancementOptions {
  content: string;
  title: string;
  focusKeyword?: string;
  addImages?: boolean;
  addYouTubeVideo?: boolean;
  imageInterval?: number; // Words between images (default: 500)
}

interface EnhancedContent {
  content: string;
  imagesAdded: number;
  videoAdded: boolean;
}

/**
 * Enhance article content with images and video
 */
export async function enhanceArticleContent(
  options: ContentEnhancementOptions
): Promise<EnhancedContent> {
  let {
    content,
    title,
    focusKeyword = '',
    addImages = true,
    addYouTubeVideo = true,
    imageInterval = 500
  } = options;

  let imagesAdded = 0;
  let videoAdded = false;

  try {
    // Step 1: Add YouTube video after intro and before first H2
    if (addYouTubeVideo) {
      const videoResult = await addYouTubeVideoToContent(content, title, focusKeyword);
      if (videoResult.success) {
        content = videoResult.content;
        videoAdded = true;
        console.log('✓ YouTube video embedded:', videoResult.videoId);
      }
    }

    // Step 2: Add images every 500 words
    if (addImages) {
      const imageResult = await addImagesToContent(content, title, focusKeyword, imageInterval);
      content = imageResult.content;
      imagesAdded = imageResult.imagesAdded;
      console.log(`✓ Added ${imagesAdded} images to content`);
    }

    return {
      content,
      imagesAdded,
      videoAdded
    };
  } catch (error) {
    console.error('Content enhancement error:', error);
    // Return original content if enhancement fails
    return {
      content: options.content,
      imagesAdded: 0,
      videoAdded: false
    };
  }
}

/**
 * Find and embed YouTube video using Perplexity
 */
async function addYouTubeVideoToContent(
  content: string,
  title: string,
  focusKeyword: string
): Promise<{ success: boolean; content: string; videoId?: string }> {
  try {
    console.log('Searching for relevant YouTube video...');

    // Use Perplexity to find a relevant YouTube video
    const prompt = `Zoek een relevante YouTube video over "${title}" (focus keyword: "${focusKeyword}").

VEREISTEN:
- De video moet Nederlands OF Engels zijn
- De video moet informatief en relevant zijn
- De video moet van goede kwaliteit zijn (geen spam)
- Geef ALLEEN de YouTube video ID (de code na "v=" in de URL)

FORMAAT:
Geef ALLEEN de video ID terug, bijvoorbeeld: "dQw4w9WgXcQ"

Als je geen goede video kunt vinden, geef dan terug: "GEEN_VIDEO"`;

    const videoId = await analyzeWithPerplexity(prompt, 30000); // 30 second timeout
    const cleanVideoId = videoId.trim().replace(/[^a-zA-Z0-9_-]/g, '');

    if (!cleanVideoId || cleanVideoId === 'GEEN_VIDEO' || cleanVideoId.length < 5) {
      console.warn('No suitable YouTube video found');
      return { success: false, content };
    }

    // Find the position after intro and before first H2
    const firstH2Match = content.match(/(<h2[^>]*>)/i);

    if (!firstH2Match) {
      console.warn('No H2 heading found, cannot insert video');
      return { success: false, content };
    }

    const insertPosition = firstH2Match.index || 0;

    // Create YouTube embed HTML
    const youtubeEmbed = `
<div class="youtube-video-container" style="margin: 2rem 0; max-width: 100%;">
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden;">
    <iframe
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
      src="https://www.youtube.com/embed/${cleanVideoId}"
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen>
    </iframe>
  </div>
</div>

`;

    // Insert video before first H2
    const enhancedContent =
      content.substring(0, insertPosition) +
      youtubeEmbed +
      content.substring(insertPosition);

    return {
      success: true,
      content: enhancedContent,
      videoId: cleanVideoId
    };
  } catch (error) {
    console.error('YouTube video embedding error:', error);
    return { success: false, content };
  }
}

/**
 * Add images throughout the content every N words
 */
async function addImagesToContent(
  content: string,
  title: string,
  focusKeyword: string,
  wordInterval: number
): Promise<{ content: string; imagesAdded: number }> {
  try {
    // Split content into sections by headings
    const sections = splitContentIntoSections(content);
    let enhancedContent = '';
    let totalWordsProcessed = 0;
    let imagesAdded = 0;
    let nextImageAt = wordInterval;

    for (const section of sections) {
      const sectionWordCount = countWords(section.content);

      // Check if we should add an image after this section
      if (totalWordsProcessed + sectionWordCount >= nextImageAt && imagesAdded < 10) { // Max 10 images
        // Add the section content first
        enhancedContent += section.content;

        // Generate image based on section context
        const imagePrompt = generateImagePrompt(section.heading || title, focusKeyword);
        console.log(`Generating image ${imagesAdded + 1} for section:`, section.heading || 'content');

        const imageUrl = await generateArticleImage(imagePrompt, 'photorealistic');

        if (imageUrl) {
          const altText = `Illustratie voor ${section.heading || focusKeyword}`;
          const imageHtml = `
<figure style="margin: 2rem 0;">
  <img src="${imageUrl}" alt="${altText}" style="width: 100%; height: auto; border-radius: 8px;" />
  <figcaption style="text-align: center; font-size: 0.9em; color: #666; margin-top: 0.5rem;">${altText}</figcaption>
</figure>

`;
          enhancedContent += imageHtml;
          imagesAdded++;
          nextImageAt += wordInterval;
        }
      } else {
        enhancedContent += section.content;
      }

      totalWordsProcessed += sectionWordCount;
    }

    return {
      content: enhancedContent,
      imagesAdded
    };
  } catch (error) {
    console.error('Image insertion error:', error);
    return { content, imagesAdded: 0 };
  }
}

/**
 * Split content into sections by headings
 */
function splitContentIntoSections(content: string): Array<{ heading?: string; content: string }> {
  const sections: Array<{ heading?: string; content: string }> = [];

  // Split by H2 and H3 headings
  const parts = content.split(/(<h[23][^>]*>.*?<\/h[23]>)/gi);

  let currentSection = '';
  let currentHeading: string | undefined;

  for (const part of parts) {
    if (part.match(/<h[23][^>]*>/i)) {
      // This is a heading
      if (currentSection) {
        sections.push({ heading: currentHeading, content: currentSection });
        currentSection = '';
      }
      currentHeading = part.replace(/<[^>]*>/g, '').trim();
      currentSection = part;
    } else {
      currentSection += part;
    }
  }

  if (currentSection) {
    sections.push({ heading: currentHeading, content: currentSection });
  }

  return sections.length > 0 ? sections : [{ content }];
}

/**
 * Count words in HTML content
 */
function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.split(' ').filter(w => w.length > 0).length;
}

/**
 * Generate image prompt based on section context
 */
function generateImagePrompt(heading: string, focusKeyword: string): string {
  // Create a contextual prompt based on the heading
  const cleanHeading = heading.toLowerCase();

  // Topic-specific prompts
  if (cleanHeading.includes('seo') || cleanHeading.includes('zoekmachine')) {
    return 'SEO analytics dashboard, search engine optimization concept, digital marketing workspace';
  }

  if (cleanHeading.includes('wordpress') || cleanHeading.includes('website')) {
    return 'modern WordPress website development, web design workspace, content management system';
  }

  if (cleanHeading.includes('content') || cleanHeading.includes('tekst') || cleanHeading.includes('schrijven')) {
    return 'content creation workspace, writing and editing, creative content development';
  }

  if (cleanHeading.includes('social media') || cleanHeading.includes('sociale')) {
    return 'social media marketing, digital engagement, online community management';
  }

  if (cleanHeading.includes('strategie') || cleanHeading.includes('planning')) {
    return 'business strategy planning, digital marketing roadmap, strategic workspace';
  }

  if (cleanHeading.includes('analyse') || cleanHeading.includes('data') || cleanHeading.includes('resultaten')) {
    return 'data analytics dashboard, business metrics, performance analysis visualization';
  }

  if (cleanHeading.includes('tips') || cleanHeading.includes('stappen') || cleanHeading.includes('how')) {
    return 'step-by-step guide visualization, tutorial concept, learning and development';
  }

  // Default: use heading and focus keyword
  return `${heading}, ${focusKeyword}, professional business concept, modern workspace`;
}
