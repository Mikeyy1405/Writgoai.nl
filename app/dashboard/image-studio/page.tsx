'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getAllModels, getModelsByTier, getModelsByProvider, ImageModel } from '@/lib/image-models';
import { getCreditCost } from '@/lib/credit-costs';

interface GeneratedImage {
  url: string;
  index: number;
  width: number;
  height: number;
  textOverlay: {
    text: string;
    position: 'top' | 'center' | 'bottom';
    fontSize?: number;
    color?: string;
  } | null;
}

interface GenerationResult {
  success: boolean;
  images: GeneratedImage[];
  model: {
    id: string;
    name: string;
    provider: string;
  };
  creditsUsed: number;
  metadata: any;
}

interface StockPhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  largeUrl: string;
  width: number;
  height: number;
  photographer: string;
  photographerUrl: string;
  source: 'pixabay' | 'pexels' | 'unsplash';
  alt: string;
  tags?: string;
  likes?: number;
  downloads?: number;
}

type TabType = 'generate' | 'stock';

export default function ImageStudioPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('generate');

  // AI Generation State
  const [selectedModel, setSelectedModel] = useState<string>('image_flux_pro_v11');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(50);
  const [seed, setSeed] = useState('');
  const [textOverlay, setTextOverlay] = useState('');
  const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textFontSize, setTextFontSize] = useState(48);
  const [imageUrl, setImageUrl] = useState(''); // For image-to-image

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [history, setHistory] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Stock Photo State
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSource, setStockSource] = useState<'all' | 'pixabay' | 'pexels' | 'unsplash'>('all');
  const [stockPhotos, setStockPhotos] = useState<StockPhoto[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockPage, setStockPage] = useState(1);
  const [stockTotalResults, setStockTotalResults] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<StockPhoto | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load credit balance
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

  // Get filtered models
  const getFilteredModels = (): ImageModel[] => {
    let models = getAllModels();

    // Filter by tier
    if (filterTier !== 'all') {
      models = getModelsByTier(filterTier as any);
    }

    // Filter by provider
    if (filterProvider !== 'all') {
      models = getModelsByProvider(filterProvider);
    }

    // Filter by search query
    if (searchQuery) {
      models = models.filter(model =>
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return models;
  };

  const selectedModelConfig = getAllModels().find(m => m.id === selectedModel);
  const estimatedCredits = selectedModelConfig ? selectedModelConfig.credits * numImages : 0;

  // Generate images
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please log in to generate images');
        return;
      }

      const payload: any = {
        model: selectedModel,
        prompt: prompt.trim(),
        aspectRatio,
        numImages,
        guidanceScale,
        numInferenceSteps,
      };

      if (negativePrompt.trim()) {
        payload.negativePrompt = negativePrompt.trim();
      }

      if (seed) {
        payload.seed = parseInt(seed);
      }

      if (textOverlay.trim()) {
        payload.textOverlay = {
          text: textOverlay,
          position: textPosition,
          fontSize: textFontSize,
          color: textColor,
        };
      }

      if (imageUrl.trim()) {
        payload.imageUrl = imageUrl.trim();
      }

      const response = await fetch('/api/image-studio/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Image generation failed');
        return;
      }

      setGeneratedImages(data.images);
      await loadCreditBalance();

    } catch (error: any) {
      console.error('Generation error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-studio-${Date.now()}-${index}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Stock Photo Search
  const searchStockPhotos = async (page: number = 1) => {
    if (!stockSearchQuery.trim()) {
      setStockError('Voer een zoekopdracht in');
      return;
    }

    setStockLoading(true);
    setStockError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStockError('Je moet ingelogd zijn');
        return;
      }

      const params = new URLSearchParams({
        query: stockSearchQuery.trim(),
        source: stockSource,
        page: page.toString(),
        per_page: '20',
      });

      const response = await fetch(`/api/image-studio/stock-photos?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setStockError(data.error || 'Zoeken mislukt');
        return;
      }

      setStockPhotos(data.photos);
      setStockTotalResults(data.totalResults);
      setStockPage(page);
    } catch (err: any) {
      setStockError(err.message || 'Er is een fout opgetreden');
    } finally {
      setStockLoading(false);
    }
  };

  // Copy stock photo URL
  const copyStockPhotoUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Download stock photo
  const downloadStockPhoto = async (photo: StockPhoto) => {
    try {
      const response = await fetch(photo.largeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${photo.source}-${photo.id.split('-')[1]}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'pixabay': return 'bg-green-500';
      case 'pexels': return 'bg-teal-500';
      case 'unsplash': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredModels = getFilteredModels();
  const providers = Array.from(new Set(getAllModels().map(m => m.provider))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            🎨 Image Studio
          </h1>
          <p className="text-gray-400">
            Genereer AI afbeeldingen of zoek gratis stock foto's
          </p>

          {/* Tabs */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('generate')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              🤖 AI Generatie
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'stock'
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              📷 Stock Foto's (Gratis)
            </button>
          </div>

          {activeTab === 'generate' && (
            <div className="mt-4 flex items-center gap-4">
              <div className="px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-400">Credits: </span>
                <span className="text-orange-500 font-bold">{creditBalance}</span>
              </div>
              <div className="px-4 py-2 bg-gray-800 rounded-lg">
                <span className="text-gray-400">Cost: </span>
                <span className="text-green-500 font-bold">{estimatedCredits} credits</span>
              </div>
            </div>
          )}
        </div>

        {/* Stock Photos Tab */}
        {activeTab === 'stock' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="Zoek stock foto's... (bijv. technologie, natuur, kantoor)"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') searchStockPhotos(1);
                    }}
                  />
                </div>
                <div>
                  <select
                    value={stockSource}
                    onChange={(e) => setStockSource(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-green-500"
                  >
                    <option value="all">Alle bronnen</option>
                    <option value="pixabay">Pixabay</option>
                    <option value="pexels">Pexels</option>
                    <option value="unsplash">Unsplash</option>
                  </select>
                </div>
                <button
                  onClick={() => searchStockPhotos(1)}
                  disabled={stockLoading}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 rounded-lg font-medium disabled:opacity-50"
                >
                  {stockLoading ? 'Zoeken...' : '🔍 Zoeken'}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {['technologie', 'natuur', 'kantoor', 'mensen', 'stad', 'eten', 'sport', 'abstract'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setStockSearchQuery(tag);
                      setTimeout(() => searchStockPhotos(1), 100);
                    }}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-full text-sm text-gray-300"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {stockError && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
                <p className="text-red-200">{stockError}</p>
              </div>
            )}

            {/* Results */}
            {stockPhotos.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-400">
                    {stockTotalResults.toLocaleString()} foto's gevonden
                  </p>
                  <div className="flex gap-2">
                    <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300">
                      Pixabay
                    </a>
                    <span className="text-gray-600">•</span>
                    <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300">
                      Pexels
                    </a>
                    <span className="text-gray-600">•</span>
                    <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-300">
                      Unsplash
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {stockPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.alt}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 ${getSourceBadgeColor(photo.source)} rounded text-xs font-medium text-white`}>
                          {photo.source}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white font-medium">Bekijken</span>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-gray-400 truncate">{photo.photographer}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {stockTotalResults > 20 && (
                  <div className="mt-6 flex justify-center gap-2">
                    <button
                      onClick={() => searchStockPhotos(stockPage - 1)}
                      disabled={stockPage <= 1 || stockLoading}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      Vorige
                    </button>
                    <span className="px-4 py-2 bg-gray-800 rounded-lg">
                      Pagina {stockPage}
                    </span>
                    <button
                      onClick={() => searchStockPhotos(stockPage + 1)}
                      disabled={stockLoading}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg disabled:opacity-50"
                    >
                      Volgende
                    </button>
                  </div>
                )}
              </div>
            ) : !stockLoading && stockSearchQuery && (
              <div className="text-center py-12 text-gray-400">
                Geen foto's gevonden voor "{stockSearchQuery}"
              </div>
            )}

            {/* Empty State */}
            {!stockLoading && stockPhotos.length === 0 && !stockSearchQuery && (
              <div className="bg-gray-800/50 rounded-lg p-12 border border-gray-700 border-dashed text-center">
                <div className="text-6xl mb-4">📷</div>
                <h3 className="text-2xl font-bold mb-2">Gratis Stock Foto's</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Zoek in miljoenen gratis te gebruiken foto's van Pixabay, Pexels en Unsplash.
                  Perfect voor nieuwsartikelen, blogs en social media.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-xl mb-1 text-green-400">Pixabay</div>
                    <div className="text-xs text-gray-500">2.5M+ foto's</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-xl mb-1 text-teal-400">Pexels</div>
                    <div className="text-xs text-gray-500">3M+ foto's</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-xl mb-1 text-purple-400">Unsplash</div>
                    <div className="text-xs text-gray-500">4M+ foto's</div>
                  </div>
                </div>
              </div>
            )}

            {/* Photo Detail Modal */}
            {selectedPhoto && (
              <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
                <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <img
                      src={selectedPhoto.largeUrl}
                      alt={selectedPhoto.alt}
                      className="w-full max-h-[60vh] object-contain bg-gray-800"
                    />
                    <button
                      onClick={() => setSelectedPhoto(null)}
                      className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center"
                    >
                      ✕
                    </button>
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 ${getSourceBadgeColor(selectedPhoto.source)} rounded-full text-sm font-medium text-white`}>
                        {selectedPhoto.source}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-medium">
                          Foto door{' '}
                          <a
                            href={selectedPhoto.photographerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-400 hover:underline"
                          >
                            {selectedPhoto.photographer}
                          </a>
                        </p>
                        <p className="text-sm text-gray-400">
                          {selectedPhoto.width} × {selectedPhoto.height} pixels
                          {selectedPhoto.likes && ` • ${selectedPhoto.likes} likes`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => downloadStockPhoto(selectedPhoto)}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg font-medium"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => copyStockPhotoUrl(selectedPhoto.largeUrl)}
                        className={`px-6 py-2 rounded-lg font-medium transition-all ${
                          copiedUrl === selectedPhoto.largeUrl
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {copiedUrl === selectedPhoto.largeUrl ? '✓ Gekopieerd!' : '📋 Kopieer URL'}
                      </button>
                      <a
                        href={selectedPhoto.photographerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
                      >
                        👤 Bekijk fotograaf
                      </a>
                    </div>

                    {selectedPhoto.tags && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedPhoto.tags.split(', ').map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Generation Tab */}
        {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Selection */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Model Selection</h2>

              {/* Search & Filters */}
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                />

                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="budget">💰 Budget (1 credit)</option>
                  <option value="standard">⭐ Standard (2 credits)</option>
                  <option value="premium">💎 Premium (3 credits)</option>
                  <option value="ultra">👑 Ultra (4 credits)</option>
                </select>

                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All Providers</option>
                  {providers.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>

              {/* Model Dropdown */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 mb-3"
              >
                {filteredModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.credits} credits) - {model.provider}
                  </option>
                ))}
              </select>

              {selectedModelConfig && (
                <div className="p-3 bg-gray-900 rounded-lg text-sm">
                  <p className="text-gray-400 mb-2">{selectedModelConfig.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedModelConfig.capabilities.textToImage && (
                      <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">Text-to-Image</span>
                    )}
                    {selectedModelConfig.capabilities.imageToImage && (
                      <span className="px-2 py-1 bg-blue-900 text-blue-300 rounded text-xs">Image-to-Image</span>
                    )}
                    {selectedModelConfig.capabilities.editing && (
                      <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs">Editing</span>
                    )}
                    {selectedModelConfig.capabilities.lora && (
                      <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs">LoRA</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Prompt</h2>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
              />

              <div className="mt-3">
                <label className="block text-sm text-gray-400 mb-2">Negative Prompt (Optional)</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid in the image..."
                  className="w-full h-20 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Image-to-Image Input */}
            {selectedModelConfig?.capabilities.imageToImage && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Source Image (Optional)</h2>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-2">For image-to-image transformation</p>
              </div>
            )}

            {/* Basic Options */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Image Options</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                  >
                    {selectedModelConfig?.capabilities.aspectRatios?.map(ratio => (
                      <option key={ratio} value={ratio}>{ratio}</option>
                    )) || (
                      <>
                        <option value="1:1">1:1 (Square)</option>
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                        <option value="4:3">4:3 (Standard)</option>
                        <option value="3:4">3:4 (Vertical)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Number of Images: {numImages}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    value={numImages}
                    onChange={(e) => setNumImages(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Text Overlay */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Text Overlay</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Overlay Text</label>
                  <input
                    type="text"
                    value={textOverlay}
                    onChange={(e) => setTextOverlay(e.target.value)}
                    placeholder="Add text to image..."
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>

                {textOverlay && (
                  <>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Position</label>
                      <select
                        value={textPosition}
                        onChange={(e) => setTextPosition(e.target.value as any)}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Font Size</label>
                        <input
                          type="number"
                          value={textFontSize}
                          onChange={(e) => setTextFontSize(parseInt(e.target.value))}
                          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Color</label>
                        <input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-full h-10 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-xl font-bold mb-4"
              >
                <span>Advanced Options</span>
                <span>{showAdvanced ? '▼' : '▶'}</span>
              </button>

              {showAdvanced && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Guidance Scale: {guidanceScale}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={guidanceScale}
                      onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher = follows prompt more closely
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Inference Steps: {numInferenceSteps}
                    </label>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      step="10"
                      value={numInferenceSteps}
                      onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Higher = better quality but slower
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Seed (Optional)</label>
                    <input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                      placeholder="Random"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-orange-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use same seed for reproducible results
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim() || creditBalance < estimatedCredits}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-lg transition-all disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  Generating...
                </span>
              ) : (
                `Generate ${numImages} Image${numImages > 1 ? 's' : ''} (${estimatedCredits} credits)`
              )}
            </button>

            {creditBalance < estimatedCredits && (
              <p className="text-red-500 text-sm text-center">
                Insufficient credits. Need {estimatedCredits - creditBalance} more.
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

            {generatedImages.length > 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
                <h2 className="text-2xl font-bold mb-6">Generated Images</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
                        <img
                          src={image.url}
                          alt={`Generated ${index + 1}`}
                          className="w-full h-auto"
                        />

                        {/* Text Overlay Preview */}
                        {image.textOverlay && (
                          <div
                            className="absolute left-0 right-0 px-4 py-2 text-center"
                            style={{
                              [image.textOverlay.position === 'top' ? 'top' :
                               image.textOverlay.position === 'center' ? 'top' : 'bottom']:
                               image.textOverlay.position === 'center' ? '50%' : '0',
                              transform: image.textOverlay.position === 'center' ? 'translateY(-50%)' : 'none',
                              fontSize: `${image.textOverlay.fontSize}px`,
                              color: image.textOverlay.color,
                              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            {image.textOverlay.text}
                          </div>
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => handleDownload(image.url, index)}
                            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-bold transition-all"
                          >
                            📥 Download
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-400">
                        Image {index + 1} • {image.width}×{image.height}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-12 border border-gray-700 border-dashed text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-2xl font-bold mb-2">Ready to Create</h3>
                <p className="text-gray-400 mb-6">
                  Select a model, enter your prompt, and generate stunning AI images
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">50+</div>
                    <div className="text-sm text-gray-400">AI Models</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">10+</div>
                    <div className="text-sm text-gray-400">Providers</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">7</div>
                    <div className="text-sm text-gray-400">Aspect Ratios</div>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-lg">
                    <div className="text-2xl mb-2">4K</div>
                    <div className="text-sm text-gray-400">Resolution</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
