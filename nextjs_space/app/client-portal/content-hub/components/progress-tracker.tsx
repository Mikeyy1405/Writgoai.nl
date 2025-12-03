'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Clock } from 'lucide-react';

interface ProgressPhase {
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress?: number;
}

interface ProgressTrackerProps {
  phases: ProgressPhase[];
  overallProgress: number;
}

export default function ProgressTracker({ phases, overallProgress }: ProgressTrackerProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Overall Progress</span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div className="space-y-2">
        {phases.map((phase, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
            {getStatusIcon(phase.status)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{phase.name}</span>
                <Badge variant="outline" className="text-xs">
                  {phase.status}
                </Badge>
              </div>
              {phase.progress !== undefined && (
                <Progress value={phase.progress} className="h-1 mt-2" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
