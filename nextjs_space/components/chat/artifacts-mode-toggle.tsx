

'use client';

import { FileCode2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ArtifactsModeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function ArtifactsModeToggle({ enabled, onChange }: ArtifactsModeToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <FileCode2 className="h-4 w-4 text-purple-600" />
        <div className="flex flex-col">
          <Label htmlFor="artifacts-mode" className="cursor-pointer text-sm font-medium">
            Artifacts Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Genereer complete projecten en documenten
          </p>
        </div>
      </div>
      <Switch
        id="artifacts-mode"
        checked={enabled}
        onCheckedChange={onChange}
      />
    </div>
  );
}

