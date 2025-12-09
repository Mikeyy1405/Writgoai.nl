
import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeWebsite,
  performSERPAnalysis,
  performKeywordResearch,
  collectImages,
  generateContentStructure,
  generateBlogContent,
} from '@/lib/seo-automated-workflow';
import { publishToWordPress } from '@/lib/wordpress-publisher';


export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function GET(req: NextRequest) {
  console.log('🤖 Content Automation Cron Job Started');
  
  try {
    // Find all active automations that are due to run
    const now = new Date();
    const automations = await prisma.contentAutomation.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: now,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            name: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            websiteUrl: true,
            customInstructions: true,
            wordpressUrl: true,
            wordpressUsername: true,
            wordpressPassword: true,
            wordpressCategory: true,
            bolcomClientId: true,
            bolcomClientSecret: true,
            bolcomAffiliateId: true,
            bolcomEnabled: true,
          },
        },
      },
    });

    console.log(`📋 Found ${automations.length} automation(s) to run`);

    const results = [];

    for (const automation of automations) {
      try {
        console.log(`\n🚀 Running automation ${automation.id} for client ${automation.client.name}`);

        // Generate a topic using AI (simple auto-generation)
        const topic = await generateTopicForClient(
          automation.client.name,
          automation.websiteUrl || automation.project?.websiteUrl
        );
        
        console.log(`  📝 Generated topic: ${topic}`);
        
        // Run the complete workflow
        const websiteUrl = automation.websiteUrl || automation.project?.websiteUrl || '';
        
        // Step 1: Website Analysis
        const websiteAnalysis = await analyzeWebsite(websiteUrl);
        
        // Step 2: SERP Analysis
        const serpAnalysis = await performSERPAnalysis(topic);
        
        // Step 3: Keyword Research
        const keywordResearch = await performKeywordResearch(topic);
        
        // Step 4: Collect Images
        const images = automation.includeImages
          ? await collectImages(topic, automation.numberOfImages)
          : [];
        
        // Step 5: Generate Content Structure
        const outline = await generateContentStructure(
          topic,
          keywordResearch.relatedKeywords,
          websiteAnalysis,
          keywordResearch,
          serpAnalysis,
          1500 // default word count
        );
        
        // Step 6: Generate Blog Content
        const blog = await generateBlogContent(
          outline,
          topic,
          1500,
          websiteAnalysis,
          keywordResearch,
          images,
          {
            includeFAQ: false,
            includeTables: false,
            includeYouTube: false,
            includeDirectAnswer: true,
            generateFeaturedImage: true,
            projectId: automation.projectId || undefined,
            useBolcomIntegration: automation.includeBolcomProducts,
            numberOfProducts: 3,
          }
        );
        
        // Save to database
        const savedContent = await prisma.savedContent.create({
          data: {
            clientId: automation.client.id,
            title: blog.metaTitle || topic,
            content: blog.content,
            contentHtml: blog.content,
            type: 'BLOG_AUTO',
            category: 'Auto-Generated',
            description: blog.metaDescription,
            metaDesc: blog.metaDescription,
            keywords: [keywordResearch.focusKeyword, ...keywordResearch.relatedKeywords.slice(0, 5)],
            wordCount: blog.wordCount,
            characterCount: blog.content.length,
            imageUrls: images.map(img => img.url),
            publishedAt: null,
          },
        });

        console.log(`  ✅ Content generated and saved: ${savedContent.id}`);

        // If auto-publish to WordPress is enabled
        if (automation.autoPublishWordpress && savedContent.id) {
          console.log('  📤 Publishing to WordPress...');

          const wpUrl = 
            automation.project?.wordpressUrl ||
            automation.client.wordpressUrl;
          const wpUsername = 
            automation.project?.wordpressUsername ||
            automation.client.wordpressUsername;
          const wpPassword = 
            automation.project?.wordpressPassword ||
            automation.client.wordpressPassword;

          if (wpUrl && wpUsername && wpPassword && savedContent.content) {
            try {
              const wpResult = await publishToWordPress(
                {
                  siteUrl: wpUrl,
                  username: wpUsername,
                  applicationPassword: wpPassword,
                },
                {
                  title: savedContent.title || 'Untitled',
                  content: savedContent.content,
                  excerpt: savedContent.description || '',
                  status: automation.wordpressStatus === 'private' ? 'draft' : (automation.wordpressStatus as 'draft' | 'publish'),
                  categories: [], // Categories as numbers - can be mapped later
                  tags: automation.wordpressTags,
                }
              );

              if (wpResult.id) {
                console.log(`  ✅ Published to WordPress: Post ID ${wpResult.id}`);
                
                // Update content record
                await prisma.savedContent.update({
                  where: { id: savedContent.id },
                  data: {
                    publishedUrl: wpResult.link || wpUrl,
                    publishedAt: new Date(),
                  },
                });
              } else {
                console.warn(`  ⚠️ WordPress publish failed`);
              }
            } catch (wpError: any) {
              console.error('  ❌ WordPress publish error:', wpError.message);
            }
          } else {
            console.warn('  ⚠️ WordPress credentials missing');
          }
        }

        // Calculate next run time
        const nextRunAt = calculateNextRun(
          automation.frequency,
          automation.dayOfWeek ?? undefined,
          automation.dayOfMonth ?? undefined,
          automation.timeOfDay
        );

        // Update automation record
        await prisma.contentAutomation.update({
          where: { id: automation.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt,
            totalRuns: { increment: 1 },
            successfulRuns: { increment: 1 },
            lastError: null,
            lastGeneratedTopic: topic, // Save the generated topic
          },
        });

        console.log(`  ✅ Automation completed successfully. Next run: ${nextRunAt.toLocaleString()}`);

        results.push({
          automationId: automation.id,
          success: true,
          contentId: savedContent.id,
          topic: topic,
          nextRunAt,
        });
      } catch (error: any) {
        console.error(`  ❌ Automation ${automation.id} failed:`, error.message);

        // Calculate next run time even on failure
        const nextRunAt = calculateNextRun(
          automation.frequency,
          automation.dayOfWeek ?? undefined,
          automation.dayOfMonth ?? undefined,
          automation.timeOfDay
        );

        // Update automation with error
        await prisma.contentAutomation.update({
          where: { id: automation.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt,
            totalRuns: { increment: 1 },
            failedRuns: { increment: 1 },
            lastError: error.message.substring(0, 500),
          },
        });

        results.push({
          automationId: automation.id,
          success: false,
          error: error.message,
          nextRunAt,
        });
      }
    }

    console.log('\n✅ Content Automation Cron Job Completed');
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processed: automations.length,
      results,
    });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

function calculateNextRun(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number,
  timeOfDay?: string
): Date {
  const now = new Date();
  const [hours, minutes] = (timeOfDay || '09:00').split(':').map(Number);
  
  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (frequency) {
    case 'daily':
      nextRun.setDate(nextRun.getDate() + 1);
      break;

    case '3x_week':
      // Monday, Wednesday, Friday
      const daysFor3x = [1, 3, 5];
      let currentDay = nextRun.getDay();
      
      for (let i = 1; i <= 7; i++) {
        nextRun.setDate(nextRun.getDate() + 1);
        currentDay = nextRun.getDay();
        if (daysFor3x.includes(currentDay)) {
          break;
        }
      }
      break;

    case 'weekly':
      nextRun.setDate(nextRun.getDate() + 7);
      break;

    case 'monthly':
      nextRun.setMonth(nextRun.getMonth() + 1);
      if (dayOfMonth) {
        nextRun.setDate(dayOfMonth);
      }
      break;

    default:
      nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun;
}

// Helper function to generate a topic for automatic content generation
async function generateTopicForClient(clientName: string, websiteUrl?: string): Promise<string> {
  console.log('🎯 Generating unique topic for:', websiteUrl || clientName);
  
  try {
    // Step 1: Get existing content from WordPress
    let existingTopics: string[] = [];
    
    if (websiteUrl) {
      try {
        existingTopics = await getExistingWordPressTopics(websiteUrl);
        console.log(`  📚 Found ${existingTopics.length} existing topics on website`);
      } catch (error) {
        console.warn('  ⚠️ Could not fetch existing topics:', error);
      }
    }
    
    // Step 2: Analyze website niche and generate relevant topics
    const { chatCompletion } = await import('@/lib/aiml-api');
    
    const prompt = `Je bent een expert SEO content strategist. Genereer een relevant, SEO-vriendelijk blog onderwerp voor de volgende website.

WEBSITE: ${websiteUrl || clientName}

${existingTopics.length > 0 ? `
Deze onderwerpen bestaan AL op de website (dus NIET gebruiken):
${existingTopics.slice(0, 50).map((topic, i) => `${i + 1}. ${topic}`).join('\n')}
` : ''}

OPDRACHT:
Genereer 1 (één) NIEUW, UNIEK blog onderwerp dat:
1. Nog NIET op de website staat
2. Relevant is voor de niche/branche van de website
3. Hoog zoekvolume heeft (trending topic)
4. Natuurlijk en aantrekkelijk klinkt (geen keyword stuffing)
5. Tussen de 5-12 woorden lang is
6. In het Nederlands is

Geef ALLEEN het onderwerp terug, zonder nummering, puntjes of extra tekst.
Voorbeeld output: "De beste robotstofzuigers voor huisdieren in 2025"`;

    const response = await chatCompletion({
      messages: [
        { role: 'user', content: prompt }
      ],
      model: 'claude-sonnet-4-5',
      max_tokens: 150,
      temperature: 0.8,
    });

    let topic = response.content.trim();
    
    // Clean up the topic
    topic = topic.replace(/^["']|["']$/g, ''); // Remove quotes
    topic = topic.replace(/^\d+\.\s*/, ''); // Remove numbering
    topic = topic.replace(/^[-•]\s*/, ''); // Remove bullets
    
    console.log(`  ✅ Generated unique topic: ${topic}`);
    
    // Verify it's not duplicate (case-insensitive check)
    const isDuplicate = existingTopics.some(existing => 
      existing.toLowerCase().trim() === topic.toLowerCase().trim()
    );
    
    if (isDuplicate) {
      console.warn('  ⚠️ Generated topic is duplicate, retrying...');
      // Retry with more specific instructions
      const retryPrompt = `${prompt}

BELANGRIJK: De vorige suggestie was een duplicaat. Genereer een COMPLEET ANDER onderwerp!`;

      const retryResponse = await chatCompletion({
        messages: [
          { role: 'user', content: retryPrompt }
        ],
        model: 'claude-sonnet-4-5',
        max_tokens: 150,
        temperature: 1.0,
      });

      topic = retryResponse.content.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^[-•]\s*/, '');
      
      console.log(`  ✅ Retry generated: ${topic}`);
    }
    
    return topic;
    
  } catch (error: any) {
    console.error('❌ Topic generation failed:', error.message);
    
    // Fallback to simple generic topic
    const timestamp = Date.now();
    return `Trending tips en tricks voor ${clientName} ${timestamp}`;
  }
}

// Helper function to get existing topics from WordPress
async function getExistingWordPressTopics(websiteUrl: string): Promise<string[]> {
  const topics: string[] = [];
  
  try {
    // Try to fetch sitemap
    const sitemapUrl = `${websiteUrl}/wp-sitemap-posts-post-1.xml`;
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'WritgoAI-Bot/1.0',
      },
    });
    
    if (response.ok) {
      const xml = await response.text();
      
      // Extract URLs from sitemap
      const urlMatches = xml.match(/<loc>(.*?)<\/loc>/g) || [];
      
      for (const urlMatch of urlMatches) {
        const url = urlMatch.replace(/<\/?loc>/g, '');
        
        // Extract title from URL slug
        const parts = url.split('/').filter(p => p);
        const slug = parts[parts.length - 1];
        
        if (slug) {
          // Convert slug to readable title
          const title = slug
            .replace(/-/g, ' ')
            .replace(/\+/g, ' ')
            .trim();
          
          if (title.length > 3) {
            topics.push(title);
          }
        }
      }
      
      return topics;
    }
    
    // Fallback: try to fetch WordPress REST API
    const apiUrl = `${websiteUrl}/wp-json/wp/v2/posts?per_page=100`;
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'WritgoAI-Bot/1.0',
      },
    });
    
    if (apiResponse.ok) {
      const posts = await apiResponse.json();
      
      for (const post of posts) {
        if (post.title?.rendered) {
          // Decode HTML entities
          const title = post.title.rendered
            .replace(/&#8217;/g, "'")
            .replace(/&#8216;/g, "'")
            .replace(/&#8220;/g, '"')
            .replace(/&#8221;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/<[^>]*>/g, '')
            .trim();
          
          if (title.length > 3) {
            topics.push(title);
          }
        }
      }
    }
    
    return topics;
    
  } catch (error: any) {
    console.error('Error fetching WordPress topics:', error.message);
    return [];
  }
}
