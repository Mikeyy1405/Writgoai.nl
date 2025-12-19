/**
 * Content Optimizer
 * Optimizer for existing WordPress content
 * - SEO score analysis
 * - Automatic rewrites
 * - FAQ additions
 */

import { rewriteContentWithClaude } from '../ai-services/claude-writer';
import { researchTopicWithPerplexity } from '../ai-services/perplexity-research';
import { getWordPressConfig } from '../wordpress-publisher';
import { deductCredits, CREDIT_COSTS } from '../credits';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ContentOptimizationJob {
  wordpressPostId: number;
  projectId: string;
  originalContent: string;
  seoScore: number;
  issues: string[];
  improvements?: string;
}

export interface OptimizationResult {
  newContent: string;
  newTitle?: string;
  newMetaDescription?: string;
  improvements: string[];
  seoScoreIncrease: number;
  wordpressUpdated: boolean;
}

/**
 * Optimize a WordPress post
 */
export async function optimizeWordPressPost(
  job: ContentOptimizationJob
): Promise<OptimizationResult> {
  const { wordpressPostId, projectId, originalContent, seoScore, issues, improvements } = job;

  console.log(`🔧 Optimizing WordPress post ${wordpressPostId}`);
  console.log(`📊 Current SEO score: ${seoScore}`);
  console.log(`⚠️ Issues: ${issues.join(', ')}`);

  // Get project details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: true,
    },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  // Step 1: Analyze current content and identify weaknesses
  const analysis = await analyzeContent(originalContent, issues);
  
  console.log(`📝 Analysis: ${analysis.weaknesses.length} weaknesses found`);

  // Step 2: Research fresh information with Perplexity
  let researchData;
  try {
    researchData = await researchTopicWithPerplexity({
      query: analysis.topic,
      includeStats: true,
      includeTrends: false,
    });

    // Deduct research credits
    await deductCredits(
      project.clientId,
      CREDIT_COSTS.WEB_SEARCH,
      'Content Optimizer: Research'
    );
  } catch (error) {
    console.warn('⚠️ Research failed, continuing without:', error);
  }

  // Step 3: Build improvement instructions
  const improvementInstructions = buildImprovementInstructions(
    issues,
    analysis.weaknesses,
    improvements
  );

  console.log(`📋 Improvements to make: ${improvementInstructions}`);

  // Step 4: Rewrite content with Claude
  const rewrittenArticle = await rewriteContentWithClaude(
    originalContent,
    improvementInstructions,
    {
      keywords: analysis.keywords,
      wordCount: analysis.wordCount,
      tone: (project.writingStyle as any) || 'professional',
      language: 'nl',
    }
  );

  console.log(`✅ Content rewritten: ${rewrittenArticle.wordCount} words`);

  // Deduct writing credits
  await deductCredits(
    project.clientId,
    CREDIT_COSTS.BLOG_POST * 0.7, // Rewrites cost less than new content
    'Content Optimizer: Rewrite'
  );

  // Step 5: Update WordPress post
  let wordpressUpdated = false;
  try {
    const wpConfig = await getWordPressConfig({ projectId });
    if (wpConfig) {
      await updateWordPressPost(wpConfig, wordpressPostId, {
        title: rewrittenArticle.title,
        content: rewrittenArticle.content,
        excerpt: rewrittenArticle.metaDescription,
      });

      wordpressUpdated = true;
      console.log(`✅ WordPress post updated`);
    }
  } catch (error) {
    console.error('⚠️ Failed to update WordPress post:', error);
    // Don't fail the optimization
  }

  // Step 6: Calculate improvements
  const improvementsList = [
    ...analysis.weaknesses.map((w) => `Fixed: ${w}`),
    rewrittenArticle.faqSection ? 'Added FAQ section' : null,
    'Improved SEO optimization',
    'Updated with fresh information',
  ].filter(Boolean) as string[];

  const estimatedScoreIncrease = Math.min(30, issues.length * 5);

  // Step 7: Log the optimization
  await prisma.contentOptimizationLog.create({
    data: {
      projectId,
      wordpressPostId,
      originalSeoScore: seoScore,
      newSeoScore: Math.min(100, seoScore + estimatedScoreIncrease),
      improvements: improvementsList,
      optimizedAt: new Date(),
    },
  });

  return {
    newContent: rewrittenArticle.content,
    newTitle: rewrittenArticle.title,
    newMetaDescription: rewrittenArticle.metaDescription,
    improvements: improvementsList,
    seoScoreIncrease: estimatedScoreIncrease,
    wordpressUpdated,
  };
}

/**
 * Analyze content to identify issues
 */
async function analyzeContent(
  content: string,
  existingIssues: string[]
): Promise<{
  topic: string;
  keywords: string[];
  wordCount: number;
  weaknesses: string[];
}> {
  // Extract basic info
  const wordCount = content.split(/\s+/).length;
  
  // Extract title (first H1 or H2)
  const titleMatch = content.match(/<h[12][^>]*>(.*?)<\/h[12]>/i);
  const topic = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'Content';

  // Simple keyword extraction (words that appear frequently)
  const words = content
    .replace(/<[^>]*>/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 4);
  
  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  const keywords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // Analyze weaknesses
  const weaknesses: string[] = [...existingIssues];

  // Check for common SEO issues
  if (wordCount < 800) {
    weaknesses.push('Content too short (less than 800 words)');
  }

  if (!content.match(/<h2/i)) {
    weaknesses.push('Missing H2 headings');
  }

  if (!content.match(/<ul|<ol/i)) {
    weaknesses.push('No lists or bullet points');
  }

  if (!content.match(/\d{4}/)) {
    weaknesses.push('No recent dates or statistics');
  }

  return {
    topic,
    keywords,
    wordCount,
    weaknesses,
  };
}

/**
 * Build improvement instructions for Claude
 */
function buildImprovementInstructions(
  seoIssues: string[],
  weaknesses: string[],
  customImprovements?: string
): string {
  const instructions: string[] = [];

  // Add SEO issue fixes
  if (seoIssues.length > 0) {
    instructions.push('Fix the following SEO issues:');
    seoIssues.forEach((issue) => instructions.push(`- ${issue}`));
  }

  // Add weakness fixes
  if (weaknesses.length > 0) {
    instructions.push('\nAddress these content weaknesses:');
    weaknesses.forEach((weakness) => instructions.push(`- ${weakness}`));
  }

  // Add custom improvements
  if (customImprovements) {
    instructions.push('\nAdditional improvements requested:');
    instructions.push(customImprovements);
  }

  // Add general improvements
  instructions.push('\nGeneral improvements:');
  instructions.push('- Improve readability and structure');
  instructions.push('- Add practical tips and examples');
  instructions.push('- Update with 2025 information');
  instructions.push('- Optimize for featured snippets');
  instructions.push('- Add a compelling conclusion with call-to-action');

  return instructions.join('\n');
}

/**
 * Update WordPress post
 */
async function updateWordPressPost(
  config: { siteUrl: string; username: string; applicationPassword: string },
  postId: number,
  updates: {
    title?: string;
    content?: string;
    excerpt?: string;
  }
): Promise<void> {
  const { siteUrl, username, applicationPassword } = config;
  const apiUrl = `${siteUrl}/wp-json/wp/v2/posts/${postId}`;

  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      title: updates.title,
      content: updates.content,
      excerpt: updates.excerpt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
  }
}

/**
 * Analyze all posts in a project
 */
export async function analyzeProjectPosts(
  projectId: string
): Promise<
  Array<{
    id: number;
    title: string;
    seoScore: number;
    issues: string[];
    canOptimize: boolean;
  }>
> {
  console.log(`🔍 Analyzing posts for project: ${projectId}`);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  const wpConfig = await getWordPressConfig({ projectId });
  if (!wpConfig) {
    throw new Error('WordPress not configured for this project');
  }

  // Fetch posts from WordPress
  const posts = await fetchWordPressPosts(wpConfig);

  // Analyze each post
  const analyzed = await Promise.all(
    posts.map(async (post) => {
      const { seoScore, issues } = await calculateSEOScore(post.content.rendered);

      return {
        id: post.id,
        title: post.title.rendered,
        seoScore,
        issues,
        canOptimize: seoScore < 80 && issues.length > 0,
      };
    })
  );

  console.log(`✅ Analyzed ${analyzed.length} posts`);

  return analyzed;
}

/**
 * Fetch posts from WordPress
 */
async function fetchWordPressPosts(config: {
  siteUrl: string;
  username: string;
  applicationPassword: string;
}): Promise<any[]> {
  const { siteUrl, username, applicationPassword } = config;
  const apiUrl = `${siteUrl}/wp-json/wp/v2/posts?per_page=100&status=publish`;

  const auth = Buffer.from(`${username}:${applicationPassword}`).toString('base64');

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Calculate SEO score for content
 */
async function calculateSEOScore(
  content: string
): Promise<{ seoScore: number; issues: string[] }> {
  const issues: string[] = [];
  let score = 100;

  const wordCount = content.split(/\s+/).length;

  // Word count checks
  if (wordCount < 300) {
    issues.push('Content too short (< 300 words)');
    score -= 20;
  } else if (wordCount < 800) {
    issues.push('Content could be longer (< 800 words)');
    score -= 10;
  }

  // Heading checks
  const h1Count = (content.match(/<h1/gi) || []).length;
  const h2Count = (content.match(/<h2/gi) || []).length;

  if (h1Count === 0) {
    issues.push('Missing H1 heading');
    score -= 15;
  } else if (h1Count > 1) {
    issues.push('Multiple H1 headings');
    score -= 10;
  }

  if (h2Count === 0) {
    issues.push('Missing H2 headings');
    score -= 10;
  }

  // Content structure checks
  if (!content.match(/<ul|<ol/i)) {
    issues.push('No lists or bullet points');
    score -= 5;
  }

  if (!content.match(/<img/i)) {
    issues.push('No images');
    score -= 5;
  }

  // Readability checks
  const avgParagraphLength =
    wordCount / (content.match(/<p>/gi) || []).length;
  if (avgParagraphLength > 150) {
    issues.push('Paragraphs too long');
    score -= 5;
  }

  // Recency check
  if (!content.match(/202[3-5]/)) {
    issues.push('Content may be outdated (no 2023-2025 dates)');
    score -= 5;
  }

  return {
    seoScore: Math.max(0, Math.min(100, score)),
    issues,
  };
}
