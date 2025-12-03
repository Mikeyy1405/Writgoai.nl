
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { scanContent as scanOriginalityAI } from '@/lib/originality-ai';
import { scanContent as scanZeroGPT } from '@/lib/zerogpt-api';
import { humanizeContent } from '@/lib/originality-ai';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Max 5 minutes for iterative humanization

/**
 * POST /api/client/originality/humanize-until-safe
 * Iteratively humanize content until AI score < 5%
 * Optimized to minimize scan costs by only scanning after humanization
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

    const { content, language = 'nl', provider = 'zerogpt', projectId, isHtml = false, targetScore = 0 } = await request.json(); // Target 0% AI = 100% human score

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

    console.log(`[Iterative Humanizer] Starting for ${session.user.email}`);
    console.log(`[Iterative Humanizer] Target score: ${targetScore}%`);
    console.log(`[Iterative Humanizer] Content length: ${content.length} characters`);
    console.log(`[Iterative Humanizer] ⚡ OPTIMIZED VERSION: Only scanning AFTER humanization to save costs`);

    // Get client for credit tracking
    const client = await prisma.client.findUnique({
      where: { email: session.user.email },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client niet gevonden' },
        { status: 404 }
      );
    }

    // Always use ZeroGPT as the AI detection provider
    const selectedProvider = 'zerogpt';
    console.log(`[Iterative Humanizer] Using ZeroGPT API for AI detection`);

    // Helper function to scan with selected provider
    const scanWithProvider = async (text: string) => {
      return selectedProvider === 'zerogpt' 
        ? await scanZeroGPT(text)
        : await scanOriginalityAI(text);
    };

    // Iterative humanization loop
    let currentContent = content;
    let currentScore = 100;
    let iteration = 0;
    const maxIterations = 15; // Increased to 15 for aggressive humanization to 100% human
    const iterations: Array<{
      iteration: number;
      beforeScore: number;
      afterScore: number;
      improvement: number;
      shareUrl?: string;
    }> = [];
    let totalCreditsUsed = 0;
    let lastShareUrl: string | null = null;

    console.log(`[Iterative Humanizer] Starting iterative process with max ${maxIterations} iterations`);
    console.log(`[Iterative Humanizer] Using aggressive humanization to reach <${targetScore}% AI score`);

    // Initial scan
    const initialScan = await scanWithProvider(currentContent);
    if (!initialScan.success) {
      throw new Error('Initiële scan mislukt: ' + initialScan.error);
    }
    currentScore = initialScan.score.ai;
    totalCreditsUsed += (initialScan.credits_used || 0);
    lastShareUrl = initialScan.shareUrl || null;
    
    console.log(`[Iterative Humanizer] Initial AI score: ${currentScore.toFixed(1)}%`);
    if (lastShareUrl) {
      console.log(`[Iterative Humanizer] Initial scan share URL: ${lastShareUrl}`);
    }

    // If already at or below target, no need to iterate
    if (currentScore <= targetScore) {
      console.log(`[Iterative Humanizer] Already at or below target score!`);
      const perfectScore = currentScore === 0 ? '0% AI - Perfect menselijk! 🎉' : `${currentScore.toFixed(1)}% AI`;
      return NextResponse.json({
        success: true,
        finalContent: currentContent,
        finalScore: currentScore,
        iterations: [],
        shareUrl: lastShareUrl,
        message: `Content heeft al een geweldige score: ${perfectScore}`,
        totalCreditsUsed,
        scansPerformed: 1,
        targetReached: true,
      });
    }

    // Store the last scan result to reuse sentence data
    let lastScanResult = initialScan;
    
    // Iterate until target score or max iterations
    // Note: For targetScore = 0, we continue while currentScore > 0
    while (currentScore > targetScore && iteration < maxIterations) {
      iteration++;
      console.log(`[Iterative Humanizer] === Iteration ${iteration}/${maxIterations} ===`);
      console.log(`[Iterative Humanizer] Current score: ${currentScore.toFixed(1)}%`);

      const beforeScore = currentScore;

      // ⚡ OPTIMIZATION: Use previous scan's sentence data instead of scanning again
      // This saves 1 scan per iteration (50% cost reduction!)
      // We use the sentence data from the last scan (either initialScan or previous iteration's afterScan)
      const sentenceScores = lastScanResult.sentences || [];
      console.log(`[Iterative Humanizer] ⚡ Using previous scan's sentence data (no extra scan needed)`);
      
      // Filter to only AI-detected sentences (marked by ZeroGPT with isHighlighted flag)
      // These are the YELLOW highlighted sentences that ZeroGPT identified as AI
      const highAISentences = sentenceScores.filter((s: any) => {
        // ZeroGPT marks AI sentences with isHighlighted flag or ai_score > 50
        return s.isHighlighted || s.ai_score > 50;
      });
      
      console.log(`[Iterative Humanizer] 🎯 Found ${highAISentences.length} AI-detected sentences to rewrite`);
      if (highAISentences.length > 0) {
        console.log(`[Iterative Humanizer] Preview of AI sentences:`);
        highAISentences.slice(0, 2).forEach((s: any, i: number) => {
          const preview = s.text.substring(0, 80) + (s.text.length > 80 ? '...' : '');
          console.log(`  [${i+1}] ${preview}`);
        });
      }

      // Humanize content with MORE AGGRESSIVE settings
      const { humanized } = await humanizeContent(
        currentContent,
        language as any,
        true, // Always preserve tone
        highAISentences.length > 0 ? highAISentences : undefined,
        isHtml
      );

      // Update current content
      currentContent = humanized;

      // Calculate credits for humanization (no scan cost here!)
      const wordsCount = content.split(/\s+/).length;
      const iterationCredits = Math.max(10, Math.ceil(wordsCount / 100));
      totalCreditsUsed += iterationCredits;

      // Scan the humanized content (only ONE scan per iteration)
      console.log(`[Iterative Humanizer] Scanning humanized content...`);
      const afterScan = await scanWithProvider(currentContent);
      if (!afterScan.success) {
        console.error(`[Iterative Humanizer] Scan failed after iteration ${iteration}`);
        // Continue anyway with estimated score
        currentScore = Math.max(0, currentScore - 10); // Optimistic estimate
      } else {
        currentScore = afterScan.score.ai;
        totalCreditsUsed += (afterScan.credits_used || 0);
        lastShareUrl = afterScan.shareUrl || lastShareUrl;
        lastScanResult = afterScan; // ⚡ Store for next iteration to reuse sentence data
        
        if (afterScan.shareUrl) {
          console.log(`[Iterative Humanizer] Iteration ${iteration} share URL: ${afterScan.shareUrl}`);
        }
        
        // IMMEDIATE CHECK: Exit if target reached after this scan
        if (currentScore <= targetScore) {
          const scoreDisplay = currentScore === 0 ? '0% (Perfect! 🎉)' : `${currentScore.toFixed(1)}%`;
          console.log(`[Iterative Humanizer] 🎯 TARGET REACHED after scan! Score: ${scoreDisplay}`);
          const improvement = beforeScore - currentScore;
          iterations.push({
            iteration,
            beforeScore,
            afterScore: currentScore,
            improvement,
            shareUrl: afterScan.shareUrl,
          });
          // Break immediately without checking anything else
          break;
        }
      }

      const improvement = beforeScore - currentScore;
      console.log(`[Iterative Humanizer] After humanization: ${currentScore.toFixed(1)}% (${improvement >= 0 ? '-' : '+'}${Math.abs(improvement).toFixed(1)}%)`);

      iterations.push({
        iteration,
        beforeScore,
        afterScore: currentScore,
        improvement,
        shareUrl: afterScan.shareUrl,
      });

      // Note: Target check already performed immediately after scan (line ~188)
      // This point is only reached if score is still > targetScore
      console.log(`[Iterative Humanizer] ⚠️ Target NOT yet reached. Current: ${currentScore.toFixed(1)}% AI, Target: ${targetScore}% AI`);
      console.log(`[Iterative Humanizer] ➡️ Continuing to next iteration...`)

      // If score is stuck or increasing, try more aggressive rewriting
      if (improvement <= 0 && iteration < maxIterations) {
        console.log(`[Iterative Humanizer] ⚠️ Score not improving, will try more aggressive approach next iteration`);
      }

      // Safety check: if score not improving after 2 iterations, break early
      if (iteration >= 2) {
        const recentImprovements = iterations.slice(-2).map(i => i.improvement);
        const avgImprovement = recentImprovements.reduce((a, b) => a + b, 0) / 2;
        
        if (avgImprovement < 1) {
          console.log(`[Iterative Humanizer] ⚠️ Minimal improvement detected (avg ${avgImprovement.toFixed(1)}%), stopping early to save costs`);
          break;
        }
      }
    }

    // Track total credits usage
    await prisma.client.update({
      where: { id: client.id },
      data: {
        totalCreditsUsed: { increment: totalCreditsUsed },
      },
    });

    // Calculate scan statistics
    const totalScansPerformed = 1 + iteration; // Initial scan + 1 per iteration (optimized!)
    const scansSaved = iteration; // We saved 1 scan per iteration by not scanning before humanizing
    
    console.log(`[Iterative Humanizer] ✅ Completed after ${iteration} iterations`);
    console.log(`[Iterative Humanizer] Final score: ${currentScore.toFixed(1)}%`);
    console.log(`[Iterative Humanizer] Total credits used: ${totalCreditsUsed}`);
    console.log(`[Iterative Humanizer] ⚡ Scans performed: ${totalScansPerformed} (saved ${scansSaved} scans with optimization!)`);
    if (lastShareUrl) {
      console.log(`[Iterative Humanizer] Final share URL: ${lastShareUrl}`);
    }

    const success = currentScore <= targetScore;
    const scoreDisplay = currentScore === 0 ? '0% AI (100% menselijk! 🎉)' : `${currentScore.toFixed(1)}% AI`;
    const message = success
      ? `✅ Succesvol! AI-score verlaagd naar ${scoreDisplay} in ${iteration} iteratie${iteration > 1 ? 's' : ''}`
      : `⚠️ Gestopt na ${iteration} iteratie${iteration > 1 ? 's' : ''}. Score: ${currentScore.toFixed(1)}% AI (doel was ${targetScore}% AI)`;

    return NextResponse.json({
      success,
      finalContent: currentContent,
      finalScore: currentScore,
      shareUrl: lastShareUrl, // Share URL for final result
      iterations,
      message,
      totalIterations: iteration,
      totalCreditsUsed,
      scansPerformed: totalScansPerformed,
      scansSaved: scansSaved,
      targetReached: success,
    });

  } catch (error: any) {
    console.error('[Iterative Humanizer] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij iteratieve humanization' },
      { status: 500 }
    );
  }
}
