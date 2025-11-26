
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import {
  scanWebsiteForKeywords,
  generateKeywordOpportunities,
  generateKeywordOpportunitiesFromKeyword,
  strategicallyAnalyzeKeywords,
  ProgressCallback,
} from '@/lib/keyword-research';

// ⏱️ Vercel Function timeout - verhoogd voor strategische analyse
export const maxDuration = 90; // 90 seconden (extra tijd voor strategische analyse)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Voer uitgebreide keyword research uit met ECHTE analyse
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
      include: {
        projects: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const body = await request.json();
    const { url, keyword, projectId } = body;

    // Get project data
    let project = null;
    if (projectId) {
      project = await prisma.project.findFirst({
        where: { id: projectId, clientId: client.id }
      });
    } else if (client.projects.length > 0) {
      project = client.projects[0];
    }

    const niche = project?.niche || undefined;

    // Bepaal research type
    const isUrlScan = url && url.trim();
    const isKeywordResearch = keyword && keyword.trim();

    if (!isUrlScan && !isKeywordResearch) {
      return NextResponse.json({ 
        error: 'Voer een website URL of keyword in' 
      }, { status: 400 });
    }

    let existingKeywords: string[] = [];
    let newKeywords: any[] = [];
    let mainTopic = '';

    if (isUrlScan) {
      // URL SCAN MODE - UITGEBREIDE ANALYSE
      console.log('🌐 URL Scan mode (uitgebreid) for:', url);
      
      try {
        // Step 1: Scan website voor bestaande keywords
        console.log('📊 Stap 1: Website scannen...');
        existingKeywords = await scanWebsiteForKeywords(url);
        console.log(`✅ Gevonden: ${existingKeywords.length} bestaande keywords`);
        
        // Step 2: Genereer keyword opportuniteiten (uitgebreid)
        console.log('🚀 Stap 2: Keyword kansen genereren (40 keywords)...');
        newKeywords = await generateKeywordOpportunities(
          url,
          existingKeywords,
          niche,
          undefined // Geen progress callback in API route
        );
        
        console.log(`✅ Gegenereerd: ${newKeywords.length} nieuwe keyword kansen`);
        
        // Bepaal main topic van de website
        mainTopic = niche || url.replace(/^https?:\/\//i, '').replace(/^www\./, '').split('.')[0];
        
      } catch (error: any) {
        console.error('URL scan error:', error);
        return NextResponse.json({ 
          error: 'Website analyse mislukt. Controleer de URL en probeer opnieuw.',
          details: error.message 
        }, { status: 500 });
      }
      
    } else {
      // KEYWORD RESEARCH MODE - UITGEBREIDE ANALYSE
      console.log('🔍 Keyword research mode (uitgebreid) for:', keyword);
      
      try {
        newKeywords = await generateKeywordOpportunitiesFromKeyword(
          keyword,
          niche,
          undefined // Geen progress callback in API route
        );
        
        console.log(`✅ Gegenereerd: ${newKeywords.length} keyword kansen`);
        
        // Main topic is het seed keyword
        mainTopic = keyword;
        
      } catch (error: any) {
        console.error('Keyword research error:', error);
        return NextResponse.json({ 
          error: 'Keyword research mislukt. Probeer een ander keyword.',
          details: error.message 
        }, { status: 500 });
      }
    }

    // NIEUWE STAP: Strategische analyse toepassen
    console.log('🎯 Stap 3: Strategische keyword analyse...');
    try {
      newKeywords = await strategicallyAnalyzeKeywords(
        newKeywords,
        mainTopic,
        undefined // Geen progress callback in API route
      );
      console.log('✅ Strategische analyse compleet');
    } catch (error: any) {
      console.error('Strategic analysis warning:', error);
      // Ga door met de keywords zonder strategische data
      console.log('⚠️ Continuing without strategic analysis');
    }

    // Sort strategisch: primary eerst, dan secondary, dan lsi
    // Binnen elke tier: hoogste potentialScore eerst
    newKeywords.sort((a, b) => {
      const tierOrder = { 'primary': 0, 'secondary': 1, 'lsi': 2 };
      const aTier = tierOrder[a.keywordTier || 'lsi'];
      const bTier = tierOrder[b.keywordTier || 'lsi'];
      
      if (aTier !== bTier) return aTier - bTier;
      return b.potentialScore - a.potentialScore;
    });
    
    // Statistics
    const excellentCount = newKeywords.filter(k => k.potentialScore > 70).length;
    const goodCount = newKeywords.filter(k => k.potentialScore > 50 && k.potentialScore <= 70).length;
    const moderateCount = newKeywords.filter(k => k.potentialScore <= 50).length;
    
    // Strategische stats
    const primaryCount = newKeywords.filter(k => k.keywordTier === 'primary').length;
    const secondaryCount = newKeywords.filter(k => k.keywordTier === 'secondary').length;
    const lsiCount = newKeywords.filter(k => k.keywordTier === 'lsi').length;
    
    const decisionCount = newKeywords.filter(k => k.buyerJourneyStage === 'decision').length;
    const considerationCount = newKeywords.filter(k => k.buyerJourneyStage === 'consideration').length;
    const awarenessCount = newKeywords.filter(k => k.buyerJourneyStage === 'awareness').length;
    
    const clusters = [...new Set(newKeywords.map(k => k.cluster).filter(Boolean))];

    console.log('📊 Keyword statistics:');
    console.log(`   - ${excellentCount} excellent (70+), ${goodCount} good (50-70), ${moderateCount} moderate (<50)`);
    console.log(`   - ${primaryCount} primary, ${secondaryCount} secondary, ${lsiCount} LSI`);
    console.log(`   - Buyer journey: ${decisionCount} decision, ${considerationCount} consideration, ${awarenessCount} awareness`);
    console.log(`   - ${clusters.length} onderwerp clusters`);

    return NextResponse.json({
      success: true,
      existingKeywords,
      newKeywords,
      total: newKeywords.length,
      type: isUrlScan ? 'url-scan' : 'keyword-research',
      stats: {
        excellent: excellentCount,
        good: goodCount,
        moderate: moderateCount,
        // Strategische stats
        primary: primaryCount,
        secondary: secondaryCount,
        lsi: lsiCount,
        decision: decisionCount,
        consideration: considerationCount,
        awareness: awarenessCount,
        clusters: clusters.length,
        clusterNames: clusters
      }
    });

  } catch (error: any) {
    console.error('Error in keyword research:', error);
    return NextResponse.json(
      { error: error.message || 'Er ging iets mis. Probeer het opnieuw.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Haal opgeslagen keywords op
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const keywords = await prisma.keyword.findMany({
      where: { clientId: client.id },
      orderBy: [
        { priority: 'desc' },
        { potentialScore: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      keywords
    });

  } catch (error: any) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}
