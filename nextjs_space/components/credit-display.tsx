
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Plus, TrendingUp, Sparkles } from 'lucide-react';
import CreditPaywall from './credit-paywall';

const BRAND_COLORS = {
  orange: '#FFA500',
  navy: '#000814',
};

interface CreditDisplayProps {
  clientId?: string;
  showButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function CreditDisplay({ 
  clientId, 
  showButton = true,
  size = 'md' 
}: CreditDisplayProps) {
  const [subscriptionCredits, setSubscriptionCredits] = useState<number>(0);
  const [topUpCredits, setTopUpCredits] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    loadCredits();
    
    // 🚀 OPTIMIZATION: Removed automatic polling
    // Credits will be refreshed only when:
    // 1. Component mounts
    // 2. After a purchase (via onPurchaseComplete)
    // 3. Manually triggered by parent component
    // This prevents unnecessary API calls every 30 seconds
  }, [clientId]);

  async function loadCredits() {
    try {
      const res = await fetch('/api/credits/balance');
      if (res.ok) {
        const data = await res.json();
        setSubscriptionCredits(data.subscriptionCredits || 0);
        setTopUpCredits(data.topUpCredits || 0);
        setTotalCredits(data.totalCredits || 0);
        setIsUnlimited(data.isUnlimited);
      }
    } catch (error) {
      console.error('Failed to load credits:', error);
    } finally {
      setLoading(false);
    }
  }

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isUnlimited) {
    return (
      <Badge 
        className="gap-2 px-3 py-1.5 text-white"
        style={{ backgroundColor: BRAND_COLORS.orange }}
      >
        <Sparkles className={iconSize[size]} />
        <span className={sizeClasses[size]}>Unlimited</span>
      </Badge>
    );
  }

  const isLowCredits = totalCredits < 10;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-1">
          {/* Total Credits Badge */}
          <Badge 
            variant={isLowCredits ? 'destructive' : 'secondary'}
            className={`gap-2 px-3 py-1.5 ${!isLowCredits && 'bg-orange-100 text-orange-900 hover:bg-orange-200'}`}
          >
            <Coins className={iconSize[size]} />
            <span className={`font-semibold ${sizeClasses[size]}`}>
              {totalCredits.toFixed(1)}
            </span>
            <span className={`text-xs ${sizeClasses[size]}`}>credits totaal</span>
          </Badge>
          
          {/* Breakdown - only show if both types have credits */}
          {(subscriptionCredits > 0 || topUpCredits > 0) && size !== 'sm' && (
            <div className="flex gap-1 text-xs text-gray-500">
              {subscriptionCredits > 0 && (
                <span>Abo: {subscriptionCredits.toFixed(1)}</span>
              )}
              {subscriptionCredits > 0 && topUpCredits > 0 && <span>•</span>}
              {topUpCredits > 0 && (
                <span>Top-up: {topUpCredits.toFixed(1)}</span>
              )}
            </div>
          )}
        </div>

        {showButton && (
          <Button
            size={size === 'lg' ? 'default' : 'sm'}
            onClick={() => setShowPaywall(true)}
            className="text-white"
            style={{ backgroundColor: BRAND_COLORS.orange }}
          >
            <Plus className={iconSize[size]} />
            {size !== 'sm' && <span className="ml-1">Koop</span>}
          </Button>
        )}
      </div>

      <CreditPaywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentCredits={totalCredits}
        onPurchaseComplete={loadCredits}
      />
    </>
  );
}
