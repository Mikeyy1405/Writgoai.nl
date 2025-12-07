'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Loader2, 
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';
import { GenerationPhase } from '@/lib/content-hub/generation-types';

interface InlineGenerationStatusProps {
  progress: number;
  phases: GenerationPhase[];
  onCancel?: () => void;
  generating: boolean;
}

export default function InlineGenerationStatus({ 
  progress, 
  phases, 
  onCancel, 
  generating 
}: InlineGenerationStatusProps) {
  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const currentPhase = phases.find(p => p.status === 'in-progress');

  return (
    <div className="border-t pt-3 mt-3 space-y-3 bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-lg">
      {/* Overall Progress Bar with Cancel Button */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-900 dark:text-gray-100">Overall Progress</span>
            <span className="text-gray-700 dark:text-gray-300 font-semibold">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {generating && onCancel && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onCancel}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Current Phase Indicator */}
      {currentPhase && (
        <div className="flex items-center gap-2 text-sm">
          {getPhaseIcon(currentPhase.status)}
          <span className="font-medium text-gray-900 dark:text-gray-100">{currentPhase.name}</span>
          {currentPhase.message && (
            <span className="text-gray-700 dark:text-gray-300">- {currentPhase.message}</span>
          )}
        </div>
      )}

      {/* Compact Phases List */}
      <div className="flex flex-wrap gap-2">
        {phases.map((phase, index) => (
          <div 
            key={`${index}-${phase.name}`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${
              phase.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700' :
              phase.status === 'completed' ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700' :
              phase.status === 'failed' ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700' :
              'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700'
            }`}
          >
            {getPhaseIcon(phase.status)}
            <span className="font-medium">{phase.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
