
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { User, Clock, CheckCircle } from 'lucide-react';

interface Writer {
  id: string;
  name: string | null;
  capacityHoursPerWeek: number;
  currentWorkloadHours: number;
  specializations: string[];
  assignedTasks: Array<{ status: string; estimatedHours: number }>;
}

interface WriterWorkloadProps {
  writers: Writer[];
}

export function WriterWorkload({ writers }: WriterWorkloadProps) {
  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getWorkloadBadgeColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'destructive';
    if (percentage >= 50) return 'secondary';
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Writer Werklast</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {writers.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            Geen writers gevonden
          </p>
        ) : (
          writers.map((writer) => {
            const workloadPercentage = writer.capacityHoursPerWeek > 0 
              ? Math.round((writer.currentWorkloadHours / writer.capacityHoursPerWeek) * 100)
              : 0;
            
            const activeTasks = writer.assignedTasks.filter(
              task => ['NOT_STARTED', 'ASSIGNED', 'IN_PROGRESS'].includes(task.status)
            ).length;

            return (
              <div key={writer.id} className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-300">{writer.name || 'Onbekende writer'}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{writer.currentWorkloadHours}h / {writer.capacityHoursPerWeek}h</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>{activeTasks} taken</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getWorkloadBadgeColor(workloadPercentage)}>
                    {workloadPercentage}%
                  </Badge>
                </div>

                <Progress 
                  value={workloadPercentage} 
                  className="h-2 mb-3"
                />

                {writer.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {writer.specializations.map((spec) => (
                      <Badge 
                        key={spec} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
