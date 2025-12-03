
'use client';

import { useState } from 'react';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import { AVAILABLE_MODELS, type ModelId } from '@/lib/aiml-chat-models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface ModelSelectorProps {
  selectedModel: ModelId;
  onModelChange: (model: ModelId) => void;
  className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  // Group models by provider
  const groupedModels = AVAILABLE_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, Array<typeof AVAILABLE_MODELS[number]>>);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={className}>
          <Sparkles className="mr-2 h-4 w-4" />
          <span className="font-medium truncate">{currentModel.name}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[min(400px,90vw)] max-h-[60vh] overflow-y-auto">
        <DropdownMenuLabel>Selecteer AI Model</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(groupedModels).map(([provider, models]) => (
          <div key={provider}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {provider}
            </DropdownMenuLabel>
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className="flex items-start gap-2 cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{model.name}</span>
                    {model.id === selectedModel && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {model.description}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
