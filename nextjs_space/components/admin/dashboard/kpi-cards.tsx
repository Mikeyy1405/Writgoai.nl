'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, Euro, TrendingUp, FileText, AlertTriangle, Coins } from 'lucide-react';

interface KPIData {
  totalClients: number;
  activeSubscriptions: number;
  mrr: number;
  arr: number;
  revenueThisMonth: number;
  revenuePreviousMonth: number;
  revenueGrowthPercent: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  creditsUsedThisMonth: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const kpis = [
    {
      title: 'Klanten',
      value: data.totalClients,
      subtitle: `${data.activeSubscriptions} actief`,
      icon: Users,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      trend: data.totalClients > 0 && data.activeSubscriptions > 0 ? `+${Math.round((data.activeSubscriptions / data.totalClients) * 100)}%` : null,
      trendUp: true,
    },
    {
      title: 'MRR',
      value: `€${data.mrr.toLocaleString('nl-NL')}`,
      subtitle: `ARR: €${data.arr.toLocaleString('nl-NL')}`,
      icon: Euro,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      trend: data.revenueGrowthPercent !== 0 ? `${data.revenueGrowthPercent > 0 ? '+' : ''}${data.revenueGrowthPercent.toFixed(1)}%` : null,
      trendUp: data.revenueGrowthPercent > 0,
    },
    {
      title: 'Omzet',
      value: `€${data.revenueThisMonth.toLocaleString('nl-NL')}`,
      subtitle: `vs €${data.revenuePreviousMonth.toLocaleString('nl-NL')}`,
      icon: TrendingUp,
      iconBg: 'bg-[#FF6B35]/20',
      iconColor: 'text-[#FF6B35]',
      trend: data.revenueGrowthPercent !== 0 ? `${data.revenueGrowthPercent > 0 ? '+' : ''}${data.revenueGrowthPercent.toFixed(1)}%` : null,
      trendUp: data.revenueGrowthPercent > 0,
    },
    {
      title: 'Openstaand',
      value: `€${data.outstandingInvoices.toLocaleString('nl-NL')}`,
      subtitle: `openstaande facturen`,
      icon: FileText,
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-400',
      trend: null,
      trendUp: false,
    },
    {
      title: 'Te Laat',
      value: `€${data.overdueInvoices.toLocaleString('nl-NL')}`,
      subtitle: `te late facturen`,
      icon: AlertTriangle,
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-400',
      trend: null,
      trendUp: false,
    },
    {
      title: 'Credits',
      value: data.creditsUsedThisMonth.toLocaleString('nl-NL'),
      subtitle: 'gebruikt',
      icon: Coins,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      trend: null,
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={index}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
                {kpi.trend && (
                  <div
                    className={`text-xs font-medium ${
                      kpi.trendUp ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {kpi.trend} {kpi.trendUp ? '↑' : '↓'}
                  </div>
                )}
              </div>
              <p className="text-xs text-zinc-500 mb-1">{kpi.title}</p>
              <p className="text-xl font-bold text-white mb-1">{kpi.value}</p>
              <p className="text-xs text-zinc-600">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
