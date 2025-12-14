/**
 * Enhanced WordPress Publisher met Error Handling en Retry Logic
 * Voor robuuste content publicatie
 */

import { WordPressClient } from '@/lib/content-hub/wordpress-client';

interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}

interface PublishOptions {
  title: string;
  content: string;
  excerpt?: string;
  categories?: string[];
  status?: 'publish' | 'draft';
  featuredImageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  focusKeyword?: string;
  scheduledDate?: string;
  tags?: string[];
}

interface PublishResult {
  success: boolean;
  postId?: number;
  link?: string;
  status?: string;
  error?: string;
  attempts?: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

/**
 * Sleep functie voor retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate WordPress configuratie
 */
function validateConfig(config: WordPressConfig): { valid: boolean; error?: string } {
  if (!config.siteUrl) {
    return { valid: false, error: 'WordPress site URL is verplicht' };
  }
  if (!config.username) {
    return { valid: false, error: 'WordPress username is verplicht' };
  }
  if (!config.applicationPassword) {
    return { valid: false, error: 'WordPress application password is verplicht' };
  }
  
  // Validate URL format
  try {
    new URL(config.siteUrl);
  } catch (e) {
    return { valid: false, error: 'Ongeldige WordPress URL' };
  }
  
  return { valid: true };
}

/**
 * Publish naar WordPress met retry logic en error handling
 */
export async function publishToWordPressEnhanced(
  config: WordPressConfig,
  options: PublishOptions
): Promise<PublishResult> {
  // Validate config
  const validation = validateConfig(config);
  if (!validation.valid) {
    console.error('[WordPress Publisher] Invalid config:', validation.error);
    return {
      success: false,
      error: validation.error,
      attempts: 0,
    };
  }

  // Validate content
  if (!options.title || !options.content) {
    return {
      success: false,
      error: 'Titel en content zijn verplicht',
      attempts: 0,
    };
  }

  let lastError: Error | null = null;
  let attempt = 0;

  // Retry loop
  for (attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[WordPress Publisher] Poging ${attempt}/${MAX_RETRIES}: ${options.title}`);

      // Initialize WordPress client
      const wpClient = new WordPressClient({
        siteUrl: config.siteUrl,
        username: config.username,
        applicationPassword: config.applicationPassword,
      });

      // Test connection first (only on first attempt)
      if (attempt === 1) {
        try {
          await wpClient.testConnection();
          console.log('[WordPress Publisher] ✅ Connectie getest');
        } catch (testError: any) {
          console.error('[WordPress Publisher] ❌ Connectie test gefaald:', testError.message);
          throw new Error(`WordPress connectie mislukt: ${testError.message}`);
        }
      }

      // Upload featured image if provided
      let featuredMediaId: number | undefined;
      if (options.featuredImageUrl) {
        try {
          console.log('[WordPress Publisher] 🖼️ Uploading featured image...');
          const media = await wpClient.uploadMedia(
            options.featuredImageUrl,
            `${options.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-featured.jpg`
          );
          featuredMediaId = media.id;
          console.log(`[WordPress Publisher] ✅ Featured image uploaded: ${media.id}`);
        } catch (imageError: any) {
          console.error('[WordPress Publisher] ⚠️ Featured image upload failed:', imageError.message);
          // Continue without featured image - don't fail the whole publish
        }
      }

      // Get or create categories
      let categoryIds: number[] | undefined;
      if (options.categories && options.categories.length > 0) {
        try {
          categoryIds = [];
          for (const category of options.categories) {
            const categoryId = await wpClient.getOrCreateCategory(category);
            categoryIds.push(categoryId);
          }
          console.log(`[WordPress Publisher] ✅ Categories created: ${categoryIds.join(', ')}`);
        } catch (catError: any) {
          console.error('[WordPress Publisher] ⚠️ Category creation failed:', catError.message);
          // Continue without categories
        }
      }

      // Prepare SEO meta
      const yoastMeta: any = {};
      if (options.seoTitle) {
        yoastMeta._yoast_wpseo_title = options.seoTitle;
        yoastMeta.rank_math_title = options.seoTitle;
      }
      if (options.seoDescription) {
        yoastMeta._yoast_wpseo_metadesc = options.seoDescription;
        yoastMeta.rank_math_description = options.seoDescription;
      }
      if (options.focusKeyword) {
        yoastMeta._yoast_wpseo_focuskw = options.focusKeyword;
        yoastMeta.rank_math_focus_keyword = options.focusKeyword;
      }

      // Create WordPress post
      console.log('[WordPress Publisher] 📝 Creating post...');
      const wpPost = await wpClient.createPost({
        title: options.title,
        content: options.content,
        excerpt: options.excerpt || options.content.substring(0, 150) + '...',
        status: options.status || 'publish',
        featured_media: featuredMediaId,
        categories: categoryIds,
        tags: options.tags,
        meta: Object.keys(yoastMeta).length > 0 ? yoastMeta : undefined,
        date: options.scheduledDate,
      });

      console.log(`[WordPress Publisher] ✅ Post ${options.status === 'draft' ? 'opgeslagen als concept' : 'gepubliceerd'}: ${wpPost.link}`);

      return {
        success: true,
        postId: wpPost.id,
        link: wpPost.link,
        status: wpPost.status,
        attempts: attempt,
      };

    } catch (error: any) {
      lastError = error;
      console.error(`[WordPress Publisher] ❌ Poging ${attempt} gefaald:`, error.message);

      // If this is not the last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY * attempt; // Exponential backoff
        console.log(`[WordPress Publisher] ⏳ Wachten ${delay}ms voor nieuwe poging...`);
        await sleep(delay);
      }
    }
  }

  // All retries failed
  console.error(`[WordPress Publisher] ❌ Alle ${MAX_RETRIES} pogingen gefaald`);
  return {
    success: false,
    error: lastError?.message || 'WordPress publicatie gefaald na meerdere pogingen',
    attempts: attempt,
  };
}

/**
 * Publish met fallback naar draft bij falen
 */
export async function publishToWordPressWithFallback(
  config: WordPressConfig,
  options: PublishOptions
): Promise<PublishResult> {
  // First try to publish
  const result = await publishToWordPressEnhanced(config, options);
  
  if (result.success) {
    return result;
  }

  // If publish failed and status was 'publish', try again as draft
  if (options.status === 'publish') {
    console.log('[WordPress Publisher] 🔄 Publiceren gefaald, proberen als concept...');
    
    const draftResult = await publishToWordPressEnhanced(config, {
      ...options,
      status: 'draft',
    });

    if (draftResult.success) {
      return {
        ...draftResult,
        error: 'Gepubliceerd als concept (originele publicatie gefaald)',
      };
    }
  }

  return result;
}

/**
 * Test WordPress connection
 */
export async function testWordPressConnection(config: WordPressConfig): Promise<{ success: boolean; error?: string }> {
  const validation = validateConfig(config);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const wpClient = new WordPressClient({
      siteUrl: config.siteUrl,
      username: config.username,
      applicationPassword: config.applicationPassword,
    });

    await wpClient.testConnection();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
