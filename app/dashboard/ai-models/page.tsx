'use client';

import { useState } from 'react';
import ModelSelector from '@/components/ModelSelector';
import { BEST_MODELS, AVAILABLE_TEXT_MODELS } from '@/lib/ai-models';

export default function AIModelsPage() {
  const [selectedModel, setSelectedModel] = useState(BEST_MODELS.ROUTING);

  const currentModel = AVAILABLE_TEXT_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Model Selector</h1>
              <p className="text-gray-400">Kies het perfecte AI model voor jouw taak</p>
            </div>
          </div>

          {/* Abacus.AI Banner */}
          <div className="bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Powered by Abacus.AI RouteLLM
                </h3>
                <p className="text-gray-300 mb-3">
                  Toegang tot <strong>500+ AI modellen</strong> via één unified API met automatische routing voor optimale kwaliteit en kosten.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-green-400 font-bold text-lg">7+</div>
                    <div className="text-gray-400 text-sm">Unlimited Modellen</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-blue-400 font-bold text-lg">$10</div>
                    <div className="text-gray-400 text-sm">Per maand</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-orange-400 font-bold text-lg">500+</div>
                    <div className="text-gray-400 text-sm">Beschikbare Models</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <div className="text-purple-400 font-bold text-lg">87%</div>
                    <div className="text-gray-400 text-sm">Kostenbesparing</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Model Selector - Larger column */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
          </div>

          {/* Current Selection Info */}
          <div className="space-y-6">
            {/* Selected Model Card */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-orange-900/20 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🎯</span>
                Geselecteerd Model
              </h3>

              {currentModel ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-bold text-white">
                        {currentModel.name}
                      </h4>
                      {currentModel.unlimited && (
                        <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full">
                          ∞ UNLIMITED
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {currentModel.developer}
                    </p>
                    <p className="text-gray-300 text-sm">
                      {currentModel.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Context</div>
                      <div className="text-white font-bold">
                        {(currentModel.contextLength / 1000).toFixed(0)}K tokens
                      </div>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Kosten</div>
                      <div className="text-white font-bold">
                        {currentModel.unlimited ? 'Unlimited' : 'Per gebruik'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Geen model geselecteerd</p>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedModel(BEST_MODELS.ROUTING)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium transition-all"
                >
                  🎯 Auto Route (Aanbevolen)
                </button>
                <button
                  onClick={() => setSelectedModel(BEST_MODELS.FLASH)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all"
                >
                  🚀 Flash (1M Context)
                </button>
                <button
                  onClick={() => setSelectedModel(BEST_MODELS.QUICK)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-medium transition-all"
                >
                  ⚡ Quick (GPT-5 Mini)
                </button>
                <button
                  onClick={() => setSelectedModel(BEST_MODELS.CONTENT)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all"
                >
                  ✨ Premium (Claude)
                </button>
              </div>
            </div>

            {/* Documentation Links */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📚</span>
                Documentatie
              </h3>
              <div className="space-y-2 text-sm">
                <a
                  href="/ABACUS_AI_EXTRA_FEATURES.md"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 bg-black/30 hover:bg-black/50 rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  <span>Abacus.AI Features</span>
                  <span>→</span>
                </a>
                <a
                  href="/MIGRATION_AIML_TO_ABACUS.md"
                  target="_blank"
                  className="flex items-center justify-between px-3 py-2 bg-black/30 hover:bg-black/50 rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  <span>Migratie Gids</span>
                  <span>→</span>
                </a>
                <a
                  href="https://abacus.ai/help/api/ref"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-black/30 hover:bg-black/50 rounded-lg text-gray-300 hover:text-white transition-all"
                >
                  <span>API Documentatie</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
