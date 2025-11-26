
'use client';

import { MessageSquare } from 'lucide-react';
import { getModelContextWindow, type ModelId } from '@/lib/aiml-chat-models';

interface ContextIndicatorProps {
  messageCount: number;
  estimatedTokens: number;
  modelId?: ModelId;
}

export function ContextIndicator({ messageCount, estimatedTokens, modelId }: ContextIndicatorProps) {
  const maxTokens = modelId ? getModelContextWindow(modelId) : 128000;
  const percentage = Math.min((estimatedTokens / maxTokens) * 100, 100);
  
  const getColor = () => {
    if (percentage < 50) return 'text-green-600 bg-green-50';
    if (percentage < 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className={`flex items-center gap-1 sm:gap-2 px-1.5 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg ${getColor()}`}>
      <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="hidden sm:inline whitespace-nowrap">
        {messageCount} • {Math.round(percentage)}%
      </span>
      <span className="sm:hidden text-[10px]">
        {messageCount} • {Math.round(percentage)}%
      </span>
    </div>
  );
}
