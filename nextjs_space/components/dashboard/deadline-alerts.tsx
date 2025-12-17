
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { nl } from 'date-fns/locale';

interface UrgentTask {
  id: string;
  title: string;
  deadline: Date;
  priority: number;
  client: { name: string };
  assignedWriter: { name: string | null } | null;
  status: string;
}

interface DeadlineAlertsProps {
  urgentTasks: UrgentTask[];
}

export function DeadlineAlerts({ urgentTasks }: DeadlineAlertsProps) {
  const getUrgencyLevel = (deadline: Date) => {
    const daysUntil = differenceInDays(deadline, new Date());
    
    if (daysUntil < 0) return { label: 'Overschreden', color: 'destructive' as const };
    if (daysUntil === 0) return { label: 'Vandaag', color: 'destructive' as const };
    if (daysUntil === 1) return { label: 'Morgen', color: 'destructive' as const };
    if (daysUntil <= 3) return { label: `${daysUntil} dagen`, color: 'destructive' as const };
    return { label: `${daysUntil} dagen`, color: 'secondary' as const };
  };

  if (urgentTasks.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="w-5 h-5" />
          <span>Urgente Deadlines</span>
          <Badge variant="destructive" className="ml-2">
            {urgentTasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {urgentTasks.map((task) => {
          const urgency = getUrgencyLevel(new Date(task.deadline));
          
          return (
            <div key={task.id} className="bg-slate-900 rounded-lg p-4 border border-red-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-300 mb-1">
                    {task.title}
                  </h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Client: {task.client.name}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(task.deadline), 'dd MMM yyyy', { locale: nl })}</span>
                    </div>
                    {task.assignedWriter?.name && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{task.assignedWriter.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Badge variant={urgency.color} className="ml-4">
                  {urgency.label}
                </Badge>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
