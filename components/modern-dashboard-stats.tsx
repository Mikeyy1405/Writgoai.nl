
'use client';

import { ModernCard } from './modern-card';
import { 
  TrendingUp, 
  FileText, 
  Wallet,
  Database,
  Sparkles,
  Clock
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

export function ModernDashboardStats({ stats }: DashboardStatsProps) {
  const creditsPercentage = stats.creditsAvailable > 0 
    ? Math.round((stats.creditsUsed / (stats.creditsAvailable + stats.creditsUsed)) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Credits Card */}
      <ModernCard gradient="orange" className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-orange-500/10">
            <Wallet className="text-orange-400" size={24} />
          </div>
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full">
            {creditsPercentage}% gebruikt
          </span>
        </div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">Credits</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{stats.creditsAvailable}</span>
          <span className="text-gray-500 text-sm">beschikbaar</span>
        </div>
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
            style={{ width: `${Math.min(creditsPercentage, 100)}%` }}
          />
        </div>
      </ModernCard>

      {/* Content Card */}
      <ModernCard gradient="purple" className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-purple-500/10">
            <FileText className="text-purple-400" size={24} />
          </div>
          {stats.thisMonth > 0 && (
            <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full flex items-center gap-1">
              <TrendingUp size={12} />
              Deze maand
            </span>
          )}
        </div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">Content</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{stats.totalContent}</span>
          <span className="text-gray-500 text-sm">artikelen</span>
        </div>
        {stats.thisMonth > 0 && (
          <p className="mt-2 text-purple-400 text-sm">
            +{stats.thisMonth} deze maand
          </p>
        )}
      </ModernCard>

      {/* Projects Card */}
      <ModernCard gradient="blue" className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-blue-500/10">
            <Database className="text-blue-400" size={24} />
          </div>
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
            Actief
          </span>
        </div>
        <h3 className="text-gray-400 text-sm font-medium mb-1">Projecten</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{stats.totalProjects}</span>
          <span className="text-gray-500 text-sm">actief</span>
        </div>
      </ModernCard>
    </div>
  );
}
