'use client';

import { useState, useEffect } from 'react';
import { AVAILABLE_TEXT_MODELS, BEST_MODELS, type TextModel } from '@/lib/ai-models';

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  task?: 'content' | 'technical' | 'quick' | 'budget';
  showUnlimitedOnly?: boolean;
  compact?: boolean;
}

export default function ModelSelector({
  selectedModel,
  onModelChange,
  task = 'content',
  showUnlimitedOnly = false,
  compact = false,
}: ModelSelectorProps) {
  const [selected, setSelected] = useState(selectedModel || BEST_MODELS.CONTENT);
  const [filterUnlimited, setFilterUnlimited] = useState(showUnlimitedOnly);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (selectedModel) {
      setSelected(selectedModel);
    }
  }, [selectedModel]);

  const handleModelChange = (modelId: string) => {
    setSelected(modelId);
    onModelChange?.(modelId);
  };

  // Filter models
  const filteredModels = AVAILABLE_TEXT_MODELS.filter((model) => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.developer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filterUnlimited || model.unlimited;
    return matchesSearch && matchesFilter;
  });

  // Group models
  const unlimitedModels = filteredModels.filter((m) => m.unlimited);
  const recommendedModels = filteredModels.filter((m) => m.recommended && !m.unlimited);
  const otherModels = filteredModels.filter((m) => !m.recommended && !m.unlimited);

  const ModelCard = ({ model }: { model: TextModel }) => {
    const isSelected = selected === model.id;

    return (
      <button
        onClick={() => handleModelChange(model.id)}
        className={`
          w-full text-left p-3 rounded-lg border transition-all
          ${isSelected
            ? 'border-orange-500 bg-orange-500/20 ring-2 ring-orange-500/50'
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
          }
          ${compact ? 'p-2' : 'p-3'}
        `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold text-white truncate ${compact ? 'text-sm' : 'text-base'}`}>
                {model.name}
              </h4>
              {model.unlimited && (
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full whitespace-nowrap">
                  ∞ UNLIMITED
                </span>
              )}
              {model.recommended && !model.unlimited && (
                <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full whitespace-nowrap">
                  ⭐ AANBEVOLEN
                </span>
              )}
            </div>
            <p className={`text-gray-400 mb-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {model.developer} • {(model.contextLength / 1000).toFixed(0)}K context
            </p>
            {!compact && (
              <p className="text-xs text-gray-500 line-clamp-2">
                {model.description}
              </p>
            )}
          </div>
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </button>
    );
  };

  // Quick selector buttons
  const QuickButtons = () => (
    <div className="grid grid-cols-2 gap-2 mb-4">
      <button
        onClick={() => handleModelChange(BEST_MODELS.ROUTING)}
        className={`
          px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${selected === BEST_MODELS.ROUTING
            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
          }
        `}
      >
        <span className="text-base mr-1">🎯</span> Auto Route
      </button>
      <button
        onClick={() => handleModelChange(BEST_MODELS.QUICK)}
        className={`
          px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${selected === BEST_MODELS.QUICK
            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
          }
        `}
      >
        <span className="text-base mr-1">⚡</span> Quick
      </button>
      <button
        onClick={() => handleModelChange(BEST_MODELS.FLASH)}
        className={`
          px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${selected === BEST_MODELS.FLASH
            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
          }
        `}
      >
        <span className="text-base mr-1">🚀</span> Flash (1M)
      </button>
      <button
        onClick={() => handleModelChange(BEST_MODELS.BUDGET)}
        className={`
          px-3 py-2 rounded-lg border text-sm font-medium transition-all
          ${selected === BEST_MODELS.BUDGET
            ? 'border-orange-500 bg-orange-500/20 text-orange-400'
            : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600 hover:text-white'
          }
        `}
      >
        <span className="text-base mr-1">🔓</span> Budget
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">AI Model Selectie</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {filteredModels.length} modellen
          </span>
        </div>
      </div>

      {/* Quick Selector */}
      {!compact && <QuickButtons />}

      {/* Search & Filter */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Zoek modellen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={filterUnlimited}
            onChange={(e) => setFilterUnlimited(e.target.checked)}
            className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500"
          />
          <span>Alleen unlimited modellen tonen</span>
          <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full">
            ∞
          </span>
        </label>
      </div>

      {/* Model Groups */}
      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {/* Unlimited Models */}
        {unlimitedModels.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">
                ⚡ Unlimited Modellen
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-green-500/50 to-transparent" />
            </div>
            {unlimitedModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {/* Recommended Models */}
        {recommendedModels.length > 0 && !filterUnlimited && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-orange-400 uppercase tracking-wide">
                ⭐ Aanbevolen
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-orange-500/50 to-transparent" />
            </div>
            {recommendedModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {/* Other Models */}
        {otherModels.length > 0 && !filterUnlimited && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Alle Modellen
              </h4>
              <div className="h-px flex-1 bg-gradient-to-r from-gray-600/50 to-transparent" />
            </div>
            {otherModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}

        {/* No results */}
        {filteredModels.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Geen modellen gevonden</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterUnlimited(false);
              }}
              className="mt-2 text-sm text-orange-400 hover:text-orange-300"
            >
              Filters wissen
            </button>
          </div>
        )}
      </div>

      {/* Info Footer */}
      {!compact && (
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-blue-400 text-lg">💡</span>
            <div className="flex-1 text-xs text-blue-300">
              <p className="font-semibold mb-1">Tips:</p>
              <ul className="space-y-1 text-blue-200/80">
                <li>• <strong>RouteLLM Auto</strong> - Kiest automatisch het beste model</li>
                <li>• <strong>Unlimited modellen</strong> - Geen limieten voor $10/maand</li>
                <li>• <strong>Flash (1M context)</strong> - Perfect voor lange artikelen</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
