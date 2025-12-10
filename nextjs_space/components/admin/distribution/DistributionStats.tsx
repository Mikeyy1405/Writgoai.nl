'use client';

import { DistributionStats as StatsType } from '@/lib/types/distribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

interface DistributionStatsProps {
  stats: StatsType;
}

export function DistributionStats({ stats }: DistributionStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Posts Today */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Posts Vandaag
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-[#FF6B35]" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.today}</div>
          <p className="text-xs text-zinc-500 mt-1">
            Gepland voor vandaag
          </p>
        </CardContent>
      </Card>

      {/* Posts This Week */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Deze Week
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.this_week}</div>
          <p className="text-xs text-zinc-500 mt-1">
            Gepland deze week
          </p>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            Successpercentage
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.success_rate}%</div>
          <p className="text-xs text-zinc-500 mt-1">
            Succesvol gepubliceerd
          </p>
        </CardContent>
      </Card>

      {/* Pending Posts */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">
            In Wachtrij
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{stats.pending}</div>
          <p className="text-xs text-zinc-500 mt-1">
            {stats.failed > 0 && (
              <span className="text-red-500">{stats.failed} mislukt</span>
            )}
            {stats.failed === 0 && 'Wachtend op publicatie'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
