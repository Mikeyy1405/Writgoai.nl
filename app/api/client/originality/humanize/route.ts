
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { humanizeContent, quickAICheck } from '@/lib/originality-ai';
import { scanContent as scanOriginalityAI } from '@/lib/originality-ai';
import { scanContent as scanZeroGPT } from '@/lib/zerogpt-api';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max 60 seconds for humanization

/**
 * POST /api/client/originality/humanize
 * Humanize AI-generated content to pass AI detection
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Niet ingelogd' },
        { status: 401 }
      );
    }

    const { content, language = 'nl', preserveTone = true, skipScan = false, provider, projectId, isHtml = false } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is verplicht' },
        { status: 400 }
      );
    }

    if (content.length < 100) {
      return NextResponse.json(
        { error: 'Content te kort voor humanization (minimaal 100 karakters)' },
        { status: 400 }
      );
    }

    console.log(`[AI Detection] Humanizing ${content.length} characters for ${session.user.email}`);
    console.log(`[AI Detection] Provider: ${provider || 'not specified'}`);
    console.log(`[AI Detection] Project ID: ${projectId || 'not specified'}`);
    console.log(`[AI Detection] Language: ${language}`);
    console.log(`[AI Detection] Preserve tone: ${preserveTone}`);
    console.log(`[AI Detection] Skip scan: ${skipScan}`);

    // Get client for credit tracking
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      console.error(`[AI Detection] Client not found: ${session.user.email}`);
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }
    
    console.log(`[AI Detection] Client found: ${client.id}, credits: ${client.totalCreditsUsed || 0}`);

    // Determine which provider to use for scanning
    let selectedProvider = provider;
    
    // If no provider specified, try to get from project settings
    if (!selectedProvider && projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { aiDetectionProvider: true },
      });
      selectedProvider = project?.aiDetectionProvider || 'originality';
    }
    
    // Default to originality if still not set
    selectedProvider = selectedProvider || 'originality';

    // Quick pre-check
    const preCheck = quickAICheck(content);

    // Helper function to scan with selected provider
    const scanWithProvider = async (text: string) => {
      return selectedProvider === 'zerogpt' 
        ? await scanZeroGPT(text)
        : await scanOriginalityAI(text);
    };

    // Optional: Scan before humanization
    let beforeScore = null;
    let sentenceScores = null;
    if (!skipScan) {
      const scanResult = await scanWithProvider(content);
      if (scanResult.success) {
        beforeScore = scanResult.score;
        sentenceScores = scanResult.sentences; // Get sentence-level scores for targeted humanization
      }
    }

    // Humanize the content (always uses Claude for humanization)
    // Pass sentence scores so it can target only AI-heavy sentences
    const startTime = Date.now();
    const { humanized, improvements } = await humanizeContent(
      content, 
      language as any, 
      preserveTone, 
      sentenceScores || undefined,
      isHtml // Pass HTML flag to preserve formatting
    );
    const processingTime = Date.now() - startTime;

    // Optional: Scan after humanization to verify improvement
    let afterScore = null;
    if (!skipScan) {
      const scanResult = await scanWithProvider(humanized);
      if (scanResult.success) {
        afterScore = scanResult.score;
      }
    }

    // Calculate credits used (humanization cost)
    const wordsCount = content.split(/\s+/).length;
    const creditsUsed = Math.max(10, Math.ceil(wordsCount / 100)); // 10 credits per 100 words, min 10

    // Track credits usage
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalCreditsUsed: { increment: creditsUsed },
      },
    });

    console.log(`[AI Detection] Humanization completed in ${processingTime}ms, ${creditsUsed} credits used`);

    return NextResponse.json({
      success: true,
      humanized,
      improvements,
      beforeScore,
      afterScore,
      preCheck,
      processingTime,
      creditsUsed,
      provider: selectedProvider,
      improvement: beforeScore && afterScore 
        ? Math.round(beforeScore.ai - afterScore.ai)
        : null,
    });

  } catch (error: any) {
    console.error('[Originality.AI] Humanize error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij humaniseren' },
      { status: 500 }
    );
  }
}
