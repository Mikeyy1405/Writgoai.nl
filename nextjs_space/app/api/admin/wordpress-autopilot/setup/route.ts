/**
 * WordPress Autopilot Setup API
 * POST: Add new WordPress site to Autopilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { verifyWordPressConnection } from '@/lib/wordpress-publisher';
import { createAutopilotSite } from '@/lib/wordpress-autopilot/database';
import { generateTopicalAuthorityStrategy } from '@/lib/wordpress-autopilot/topical-authority-generator';
import { generateContentCalendar } from '@/lib/wordpress-autopilot/topical-authority-generator';
import { saveContentStrategy, addToContentCalendar } from '@/lib/wordpress-autopilot/database';

export const dynamic = 'force-dynamic';

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
    const {
      name,
      siteUrl,
      username,
      applicationPassword,
      postingFrequency,
      contentTypes,
      language,
    } = body;
    
    // Validate required fields
    if (!name || !siteUrl || !username || !applicationPassword) {
      return NextResponse.json(
        { error: 'Alle velden zijn verplicht' },
        { status: 400 }
      );
    }
    
    // Step 1: Verify WordPress connection
    console.log('🔌 Testing WordPress connection...');
    const isValid = await verifyWordPressConnection({
      siteUrl,
      username,
      applicationPassword,
    });
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'WordPress verbinding mislukt. Controleer je gegevens.' },
        { status: 400 }
      );
    }
    
    console.log('✅ WordPress connection verified');
    
    // Step 2: Create Autopilot site
    const site = await createAutopilotSite({
      clientId: client.id,
      name,
      siteUrl,
      username,
      applicationPassword,
      language: language || 'nl',
      postingFrequency: postingFrequency || 'weekly',
      contentTypes: contentTypes || ['article', 'guide', 'how-to'],
      lastPostDate: undefined,
      nextPostDate: undefined,
      averageViews: undefined,
      topicalAuthorityScore: undefined,
    });
    
    console.log(`✅ Autopilot site created: ${site.id}`);
    
    // Step 3: Generate topical authority strategy (async)
    console.log('🧠 Generating topical authority strategy...');
    
    try {
      const strategy = await generateTopicalAuthorityStrategy(
        site.id,
        siteUrl,
        client.id,
        postingFrequency || 'weekly'
      );
      
      // Save strategy
      const savedStrategy = await saveContentStrategy(strategy);
      
      // Generate content calendar
      const calendar = await generateContentCalendar(
        site.id,
        savedStrategy.id,
        strategy.keywordClusters,
        postingFrequency || 'weekly',
        client.id
      );
      
      // Save calendar items
      await addToContentCalendar(calendar);
      
      console.log(`✅ Strategy and calendar generated: ${calendar.length} items`);
      
      return NextResponse.json({
        success: true,
        site: {
          id: site.id,
          name: site.name,
          siteUrl: site.siteUrl,
          status: site.status,
        },
        strategy: {
          niche: strategy.niche,
          mainTopics: strategy.mainTopics,
          coverage: strategy.currentCoverage,
          goal: strategy.topicalAuthorityGoal,
        },
        calendar: {
          totalItems: calendar.length,
          nextPostDate: calendar[0]?.scheduledDate,
        },
      });
    } catch (strategyError) {
      console.error('❌ Strategy generation failed:', strategyError);
      
      // Site is created but strategy failed - return partial success
      return NextResponse.json({
        success: true,
        site: {
          id: site.id,
          name: site.name,
          siteUrl: site.siteUrl,
          status: site.status,
        },
        warning: 'Site toegevoegd, maar strategie generatie is mislukt. Je kunt dit later opnieuw proberen.',
      });
    }
  } catch (error: any) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json(
      { error: error.message || 'Setup mislukt' },
      { status: 500 }
    );
  }
}
