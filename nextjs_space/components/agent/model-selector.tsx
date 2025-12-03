/**
 * Model Selector Component
 * Dropdown to select AI model with categorization and info
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  quality: number;
  speed: string;
  costPer1kInput: number;
  costPer1kOutput: number;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (modelId: string) => void;
  category?: string;
  className?: string;
}

export function ModelSelector({
  value,
  onChange,
  category,
  className,
}: ModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);

  // Fetch models
  useEffect(() => {
    async function fetchModels() {
      try {
        const url = category
          ? `/api/agent/models?category=${category}`
          : '/api/agent/models';
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch models');
        
        const data = await response.json();
        setModels(data.models || []);
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, [category]);

  // Update selected model when value changes
  useEffect(() => {
    if (value && models.length > 0) {
      const model = models.find(m => m.id === value);
      setSelectedModel(model || null);
    }
  }, [value, models]);

  // Group models by category
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.category]) {
      acc[model.category] = [];
    }
    acc[model.category].push(model);
    return acc;
  }, {} as Record<string, AIModel[]>);

  // Category labels
  const categoryLabels: Record<string, string> = {
    chat: 'Chat / LLM',
    code: 'Code',
    image: 'Afbeeldingen',
    video: "Video's",
    voice: 'Voice / TTS',
    audio: 'Audio',
    embedding: 'Embeddings',
    moderation: 'Moderatie',
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Modellen laden...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecteer een model" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedModels).map(([cat, catModels]) => (
              <SelectGroup key={cat}>
                <SelectLabel>{categoryLabels[cat] || cat}</SelectLabel>
                {catModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-zinc-500">
                        {model.provider}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {/* Model Info Tooltip */}
        {selectedModel && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-zinc-800 rounded">
                  <Info className="w-4 h-4 text-zinc-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-sm">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-white">
                      {selectedModel.name}
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {selectedModel.provider}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {selectedModel.description}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700">
                    <div>
                      <p className="text-xs text-zinc-500">Kwaliteit</p>
                      <p className="text-sm font-medium">
                        {selectedModel.quality}/5
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Snelheid</p>
                      <p className="text-sm font-medium capitalize">
                        {selectedModel.speed}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Input</p>
                      <p className="text-sm font-medium">
                        ${selectedModel.costPer1kInput.toFixed(2)}/1k
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Output</p>
                      <p className="text-sm font-medium">
                        ${selectedModel.costPer1kOutput.toFixed(2)}/1k
                      </p>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
