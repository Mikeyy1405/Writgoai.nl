'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

interface GeneratedVideo {
  url: string;
  duration: number;
  aspectRatio: string;
}

type VideoModel = 'luma/dream-machine' | 'runway/gen-3' | 'pika/pika-2.0';

interface VideoModelConfig {
  id: VideoModel;
  name: string;
  description: string;
  credits: number;
  maxDuration: number;
}

const VIDEO_MODELS: VideoModelConfig[] = [
  {
    id: 'luma/dream-machine',
    name: 'Luma Dream Machine',
    description: 'High-quality cinematic video generation with smooth motion',
    credits: 10,
    maxDuration: 10,
  },
  {
    id: 'runway/gen-3',
    name: 'Runway Gen-3',
    description: 'State-of-the-art video generation with excellent consistency',
    credits: 15,
    maxDuration: 10,
  },
  {
    id: 'pika/pika-2.0',
    name: 'Pika 2.0',
    description: 'Fast and creative video generation with artistic styles',
    credits: 8,
    maxDuration: 15,
  },
];

export default function VideoStudioPage() {
  const [selectedModel, setSelectedModel] = useState<VideoModel>('luma/dream-machine');
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);

  const selectedModelConfig = VIDEO_MODELS.find(m => m.id === selectedModel);
  const estimatedCredits = selectedModelConfig?.credits || 0;

  useEffect(() => {
    loadCreditBalance();
  }, []);

  const loadCreditBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCreditBalance(data.credits);
      }
    } catch (error) {
      console.error('Error loading credit balance:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Voer een prompt in');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedVideo(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Je moet ingelogd zijn om video\'s te genereren');
        return;
      }

      const response = await fetch('/api/video-studio/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt.trim(),
          duration,
          aspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Video generatie mislukt');
        return;
      }

      setGeneratedVideo({
        url: data.url,
        duration,
        aspectRatio,
      });
      await loadCreditBalance();

    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Er is een fout opgetreden');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;

    try {
      const response = await fetch(generatedVideo.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-studio-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Video Studio
          </h1>
          <p className="text-gray-400">
            Genereer AI video's met de nieuwste modellen
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Credits: </span>
              <span className="text-purple-500 font-bold">{creditBalance}</span>
            </div>
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <span className="text-gray-400">Kosten: </span>
              <span className="text-green-500 font-bold">{estimatedCredits} credits</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Model</h2>

              <div className="space-y-3">
                {VIDEO_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedModel === model.id
                        ? 'bg-purple-500/20 border-2 border-purple-500'
                        : 'bg-gray-900 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold">{model.name}</span>
                      <span className="text-sm text-purple-400">{model.credits} credits</span>
                    </div>
                    <p className="text-sm text-gray-400">{model.description}</p>
                    <p className="text-xs text-gray-500 mt-1">Max {model.maxDuration}s video</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Prompt</h2>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Beschrijf de video die je wilt genereren..."
                className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Cinematic drone shot over mountains',
                  'Abstract colorful particles',
                  'Professional office environment',
                  'Nature timelapse sunset',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setPrompt(suggestion)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300"
                  >
                    {suggestion.slice(0, 25)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Video Options */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Video Opties</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Duur: {duration} seconden
                  </label>
                  <input
                    type="range"
                    min="3"
                    max={selectedModelConfig?.maxDuration || 10}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          aspectRatio === ratio
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Landscape</span>
                    <span>Portrait</span>
                    <span>Square</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || creditBalance < estimatedCredits}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">...</span>
                  Video genereren...
                </span>
              ) : (
                `Genereer Video (${estimatedCredits} credits)`
              )}
            </button>

            {creditBalance < estimatedCredits && (
              <p className="text-red-500 text-sm text-center">
                Onvoldoende credits. Je hebt nog {estimatedCredits - creditBalance} credits nodig.
              </p>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {generatedVideo ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Gegenereerde Video</h2>

                <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                  <video
                    src={generatedVideo.url}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    {generatedVideo.duration}s | {generatedVideo.aspectRatio}
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium"
                  >
                    Download Video
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-12 border border-gray-700 border-dashed text-center">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-bold mb-2">Klaar om te creëren</h3>
                <p className="text-gray-400 mb-6">
                  Selecteer een model, voer je prompt in en genereer geweldige AI video's
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">3</div>
                    <div className="text-sm text-gray-400">AI Modellen</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">15s</div>
                    <div className="text-sm text-gray-400">Max Duur</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">HD</div>
                    <div className="text-sm text-gray-400">Kwaliteit</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-6 bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-bold mb-4">Tips voor betere video's</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">1.</span>
                  Wees specifiek over camera bewegingen (bijv. "slow pan", "zoom in")
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">2.</span>
                  Beschrijf de sfeer en belichting (bijv. "golden hour", "cinematic lighting")
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">3.</span>
                  Vermeld een specifieke stijl (bijv. "professional", "artistic", "documentary")
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400">4.</span>
                  Kortere video's (3-5s) hebben vaak betere kwaliteit
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
