
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Search, Download, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface AIModel {
  id: string;
  name: string;
  description: string;
  cost: number;
  provider: string;
}

interface StockImage {
  id: number;
  preview: string;
  full: string;
  width: number;
  height: number;
  tags: string[];
  user: string;
  likes: number;
  downloads: number;
  source: string;
  pageUrl: string;
}

interface ImageSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  projectId?: string;
}

export function ImageSelectorModal({
  open,
  onClose,
  onSelect,
  projectId,
}: ImageSelectorModalProps) {
  // AI Generation state
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('flux-pro');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [translatedPrompt, setTranslatedPrompt] = useState('');

  // Stock search state
  const [searchQuery, setSearchQuery] = useState('');
  const [orientation, setOrientation] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [imageType, setImageType] = useState<'photo' | 'illustration' | 'vector' | 'all'>('photo');
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [searchingStock, setSearchingStock] = useState(false);
  const [selectedStockImage, setSelectedStockImage] = useState<StockImage | null>(null);
  const [translatedQuery, setTranslatedQuery] = useState('');

  // Credits
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (open) {
      loadModels();
      loadCredits();
    }
  }, [open]);

  const loadModels = async () => {
    try {
      const res = await fetch('/api/client/images/generate');
      const data = await res.json();
      setModels(data.models || []);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/client/profile');
      const data = await res.json();
      setCredits(data.client?.credits || 0);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Voer een prompt in');
      return;
    }

    const selectedModelData = models.find(m => m.id === selectedModel);
    if (!selectedModelData) {
      toast.error('Selecteer een model');
      return;
    }

    if (credits < selectedModelData.cost) {
      toast.error(`Onvoldoende credits. Je hebt €${selectedModelData.cost.toFixed(2)} nodig.`);
      return;
    }

    setGeneratingAI(true);
    setGeneratedImage(null);
    setTranslatedPrompt('');

    try {
      const res = await fetch('/api/client/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          model: selectedModel,
          projectId: projectId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Genereren mislukt');
      }

      // Use signedUrl directly from API response
      setGeneratedImage(data.signedUrl || data.imageUrl);
      setTranslatedPrompt(data.translatedPrompt);
      setCredits(prev => prev - selectedModelData.cost);

      toast.success(`Afbeelding gegenereerd!`);
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setGeneratingAI(false);
    }
  };

  const searchStockImages = async () => {
    if (!searchQuery.trim()) {
      toast.error('Voer een zoekopdracht in');
      return;
    }

    setSearchingStock(true);
    setStockImages([]);
    setSelectedStockImage(null);
    setTranslatedQuery('');

    try {
      const res = await fetch('/api/client/images/search-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          orientation,
          imageType,
          perPage: 30,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Zoeken mislukt');
      }

      setStockImages(data.images || []);
      setTranslatedQuery(data.translatedQuery);
      toast.success(`${data.images.length} afbeeldingen gevonden`);
    } catch (error) {
      console.error('Stock search error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setSearchingStock(false);
    }
  };

  const useGeneratedImage = async () => {
    if (!generatedImage) return;
    onSelect(generatedImage);
    onClose();
  };

  const useStockImage = async (image: StockImage) => {
    setSelectedStockImage(image);

    try {
      const res = await fetch('/api/client/images/search-stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.full,
          imageId: image.id,
          tags: image.tags,
          projectId: projectId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Download mislukt');
      }

      // Use signedUrl directly from API response
      const signedUrl = data.signedUrl || data.imageUrl;
      onSelect(signedUrl);
      onClose();
      toast.success('Afbeelding geselecteerd!');
    } catch (error) {
      console.error('Stock image error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setSelectedStockImage(null);
    }
  };

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecteer of Genereer Afbeelding</DialogTitle>
          <DialogDescription>
            Genereer een AI afbeelding of zoek gratis stock foto's
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4 text-sm">
          Credits: <span className="font-medium text-primary">€{credits.toFixed(2)}</span>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Genereren
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Stock Foto's
            </TabsTrigger>
          </TabsList>

          {/* AI Generation Tab */}
          <TabsContent value="ai" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name} - €{model.cost.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModelData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedModelData.description}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Beschrijf de afbeelding..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={generateAIImage}
                disabled={generatingAI || !aiPrompt.trim()}
                className="w-full"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genereer
                    {selectedModelData && ` (€${selectedModelData.cost.toFixed(2)})`}
                  </>
                )}
              </Button>
            </div>

            {translatedPrompt && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs">
                  <span className="font-medium">Vertaald:</span> {translatedPrompt}
                </p>
              </div>
            )}

            {generatedImage && (
              <div className="space-y-3">
                <div className="relative aspect-square w-full bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={generatedImage}
                    alt={aiPrompt}
                    fill
                    className="object-contain"
                  />
                </div>
                <Button onClick={useGeneratedImage} className="w-full" variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Gebruik deze afbeelding
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Stock Photos Tab */}
          <TabsContent value="stock" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Zoekopdracht</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek stock foto's..."
                  onKeyDown={(e) => e.key === 'Enter' && searchStockImages()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orientation">Oriëntatie</Label>
                  <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="horizontal">Horizontaal</SelectItem>
                      <SelectItem value="vertical">Verticaal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="imageType">Type</Label>
                  <Select value={imageType} onValueChange={(v: any) => setImageType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="photo">Foto</SelectItem>
                      <SelectItem value="illustration">Illustratie</SelectItem>
                      <SelectItem value="vector">Vector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={searchStockImages}
                disabled={searchingStock || !searchQuery.trim()}
                className="w-full"
              >
                {searchingStock ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zoeken...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Zoek (Gratis)
                  </>
                )}
              </Button>
            </div>

            {translatedQuery && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs">
                  <span className="font-medium">Vertaald:</span> {translatedQuery}
                </p>
              </div>
            )}

            {stockImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                {stockImages.map((image) => (
                  <Card
                    key={image.id}
                    className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    onClick={() => useStockImage(image)}
                  >
                    <div className="relative aspect-square bg-muted">
                      {selectedStockImage?.id === image.id ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      ) : null}
                      <Image
                        src={image.preview}
                        alt={image.tags.join(', ')}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div className="p-2 text-center">
                      <p className="text-xs text-muted-foreground truncate">
                        {image.user}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
