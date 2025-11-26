
'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PenToolIcon } from 'lucide-react';

interface CanvasModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function CanvasModeToggle({ enabled, onToggle }: CanvasModeToggleProps) {
  return (
    <div className="flex items-center gap-2 p-1.5 sm:p-2 bg-muted/50 rounded-lg">
      <PenToolIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
      <Label htmlFor="canvas-mode" className="text-xs sm:text-sm font-medium cursor-pointer hidden sm:inline">
        Canvas modus
      </Label>
      <Switch
        id="canvas-mode"
        checked={enabled}
        onCheckedChange={onToggle}
        className="scale-75 sm:scale-100"
      />
    </div>
  );
}
