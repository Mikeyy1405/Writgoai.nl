
'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';

interface TemperatureSliderProps {
  value: number;
  onChange: (temperature: number) => void;
}

export function TemperatureSlider({ value, onChange }: TemperatureSliderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getLabel = (temp: number) => {
    if (temp <= 0.3) return 'Precies';
    if (temp <= 0.6) return 'Uitgebalanceerd';
    if (temp <= 0.8) return 'Creatief';
    return 'Zeer Creatief';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
        title="Pas creativiteit aan"
      >
        <Flame className="w-4 h-4" />
        <span className="hidden sm:inline">{getLabel(value)}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 z-50 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Creativiteit</span>
              <span className="text-blue-600">{getLabel(value)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>Precies (0.0)</span>
              <span>Creatief (1.0)</span>
            </div>
            <div className="text-xs text-gray-500 mt-3">
              Hogere waarden maken antwoorden creatiever en gevarieerder.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
