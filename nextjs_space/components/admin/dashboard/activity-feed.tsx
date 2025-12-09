'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, CreditCard, UserPlus, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Activity {
  type: string;
  description: string;
  amount?: number;
  date: string;
  client?: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice_paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'subscription_created':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'new_client':
        return <UserPlus className="w-4 h-4 text-purple-400" />;
      default:
        return <Clock className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: nl });
    } catch {
      return 'onbekend';
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          🕐 Recente Activiteit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {activities.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              Geen recente activiteit
            </div>
          ) : (
            activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-950 hover:bg-zinc-800 transition-colors"
              >
                <div className="mt-0.5">{getIcon(activity.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    {activity.description}
                    {activity.amount && (
                      <span className="text-[#FF6B35] font-medium ml-1">
                        - €{activity.amount.toLocaleString('nl-NL')}
                      </span>
                    )}
                  </p>
                  {activity.client && (
                    <p className="text-xs text-zinc-500 truncate">{activity.client}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">{getTimeAgo(activity.date)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
