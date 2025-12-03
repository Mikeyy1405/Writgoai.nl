
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Loader2,
  Sparkles,
  Download,
  Search,
  Zap,
  Palette,
  Image as ImageIcon,
  Info,
  Star,
  TrendingUp,
  CheckCircle2,
  ImagePlus,
  Filter,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import ProjectSelector from '@/components/project-selector';

// ══════════════════════════════════════════════════════════
// AI MODELS MET UNIEKE EIGENSCHAPPEN
// ══════════════════════════════════════════════════════════

interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: string;
  credits: number;
  tier: 'budget' | 'balanced' | 'premium' | 'ultra';
  features: string[];
  bestFor: string[];
  speedRating: number; // 1-5
  qualityRating: number; // 1-5
  icon: string;
  badge?: string;
}

const ALL_MODELS: AIModel[] = [
  // 🎨 BALANCED - Beste prijs/kwaliteit
  {
    id: 'stable-diffusion-v3-medium',
    name: 'Stable Diffusion 3',
    description: 'Ideaal voor: Algemene illustraties, product visualisatie, marketing materiaal',
    provider: 'Stability AI',
    credits: 4,
    tier: 'balanced',
    features: ['Open source basis', 'Betrouwbaar', 'Consistente output', 'Breed inzetbaar'],
    bestFor: ['Algemene illustraties', 'Product visualisatie', 'Marketing materiaal'],
    speedRating: 4,
    qualityRating: 4,
    icon: '🎨',
  },
  {
    id: 'stable-diffusion-v35-large',
    name: 'Stable Diffusion 3.5',
    description: 'Ideaal voor: Professional artwork, high-quality visuals, print materiaal',
    provider: 'Stability AI',
    credits: 4,
    tier: 'balanced',
    features: ['Nieuwste versie', 'Betere compositie', 'Realistische details'],
    bestFor: ['Professional artwork', 'High-quality visuals', 'Print materiaal'],
    speedRating: 4,
    qualityRating: 5,
    icon: '🎨',
    badge: 'AANBEVOLEN',
  },
  
  // ⭐ PREMIUM - Hoogste kwaliteit
  {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Ideaal voor: Fotografie-stijl beelden, product shots, professional content',
    provider: 'Black Forest Labs',
    credits: 5,
    tier: 'premium',
    features: ['Hoogste kwaliteit', 'Fotorealisme', 'Perfecte details', 'Pro level'],
    bestFor: ['Fotografie-stijl', 'Product shots', 'Professional content'],
    speedRating: 3,
    qualityRating: 5,
    icon: '⭐',
    badge: 'PRO',
  },
  {
    id: 'flux-realism',
    name: 'Flux Realism',
    description: 'Ideaal voor: Product fotografie, lifestyle shots, portret fotografie',
    provider: 'Black Forest Labs',
    credits: 5,
    tier: 'premium',
    features: ['Ultra realistisch', 'Photo-quality', 'Perfecte belichting'],
    bestFor: ['Product fotografie', 'Lifestyle shots', 'Portret fotografie'],
    speedRating: 3,
    qualityRating: 5,
    icon: '📸',
    badge: 'REALISM',
  },
  
  // 💎 ULTRA - Maximale kwaliteit & creativiteit
  {
    id: 'flux-pro/v1.1-ultra',
    name: 'Flux Pro Ultra',
    description: 'Ideaal voor: Print media, billboard ads, high-end campaigns, 4K output',
    provider: 'Black Forest Labs',
    credits: 8,
    tier: 'ultra',
    features: ['Ultra HD', 'Maximale detail', '4K ready', 'Professional grade'],
    bestFor: ['Print media', 'Billboard ads', 'High-end campaigns'],
    speedRating: 2,
    qualityRating: 5,
    icon: '💎',
    badge: 'ULTRA HD',
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'Ideaal voor: Conceptuele kunst, creative designs, artistic projects',
    provider: 'OpenAI',
    credits: 18,
    tier: 'ultra',
    features: ['Zeer creatief', 'Artistieke vrijheid', 'Unieke stijlen'],
    bestFor: ['Conceptuele kunst', 'Creative designs', 'Artistic projects'],
    speedRating: 3,
    qualityRating: 5,
    icon: '🎭',
    badge: 'CREATIVE',
  },
  {
    id: 'openai/gpt-image-1',
    name: 'GPT Image 1',
    description: 'Ideaal voor: Varied styles, complex requests, creative freedom',
    provider: 'OpenAI',
    credits: 18,
    tier: 'ultra',
    features: ['Nieuwste GPT', 'Diverse stijlen', 'Excellent prompt begrip'],
    bestFor: ['Varied styles', 'Complex requests', 'Creative freedom'],
    speedRating: 3,
    qualityRating: 5,
    icon: '🤖',
    badge: 'GPT',
  },
  
  // 🎯 SPECIALIZED - Specifieke use cases
  {
    id: 'imagen-3.0-generate-002',
    name: 'Google Imagen 3',
    description: 'Ideaal voor: Technical diagrams, clean illustrations, UI mockups',
    provider: 'Google',
    credits: 6,
    tier: 'premium',
    features: ['Google kwaliteit', 'Clean design', 'Technical accuracy'],
    bestFor: ['Technical diagrams', 'Clean illustrations', 'UI mockups'],
    speedRating: 4,
    qualityRating: 5,
    icon: '🔵',
  },
  {
    id: 'recraft-v3',
    name: 'Recraft V3',
    description: 'Ideaal voor: Logo\'s, graphics, brand identity, UI elements',
    provider: 'Recraft',
    credits: 5,
    tier: 'premium',
    features: ['Design focus', 'Vector-style', 'Brand materials'],
    bestFor: ['Logo\'s', 'Graphics', 'Brand identity', 'UI elements'],
    speedRating: 4,
    qualityRating: 5,
    icon: '🎨',
    badge: 'DESIGN',
  },
];

// Art styles voor AI generatie
const ART_STYLES = [
  { id: 'none', name: '🎨 Geen stijl', description: 'Standaard model output' },
  { id: 'photorealistic', name: '📷 Fotorealistisch', description: 'Als een echte foto' },
  { id: 'cinematic', name: '🎬 Cinematisch', description: 'Film-achtige belichting' },
  { id: 'anime', name: '🎌 Anime', description: 'Japanse anime stijl' },
  { id: 'digital-art', name: '💻 Digitale Kunst', description: 'Moderne illustraties' },
  { id: 'oil-painting', name: '🖼️ Olieverf', description: 'Klassieke schilderkunst' },
  { id: 'watercolor', name: '🎨 Aquarel', description: 'Zachte waterverf' },
  { id: '3d-render', name: '🔮 3D Render', description: 'Fotorealistische 3D' },
  { id: 'minimalist', name: '⬜ Minimalistisch', description: 'Simpel en clean' },
  { id: 'vintage', name: '📻 Vintage', description: 'Retro en nostalgisch' },
  { id: 'comic', name: '💥 Comic', description: 'Stripboek stijl' },
  { id: 'neon', name: '🌃 Neon', description: 'Cyberpunk neon' },
];

interface StockImage {
  id: string;
  preview: string;
  full: string;
  width: number;
  height: number;
  tags: string[];
  user: string;
  likes: number;
  downloads: number;
  source: 'pixabay' | 'pexels';
  pageUrl: string;
  avgColor?: string;
}

export default function ImageSpecialistPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // AI Generation
  const [selectedModel, setSelectedModel] = useState('stable-diffusion-v35-large');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [batchCount, setBatchCount] = useState(1);

  // Stock Search
  const [searchQuery, setSearchQuery] = useState('');
  const [stockSource, setStockSource] = useState<'both' | 'pixabay' | 'pexels'>('both');
  const [orientation, setOrientation] = useState<'all' | 'horizontal' | 'vertical'>('all');
  const [stockImages, setStockImages] = useState<StockImage[]>([]);
  const [searchingStock, setSearchingStock] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);

  // Filters
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'speed' | 'quality' | 'cost'>('quality');

  // Project & Credits
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [credits, setCredits] = useState(0);

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
      loadCredits();
    }
  }, [status]);

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/client/profile');
      const data = await res.json();
      setCredits(data.client?.credits || 0);
    } catch (error) {
      console.error('Failed to load credits:', error);
    }
  };

  const filteredModels = ALL_MODELS
    .filter(m => tierFilter === 'all' || m.tier === tierFilter)
    .sort((a, b) => {
      if (sortBy === 'speed') return b.speedRating - a.speedRating;
      if (sortBy === 'quality') return b.qualityRating - a.qualityRating;
      if (sortBy === 'cost') return a.credits - b.credits;
      return 0;
    });

  const selectedModelData = ALL_MODELS.find(m => m.id === selectedModel);

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Voer een prompt in');
      return;
    }

    if (!selectedModelData) {
      toast.error('Selecteer een model');
      return;
    }

    const totalCredits = selectedModelData.credits * batchCount;
    if (credits < totalCredits) {
      toast.error(`Onvoldoende credits. Je hebt ${totalCredits} credits nodig.`);
      return;
    }

    setGeneratingAI(true);
    setGeneratedImages([]);

    try {
      const images: string[] = [];
      
      for (let i = 0; i < batchCount; i++) {
        toast.loading(`Genereren ${i + 1}/${batchCount}...`, { id: 'generating' });
        
        const res = await fetch('/api/client/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: aiPrompt,
            model: selectedModel,
            projectId: selectedProjectId || undefined,
            aspectRatio,
            style: selectedStyle !== 'none' ? selectedStyle : undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Genereren mislukt');
        }

        images.push(data.signedUrl || data.imageUrl);
        
        if (data.newBalance !== undefined) {
          setCredits(data.newBalance);
        }
      }

      setGeneratedImages(images);
      toast.success(`${batchCount} afbeelding(en) gegenereerd!`, { id: 'generating' });
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Er is een fout opgetreden', { id: 'generating' });
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

    try {
      const res = await fetch('/api/client/images/search-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          orientation,
          source: stockSource,
          perPage: 40,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Zoeken mislukt');
      }

      setStockImages(data.images || []);
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
          source: image.source,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Download mislukt');
      }

      const signedUrl = data.signedUrl || data.imageUrl;
      
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = `${image.source}-${image.id}.jpg`;
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

  const totalCost = selectedModelData ? selectedModelData.credits * batchCount : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
              <ImagePlus className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                Image Specialist
              </h1>
              <p className="text-gray-400 mt-1">
                15+ AI modellen • Pixabay & Pexels • Geavanceerde features
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-5">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-white">Credits: {Math.floor(credits)}</span>
            </div>
          <div className="flex-1 min-w-[200px]">
            <ProjectSelector
              value={selectedProjectId}
              onChange={(projectId) => setSelectedProjectId(projectId || '')}
              autoSelectPrimary={false}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Genereren
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Stock Foto's (Gratis)
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* AI GENERATION TAB */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="ai" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Model Selection */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Filter className="w-5 h-5 text-orange-500" />
                    Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white">Tier</Label>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all" className="text-white">Alle Tiers</SelectItem>
                        <SelectItem value="budget" className="text-white">🍌 Budget (2-3 credits)</SelectItem>
                        <SelectItem value="balanced" className="text-white">🎨 Balanced (4-5 credits)</SelectItem>
                        <SelectItem value="premium" className="text-white">⚡ Premium (5-6 credits)</SelectItem>
                        <SelectItem value="ultra" className="text-white">💎 Ultra (8-18 credits)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Sorteer op</Label>
                    <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="quality" className="text-white">Kwaliteit</SelectItem>
                        <SelectItem value="speed" className="text-white">Snelheid</SelectItem>
                        <SelectItem value="cost" className="text-white">Kosten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white">Aantal ({batchCount}x)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={batchCount}
                      onChange={(e) => setBatchCount(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Totaal: {totalCost} credits
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Model Info */}
              {selectedModelData && (
                <Card className="border-2 border-orange-500/20 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-white">
                      <span className="text-2xl">{selectedModelData.icon}</span>
                      {selectedModelData.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">{selectedModelData.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Snelheid:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < selectedModelData.speedRating ? 'bg-green-500' : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Kwaliteit:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < selectedModelData.qualityRating ? 'bg-orange-500' : 'bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-300">
                      <span>Kosten:</span>
                      <Badge variant="secondary" className="bg-orange-900/50 text-orange-300">{selectedModelData.credits} credits</Badge>
                    </div>
                    <div className="pt-2 border-t border-gray-800">
                      <p className="text-xs font-medium mb-2 text-white">Best voor:</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedModelData.bestFor.map((use) => (
                          <Badge key={use} variant="outline" className="text-xs border-gray-700 text-gray-300">
                            {use}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Generation Form & Results */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Genereer Afbeelding</CardTitle>
                  <CardDescription className="text-gray-400">
                    Kies een model en beschrijf wat je wilt maken
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Prompt</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Beschrijf de afbeelding die je wilt genereren..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Oriëntatie</Label>
                      <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landscape">🖼️ Liggend</SelectItem>
                          <SelectItem value="portrait">📱 Staand</SelectItem>
                          <SelectItem value="square">⬜ Vierkant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Stijl</Label>
                      <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {ART_STYLES.map((style) => (
                            <SelectItem key={style.id} value={style.id}>
                              {style.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                        Genereer {batchCount > 1 && `${batchCount}x`} ({totalCost} credits)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generated Images */}
              {generatedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((image, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <div className={`relative w-full bg-muted ${
                        aspectRatio === 'landscape' ? 'aspect-video' :
                        aspectRatio === 'portrait' ? 'aspect-[9/16]' :
                        'aspect-square'
                      }`}>
                        <Image
                          src={image}
                          alt={`Generated ${idx + 1}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <CardContent className="p-3">
                        <Button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = image;
                            a.download = `generated-${Date.now()}-${idx}.png`;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Model Gallery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Beschikbare AI Modellen ({filteredModels.length})
              </CardTitle>
              <CardDescription>
                Klik op een model om te selecteren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                  <Card
                    key={model.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedModel === model.id
                        ? 'border-2 border-orange-500 shadow-orange-500/20'
                        : 'border hover:border-orange-500/50'
                    }`}
                    onClick={() => setSelectedModel(model.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{model.icon}</span>
                          <div>
                            <CardTitle className="text-base">{model.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{model.provider}</p>
                          </div>
                        </div>
                        {model.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {model.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {model.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Kosten:</span>
                        <Badge variant="outline">{model.credits} credits</Badge>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {model.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-[10px]">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                      {selectedModel === model.id && (
                        <div className="pt-2 flex items-center gap-1 text-orange-500 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Geselecteerd
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* STOCK PHOTOS TAB */}
        {/* ══════════════════════════════════════════════════════════ */}
        <TabsContent value="stock" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Zoek Gratis Stock Foto's</CardTitle>
              <CardDescription>
                Doorzoek miljoenen gratis afbeeldingen van Pixabay & Pexels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Zoekopdracht</Label>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Zoek naar afbeeldingen..."
                  onKeyDown={(e) => e.key === 'Enter' && searchStockImages()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bron</Label>
                  <Select value={stockSource} onValueChange={(v: any) => setStockSource(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Beide (Pixabay + Pexels)</SelectItem>
                      <SelectItem value="pixabay">Alleen Pixabay</SelectItem>
                      <SelectItem value="pexels">Alleen Pexels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Oriëntatie</Label>
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
                    Zoek Gratis Foto's
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {stockImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stockImages.map((image) => (
                <Card key={image.id} className="overflow-hidden group">
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={image.preview}
                      alt={image.tags.join(', ')}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                    <Badge
                      variant="secondary"
                      className="absolute top-2 right-2 text-xs"
                    >
                      {image.source}
                    </Badge>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{image.user}</span>
                      <span>❤️ {image.likes}</span>
                    </div>
                    <Button
                      onClick={() => downloadStockImage(image)}
                      disabled={downloadingImage === image.id}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      {downloadingImage === image.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          Laden...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
