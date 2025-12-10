'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Mail, Euro, FileText, Calendar } from 'lucide-react';

interface KPIData {
  unreadEmails: number;
  mrr: number;
  pendingContent: number;
  scheduledPosts: number;
}

interface CommandCenterKPIsProps {
  data: KPIData;
}

export function CommandCenterKPIs({ data }: CommandCenterKPIsProps) {
  const kpis = [
    {
      title: 'Inbox',
      value: data.unreadEmails,
      subtitle: 'nieuw',
      icon: Mail,
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      emoji: '📧',
    },
    {
      title: 'Financiën',
      value: `€${data.mrr.toLocaleString('nl-NL')}`,
      subtitle: 'MRR',
      icon: Euro,
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      emoji: '💰',
    },
    {
      title: 'Content',
      value: data.pendingContent,
      subtitle: 'concepten',
      icon: FileText,
      iconBg: 'bg-[#FF6B35]/20',
      iconColor: 'text-[#FF6B35]',
      emoji: '📝',
    },
    {
      title: 'Social',
      value: data.scheduledPosts,
      subtitle: 'gepland',
      icon: Calendar,
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      emoji: '📱',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={index}
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${kpi.iconBg}`}>
                  <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <span className="text-3xl">{kpi.emoji}</span>
              </div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">{kpi.title}</h3>
              <p className="text-2xl font-bold text-white mb-1">{kpi.value}</p>
              <p className="text-xs text-zinc-600">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
