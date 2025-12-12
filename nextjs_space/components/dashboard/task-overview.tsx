
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Building2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  deadline: Date;
  priority: number;
  status: string;
  estimatedHours: number;
  client: { name: string };
  assignedWriter: { name: string | null } | null;
}

interface TaskOverviewProps {
  tasks: Task[];
}

const statusLabels: { [key: string]: { label: string; color: string } } = {
  'NOT_STARTED': { label: 'Te starten', color: 'bg-gray-500' },
  'ASSIGNED': { label: 'Toegewezen', color: 'bg-zinc-9000' },
  'IN_PROGRESS': { label: 'Bezig', color: 'bg-zinc-9000' },
  'REVIEW': { label: 'Review', color: 'bg-writgo-orange' },
  'SHARED_WITH_CLIENT': { label: 'Bij client', color: 'bg-writgo-orange' },
  'FEEDBACK': { label: 'Feedback', color: 'bg-yellow-500' },
  'COMPLETED': { label: 'Voltooid', color: 'bg-green-500' },
};

export function TaskOverview({ tasks }: TaskOverviewProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Belangrijke Taken</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/tasks">
            Alle taken
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            Geen taken gevonden
          </p>
        ) : (
          tasks.map((task) => {
            const status = statusLabels[task.status] || statusLabels['NOT_STARTED'];
            
            return (
              <div key={task.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-700 flex-1 pr-4">
                    {task.title}
                  </h4>
                  <Badge 
                    className={`${status.color} text-white text-xs px-2 py-1 rounded-full`}
                  >
                    {status.label}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>{task.client.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(task.deadline), 'dd MMM', { locale: nl })}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{task.assignedWriter?.name || 'Niet toegewezen'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Geschat: {task.estimatedHours}h • Prioriteit: {task.priority.toFixed(1)}
                  </div>
                  <Button variant="ghost" size="sm" className="text-writgo-orange hover:text-blue-700">
                    Bekijken
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
