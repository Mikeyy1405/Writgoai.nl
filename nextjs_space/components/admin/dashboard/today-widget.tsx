'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertCircle, RefreshCw, Euro, Sparkles } from 'lucide-react';

interface TodayData {
  invoicesToSend: number;
  overdueInvoices: number;
  subscriptionsRenewing: number;
  revenueToday: number;
  contentGenerated: number;
}

interface TodayWidgetProps {
  data: TodayData;
}

export function TodayWidget({ data }: TodayWidgetProps) {
  const items = [
    {
      icon: FileText,
      label: 'Facturen te versturen',
      value: data.invoicesToSend,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: AlertCircle,
      label: 'Facturen te laat',
      value: data.overdueInvoices,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      highlight: data.overdueInvoices > 0,
    },
    {
      icon: Euro,
      label: 'Omzet vandaag',
      value: `€${data.revenueToday.toLocaleString('nl-NL')}`,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      icon: Sparkles,
      label: 'Content gegenereerd',
      value: data.contentGenerated,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          📅 Vandaag
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  item.highlight ? 'bg-red-500/10 border border-red-500/20' : 'bg-zinc-950'
                } transition-colors`}
              >
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-zinc-500">{item.label}</p>
                  <p className="text-lg font-bold text-white">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
