
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectSelector from '@/components/project-selector';
import { 
  Sparkles, 
  FileText,
  Settings,
  Image as ImageIcon,
  Link as LinkIcon,
  ShoppingBag,
  Send,
  Loader2
} from 'lucide-react';

/**
 * 🚀 UNIFIED CONTENT WRITER
 * - Één tool voor alle content generatie
 * - Simpel, robuust, geen freeze issues
 * - Combineert alle features
 */

interface TopicalTopic {
  id: string;
  title: string;
  type: string;
  categoryName: string;
}

interface BolProduct {
  ean: string;
  bolProductId: number;
  title: string;
  description: string;
  url: string;
  price?: number;
  regularPrice?: number;
  rating?: number;
  image?: string;
  images: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  affiliateLink?: string;
}

export default function UnifiedContentWriterPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();

  // Topics state
  const [availableTopics, setAvailableTopics] = useState<TopicalTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  // Bol.com product search state
  const [bolSearchTerm, setBolSearchTerm] = useState('');
  const [bolSearchResults, setBolSearchResults] = useState<BolProduct[]>([]);
  const [isSearchingBol, setIsSearchingBol] = useState(false);
  const [selectedBolProducts, setSelectedBolProducts] = useState<BolProduct[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    topic: '',
    projectId: 'no-project',
    topicalTopicId: 'no-topic',
    language: 'nl',
    wordCount: 1500,
    tone: 'professional',
    includeImages: true,
    imageCount: 2,
    includeFAQ: false,
    includeInternalLinks: true,
    bolProducts: [] as BolProduct[],
    publishToWordPress: false,
  });

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');

  // Load topics when project changes
  useEffect(() => {
    if (formData.projectId && formData.projectId !== 'no-project') {
      loadTopics(formData.projectId);
    } else {
      setAvailableTopics([]);
    }
  }, [formData.projectId]);

  const loadTopics = async (projectId: string) => {
    try {
      setLoadingTopics(true);
      const response = await fetch(`/api/client/topical-map?projectId=${projectId}`);
      if (response.ok) {
        const maps = await response.json();
        
        const allTopics: TopicalTopic[] = [];
        maps.forEach((map: any) => {
          map.categories?.forEach((category: any) => {
            category.topics?.forEach((topic: any) => {
              allTopics.push({
                id: topic.id,
                title: topic.title,
                type: topic.type,
                categoryName: category.categoryName,
              });
            });
          });
        });
        
        setAvailableTopics(allTopics);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      setAvailableTopics([]);
    } finally {
      setLoadingTopics(false);
    }
  };

  // Bol.com product search
  const handleBolSearch = async () => {
    if (!bolSearchTerm.trim()) {
      toast.error('Vul een zoekterm in');
      return;
    }

    setIsSearchingBol(true);
    try {
      const response = await fetch('/api/client/search-bolcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: bolSearchTerm,
          projectId: formData.projectId !== 'no-project' ? formData.projectId : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setBolSearchResults(data.products || []);
        if (data.products?.length === 0) {
          toast.error('Geen producten gevonden');
        }
      } else {
        toast.error('Fout bij zoeken naar producten');
      }
    } catch (error) {
      console.error('Bol search error:', error);
      toast.error('Fout bij zoeken naar producten');
    } finally {
      setIsSearchingBol(false);
    }
  };

  const toggleBolProduct = (product: BolProduct) => {
    setSelectedBolProducts(prev => {
      const exists = prev.find(p => p.ean === product.ean);
      if (exists) {
        return prev.filter(p => p.ean !== product.ean);
      } else {
        return [...prev, product];
      }
    });
  };

  const removeBolProduct = (ean: string) => {
    setSelectedBolProducts(prev => prev.filter(p => p.ean !== ean));
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Vul een onderwerp in');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setProgressMessage('Content genereren gestart...');

    try {
      // Transform formData: convert "no-project" and "no-topic" to empty strings
      const apiData = {
        ...formData,
        projectId: formData.projectId === 'no-project' ? '' : formData.projectId,
        topicalTopicId: formData.topicalTopicId === 'no-topic' ? '' : formData.topicalTopicId,
        bolProducts: selectedBolProducts,
      };

      const response = await fetch('/api/client/unified-content-writer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Content genereren mislukt');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Geen response stream beschikbaar');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.progress !== undefined) {
                setProgress(data.progress);
              }
              
              if (data.message) {
                setProgressMessage(data.message);
              }
              
              if (data.done) {
                console.log('[UnifiedWriter] ✅ Generation complete!', {
                  contentId: data.contentId,
                  title: data.title,
                });
                
                if (!data.contentId) {
                  throw new Error('Geen content ID ontvangen van de server');
                }
                
                setProgress(100);
                setProgressMessage('Content succesvol gegenereerd!');
                
                toast.success('Content succesvol gegenereerd! 🎉');
                
                // Redirect to edit page
                router.push(`/client-portal/content-library/${data.contentId}/edit`);
                return;
              }
              
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error('[UnifiedWriter] Parse error:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('[UnifiedWriter] Error:', error);
      toast.error(error.message || 'Content generatie mislukt');
      setIsGenerating(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">Content Writer</h1>
              </div>
              <p className="text-gray-300 text-lg">
                Één krachtige tool voor alle content generatie. Simpel, snel, en betrouwbaar.
              </p>
            </div>

            {/* Form */}
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6 mb-6">
              <div className="space-y-6">
                {/* Onderwerp */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="flex items-center gap-2 text-white font-medium">
                    <FileText className="h-4 w-4 text-orange-500" />
                    Onderwerp
                  </Label>
                  <Input
                    id="topic"
                    placeholder="Bijvoorbeeld: De voordelen van AI voor bedrijven"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    disabled={isGenerating}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                {/* Project */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project" className="text-white font-medium">Project (optioneel)</Label>
                    <ProjectSelector
                      value={formData.projectId === 'no-project' ? null : formData.projectId}
                      onChange={(projectId) => setFormData({ ...formData, projectId: projectId || 'no-project', topicalTopicId: 'no-topic' })}
                    />
                  </div>

                  {/* Topical Topic */}
                  {formData.projectId && formData.projectId !== 'no-project' && (
                    <div className="space-y-2">
                      <Label htmlFor="topicalTopic" className="text-white font-medium">Topical Map Topic (optioneel)</Label>
                      <Select
                        value={formData.topicalTopicId}
                        onValueChange={(value) => {
                          const topic = availableTopics.find(t => t.id === value);
                          setFormData({ 
                            ...formData, 
                            topicalTopicId: value,
                            topic: (topic && value !== 'no-topic') ? topic.title : formData.topic
                          });
                        }}
                        disabled={isGenerating || loadingTopics}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-topic">Geen topic</SelectItem>
                          {availableTopics.map((topic) => (
                            <SelectItem key={topic.id} value={topic.id}>
                              {topic.title} ({topic.categoryName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Taal</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nl">Nederlands</SelectItem>
                        <SelectItem value="en">Engels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Woordenaantal</Label>
                    <Input
                      type="number"
                      value={formData.wordCount}
                      onChange={(e) => setFormData({ ...formData, wordCount: parseInt(e.target.value) || 1500 })}
                      disabled={isGenerating}
                      min={500}
                      max={3000}
                      step={100}
                      className="bg-slate-700 border-slate-600 text-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Toon</Label>
                    <Select
                      value={formData.tone}
                      onValueChange={(value) => setFormData({ ...formData, tone: value })}
                      disabled={isGenerating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professioneel</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="friendly">Vriendelijk</SelectItem>
                        <SelectItem value="formal">Formeel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Aantal afbeeldingen</Label>
                    <Input
                      type="number"
                      value={formData.imageCount}
                      onChange={(e) => setFormData({ ...formData, imageCount: parseInt(e.target.value) || 2 })}
                      disabled={isGenerating || !formData.includeImages}
                      min={0}
                      max={5}
                      className="bg-slate-700 border-slate-600 text-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeImages}
                      onChange={(e) => setFormData({ ...formData, includeImages: e.target.checked })}
                      disabled={isGenerating}
                      className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                    <ImageIcon className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Inclusief afbeeldingen</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeInternalLinks}
                      onChange={(e) => setFormData({ ...formData, includeInternalLinks: e.target.checked })}
                      disabled={isGenerating}
                      className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                    <LinkIcon className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Interne links toevoegen</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.includeFAQ}
                      onChange={(e) => setFormData({ ...formData, includeFAQ: e.target.checked })}
                      disabled={isGenerating}
                      className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                    <Settings className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">FAQ sectie toevoegen</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.publishToWordPress}
                      onChange={(e) => setFormData({ ...formData, publishToWordPress: e.target.checked })}
                      disabled={isGenerating}
                      className="rounded border-slate-600 bg-slate-700 text-orange-500 focus:ring-orange-500"
                    />
                    <Send className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-gray-300">Direct publiceren naar WordPress</span>
                  </label>
                </div>

                {/* Bol.com Product Search */}
                <div className="space-y-4 border-t border-slate-700 pt-6">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-white">Bol.com Producten</h3>
                  </div>
                  <p className="text-sm text-gray-400">Zoek en voeg relevante producten toe aan je content</p>
                  
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Zoek producten..."
                      value={bolSearchTerm}
                      onChange={(e) => setBolSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBolSearch()}
                      disabled={isGenerating || isSearchingBol}
                      className="flex-1 bg-slate-700 border-slate-600 text-white placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-500"
                    />
                    <Button
                      onClick={handleBolSearch}
                      disabled={isGenerating || isSearchingBol || !bolSearchTerm.trim()}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      {isSearchingBol ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Zoeken...
                        </>
                      ) : (
                        'Zoek'
                      )}
                    </Button>
                  </div>

                  {/* Selected Products */}
                  {selectedBolProducts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Geselecteerde producten ({selectedBolProducts.length})</Label>
                      <div className="space-y-2">
                        {selectedBolProducts.map((product) => (
                          <div
                            key={product.ean}
                            className="flex items-center gap-3 bg-slate-700 p-3 rounded-lg border border-slate-600"
                          >
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{product.title}</p>
                              {product.price && (
                                <p className="text-xs text-orange-500 font-semibold">€ {product.price.toFixed(2)}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBolProduct(product.ean)}
                              className="text-gray-400 hover:text-red-500 hover:bg-slate-600"
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {bolSearchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Zoekresultaten</Label>
                      <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                        {bolSearchResults.map((product) => {
                          const isSelected = selectedBolProducts.some(p => p.ean === product.ean);
                          return (
                            <div
                              key={product.ean}
                              onClick={() => toggleBolProduct(product)}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-orange-900/30 border-orange-500'
                                  : 'bg-slate-700 border-slate-600 hover:border-orange-500'
                              }`}
                            >
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{product.title}</p>
                                {product.price && (
                                  <p className="text-sm text-orange-500 font-semibold">€ {product.price.toFixed(2)}</p>
                                )}
                                {product.rating && (
                                  <p className="text-xs text-gray-400">⭐ {product.rating}/5</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="text-orange-500 font-bold">✓</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !formData.topic.trim()}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Bezig met genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Genereer Content
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      {progressMessage}
                    </span>
                    <span className="text-sm font-bold text-orange-500">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2 bg-slate-700" />
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
