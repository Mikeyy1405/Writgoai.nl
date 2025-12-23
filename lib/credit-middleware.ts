/**
 * Credit Middleware for API Routes
 * 
 * Helper functions to add credit checking and deduction to API routes
 */

import { NextResponse } from 'next/server';
import { checkCredits, deductCredits, getCreditBalance } from './credit-manager';
import type { CreditAction } from './credit-costs';

/**
 * Check if user has sufficient credits for an action
 * Returns error response if insufficient, null if OK
 */
export async function requireCredits(
  userId: string,
  action: CreditAction
): Promise<NextResponse | null> {
  const hasCredits = await checkCredits(userId, action);
  
  if (!hasCredits) {
    const balance = await getCreditBalance(userId);
    
    return NextResponse.json(
      {
        error: 'Insufficient credits',
        message: `Je hebt niet genoeg credits voor deze actie. Credits over: ${balance?.credits_remaining || 0}`,
        credits_remaining: balance?.credits_remaining || 0,
        action_required: action,
      },
      { status: 402 } // Payment Required
    );
  }
  
  return null;
}

/**
 * Deduct credits after successful action
 * Logs error but doesn't fail the request if deduction fails
 */
export async function deductCreditsAfterAction(
  userId: string,
  action: CreditAction,
  metadata?: Record<string, any>
): Promise<{ success: boolean; remaining: number }> {
  const result = await deductCredits(userId, action);
  
  if (!result.success) {
    console.error(`Failed to deduct credits for user ${userId}, action ${action}:`, result.error);
    // Log to monitoring system if available
  } else {
    console.log(`Deducted credits for user ${userId}, action ${action}. Remaining: ${result.remaining}`);
  }
  
  return result;
}

/**
 * Get user credit info to include in response headers
 */
export function addCreditHeaders(
  response: NextResponse,
  creditsRemaining: number,
  monthlyCredits: number
): NextResponse {
  response.headers.set('X-Credits-Remaining', creditsRemaining.toString());
  response.headers.set('X-Credits-Monthly', monthlyCredits.toString());
  return response;
}

/**
 * Wrapper to add credit checking and deduction to an API handler
 * 
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   return withCreditCheck(request, 'article_medium', async (user, supabase) => {
 *     // Your handler logic here
 *     const article = await generateArticle(...);
 *     return NextResponse.json({ article });
 *   });
 * }
 * ```
 */
export async function withCreditCheck<T>(
  request: Request,
  action: CreditAction,
  handler: (userId: string, metadata?: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract user ID from request (you'll need to adapt this based on your auth)
    // This is a placeholder - integrate with your actual auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse user ID from your auth system
    // const userId = await getUserIdFromAuth(authHeader);
    
    // For now, this is a template - you'll implement the actual extraction
    throw new Error('withCreditCheck needs to be integrated with your auth system');
    
  } catch (error: any) {
    console.error('Credit check wrapper error:', error);
    return NextResponse.json(
      { error: error.message || 'Credit check failed' },
      { status: 500 }
    );
  }
}
