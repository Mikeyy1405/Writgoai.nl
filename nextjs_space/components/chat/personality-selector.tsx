
'use client';

import { useState } from 'react';
import { Check, Settings2 } from 'lucide-react';
import { PersonalityPreset, PERSONALITY_PRESETS } from '@/lib/chat-settings';

interface PersonalitySelectorProps {
  value: PersonalityPreset;
  onChange: (personality: PersonalityPreset) => void;
}

export function PersonalitySelector({ value, onChange }: PersonalitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-700 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        title="Kies persoonlijkheid"
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">
          {PERSONALITY_PRESETS[value].icon} {PERSONALITY_PRESETS[value].label}
        </span>
        <span className="sm:hidden">
          {PERSONALITY_PRESETS[value].icon}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-slate-900 rounded-lg shadow-lg border border-slate-700 p-2 max-h-[60vh] overflow-y-auto">
            <div className="text-xs font-semibold text-gray-500 px-3 py-2">
              Persoonlijkheid
            </div>
            {(Object.keys(PERSONALITY_PRESETS) as PersonalityPreset[]).map((key) => {
              const preset = PERSONALITY_PRESETS[key];
              return (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors flex items-start gap-3 ${
                    value === key ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-2xl flex-shrink-0 mt-1">{preset.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{preset.label}</span>
                      {value === key && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{preset.description}</p>
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
