
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { Loader2, Sparkles, Image as ImageIcon, Download, Search, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProjectSelector from '@/components/project-selector';

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

// Available art styles
const IMAGE_STYLES = [
  { id: 'none', name: 'Geen stijl', description: 'Standaard generatie' },
  { id: 'photorealistic', name: 'Fotorealistisch', description: 'Realistische foto-kwaliteit' },
  { id: 'cinematic', name: 'Cinematisch', description: 'Film-achtige belichting en compositie' },
  { id: 'anime', name: 'Anime', description: 'Japanse anime stijl' },
  { id: 'digital-art', name: 'Digitale Kunst', description: 'Moderne digitale illustraties' },
  { id: 'oil-painting', name: 'Olieverf', description: 'Klassieke schilderkunst' },
  { id: 'watercolor', name: 'Aquarel', description: 'Zachte waterverf stijl' },
  { id: '3d-render', name: '3D Render', description: 'Fotorealistische 3D graphics' },
  { id: 'minimalist', name: 'Minimalistisch', description: 'Simpel en clean design' },
  { id: 'vintage', name: 'Vintage', description: 'Retro en nostalgisch' },
  { id: 'comic', name: 'Comic', description: 'Stripboek stijl' },
  { id: 'neon', name: 'Neon', description: 'Cyberpunk neon effecten' },
];

// Helper function to get credits cost for a model
function getModelCredits(modelId: string): number {
  if (modelId.includes('nano-banana-pro')) return 3; // IMAGE_BUDGET_PRO
  if (modelId.includes('nano-banana')) return 2; // IMAGE_ULTRA_BUDGET
  if (modelId.includes('dall-e-3')) return 18; // IMAGE_PREMIUM
  if (modelId.includes('flux-1.1-pro') || modelId.includes('flux-pro')) return 5; // IMAGE_STANDARD
  if (modelId.includes('stable-diffusion')) return 4; // IMAGE_BUDGET
  return 5; // Default
}

export default function ImageGeneratorPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  
  // AI Generation state
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [translatedPrompt, setTranslatedPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  const [selectedStyle, setSelectedStyle] = useState<string>('none');
  const [textOverlay, setTextOverlay] = useState('');
  
  // Stock search state
  const [searchQuery, setSearchQuery] = useState('');
  const [orientation, setOrientation] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [imageType, setImageType] = useState<'photo' | 'illustration' | 'vector' | 'all'>('photo');
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [searchingStock, setSearchingStock] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState<number | null>(null);
  const [translatedQuery, setTranslatedQuery] = useState('');
  
  // Project selection
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Credits
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/client-login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadModels();
      loadCredits();
    }
  }, [status]);

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

    // Calculate credits needed (models show cost in €, but we need credits)
    let creditsNeeded = getModelCredits(selectedModel);
    
    // Fallback to default if not found
    if (!creditsNeeded) {
      creditsNeeded = 5; // default
    }

    if (credits < creditsNeeded) {
      toast.error(`Onvoldoende credits. Je hebt ${creditsNeeded} credits nodig.`);
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
          projectId: selectedProjectId || undefined,
          aspectRatio,
          style: selectedStyle !== 'none' ? selectedStyle : undefined,
          textOverlay: textOverlay.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Genereren mislukt');
      }

      // Use signedUrl directly from API response
      setGeneratedImage(data.signedUrl || data.imageUrl);
      setTranslatedPrompt(data.translatedPrompt);
      
      // Update credits from server response
      if (data.newBalance !== undefined) {
        setCredits(data.newBalance);
      } else {
        // Fallback to local calculation
        setCredits(prev => prev - (data.creditsUsed || selectedModelData.cost));
      }
      
      toast.success(`Afbeelding gegenereerd! (${data.creditsUsed || selectedModelData.cost} credits gebruikt)`);
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

  const downloadStockImage = async (image: StockImage) => {
    setDownloadingImage(image.id);

    try {
      const res = await fetch('/api/client/images/search-stock', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.full,
          imageId: image.id,
          tags: image.tags,
          projectId: selectedProjectId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Download mislukt');
      }

      // Use signedUrl directly from API response and download
      const signedUrl = data.signedUrl || data.imageUrl;
      
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = `pixabay-${image.id}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Afbeelding gedownload!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden');
    } finally {
      setDownloadingImage(null);
    }
  };

  if (!isMounted || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const selectedModelData = models.find(m => m.id === selectedModel);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Afbeeldingen Genereren</h1>
        <p className="text-muted-foreground">
          Genereer AI afbeeldingen of zoek gratis stock foto's
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm font-medium">
            Credits: <span className="text-primary">{Math.floor(credits)} credits</span>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Koppel aan project (optioneel)
            </Label>
            <ProjectSelector
              value={selectedProjectId}
              onChange={(projectId) => setSelectedProjectId(projectId || '')}
              autoSelectPrimary={false}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
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
        <TabsContent value="ai" className="space-y-6">
          <Card className="p-6">
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
                        {model.name} - {getModelCredits(model.id)} credits ({model.description})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModelData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedModelData.description} • Kosten: {getModelCredits(selectedModelData.id)} credits
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Beschrijf de afbeelding die je wilt genereren... (wordt automatisch naar Engels vertaald)"
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aspectRatio">Oriëntatie</Label>
                  <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">🖼️ Liggend (16:9)</SelectItem>
                      <SelectItem value="portrait">📱 Staand (9:16)</SelectItem>
                      <SelectItem value="square">⬜ Vierkant (1:1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="style">Stijl</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {IMAGE_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedStyle !== 'none' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {IMAGE_STYLES.find(s => s.id === selectedStyle)?.description}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="textOverlay">Tekst Overlay (optioneel)</Label>
                <Input
                  id="textOverlay"
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Voeg tekst toe op de afbeelding (bijv. 'SALE 50% OFF')"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  De tekst wordt prominent op de afbeelding getoond
                </p>
              </div>

              <Button
                onClick={generateAIImage}
                disabled={generatingAI || !aiPrompt.trim()}
                className="w-full"
                size="lg"
              >
                {generatingAI ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Genereren...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Genereer Afbeelding
                    {selectedModelData && ` (${getModelCredits(selectedModelData.id)} credits)`}
                  </>
                )}
              </Button>
            </div>
          </Card>

          {translatedPrompt && (
            <Card className="p-4 bg-muted">
              <p className="text-sm">
                <span className="font-medium">Vertaalde prompt:</span> {translatedPrompt}
              </p>
            </Card>
          )}

          {generatedImage && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Gegenereerde Afbeelding</h3>
              <div className={`relative w-full max-w-2xl mx-auto bg-muted rounded-lg overflow-hidden ${
                aspectRatio === 'landscape' ? 'aspect-video' : 
                aspectRatio === 'portrait' ? 'aspect-[9/16]' : 
                'aspect-square'
              }`}>
                <Image
                  src={generatedImage}
                  alt={aiPrompt}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="mt-4 space-y-2">
                {selectedStyle !== 'none' && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Stijl:</span> {IMAGE_STYLES.find(s => s.id === selectedStyle)?.name}
                  </div>
                )}
                {textOverlay && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Tekst overlay:</span> "{textOverlay}"
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = generatedImage;
                      a.download = `generated-${Date.now()}.png`;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Stock Photos Tab */}
        <TabsContent value="stock" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Zoekopdracht</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek gratis stock foto's... (wordt automatisch naar Engels vertaald)"
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
                size="lg"
              >
                {searchingStock ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Zoeken...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Zoek Stock Foto's (Gratis)
                  </>
                )}
              </Button>
            </div>
          </Card>

          {translatedQuery && (
            <Card className="p-4 bg-muted">
              <p className="text-sm">
                <span className="font-medium">Vertaalde zoekopdracht:</span> {translatedQuery}
              </p>
            </Card>
          )}

          {stockImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stockImages.map((image) => (
                <Card key={image.id} className="overflow-hidden group">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={image.preview}
                      alt={image.tags.join(', ')}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{image.user}</span>
                      <span>❤️ {image.likes}</span>
                    </div>
                    <Button
                      onClick={() => downloadStockImage(image)}
                      disabled={downloadingImage === image.id}
                      size="sm"
                      className="w-full"
                      variant="outline"
                    >
                      {downloadingImage === image.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Downloaden...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
