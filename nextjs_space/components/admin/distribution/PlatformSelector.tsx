'use client';

import { useState } from 'react';
import { PlatformType, PLATFORM_CONFIGS } from '@/lib/types/distribution';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import * as Icons from 'lucide-react';

interface PlatformSelectorProps {
  selectedPlatforms: PlatformType[];
  onChange: (platforms: PlatformType[]) => void;
}

export function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const platforms = Object.values(PLATFORM_CONFIGS);

  const handleToggle = (platform: PlatformType) => {
    if (selectedPlatforms.includes(platform)) {
      onChange(selectedPlatforms.filter(p => p !== platform));
    } else {
      onChange([...selectedPlatforms, platform]);
    }
  };

  const handleSelectAll = () => {
    if (selectedPlatforms.length === platforms.length) {
      onChange([]);
    } else {
      onChange(platforms.map(p => p.platform));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-300">Selecteer Platforms</h3>
        <button
          onClick={handleSelectAll}
          className="text-xs text-[#FF6B35] hover:text-[#FF8555] transition-colors"
        >
          {selectedPlatforms.length === platforms.length ? 'Deselecteer alles' : 'Selecteer alles'}
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map(platform => {
          // Get the icon component
          const IconComponent = (Icons as any)[
            platform.icon.split('-').map((word, i) => 
              i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join('')
          ] || Icons.Share2;

          const isSelected = selectedPlatforms.includes(platform.platform);

          return (
            <div
              key={platform.platform}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                ${isSelected 
                  ? 'bg-zinc-900 border-[#FF6B35] shadow-sm' 
                  : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }
              `}
              onClick={() => handleToggle(platform.platform)}
            >
              <Checkbox
                id={platform.platform}
                checked={isSelected}
                onCheckedChange={() => handleToggle(platform.platform)}
                className="border-zinc-700"
              />
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${platform.color}20` }}
                >
                  <IconComponent 
                    className="w-4 h-4" 
                    style={{ color: platform.color }}
                  />
                </div>
                <Label
                  htmlFor={platform.platform}
                  className="text-sm text-zinc-300 cursor-pointer"
                >
                  {platform.display_name}
                </Label>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlatforms.length > 0 && (
        <div className="text-xs text-zinc-500">
          {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 && 's'} geselecteerd
        </div>
      )}
    </div>
  );
}
