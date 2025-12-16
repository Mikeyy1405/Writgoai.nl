/**
 * AI Content Update API
 * POST: Analyze and update existing content with AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { analyzeContentForUpdates, updateContentWithAI } from '@/lib/wordpress-autopilot/content-updater';
import { publishToWordPress, updateWordPressPost } from '@/lib/wordpress-publisher';
import { hasEnoughCredits, deductCredits } from '@/lib/credits';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

interface RequestBody {
  contentId: string;
  action: 'analyze' | 'update';
}

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
    
    const body: RequestBody = await req.json();
    const { contentId, action } = body;
    
    if (!contentId || !action) {
      return NextResponse.json(
        { error: 'Content ID en action verplicht' },
        { status: 400 }
      );
    }
    
    // Get content
    const content = await prisma.savedContent.findUnique({
      where: { id: contentId },
    });
    
    if (!content || content.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Content niet gevonden' },
        { status: 404 }
      );
    }
    
    // Get calendar item to find WordPress post ID
    const calendarItem = await prisma.contentCalendarItem.findFirst({
      where: { contentId: content.id },
    });
    
    if (action === 'analyze') {
      console.log('🔍 Analyzing content for updates...');
      
      const suggestions = await analyzeContentForUpdates(
        {
          id: content.id,
          title: content.title,
          content: content.content,
          url: content.publishedUrl || '',
          publishedAt: content.createdAt,
          lastUpdated: content.updatedAt,
        },
        client.id
      );
      
      return NextResponse.json({
        success: true,
        suggestions,
      });
    } else if (action === 'update') {
      // Check credits
      const totalCredits = client.subscriptionCredits + client.topUpCredits;
      if (!client.isUnlimited && totalCredits < 25) {
        return NextResponse.json(
          { error: 'Onvoldoende credits (25 vereist)' },
          { status: 402 }
        );
      }
      
      console.log('✨ Updating content with AI...');
      
      // First analyze
      const suggestions = await analyzeContentForUpdates(
        {
          id: content.id,
          title: content.title,
          content: content.content,
          url: content.publishedUrl || '',
          publishedAt: content.createdAt,
          lastUpdated: content.updatedAt,
        },
        client.id
      );
      
      // Then update
      const updatedContent = await updateContentWithAI(
        content.content,
        suggestions.suggestions,
        client.id
      );
      
      // Save updated content
      await prisma.savedContent.update({
        where: { id: contentId },
        data: {
          content: updatedContent,
          contentHtml: updatedContent,
          updatedAt: new Date(),
        },
      });
      
      // Update WordPress if published
      if (calendarItem?.wordpressPostId) {
        const site = await prisma.wordPressAutopilotSite.findUnique({
          where: { id: calendarItem.siteId },
        });
        
        if (site) {
          try {
            await updateWordPressPost(
              {
                siteUrl: site.siteUrl,
                username: site.username,
                applicationPassword: site.applicationPassword,
              },
              calendarItem.wordpressPostId,
              {
                content: updatedContent,
              }
            );
            
            console.log('✅ WordPress post updated');
          } catch (wpError) {
            console.error('❌ WordPress update failed:', wpError);
          }
        }
      }
      
      // Deduct credits
      await deductCredits(
        client.id,
        25,
        `Content Update: ${content.title}`,
        { model: 'gpt-4o' }
      );
      
      return NextResponse.json({
        success: true,
        updated: true,
        message: 'Content succesvol bijgewerkt',
      });
    } else {
      return NextResponse.json(
        { error: 'Ongeldige action' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Content update failed:', error);
    return NextResponse.json(
      { error: error.message || 'Content update mislukt' },
      { status: 500 }
    );
  }
}
