
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Sparkles, Image as ImageIcon, Palette } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface AIImageGeneratorDialogProps {
  open: boolean;
  onClose: () => void;
  onInsert: (imageUrl: string) => void;
  defaultPrompt?: string;
}

interface ImageModel {
  id: string;
  name: string;
  description: string;
  quality: string;
  speed: string;
  credits: number;
  recommended: boolean;
  supportsStyles?: boolean;
}

interface ImageStyle {
  id: string;
  name: string;
  description: string;
}

export default function AIImageGeneratorDialog({
  open,
  onClose,
  onInsert,
  defaultPrompt = ''
}: AIImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [selectedModel, setSelectedModel] = useState('SD_3');  // Cost-optimized default: $0.037 vs $0.18 for GPT-image-1
  const [selectedStyle, setSelectedStyle] = useState('natural');
  const [selectedQuality, setSelectedQuality] = useState<'standard' | 'hd'>('standard');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ImageModel[]>([]);
  const [availableStyles, setAvailableStyles] = useState<ImageStyle[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available models and styles on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/client/generate-image');
        if (response.ok) {
          const data = await response.json();
          setAvailableModels(data.models || []);
          setAvailableStyles(data.styles || []);
        }
      } catch (error) {
        console.error('Error fetching image options:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (open) {
      fetchOptions();
    }
  }, [open]);

  const currentModel = availableModels.find(m => m.id === selectedModel);
  const supportsStyles = currentModel?.supportsStyles || selectedModel === 'GPT_IMAGE_1';

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Voer een prompt in');
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/client/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          style: supportsStyles ? selectedStyle : undefined,
          quality: selectedQuality,
          width: 1024,
          height: 768,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fout bij genereren van afbeelding');
      }

      const data = await response.json();

      if (!data.imageUrl) {
        throw new Error('Geen afbeelding URL ontvangen');
      }

      setGeneratedImage(data.imageUrl);
      toast.success(`Afbeelding gegenereerd! (${data.creditsUsed} credits gebruikt)`);
    } catch (error: any) {
      console.error('Error generating image:', error);
      toast.error(error.message || 'Fout bij genereren van afbeelding');
    } finally {
      setGenerating(false);
    }
  };

  const handleInsert = () => {
    if (!generatedImage) {
      toast.error('Genereer eerst een afbeelding');
      return;
    }

    onInsert(generatedImage);
    onClose();
    
    // Reset
    setPrompt('');
    setGeneratedImage(null);
  };

  const handleClose = () => {
    onClose();
    // Reset na korte delay zodat de animatie niet verstoord wordt
    setTimeout(() => {
      setPrompt(defaultPrompt);
      setGeneratedImage(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-orange-500" />
            AI Afbeelding Genereren met GPT Image 1
          </DialogTitle>
          <DialogDescription>
            Genereer hoogwaardige afbeeldingen in verschillende stijlen met de nieuwste AI technologie
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Prompt Invoer */}
          <div>
            <Label className="text-base font-semibold">Beschrijving van de Afbeelding *</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Bijv: Een moderne laptop op een bureau met koffie, natuurlijk licht..."
              rows={4}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Wees zo specifiek mogelijk voor de beste resultaten
            </p>
          </div>

          {/* Model Selectie */}
          <div>
            <Label className="text-base font-semibold mb-2 block">AI Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer een model..." />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center gap-2">
                      {model.name} 
                      <span className="text-xs text-gray-500">
                        ({model.credits} credits) {model.recommended && '⭐'}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentModel && (
              <p className="text-xs text-gray-600 mt-1">
                {currentModel.description} • {currentModel.quality} • {currentModel.speed}
              </p>
            )}
          </div>

          {/* Stijl Selectie (alleen voor GPT Image 1) */}
          {supportsStyles && (
            <div>
              <Label className="text-base font-semibold mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4 text-orange-500" />
                Afbeelding Stijl 🆕
              </Label>
              <Select value={selectedStyle} onValueChange={setSelectedStyle} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer een stijl..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-xs text-gray-500">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Kwaliteit Selectie */}
          <div>
            <Label className="text-base font-semibold mb-2 block">Kwaliteit</Label>
            <Select 
              value={selectedQuality} 
              onValueChange={(value) => setSelectedQuality(value as 'standard' | 'hd')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">
                  <div>
                    <div className="font-medium">Standaard</div>
                    <div className="text-xs text-gray-500">Goede kwaliteit, sneller</div>
                  </div>
                </SelectItem>
                <SelectItem value="hd">
                  <div>
                    <div className="font-medium">HD</div>
                    <div className="text-xs text-gray-500">Hoogste kwaliteit, meer details</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Genereer Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim() || loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Afbeelding wordt gegenereerd...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Genereer Afbeelding
                {currentModel && ` (${currentModel.credits} credits)`}
              </>
            )}
          </Button>

          {/* Preview Gegenereerde Afbeelding */}
          {generatedImage && (
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
              <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                Gegenereerde Afbeelding
              </Label>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200">
                <Image
                  src={generatedImage}
                  alt="Gegenereerde afbeelding"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}

          {/* Acties */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuleren
            </Button>
            <Button
              onClick={handleInsert}
              disabled={!generatedImage}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Afbeelding Invoegen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
