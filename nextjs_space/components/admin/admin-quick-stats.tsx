'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, TrendingUp, DollarSign, Package, MessageSquare } from 'lucide-react';

interface StatsData {
  totalClients: number;
  activeSubscriptions: number;
  creditsUsedThisMonth: number;
  revenueThisMonth: number;
  unreadMessages: number;
  unreadSupport: number;
}

interface AdminQuickStatsProps {
  stats: StatsData;
}

export function AdminQuickStats({ stats }: AdminQuickStatsProps) {
  const statsCards = [
    {
      title: 'Totaal Klanten',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      title: 'Actieve Abonnementen',
      value: stats.activeSubscriptions,
      icon: CreditCard,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      title: 'Credits Gebruikt',
      value: stats.creditsUsedThisMonth.toLocaleString(),
      subtitle: 'Deze maand',
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      title: 'Omzet Deze Maand',
      value: `€${stats.revenueThisMonth.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
    },
    {
      title: 'Openstaande Opdrachten',
      value: '-',
      subtitle: 'Binnenkort beschikbaar',
      icon: Package,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
    },
    {
      title: 'Ongelezen Berichten',
      value: stats.unreadMessages + stats.unreadSupport,
      icon: MessageSquare,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
