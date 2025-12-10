'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Euro, Calendar, Mail, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function QuickActionsWidget() {
  const router = useRouter();

  const actions = [
    {
      icon: Sparkles,
      label: '🚀 1-Klik Generator',
      onClick: () => router.push('/admin/blog/auto-generate'),
      color: 'text-orange-400',
      bg: 'bg-orange-500/20',
    },
    {
      icon: FileText,
      label: 'Nieuwe Blog',
      onClick: () => router.push('/admin/blog/editor'),
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
    },
    {
      icon: Euro,
      label: 'Factuur Versturen',
      onClick: () => router.push('/admin/financien/facturen'),
      color: 'text-green-400',
      bg: 'bg-green-500/20',
    },
    {
      icon: Calendar,
      label: 'Social Post',
      onClick: () => router.push('/admin/content'),
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
    },
    {
      icon: Mail,
      label: 'Email Beantwoorden',
      onClick: () => router.push('/admin/emails'),
      color: 'text-[#FF6B35]',
      bg: 'bg-[#FF6B35]/20',
    },
  ];

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          ⚡ Snelle Acties
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.onClick}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg ${action.bg} hover:opacity-80 transition-opacity`}
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-xs text-white text-center">{action.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
