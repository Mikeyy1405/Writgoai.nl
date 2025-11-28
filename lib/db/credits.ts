/**
 * Credits Database Helper Functions
 * Provides functions for managing credits via Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { CONTENT_PLANNING_CREDITS } from '@/types/database';
import { generateId } from './utils';

// Create supabase client for this module
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface Client {
  id: string;
  subscriptionCredits: number;
  topUpCredits: number;
  isUnlimited: boolean;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
}

export interface CreditTransaction {
  id: string;
  clientId: string;
  amount: number;
  type: string;
  description: string;
  model: string | null;
  tokensUsed: number | null;
  messageId: string | null;
  balanceAfter: number;
  createdAt: string;
}

/**
 * Get client credit info
 */
export async function getClientCredits(clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('Client')
    .select('id, subscriptionCredits, topUpCredits, isUnlimited, totalCreditsUsed, totalCreditsPurchased')
    .eq('id', clientId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching client credits:', error);
    throw error;
  }

  return data as Client;
}

/**
 * Check if client has enough credits
 */
export async function hasEnoughCredits(
  clientId: string, 
  requiredCredits: number
): Promise<boolean> {
  const client = await getClientCredits(clientId);
  
  if (!client) return false;
  if (client.isUnlimited) return true;
  
  const totalCredits = client.subscriptionCredits + client.topUpCredits;
  return totalCredits >= requiredCredits;
}

/**
 * Get total available credits
 */
export async function getTotalCredits(clientId: string): Promise<number> {
  const client = await getClientCredits(clientId);
  
  if (!client) return 0;
  if (client.isUnlimited) return 999999;
  
  return client.subscriptionCredits + client.topUpCredits;
}

/**
 * Deduct credits from a client
 */
export async function deductCredits(
  clientId: string,
  amount: number,
  description: string,
  metadata?: {
    model?: string;
    tokensUsed?: number;
    messageId?: string;
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  try {
    const client = await getClientCredits(clientId);

    if (!client) {
      return { success: false, newBalance: 0, error: 'Client not found' };
    }

    if (client.isUnlimited) {
      await supabase.from('CreditTransaction').insert({
        id: generateId(),
        clientId,
        amount: -amount,
        type: 'usage',
        description: `${description} (Unlimited account)`,
        model: metadata?.model || null,
        tokensUsed: metadata?.tokensUsed || null,
        messageId: metadata?.messageId || null,
        balanceAfter: 999999,
        createdAt: new Date().toISOString(),
      });

      return { success: true, newBalance: 999999 };
    }

    const totalCredits = client.subscriptionCredits + client.topUpCredits;
    if (totalCredits < amount) {
      return { 
        success: false, 
        newBalance: totalCredits, 
        error: 'Insufficient credits' 
      };
    }

    let remainingAmount = amount;
    let subscriptionDeduction = 0;
    let topUpDeduction = 0;

    if (client.subscriptionCredits >= remainingAmount) {
      subscriptionDeduction = remainingAmount;
      remainingAmount = 0;
    } else {
      subscriptionDeduction = client.subscriptionCredits;
      remainingAmount -= client.subscriptionCredits;
      topUpDeduction = remainingAmount;
    }

    const newSubscriptionCredits = client.subscriptionCredits - subscriptionDeduction;
    const newTopUpCredits = client.topUpCredits - topUpDeduction;
    const newBalance = newSubscriptionCredits + newTopUpCredits;

    const { error: updateError } = await supabase
      .from('Client')
      .update({
        subscriptionCredits: newSubscriptionCredits,
        topUpCredits: newTopUpCredits,
        totalCreditsUsed: client.totalCreditsUsed + amount,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error updating client credits:', updateError);
      return { success: false, newBalance: totalCredits, error: updateError.message };
    }

    await supabase.from('CreditTransaction').insert({
      id: generateId(),
      clientId,
      amount: -amount,
      type: 'usage',
      description: subscriptionDeduction > 0 && topUpDeduction > 0 
        ? `${description} (${subscriptionDeduction.toFixed(1)} abo + ${topUpDeduction.toFixed(1)} top-up)`
        : subscriptionDeduction > 0
        ? `${description} (abonnement credits)`
        : `${description} (top-up credits)`,
      model: metadata?.model || null,
      tokensUsed: metadata?.tokensUsed || null,
      messageId: metadata?.messageId || null,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    });

    return { success: true, newBalance };
  } catch (error: unknown) {
    console.error('Error deducting credits:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, newBalance: 0, error: errorMessage };
  }
}

/**
 * Add credits to client
 */
export async function addCredits(
  clientId: string,
  amount: number,
  type: 'purchase' | 'refund' | 'bonus' | 'subscription',
  description: string
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const client = await getClientCredits(clientId);
    
    if (!client) {
      return { success: false, newBalance: 0 };
    }

    const isSubscriptionCredit = type === 'subscription';
    
    let newSubscriptionCredits = client.subscriptionCredits;
    let newTopUpCredits = client.topUpCredits;
    let newTotalPurchased = client.totalCreditsPurchased;

    if (isSubscriptionCredit) {
      newSubscriptionCredits += amount;
    } else {
      newTopUpCredits += amount;
    }

    if (type === 'purchase') {
      newTotalPurchased += amount;
    }

    const newBalance = newSubscriptionCredits + newTopUpCredits;

    const { error: updateError } = await supabase
      .from('Client')
      .update({
        subscriptionCredits: newSubscriptionCredits,
        topUpCredits: newTopUpCredits,
        totalCreditsPurchased: newTotalPurchased,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (updateError) {
      console.error('Error adding credits:', updateError);
      return { success: false, newBalance: 0 };
    }

    await supabase.from('CreditTransaction').insert({
      id: generateId(),
      clientId,
      amount,
      type,
      description: `${description} ${isSubscriptionCredit ? '(abonnement)' : '(top-up)'}`,
      model: null,
      tokensUsed: null,
      messageId: null,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(
  clientId: string, 
  limit: number = 50
): Promise<CreditTransaction[]> {
  const { data, error } = await supabase
    .from('CreditTransaction')
    .select('*')
    .eq('clientId', clientId)
    .order('createdAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching credit history:', error);
    throw error;
  }

  return (data || []) as CreditTransaction[];
}

export function getSitePlanCost(): number {
  return CONTENT_PLANNING_CREDITS.SITE_PLAN_GENERATION;
}

export function getBlogGenerationCost(): number {
  return CONTENT_PLANNING_CREDITS.BLOG_GENERATION;
}

export function getPillarPageCost(): number {
  return CONTENT_PLANNING_CREDITS.PILLAR_PAGE_GENERATION;
}

export function getKeywordResearchCost(): number {
  return CONTENT_PLANNING_CREDITS.KEYWORD_RESEARCH_50;
}

export { CONTENT_PLANNING_CREDITS };
