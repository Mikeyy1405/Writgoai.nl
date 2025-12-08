'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, PenTool, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProgressTrackerProps {
  progress: {
    phase: 'research' | 'outline' | 'writing' | 'optimization' | 'complete';
    progress: number;
    message: string;
    currentStep: string;
  };
}

export default function ProgressTracker({ progress }: ProgressTrackerProps) {
  const phases = [
    { id: 'research', label: 'Research', icon: Search },
    { id: 'outline', label: 'Outline', icon: FileText },
    { id: 'writing', label: 'Schrijven', icon: PenTool },
    { id: 'optimization', label: 'Optimalisatie', icon: Sparkles },
    { id: 'complete', label: 'Klaar', icon: CheckCircle2 },
  ];

  const getCurrentPhaseIndex = () => {
    return phases.findIndex((p) => p.id === progress.phase);
  };

  const currentPhaseIndex = getCurrentPhaseIndex();

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6">
        {/* Phase Indicators */}
        <div className="flex items-center justify-between mb-6">
          {phases.map((phase, index) => {
            const Icon = phase.icon;
            const isActive = index === currentPhaseIndex;
            const isCompleted = index < currentPhaseIndex;
            const isPending = index > currentPhaseIndex;

            return (
              <div key={phase.id} className="flex-1">
                <div className="flex items-center">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-green-500/20 border-2 border-green-500'
                        : isActive
                        ? 'bg-[#ff6b35] border-2 border-[#ff6b35] animate-pulse'
                        : 'bg-zinc-800 border-2 border-zinc-700'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCompleted
                          ? 'text-green-500'
                          : isActive
                          ? 'text-white'
                          : 'text-zinc-500'
                      }`}
                    />
                  </div>

                  {/* Connector Line */}
                  {index < phases.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-zinc-700'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive ? 'text-white' : isPending ? 'text-zinc-500' : 'text-green-500'
                    }`}
                  >
                    {phase.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{progress.message}</span>
            <Badge variant="outline" className="bg-zinc-800 text-zinc-300 border-zinc-700">
              {progress.progress}%
            </Badge>
          </div>
          <Progress value={progress.progress} className="h-2" />
          {progress.currentStep && (
            <p className="text-sm text-zinc-400">{progress.currentStep}</p>
          )}
        </div>

        {/* Animation */}
        {progress.phase !== 'complete' && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-[#ff6b35] rounded-full animate-bounce"
                  style={{
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
