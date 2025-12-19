'use server';

/**
 * 🌐 WordPress Server Actions
 * 
 * Consolidates all WordPress integration functionality:
 * - Publishing content to WordPress
 * - SEO optimization of posts
 * - Post management (CRUD)
 * - Site scanning and analysis
 * 
 * Replaces 7+ API routes:
 * - /api/client/wordpress/publish
 * - /api/client/publish-to-wordpress
 * - /api/admin/wordpress-publish
 * - /api/client/wordpress/optimize
 * - /api/client/wordpress/rewrite
 * - /api/client/wordpress/posts
 * - /api/client/wordpress-content
 */

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { auth, getAuthenticatedClient } from '@/lib/auth';
import { 
  publishToWordPress as wpPublish,
  getWordPressConfig,
  type WordPressConfig,
} from '@/lib/wordpress-publisher';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';
import { chatCompletion, TEXT_MODELS } from '@/lib/aiml-api';
import type { ChatMessage } from '@/lib/aiml-api';
import { sendEmail } from '@/lib/email';
import { getContentPublishedEmailTemplate } from '@/lib/email-templates';

// ═════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═════════════════════════════════════════════════════════════════════

export interface PublishToWordPressInput {
  contentId: string;
  projectId: string;
  status?: 'draft' | 'publish' | 'pending';
  categories?: string[];
  tags?: string[];
}

export interface PublishToWordPressResult {
  success: boolean;
  url: string;
  postId: number;
}

export interface OptimizeWordPressPostInput {
  projectId: string;
  postId: number;
  improvements?: string;
  includeFAQ?: boolean;
}

export interface OptimizeWordPressPostResult {
  success: boolean;
  oldScore: number;
  newScore: number;
  improvements: string[];
}

// ═════════════════════════════════════════════════════════════════════
// WORDPRESS PUBLISHING
// ═════════════════════════════════════════════════════════════════════

/**
 * 📤 Publish to WordPress
 * 
 * Publish content from library to WordPress site
 */
export async function publishToWordPress(
  input: PublishToWordPressInput
): Promise<PublishToWordPressResult> {
  try {
    const session = await auth();
    const client = await getAuthenticatedClient();

    // Get content
    const content = await prisma.savedContent.findFirst({
      where: {
        id: input.contentId,
        clientId: client.id,
      },
    });

    if (!content) {
      throw new Error('Content niet gevonden');
    }

    // Get project with WordPress config
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        clientId: client.id,
      },
    });

    if (!project) {
      throw new Error('Project niet gevonden');
    }

    // Get WordPress configuration
    const wordpressConfig = {
      siteUrl: project.wordpressUrl || client.wordpressUrl,
      username: project.wordpressUsername || client.wordpressUsername,
      applicationPassword: project.wordpressPassword || client.wordpressPassword,
    };

    if (!wordpressConfig.siteUrl || !wordpressConfig.username || !wordpressConfig.applicationPassword) {
      throw new Error('WordPress configuratie ontbreekt. Stel WordPress credentials in voor dit project.');
    }

    console.log(`📤 Publishing to WordPress: ${content.title}`);

    // Publish to WordPress
    const result = await wpPublish({
      config: wordpressConfig as WordPressConfig,
      title: content.title,
      content: content.contentHtml || content.content,
      excerpt: content.description || '',
      status: input.status || 'publish',
      categories: input.categories || [],
      tags: input.tags || content.keywords || [],
      featuredImageUrl: content.featuredImageUrl || undefined,
      seoTitle: content.seoTitle || content.title,
      seoDescription: content.description || '',
      focusKeyword: content.keywords?.[0] || '',
    });

    // Update content status
    await prisma.savedContent.update({
      where: { id: input.contentId },
      data: {
        status: 'published',
        publishedUrl: result.link,
        publishedAt: new Date(),
      },
    });

    // Send email notification
    try {
      await sendEmail({
        to: client.email,
        subject: `✅ Content gepubliceerd: ${content.title}`,
        html: getContentPublishedEmailTemplate({
          clientName: client.name,
          contentTitle: content.title,
          url: result.link,
        }),
      });
    } catch (emailError) {
      console.error('❌ Failed to send email notification:', emailError);
      // Don't fail the whole operation if email fails
    }

    revalidatePath('/client-portal/content-library');
    revalidatePath(`/client-portal/projects/${input.projectId}`);

    console.log(`✅ Published to WordPress: ${result.link}`);

    return {
      success: true,
      url: result.link,
      postId: result.id,
    };
  } catch (error: any) {
    console.error('❌ Error publishing to WordPress:', error);
    throw new Error(error.message || 'Fout bij publiceren naar WordPress');
  }
}

// ═════════════════════════════════════════════════════════════════════
// SEO OPTIMIZATION
// ═════════════════════════════════════════════════════════════════════

/**
 * 🎯 Optimize WordPress Post
 * 
 * Analyze and improve SEO of existing WordPress post
 */
export async function optimizeWordPressPost(
  input: OptimizeWordPressPostInput
): Promise<OptimizeWordPressPostResult> {
  try {
    const client = await getAuthenticatedClient();

    // Check credits
    const creditCost = 60;
    const hasCredits = await hasEnoughCredits(client.id, creditCost);
    
    if (!hasCredits) {
      throw new Error(`Niet genoeg credits. Deze actie kost ${creditCost} credits.`);
    }

    // Get WordPress config
    const config = await getWordPressConfig({
      projectId: input.projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    // Fetch the post from WordPress
    const postResponse = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts/${input.postId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );

    if (!postResponse.ok) {
      throw new Error('Post niet gevonden op WordPress');
    }

    const post = await postResponse.json();

    // Calculate current SEO score
    const oldScore = calculateSEOScore(post);

    console.log(`🎯 Optimizing WordPress post: ${post.title.rendered} (current score: ${oldScore})`);

    // Use Claude Sonnet 4.5 for optimization
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert SEO optimizer. Your task is to improve WordPress blog posts for better SEO performance.`,
      },
      {
        role: 'user',
        content: `Optimize this WordPress post for SEO:

Title: ${post.title.rendered}
Content: ${post.content.rendered}

${input.improvements ? `Focus on: ${input.improvements}` : 'Make comprehensive SEO improvements'}
${input.includeFAQ ? 'Include an FAQ section' : ''}

Provide the optimized content in HTML format with:
1. Better heading structure (H2, H3)
2. Keyword optimization
3. Internal linking opportunities (marked with [LINK: anchor text])
4. Meta description suggestion
5. ${input.includeFAQ ? 'FAQ schema section' : ''}

Return as JSON:
{
  "optimizedContent": "HTML content",
  "metaDescription": "...",
  "improvements": ["list of changes made"],
  "suggestedLinks": [{"anchor": "", "url": ""}]
}`,
      },
    ];

    const response = await chatCompletion({
      model: TEXT_MODELS.CLAUDE_SONNET,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.content || '{}');

    // Update the post on WordPress
    const updateResponse = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts/${input.postId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
        body: JSON.stringify({
          content: result.optimizedContent,
          excerpt: result.metaDescription,
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('Fout bij updaten van WordPress post');
    }

    const updatedPost = await updateResponse.json();
    const newScore = calculateSEOScore(updatedPost);

    // Deduct credits
    await deductCredits(
      client.id,
      creditCost,
      `WordPress post optimalisatie: ${post.title.rendered}`,
      {
        model: TEXT_MODELS.CLAUDE_SONNET,
        tool: 'wordpress_optimizer',
      }
    );

    console.log(`✅ Optimized WordPress post: ${updatedPost.link} (new score: ${newScore})`);

    return {
      success: true,
      oldScore,
      newScore,
      improvements: result.improvements || [],
    };
  } catch (error: any) {
    console.error('❌ Error optimizing WordPress post:', error);
    throw new Error(error.message || 'Fout bij optimaliseren van WordPress post');
  }
}

/**
 * Calculate simple SEO score (0-100)
 */
function calculateSEOScore(post: any): number {
  let score = 0;

  // Title length (ideal: 50-60 chars)
  const titleLength = post.title?.rendered?.length || 0;
  if (titleLength >= 50 && titleLength <= 70) score += 20;
  else if (titleLength >= 40 && titleLength < 90) score += 10;

  // Content length (ideal: 1000+ words)
  const content = post.content?.rendered || '';
  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 1500) score += 30;
  else if (wordCount >= 800) score += 20;
  else if (wordCount >= 500) score += 10;

  // Has headings
  if (content.includes('<h2>')) score += 15;
  if (content.includes('<h3>')) score += 10;

  // Has images
  if (content.includes('<img')) score += 10;

  // Has excerpt/meta description
  if (post.excerpt?.rendered) score += 15;

  return Math.min(score, 100);
}

// ═════════════════════════════════════════════════════════════════════
// POST MANAGEMENT
// ═════════════════════════════════════════════════════════════════════

/**
 * 📋 Get WordPress Posts
 * 
 * Fetch posts from WordPress site
 */
export async function getWordPressPosts(projectId: string, page: number = 1) {
  try {
    const client = await getAuthenticatedClient();

    const config = await getWordPressConfig({
      projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    const response = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts?page=${page}&per_page=20&_embed`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Fout bij ophalen van WordPress posts');
    }

    const posts = await response.json();
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

    return {
      success: true,
      posts,
      totalPages,
      currentPage: page,
    };
  } catch (error: any) {
    console.error('❌ Error fetching WordPress posts:', error);
    throw new Error('Fout bij ophalen van WordPress posts');
  }
}

/**
 * 📄 Get WordPress Post
 * 
 * Fetch single post from WordPress
 */
export async function getWordPressPost(projectId: string, postId: number) {
  try {
    const client = await getAuthenticatedClient();

    const config = await getWordPressConfig({
      projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    const response = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts/${postId}?_embed`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Post niet gevonden');
    }

    const post = await response.json();

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    console.error('❌ Error fetching WordPress post:', error);
    throw new Error('Fout bij ophalen van WordPress post');
  }
}

/**
 * ✏️ Update WordPress Post
 * 
 * Update existing WordPress post
 */
export async function updateWordPressPost(
  projectId: string,
  postId: number,
  updates: any
) {
  try {
    const client = await getAuthenticatedClient();

    const config = await getWordPressConfig({
      projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    const response = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error('Fout bij updaten van WordPress post');
    }

    const post = await response.json();

    return {
      success: true,
      post,
    };
  } catch (error: any) {
    console.error('❌ Error updating WordPress post:', error);
    throw new Error('Fout bij updaten van WordPress post');
  }
}

/**
 * 🗑️ Delete WordPress Post
 * 
 * Delete post from WordPress
 */
export async function deleteWordPressPost(projectId: string, postId: number) {
  try {
    const client = await getAuthenticatedClient();

    const config = await getWordPressConfig({
      projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    const response = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts/${postId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Fout bij verwijderen van WordPress post');
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('❌ Error deleting WordPress post:', error);
    throw new Error('Fout bij verwijderen van WordPress post');
  }
}

/**
 * 🔍 Scan WordPress Site
 * 
 * Scan WordPress site for content and SEO analysis
 */
export async function scanWordPressSite(projectId: string) {
  try {
    const client = await getAuthenticatedClient();

    const config = await getWordPressConfig({
      projectId,
    });

    if (!config) {
      throw new Error('WordPress configuratie niet gevonden');
    }

    // Fetch site info
    const siteResponse = await fetch(`${config.siteUrl}/wp-json`);
    const siteInfo = await siteResponse.json();

    // Fetch posts
    const postsResponse = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/posts?per_page=100`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );
    const posts = await postsResponse.json();

    // Analyze posts
    const totalPosts = posts.length;
    const avgWordCount =
      posts.reduce((sum: number, post: any) => {
        const wordCount = post.content?.rendered?.split(/\s+/).length || 0;
        return sum + wordCount;
      }, 0) / totalPosts;

    const avgSEOScore =
      posts.reduce((sum: number, post: any) => {
        return sum + calculateSEOScore(post);
      }, 0) / totalPosts;

    // Fetch categories
    const categoriesResponse = await fetch(
      `${config.siteUrl}/wp-json/wp/v2/categories`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.applicationPassword}`
          ).toString('base64')}`,
        },
      }
    );
    const categories = await categoriesResponse.json();

    return {
      success: true,
      site: {
        name: siteInfo.name,
        url: config.siteUrl,
        description: siteInfo.description,
      },
      stats: {
        totalPosts,
        avgWordCount: Math.round(avgWordCount),
        avgSEOScore: Math.round(avgSEOScore),
        totalCategories: categories.length,
      },
      recentPosts: posts.slice(0, 5).map((post: any) => ({
        id: post.id,
        title: post.title.rendered,
        link: post.link,
        date: post.date,
        wordCount: post.content?.rendered?.split(/\s+/).length || 0,
        seoScore: calculateSEOScore(post),
      })),
    };
  } catch (error: any) {
    console.error('❌ Error scanning WordPress site:', error);
    throw new Error('Fout bij scannen van WordPress site');
  }
}
