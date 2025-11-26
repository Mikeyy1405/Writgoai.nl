
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';

interface TaskStatsProps {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    todayTasks: number;
  };
}

export function TaskStats({ stats }: TaskStatsProps) {
  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  const statItems = [
    {
      title: 'Totaal Taken',
      value: stats.totalTasks,
      icon: Calendar,
      color: 'text-writgo-orange',
      bg: 'bg-zinc-900',
    },
    {
      title: 'Voltooid',
      value: `${stats.completedTasks} (${completionRate}%)`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Vandaag',
      value: stats.todayTasks,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-zinc-900',
    },
    {
      title: 'Overschreden',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => (
        <Card key={item.title} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              {item.title}
            </CardTitle>
            <div className={`${item.bg} ${item.color} p-2 rounded-lg`}>
              <item.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
