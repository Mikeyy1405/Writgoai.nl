/**
 * Generate Content Strategy API
 * POST: Generate or regenerate topical authority strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getAutopilotSite } from '@/lib/wordpress-autopilot/database';
import { generateTopicalAuthorityStrategy } from '@/lib/wordpress-autopilot/topical-authority-generator';
import { generateContentCalendar } from '@/lib/wordpress-autopilot/topical-authority-generator';
import { saveContentStrategy, addToContentCalendar } from '@/lib/wordpress-autopilot/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
    
    const body = await req.json();
    const { siteId } = body;
    
    if (!siteId) {
      return NextResponse.json(
        { error: 'Site ID verplicht' },
        { status: 400 }
      );
    }
    
    // Get site
    const site = await getAutopilotSite(siteId);
    
    if (!site) {
      return NextResponse.json(
        { error: 'Site niet gevonden' },
        { status: 404 }
      );
    }
    
    if (site.clientId !== client.id) {
      return NextResponse.json(
        { error: 'Geen toegang tot deze site' },
        { status: 403 }
      );
    }
    
    // Generate strategy
    console.log(`🧠 Generating strategy for site: ${site.name}`);
    
    const strategy = await generateTopicalAuthorityStrategy(
      site.id,
      site.siteUrl,
      client.id,
      site.postingFrequency
    );
    
    // Save strategy
    const savedStrategy = await saveContentStrategy(strategy);
    
    // Generate content calendar
    const calendar = await generateContentCalendar(
      site.id,
      savedStrategy.id,
      strategy.keywordClusters,
      site.postingFrequency,
      client.id
    );
    
    // Save calendar items
    await addToContentCalendar(calendar);
    
    console.log(`✅ Strategy generated: ${calendar.length} content items`);
    
    return NextResponse.json({
      success: true,
      strategy: {
        id: savedStrategy.id,
        niche: strategy.niche,
        mainTopics: strategy.mainTopics,
        keywords: strategy.keywordClusters.length,
        coverage: strategy.currentCoverage,
        goal: strategy.topicalAuthorityGoal,
      },
      calendar: {
        totalItems: calendar.length,
        nextPostDate: calendar[0]?.scheduledDate,
      },
    });
  } catch (error: any) {
    console.error('❌ Strategy generation failed:', error);
    return NextResponse.json(
      { error: error.message || 'Strategie generatie mislukt' },
      { status: 500 }
    );
  }
}
