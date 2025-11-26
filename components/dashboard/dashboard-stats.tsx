
'use client';

import { Card } from '@/components/ui/card';
import { 
  Wallet, 
  FileText, 
  Clock, 
  Zap,
  TrendingUp,
  Database
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalContent: number;
    thisMonth: number;
    totalProjects: number;
    creditsAvailable: number;
    creditsUsed: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const creditPercentage = stats.creditsAvailable > 0 
    ? Math.round((stats.creditsUsed / (stats.creditsAvailable + stats.creditsUsed)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Credits Card */}
      <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-green-500/10 rounded-xl">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase bg-gray-800/50 px-2 py-1 rounded">
            Credits
          </span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">
          {stats.creditsAvailable.toLocaleString()}
        </h3>
        <p className="text-xs text-gray-400">
          Beschikbaar ({creditPercentage}% gebruikt)
        </p>
        <div className="mt-3 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min(creditPercentage, 100)}%` }}
          />
        </div>
      </Card>

      {/* Content Card */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase bg-gray-800/50 px-2 py-1 rounded">
            Content
          </span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">
          {stats.totalContent}
        </h3>
        <p className="text-xs text-gray-400">
          Totaal Artikelen
        </p>
        {stats.thisMonth > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-green-400">
            <TrendingUp className="w-3 h-3" />
            <span>+{stats.thisMonth} deze maand</span>
          </div>
        )}
      </Card>

      {/* Projects Card */}
      <Card className="bg-gradient-to-br from-orange-500/10 to-pink-500/5 border-orange-500/20 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <Database className="w-6 h-6 text-orange-400" />
          </div>
          <span className="text-xs text-gray-400 font-bold uppercase bg-gray-800/50 px-2 py-1 rounded">
            Projecten
          </span>
        </div>
        <h3 className="text-3xl font-bold text-white mb-1">
          {stats.totalProjects}
        </h3>
        <p className="text-xs text-gray-400">
          Actieve Projecten
        </p>
      </Card>
    </div>
  );
}
