/**
 * Credit Management System
 * 
 * Handles credit checking, deduction, and balance management
 */

import { createClient } from '@supabase/supabase-js';
import { CREDIT_COSTS, type CreditAction, isFreeAction } from './credit-costs';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseAdmin!;
}

export interface CreditBalance {
  credits_remaining: number;
  monthly_credits: number;
  subscription_tier: string | null;
  subscription_active: boolean;
  is_admin?: boolean;
}

/**
 * Check if user has enough credits for an action
 */
export async function checkCredits(
  userId: string,
  action: CreditAction
): Promise<boolean> {
  // Free actions always pass
  if (isFreeAction(action)) {
    return true;
  }

  const balance = await getCreditBalance(userId);
  if (!balance) {
    return false;
  }

  // Admin users have unlimited credits
  if (balance.is_admin) {
    return true;
  }

  const requiredCredits = CREDIT_COSTS[action];
  return balance.credits_remaining >= requiredCredits;
}

/**
 * Deduct credits from user account
 */
export async function deductCredits(
  userId: string,
  action: CreditAction,
  customAmount?: number
): Promise<{ success: boolean; remaining: number; error?: string }> {
  // Free actions don't deduct credits
  if (isFreeAction(action)) {
    const balance = await getCreditBalance(userId);
    return {
      success: true,
      remaining: balance?.credits_remaining || 0,
    };
  }

  const amount = customAmount || CREDIT_COSTS[action];

  try {
    // Get current balance
    const supabase = getSupabaseAdmin();
    const { data: subscriber, error: fetchError } = await supabase
      .from('subscribers')
      .select('credits_remaining, subscription_active, is_admin')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscriber) {
      return {
        success: false,
        remaining: 0,
        error: 'Subscriber not found',
      };
    }

    // Admin users don't deduct credits
    if ((subscriber as any).is_admin) {
      await logCreditUsage(userId, action, amount);
      return {
        success: true,
        remaining: 999999, // Admin always shows unlimited
      };
    }

    // Check if enough credits (removed subscription_active check - credits should work regardless)
    if ((subscriber as any).credits_remaining < amount) {
      return {
        success: false,
        remaining: (subscriber as any).credits_remaining,
        error: 'Insufficient credits',
      };
    }

    // Deduct credits
    const newBalance = (subscriber as any).credits_remaining - amount;
    const { error: updateError } = await (supabase as any)
      .from('subscribers')
      .update({ credits_remaining: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      return {
        success: false,
        remaining: (subscriber as any).credits_remaining,
        error: 'Failed to update credits',
      };
    }

    // Log the usage
    await logCreditUsage(userId, action, amount);

    return {
      success: true,
      remaining: newBalance,
    };
  } catch (error: any) {
    console.error('Credit deduction error:', error);
    return {
      success: false,
      remaining: 0,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Get user's credit balance
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance | null> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any)
      .from('subscribers')
      .select('credits_remaining, monthly_credits, subscription_tier, subscription_active, is_admin')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as CreditBalance;
  } catch (error) {
    console.error('Get credit balance error:', error);
    return null;
  }
}

/**
 * Add credits to user account (used by Stripe webhook)
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason: string = 'subscription'
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: subscriber, error: fetchError } = await supabase.from('subscribers')
      .select('credits_remaining')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscriber) {
      return false;
    }

    const newBalance = (subscriber as any).credits_remaining + amount;
    const { error: updateError } = await (supabase as any)
      .from('subscribers')
      .update({ credits_remaining: newBalance })
      .eq('user_id', userId);

    if (updateError) {
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('Add credits error:', error);
    return false;
  }
}

/**
 * Reset monthly credits (called on subscription renewal)
 */
export async function resetMonthlyCredits(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: subscriber, error: fetchError } = await (supabase as any)
      .from('subscribers')
      .select('monthly_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !subscriber) {
      return false;
    }

    const { error: updateError } = await (supabase as any)
      .from('subscribers')
      .update({ credits_remaining: (subscriber as any).monthly_credits })
      .eq('user_id', userId);

    return !updateError;
  } catch (error) {
    console.error('Reset monthly credits error:', error);
    return false;
  }
}

/**
 * Log credit usage for analytics
 */
async function logCreditUsage(
  userId: string,
  action: CreditAction,
  amount: number
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    await (supabase as any).from('credit_usage_logs').insert({
      user_id: userId,
      action,
      credits_used: amount,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Log credit usage error:', error);
    // Don't fail the main operation if logging fails
  }
}
