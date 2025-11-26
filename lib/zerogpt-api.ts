
/**
 * ZeroGPT API Client
 * Scans content for AI detection
 * Documentation: https://app.theneo.io/olive-works-llc/zerogpt-docs/zerogpt-business-api
 */

const ZEROGPT_API_URL = 'https://api.zerogpt.com/api/detect/detectText';
const API_KEY = process.env.ZEROGPT_API_KEY || '';

export interface ZeroGPTScore {
  ai: number;
  original: number;
  score: number; // Overall AI probability (0-100)
}

export interface ZeroGPTScanResult {
  success: boolean;
  score: ZeroGPTScore;
  credits_used: number;
  sentences?: Array<{
    text: string;
    ai_score: number;
  }>;
  shareUrl?: string; // Share URL (ZeroGPT doesn't provide this, but keeping for consistency)
  error?: string;
}

/**
 * Scan content for AI detection using ZeroGPT
 */
export async function scanContent(content: string): Promise<ZeroGPTScanResult> {
  try {
    if (!API_KEY) {
      console.error('[ZeroGPT] API key not configured');
      throw new Error('ZeroGPT API key niet geconfigureerd. Neem contact op met support.');
    }

    if (!content || content.trim().length < 50) {
      throw new Error('Content te kort voor accurate scanning (minimaal 50 karakters)');
    }

    console.log('[ZeroGPT] Scanning', content.length, 'characters');
    console.log('[ZeroGPT] Using API endpoint:', ZEROGPT_API_URL);
    console.log('[ZeroGPT] API Key configured:', API_KEY ? 'Yes (length: ' + API_KEY.length + ')' : 'No');

    const response = await fetch(ZEROGPT_API_URL, {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_text: content,
      }),
    });

    console.log('[ZeroGPT] Response status:', response.status);
    console.log('[ZeroGPT] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ZeroGPT] API error response:', errorText);
      
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // Not JSON
        console.error('[ZeroGPT] Error response is not JSON:', errorText.substring(0, 200));
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.detail || errorText || `API fout: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[ZeroGPT] Response data:', JSON.stringify(data, null, 2));

    // ZeroGPT API returns:
    // {
    //   "code": 200,
    //   "success": true,
    //   "message": "",
    //   "data": {
    //     "fakePercentage": number,  // AI percentage (0-100)
    //     "textWords": number,       // Total word count
    //     "aiWords": number,         // AI-generated word count
    //     "sentences": array,        // Sentences array (structure varies)
    //     "feedback": string,
    //     ...
    //   }
    // }

    if (!data.success) {
      throw new Error(data.message || data.data?.feedback || 'Scan mislukt');
    }

    // Parse AI percentage from fakePercentage field
    const aiPercentage = parseFloat(data.data?.fakePercentage || 0);
    const humanPercentage = 100 - aiPercentage;

    console.log('[ZeroGPT] Scan result: AI=' + aiPercentage + '%, Human=' + humanPercentage + '%');

    // Parse sentences - ZeroGPT marks AI sentences with isHighlighted: true
    const sentences = Array.isArray(data.data?.sentences) 
      ? data.data.sentences
          .map((sentence: any) => {
            // Handle different sentence formats from ZeroGPT
            const text = typeof sentence === 'string' ? sentence : (sentence.sentence || sentence.text || '');
            const isHighlighted = sentence.isHighlighted || sentence.is_highlighted || sentence.highlight || false;
            
            // ZeroGPT marks AI sentences with isHighlighted flag
            // Give them high score (90) for aggressive rewriting
            const ai_score = isHighlighted ? 90 : 0;
            
            return { text, ai_score, isHighlighted };
          })
          .filter((s: any) => s.text && s.text.trim().length > 10) // Filter out empty/tiny sentences
      : [];

    // Log AI-detected sentences for debugging
    const aiSentences = sentences.filter(s => s.isHighlighted);
    console.log('[ZeroGPT] Total sentences:', sentences.length);
    console.log('[ZeroGPT] AI-detected sentences (highlighted):', aiSentences.length);
    
    if (aiSentences.length > 0) {
      console.log('[ZeroGPT] AI sentences preview:');
      aiSentences.slice(0, 3).forEach((s, i) => {
        const preview = s.text.substring(0, 60) + (s.text.length > 60 ? '...' : '');
        console.log(`  [${i+1}] ${preview}`);
      });
    }

    return {
      success: true,
      score: {
        ai: aiPercentage,
        original: humanPercentage,
        score: aiPercentage,
      },
      credits_used: 0.01, // ZeroGPT doesn't provide credit usage in response
      sentences: sentences.length > 0 ? sentences : undefined,
      shareUrl: undefined, // ZeroGPT doesn't provide share URLs
    };
  } catch (error: any) {
    console.error('[ZeroGPT] Scan error:', error);
    return {
      success: false,
      score: { ai: 0, original: 0, score: 0 },
      credits_used: 0,
      error: error.message || 'Onbekende fout bij scannen',
    };
  }
}

/**
 * Quick check if content likely needs humanization
 */
export function quickAICheck(content: string): {
  needsHumanization: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let needsHumanization = false;

  // Check 1: Uniform sentence length (low burstiness indicator)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const lengths = sentences.map(s => s.split(' ').length);
  const variance = calculateVariance(lengths);
  const avgLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  
  if (variance < avgLength * 0.3) {
    needsHumanization = true;
    reasons.push('Uniforme zinlengte gedetecteerd (lage burstiness)');
  }

  // Check 2: Repetitive patterns
  const words = content.toLowerCase().split(/\s+/);
  const bigramCounts = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
  }
  
  const maxRepetition = Math.max(...Array.from(bigramCounts.values()));
  if (maxRepetition > 3) {
    needsHumanization = true;
    reasons.push(`Herhalende woordcombinaties gedetecteerd (${maxRepetition}x)`);
  }

  // Check 3: Formal transition words overuse (AI pattern)
  const formalTransitions = ['echter', 'bovendien', 'daarnaast', 'tevens', 'voorts', 'aldus'];
  const transitionCount = formalTransitions.filter(t => 
    content.toLowerCase().includes(t)
  ).length;
  
  if (transitionCount > sentences.length * 0.15) {
    needsHumanization = true;
    reasons.push('Overmatig gebruik van formele overgangswoorden');
  }

  // Check 4: Lack of personal pronouns (too formal/robotic)
  const personalPronouns = ['ik', 'we', 'je', 'jij', 'jullie', 'mijn', 'onze'];
  const pronounCount = personalPronouns.filter(p => 
    content.toLowerCase().includes(` ${p} `)
  ).length;
  
  if (pronounCount === 0 && content.length > 500) {
    reasons.push('Gebrek aan persoonlijke elementen');
  }

  return { needsHumanization, reasons };
}

/**
 * Calculate variance for sentence length analysis
 */
function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
  return Math.sqrt(variance);
}

/**
 * Humanize/Paraphrase content using ZeroGPT
 * @param content - The text to humanize
 * @param tone - The tone to use (Standard, Academic, Fluent, Formal, Simple, Creative, etc.)
 * @returns The humanized content
 */
export async function humanizeContent(
  content: string,
  tone: 'Standard' | 'Academic' | 'Fluent' | 'Formal' | 'Simple' | 'Creative' = 'Standard'
): Promise<{
  success: boolean;
  humanizedContent?: string;
  error?: string;
}> {
  try {
    if (!API_KEY) {
      console.error('[ZeroGPT] API key not configured');
      throw new Error('ZeroGPT API key niet geconfigureerd. Neem contact op met support.');
    }

    if (!content || content.trim().length < 10) {
      throw new Error('Content te kort voor humanization (minimaal 10 karakters)');
    }

    console.log('[ZeroGPT] Humanizing', content.length, 'characters with tone:', tone);

    const response = await fetch('https://api.zerogpt.com/api/transform/paraphrase', {
      method: 'POST',
      headers: {
        'ApiKey': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        string: content,
        skipRealtime: 1, // No websocket, synchronous response
        tone: tone,
      }),
    });

    console.log('[ZeroGPT] Humanization response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ZeroGPT] Humanization error response:', errorText);
      
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('[ZeroGPT] Error response is not JSON:', errorText.substring(0, 200));
      }
      
      const errorMessage = errorData.message || errorData.error || errorData.detail || errorText || `API fout: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[ZeroGPT] Humanization response:', JSON.stringify(data, null, 2));

    // ZeroGPT API returns:
    // {
    //   "success": true,
    //   "code": 200,
    //   "message": "success or failure message",
    //   "data": {
    //     "message": "<humanized content>"
    //   }
    // }

    if (!data.success) {
      throw new Error(data.message || 'Humanization mislukt');
    }

    const humanizedContent = data.data?.message || '';
    
    if (!humanizedContent || humanizedContent.trim().length === 0) {
      throw new Error('Geen gehumaniseerde content ontvangen van API');
    }

    console.log('[ZeroGPT] Humanization successful, generated', humanizedContent.length, 'characters');

    return {
      success: true,
      humanizedContent: humanizedContent.trim(),
    };
  } catch (error: any) {
    console.error('[ZeroGPT] Humanization error:', error);
    return {
      success: false,
      error: error.message || 'Onbekende fout bij humanization',
    };
  }
}

/**
 * Iteratively humanize content until it reaches a target AI score
 * @param content - The text to humanize
 * @param targetScore - Target AI score (default 5%)
 * @param maxIterations - Maximum iterations (default 5)
 */
export async function iterativeHumanize(
  content: string,
  targetScore: number = 5,
  maxIterations: number = 5,
  onProgress?: (iteration: number, currentScore: number, message: string) => void
): Promise<{
  success: boolean;
  finalContent?: string;
  finalScore?: number;
  iterations: number;
  error?: string;
}> {
  let currentContent = content;
  let currentScore = 100; // Assume 100% AI initially
  let iteration = 0;

  try {
    // First, scan the original content
    onProgress?.(0, 100, 'Initiële scan uitvoeren...');
    const initialScan = await scanContent(currentContent);
    
    if (!initialScan.success) {
      throw new Error(initialScan.error || 'Initiële scan mislukt');
    }

    currentScore = initialScan.score.ai;
    console.log('[ZeroGPT] Initial AI score:', currentScore + '%');

    // If already below target, no need to humanize
    if (currentScore <= targetScore) {
      return {
        success: true,
        finalContent: currentContent,
        finalScore: currentScore,
        iterations: 0,
      };
    }

    // Iteratively humanize until target is reached or max iterations
    while (currentScore > targetScore && iteration < maxIterations) {
      iteration++;
      
      onProgress?.(
        iteration,
        currentScore,
        `Iteratie ${iteration}/${maxIterations}: Content herschrijven...`
      );

      // Determine tone based on current score
      let tone: 'Standard' | 'Creative' | 'Simple' = 'Standard';
      if (currentScore > 50) {
        tone = 'Creative'; // More aggressive rewriting for high AI scores
      } else if (currentScore > 30) {
        tone = 'Standard';
      } else {
        tone = 'Simple'; // Gentle rewriting when close to target
      }

      const humanizeResult = await humanizeContent(currentContent, tone);
      
      if (!humanizeResult.success || !humanizeResult.humanizedContent) {
        console.warn('[ZeroGPT] Humanization failed at iteration', iteration, ':', humanizeResult.error);
        // Continue with current content
        break;
      }

      currentContent = humanizeResult.humanizedContent;
      
      // Scan the humanized content
      onProgress?.(
        iteration,
        currentScore,
        `Iteratie ${iteration}/${maxIterations}: Resultaat scannen...`
      );
      
      const scanResult = await scanContent(currentContent);
      
      if (!scanResult.success) {
        console.warn('[ZeroGPT] Scan failed at iteration', iteration, ':', scanResult.error);
        break;
      }

      const previousScore = currentScore;
      currentScore = scanResult.score.ai;
      
      console.log(`[ZeroGPT] Iteration ${iteration}: ${previousScore}% → ${currentScore}%`);
      
      // If score didn't improve significantly, stop
      if (previousScore - currentScore < 2) {
        console.log('[ZeroGPT] Score improvement too small, stopping iterations');
        break;
      }
    }

    return {
      success: true,
      finalContent: currentContent,
      finalScore: currentScore,
      iterations: iteration,
    };
  } catch (error: any) {
    console.error('[ZeroGPT] Iterative humanization error:', error);
    return {
      success: false,
      iterations: iteration,
      error: error.message || 'Onbekende fout bij iteratieve humanization',
    };
  }
}
