'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
}

interface ProgressStatusBarProps {
  steps: ProgressStep[];
  currentStep?: string;
  onComplete?: () => void;
}

export function ProgressStatusBar({ steps, currentStep, onComplete }: ProgressStatusBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    const newProgress = (completedSteps / steps.length) * 100;
    setProgress(newProgress);

    if (newProgress === 100 && onComplete) {
      onComplete();
    }
  }, [steps, onComplete]);

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-500';
      case 'in_progress':
        return 'text-orange-500 font-semibold';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-white">Voortgang</span>
          <span className="text-sm font-medium text-orange-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-orange-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-start space-x-3 p-3 rounded-lg transition-all duration-300 ${
              step.status === 'in_progress'
                ? 'bg-orange-500/10 border border-orange-500/20'
                : 'bg-gray-800/50'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${getStepColor(step)}`}>
                  Stap {index + 1}: {step.label}
                </p>
                {step.status === 'in_progress' && (
                  <span className="text-xs text-orange-400 animate-pulse">Bezig...</span>
                )}
                {step.status === 'completed' && (
                  <span className="text-xs text-green-400">✓ Klaar</span>
                )}
              </div>
              {step.message && (
                <p className="text-xs text-gray-400 mt-1">{step.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {progress === 100 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-500">Voltooid!</p>
            <p className="text-xs text-gray-400">Alle stappen zijn succesvol afgerond.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for managing progress steps
export function useProgressSteps(initialSteps: ProgressStep[]) {
  const [steps, setSteps] = useState<ProgressStep[]>(initialSteps);

  const updateStep = (stepId: string, updates: Partial<ProgressStep>) => {
    setSteps(prev =>
      prev.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    );
  };

  const setStepStatus = (
    stepId: string,
    status: ProgressStep['status'],
    message?: string
  ) => {
    updateStep(stepId, { status, message });
  };

  const resetSteps = () => {
    setSteps(initialSteps.map(step => ({ ...step, status: 'pending', message: undefined })));
  };

  return {
    steps,
    updateStep,
    setStepStatus,
    resetSteps,
  };
}
