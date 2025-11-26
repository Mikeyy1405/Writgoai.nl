
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, AlertCircle, Zap, Plus } from 'lucide-react';
import Link from 'next/link';

interface CreditsOverviewProps {
  creditsAvailable: number;
  creditsUsed: number;
  isUnlimited?: boolean;
}

export function CreditsOverview({ creditsAvailable, creditsUsed, isUnlimited }: CreditsOverviewProps) {
  const totalCredits = creditsAvailable + creditsUsed;
  const percentage = totalCredits > 0 ? Math.round((creditsUsed / totalCredits) * 100) : 0;
  const isLow = creditsAvailable < 100 && !isUnlimited;

  return (
    <Card className="bg-gradient-to-br from-orange-900/30 via-gray-900 to-gray-900 border-orange-500/20 p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Wallet className="text-orange-400" size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isUnlimited ? '∞' : creditsAvailable.toLocaleString()}
              </h3>
              <p className="text-sm text-gray-400">
                {isUnlimited ? 'Unlimited Credits' : 'Credits Beschikbaar'}
              </p>
            </div>
          </div>
          
          {isLow && (
            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full">
              <AlertCircle className="text-red-400" size={16} />
              <span className="text-xs font-semibold text-red-400">Bijna op</span>
            </div>
          )}
        </div>

        {!isUnlimited && (
          <>
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Verbruik</span>
                <span className="text-sm font-semibold text-white">{percentage}%</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    percentage > 80 
                      ? 'bg-gradient-to-r from-red-500 to-orange-500' 
                      : 'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="text-green-400" size={16} />
                  <span className="text-xs text-gray-400">Gebruikt</span>
                </div>
                <p className="text-lg font-bold text-white">{creditsUsed.toLocaleString()}</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="text-blue-400" size={16} />
                  <span className="text-xs text-gray-400">Totaal</span>
                </div>
                <p className="text-lg font-bold text-white">{totalCredits.toLocaleString()}</p>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link href="/client-portal/pricing" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold">
              <Plus size={18} className="mr-2" />
              Credits Kopen
            </Button>
          </Link>
          
          <Link href="/client-portal/usage">
            <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Details
            </Button>
          </Link>
        </div>

        {isLow && (
          <p className="mt-4 text-xs text-orange-400 flex items-center gap-2">
            <AlertCircle size={14} />
            Koop nu credits bij om zonder onderbreking door te werken
          </p>
        )}
      </div>
    </Card>
  );
}
