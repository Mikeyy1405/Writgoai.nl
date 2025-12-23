'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CreditBalanceProps {
  userId: string;
}

interface CreditInfo {
  credits_remaining: number;
  monthly_credits: number;
  subscription_tier: string | null;
  subscription_active: boolean;
}

export default function CreditBalance({ userId }: CreditBalanceProps) {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCredits();
  }, [userId]);

  const fetchCredits = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-4 p-3 bg-gray-800/50 border border-gray-700 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </div>
    );
  }

  if (!credits || !credits.subscription_active) {
    return (
      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
        <div className="text-xs text-gray-400 mb-1">Credits</div>
        <div className="text-sm font-semibold text-white mb-2">Geen actief abonnement</div>
        <Link
          href="/#pricing"
          className="block w-full text-center px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          Upgrade Nu
        </Link>
      </div>
    );
  }

  const percentage = (credits.credits_remaining / credits.monthly_credits) * 100;
  const isLow = percentage < 20;

  return (
    <div className="mb-4">
      <div className={`p-3 border rounded-lg ${
        isLow 
          ? 'bg-red-500/10 border-red-500/30' 
          : 'bg-gray-800/50 border-gray-700'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-400">Credits</div>
          <div className="text-xs text-gray-500">
            {credits.subscription_tier && (
              <span className="capitalize">{credits.subscription_tier}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-baseline space-x-1 mb-2">
          <div className={`text-2xl font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
            {credits.credits_remaining}
          </div>
          <div className="text-sm text-gray-400">/ {credits.monthly_credits}</div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              isLow ? 'bg-red-500' : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {isLow && (
          <Link
            href="/#pricing"
            className="block w-full text-center px-3 py-1.5 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Upgrade Plan
          </Link>
        )}
      </div>
    </div>
  );
}
