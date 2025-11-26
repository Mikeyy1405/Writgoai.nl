
'use client';

/**
 * 🎬 VEREENVOUDIGDE VIDEO GENERATOR
 * 
 * Gebruikt directe Text-to-Video AI API's (Luma/Runway)
 * Geen complexe agent loops - gewoon simpel en snel!
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Film, Sparkles, Download, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoResult {
  videoUrl: string;
  thumbnailUrl?: string;
  prompt: string;
  provider: string;
  duration: number;
  aspectRatio: string;
}

export default function SimpleVideoGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [provider, setProvider] = useState<'luma' | 'runway'>('luma');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<VideoResult | null>(null);

  const aspectRatioLabels = {
    '9:16': 'Verticaal (TikTok, Reels, Shorts)',
    '16:9': 'Horizontaal (YouTube)',
    '1:1': 'Vierkant (Instagram)',
  };

  const providerInfo = {
    luma: {
      name: 'Luma AI Dream Machine',
      cost: 10,
      speed: 'Snel (1-2 min)',
      quality: '⭐⭐⭐⭐',
    },
    runway: {
      name: 'Runway ML Gen-3 Alpha',
      cost: 20,
      speed: 'Langzaam (2-3 min)',
      quality: '⭐⭐⭐⭐⭐',
    },
  };

  const examplePrompts = [
    "Een zonsondergang aan het strand met golven en zeemeeuwen",
    "Een futuristische stad met vliegende auto's en neonlichten",
    "Een hond die speelt in een park vol bloemen",
    "Een astronaut die rondloopt op Mars met bergen op de achtergrond",
    "Een rustig bos met zonnestralen door de bomen",
  ];

  async function generateVideo() {
    if (!prompt || prompt.length < 10) {
      toast.error('Prompt moet minimaal 10 karakters bevatten');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setStatusMessage('Video generatie wordt voorbereid...');
    setResult(null);

    try {
      const response = await fetch('/api/client/generate-video-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          aspectRatio,
          provider,
          clientId: 'demo', // TODO: Get from session
        }),
      });

      if (!response.ok) {
        throw new Error('Video generatie mislukt');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming not supported');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'status') {
                setStatusMessage(data.message);
                if (data.progress) {
                  setProgress(data.progress);
                }
              } else if (data.type === 'error') {
                toast.error(data.message);
                setIsGenerating(false);
                return;
              } else if (data.type === 'complete') {
                setResult({
                  videoUrl: data.videoUrl,
                  thumbnailUrl: data.thumbnailUrl,
                  prompt: data.prompt,
                  provider: data.provider,
                  duration: data.duration,
                  aspectRatio: data.aspectRatio,
                });
                setProgress(100);
                setStatusMessage('✅ Video succesvol gegenereerd!');
                toast.success('Video is klaar! 🎉');
              }
            } catch (e) {
              console.error('Failed to parse SSE:', e);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Video generation error:', error);
      toast.error(`Video generatie mislukt: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Film className="h-6 w-6 text-primary" />
            Vereenvoudigde Video Generator
          </CardTitle>
          <CardDescription>
            Genereer AI video's in 1-2 minuten met Luma AI of Runway ML
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Video Beschrijving</label>
            <Textarea
              placeholder="Beschrijf de video die je wilt maken... (minimaal 10 karakters)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              {prompt.length} / 500 karakters
            </p>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Voorbeeld Prompts</label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                >
                  {example.substring(0, 30)}...
                </Button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Formaat</label>
              <Select
                value={aspectRatio}
                onValueChange={(v: any) => setAspectRatio(v)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(aspectRatioLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select
                value={provider}
                onValueChange={(v: any) => setProvider(v)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(providerInfo).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{info.name}</span>
                        <Badge variant="secondary">{info.cost} credits</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>⚡ Snelheid: {providerInfo[provider].speed}</div>
                <div>⭐ Kwaliteit: {providerInfo[provider].quality}</div>
                <div>💰 Kosten: {providerInfo[provider].cost} credits</div>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateVideo}
            disabled={isGenerating || !prompt || prompt.length < 10}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Genereren... ({Math.round(progress)}%)
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Genereer Video
              </>
            )}
          </Button>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                {statusMessage}
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className="border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600">
                  ✅ Video Succesvol Gegenereerd!
                </CardTitle>
                <CardDescription>
                  Je video is klaar voor download of delen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={result.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Provider:</span>
                    <span className="ml-2 font-medium">
                      {providerInfo[result.provider as 'luma' | 'runway'].name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Formaat:</span>
                    <span className="ml-2 font-medium">{result.aspectRatio}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duur:</span>
                    <span className="ml-2 font-medium">{result.duration}s</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prompt:</span>
                    <span className="ml-2 font-medium">
                      {result.prompt.substring(0, 30)}...
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <a href={result.videoUrl} download target="_blank">
                      <Download className="mr-2 h-4 w-4" />
                      Download Video
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <a href={result.videoUrl} target="_blank">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Nieuw Tab
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ℹ️ Hoe het werkt</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Deze generator gebruikt state-of-the-art AI modellen om video's te maken
            op basis van je beschrijving:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              <strong>Luma AI:</strong> Snelste optie met hoge kwaliteit (1-2 min)
            </li>
            <li>
              <strong>Runway ML:</strong> Premium kwaliteit voor professionele video's
              (2-3 min)
            </li>
          </ul>
          <p className="pt-2">
            💡 <strong>Tip:</strong> Beschrijf je video zo gedetailleerd mogelijk voor
            de beste resultaten!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
