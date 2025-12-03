/**
 * Tool Execution Component
 * Displays tool execution progress and results
 */

'use client';

import { useState } from 'react';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolCall {
  id: string;
  name: string;
  parameters: any;
  result?: {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  };
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface ToolExecutionProps {
  toolCall: ToolCall;
  className?: string;
}

export function ToolExecution({ toolCall, className }: ToolExecutionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { name, parameters, result, status } = toolCall;

  // Format tool name for display
  const displayName = name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div
      className={cn(
        'border border-zinc-800 rounded-lg p-3 bg-zinc-900/30',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {status === 'pending' && (
            <Zap className="w-4 h-4 text-zinc-400" />
          )}
          {status === 'executing' && (
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          )}
          {status === 'failed' && (
            <XCircle className="w-4 h-4 text-red-400" />
          )}
        </div>

        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">
              {displayName}
            </span>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full',
                status === 'pending' && 'bg-zinc-800 text-zinc-400',
                status === 'executing' && 'bg-blue-900/50 text-blue-400',
                status === 'completed' && 'bg-green-900/50 text-green-400',
                status === 'failed' && 'bg-red-900/50 text-red-400'
              )}
            >
              {status === 'pending' && 'Wachten'}
              {status === 'executing' && 'Uitvoeren...'}
              {status === 'completed' && 'Voltooid'}
              {status === 'failed' && 'Mislukt'}
            </span>
          </div>

          {/* Result Message */}
          {result?.message && (
            <p className="text-xs text-zinc-400 mt-1">{result.message}</p>
          )}

          {/* Error Message */}
          {result?.error && (
            <p className="text-xs text-red-400 mt-1">{result.error}</p>
          )}
        </div>

        {/* Expand Button */}
        {(status === 'completed' || status === 'failed') && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-1 hover:bg-zinc-800 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
          </button>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
          {/* Parameters */}
          <div>
            <div className="text-xs font-medium text-zinc-400 mb-1">
              Parameters:
            </div>
            <pre className="text-xs text-zinc-300 bg-zinc-800/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(parameters, null, 2)}
            </pre>
          </div>

          {/* Result Data */}
          {result?.data && (
            <div>
              <div className="text-xs font-medium text-zinc-400 mb-1">
                Result:
              </div>
              <pre className="text-xs text-zinc-300 bg-zinc-800/50 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
