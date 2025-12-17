
'use client';

import { useState } from 'react';
import { Brain, Zap, Sparkles } from 'lucide-react';
import { ReasoningMode, REASONING_MODES } from '@/lib/chat-settings';

interface ReasoningModeSelectorProps {
  value: ReasoningMode;
  onChange: (mode: ReasoningMode) => void;
}

export function ReasoningModeSelector({ value, onChange }: ReasoningModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (mode: ReasoningMode) => {
    switch (mode) {
      case 'instant':
        return <Zap className="w-4 h-4" />;
      case 'thinking':
        return <Brain className="w-4 h-4" />;
      case 'auto':
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        title="Kies reasoning mode"
      >
        {getIcon(value)}
        <span className="hidden sm:inline">{REASONING_MODES[value].label}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 w-64 bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-2">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2">
              Reasoning Mode
            </div>
            {(Object.keys(REASONING_MODES) as ReasoningMode[]).map((key) => {
              const mode = REASONING_MODES[key];
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors flex items-center gap-3 ${
                    value === key ? 'bg-blue-50' : ''
                  }`}
                >
                  {getIcon(key)}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{mode.label}</div>
                    <p className="text-xs text-gray-600">{mode.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
