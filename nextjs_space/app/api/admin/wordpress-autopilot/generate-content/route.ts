/**
 * Generate and Post Content API
 * POST: Generate content for a calendar item and post to WordPress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { chatCompletion } from '@/lib/aiml-api';
import { publishToWordPress } from '@/lib/wordpress-publisher';
import { updateContentCalendarItem, getAutopilotSettings } from '@/lib/wordpress-autopilot/database';
import { hasEnoughCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import { getContentTemplate, buildContentPrompt } from '@/lib/wordpress-autopilot/content-intent-templates';
import { enhanceContent } from '@/lib/wordpress-autopilot/content-enhancers';
import type { ContentCalendarItem } from '@/lib/wordpress-autopilot/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet geautoriseerd' },
        { status: 401 }
      );
    }
    
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    // Check credits
    const totalCredits = client.subscriptionCredits + client.topUpCredits;
    if (!client.isUnlimited && totalCredits < CREDIT_COSTS.BLOG_POST) {
      return NextResponse.json(
        { error: 'Onvoldoende credits' },
        { status: 402 }
      );
    }
    
    const body = await req.json();
    const { calendarItemId } = body;
    
    if (!calendarItemId) {
      return NextResponse.json(
        { error: 'Calendar item ID verplicht' },
        { status: 400 }
      );
    }
    
    // Get calendar item
    const item = await prisma.contentCalendarItem.findUnique({
      where: { id: calendarItemId },
    });
    
    if (!item) {
      return NextResponse.json(
        { error: 'Calendar item niet gevonden' },
        { status: 404 }
      );
    }
    
    // Get site
    const site = await prisma.wordPressAutopilotSite.findUnique({
      where: { id: item.siteId },
    });
    
    if (!site || site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang' },
        { status: 403 }
      );
    }
    
    // Get autopilot settings (for content rules)
    const settings = await getAutopilotSettings(item.siteId);
    
    // Update status to generating
    await updateContentCalendarItem(calendarItemId, {
      status: 'generating',
    });
    
    console.log(`📝 Generating content: ${item.title}`);
    console.log(`   Content Intent: ${item.contentIntent || 'informational'}`);
    
    // Get content template based on intent
    const template = getContentTemplate(
      item.contentIntent,
      item.contentType
    );
    
    // Build AI prompt with content rules and template
    const prompt = buildContentPrompt(
      item as ContentCalendarItem,
      template,
      settings || undefined,
      site.language || 'nl'
    );
    
    console.log(`   Using template: ${template.intent}`);
    console.log(`   Target length: ${template.minWordCount}-${template.maxWordCount} words`);
    
    // Generate content with Claude Sonnet 4
    const response = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-sonnet-4',
      temperature: 0.6,
      max_tokens: 8000,
      trackUsage: {
        clientId: client.id,
        feature: 'wordpress_autopilot_content',
      },
    });
    
    let htmlContent = response.choices[0]?.message?.content || '';
    
    // Clean up response (remove any markdown code blocks)
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('✅ Base content generated');
    
    // Enhance content with internal links, affiliate links, and images
    console.log('🔧 Enhancing content...');
    const enhancement = await enhanceContent(
      item.siteId,
      client.id,
      htmlContent,
      item.title,
      item.focusKeyword,
      item.topic,
      settings?.includeImages ?? true
    );
    
    htmlContent = enhancement.enhancedContent;
    
    console.log('✅ Content enhanced');
    
    // Save to SavedContent
    const savedContent = await prisma.savedContent.create({
      data: {
        clientId: client.id,
        type: 'blog',
        title: item.title,
        content: htmlContent,
        contentHtml: htmlContent,
        language: site.language || 'NL',
        keywords,
        generatorType: 'wordpress-autopilot',
      },
    });
    
    // Update calendar item with content and enhancements
    await updateContentCalendarItem(calendarItemId, {
      status: 'generated',
      contentId: savedContent.id,
      generatedAt: new Date(),
      internalLinks: enhancement.internalLinks,
      affiliateLinks: enhancement.affiliateLinks,
      images: enhancement.images,
      metadata: {
        template: template.intent,
        wordCount: htmlContent.split(/\s+/).length,
        enhancementStats: {
          internalLinks: enhancement.internalLinks.length,
          affiliateLinks: enhancement.affiliateLinks.length,
          images: enhancement.images.length,
        },
      },
    });
    
    // Publish to WordPress
    try {
      console.log('🚀 Publishing to WordPress...');
      
      const publishResult = await publishToWordPress(
        {
          siteUrl: site.siteUrl,
          username: site.username,
          applicationPassword: site.applicationPassword,
        },
        {
          title: item.title,
          content: htmlContent,
          excerpt: htmlContent.substring(0, 200).replace(/<[^>]+>/g, ''),
          status: 'publish',
          tags: keywords,
          focusKeyword: item.focusKeyword,
          useGutenberg: true,
        }
      );
      
      // Update calendar item with published info
      await updateContentCalendarItem(calendarItemId, {
        status: 'published',
        publishedUrl: publishResult.link,
        publishedAt: new Date(),
        wordpressPostId: publishResult.id,
      });
      
      // Update site stats
      await prisma.wordPressAutopilotSite.update({
        where: { id: site.id },
        data: {
          totalPosts: { increment: 1 },
          lastPostDate: new Date(),
        },
      });
      
      console.log(`✅ Published: ${publishResult.link}`);
      
      // Deduct credits
      await deductCredits(
        client.id,
        CREDIT_COSTS.BLOG_POST,
        `WordPress Autopilot: ${item.title}`,
        { model: 'claude-sonnet-4' }
      );
      
      return NextResponse.json({
        success: true,
        content: {
          id: savedContent.id,
          title: item.title,
        },
        published: {
          url: publishResult.link,
          postId: publishResult.id,
        },
      });
    } catch (publishError: any) {
      console.error('❌ Publishing failed:', publishError);
      
      // Update calendar item with error
      await updateContentCalendarItem(calendarItemId, {
        status: 'failed',
        error: publishError.message,
      });
      
      return NextResponse.json(
        { 
          error: 'Content gegenereerd maar publicatie mislukt',
          contentId: savedContent.id,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Content generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Content generatie mislukt' },
      { status: 500 }
    );
  }
}
