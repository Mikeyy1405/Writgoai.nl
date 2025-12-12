'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Circle, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStepProps {
  number: number;
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
  status?: 'idle' | 'active' | 'completed' | 'paused';
  toggle?: React.ReactNode;
  disabled?: boolean;
  showConnector?: boolean;
  stats?: {
    label: string;
    value: string | number;
  }[];
}

export function PipelineStep({
  number,
  title,
  description,
  action,
  onClick,
  status = 'idle',
  toggle,
  disabled = false,
  showConnector = true,
  stats,
}: PipelineStepProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'active':
        return <Loader2 className="w-6 h-6 text-orange-400 animate-spin" />;
      case 'paused':
        return <Pause className="w-6 h-6 text-yellow-400" />;
      default:
        return <Circle className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'border-green-500/50 bg-green-500/10';
      case 'active':
        return 'border-orange-500/50 bg-orange-500/10';
      case 'paused':
        return 'border-yellow-500/50 bg-yellow-500/10';
      default:
        return 'border-zinc-700 bg-zinc-800/50';
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          'relative border rounded-xl p-6 transition-all duration-300',
          getStatusColor(),
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Step Number & Icon */}
          <div className="md:col-span-2 flex items-start gap-4 md:flex-col md:items-center">
            {/* Step Number Badge */}
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2',
                status === 'completed' && 'bg-green-500/20 border-green-500 text-green-300',
                status === 'active' && 'bg-orange-500/20 border-orange-500 text-orange-300',
                status === 'paused' && 'bg-yellow-500/20 border-yellow-500 text-yellow-300',
                status === 'idle' && 'bg-zinc-800 border-zinc-700 text-gray-400'
              )}
            >
              {number}
            </div>

            {/* Status Icon */}
            <div className="flex-shrink-0">{getStatusIcon()}</div>
          </div>

          {/* Middle: Content */}
          <div className="md:col-span-7 space-y-3">
            {/* Title & Description */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="flex flex-wrap gap-4 pt-2">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{stat.label}:</span>
                    <span className="text-sm font-semibold text-white">{stat.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Status Text */}
            {status === 'active' && (
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Bezig met verwerken...</span>
              </div>
            )}
            {status === 'completed' && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Voltooid</span>
              </div>
            )}
            {status === 'paused' && (
              <div className="flex items-center gap-2 text-sm text-yellow-400">
                <Pause className="w-4 h-4" />
                <span>Gepauzeerd</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="md:col-span-3 flex flex-col gap-3">
            {/* Action Button */}
            {action && onClick && (
              <Button
                onClick={onClick}
                disabled={disabled}
                size="lg"
                className={cn(
                  'w-full h-12 text-base font-semibold',
                  status === 'idle' && 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
                  status === 'active' && 'bg-gradient-to-r from-orange-500 to-orange-600 opacity-50 cursor-not-allowed',
                  status === 'completed' && 'bg-green-600 hover:bg-green-700'
                )}
              >
                {status === 'active' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    {action}
                  </>
                )}
              </Button>
            )}

            {/* Toggle */}
            {toggle && <div className="w-full">{toggle}</div>}
          </div>
        </div>
      </div>

      {/* Connector Line to Next Step */}
      {showConnector && (
        <div className="flex justify-center py-4">
          <div className="w-0.5 h-8 bg-gradient-to-b from-zinc-700 to-transparent" />
        </div>
      )}
    </div>
  );
}

// Pipeline Container Component
export function PipelineContainer({
  children,
  title,
  description,
  icon,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        {icon && <div className="flex-shrink-0 mt-1">{icon}</div>}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0">{children}</div>
    </div>
  );
}
