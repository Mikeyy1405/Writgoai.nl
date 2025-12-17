
'use client';

import { Search } from 'lucide-react';

interface WebSearchToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function WebSearchToggle({ enabled, onChange }: WebSearchToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors ${
        enabled 
          ? 'border-blue-500 bg-blue-50 text-blue-700' 
          : 'border-slate-700 hover:border-blue-500 hover:bg-blue-50'
      }`}
      title={enabled ? 'Web zoeken uitschakelen' : 'Web zoeken inschakelen'}
    >
      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
      <span className="hidden sm:inline">Web Zoeken</span>
    </button>
  );
}
