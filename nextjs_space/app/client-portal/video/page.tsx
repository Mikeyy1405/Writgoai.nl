'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Loader2, Video, Sparkles, ArrowLeft, Zap, Settings, Crown,
  Play, Download, RefreshCw, Check, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import ProjectSelector, { Project } from '@/components/project-selector';

type VideoType = 'simple' | 'custom' | 'pro';

interface VideoConfig {
  type: VideoType;
  topic: string;
  script?: string;
  voiceId?: string;
  language: string;
  duration: number;
  style: string;
  aspectRatio: '16:9' | '9:16' | '1:1';
  includeSubtitles: boolean;
  backgroundMusic: boolean;
  projectId?: string;
}

interface GenerationProgress {
  step: number;
  progress: number;
  message: string;
}

interface VideoResult {
  videoId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  creditsUsed: number;
}

const VOICE_OPTIONS = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (English - Female)', language: 'en' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella (English - Female)', language: 'en' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni (English - Male)', language: 'en' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh (English - Male)', language: 'en' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Dutch - Female)', language: 'nl' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam (English - Male)', language: 'en' },
];

export default function UnifiedVideoPage() {
  const [config, setConfig] = useState<VideoConfig>({
    type: 'simple',
    topic: '',
    language: 'Dutch',
    duration: 30,
    style: 'professional',
    aspectRatio: '16:9',
    includeSubtitles: true,
    backgroundMusic: true,
  });

  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleProjectChange = (projectId: string | null, project: Project | null) => {
    setConfig({ ...config, projectId: projectId || undefined });
  };

  const generateVideo = async (currentRetryCount = 0) => {
    const MAX_RETRIES = 2;
    
    setGenerating(true);
    setProgress({ step: 0, progress: 0, message: 'Initialiseren...' });
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/client/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Geen streaming ondersteuning');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));

              if (data.type === 'heartbeat') {
                // Keep connection alive
                console.log('Heartbeat received');
              } else if (data.type === 'status') {
                setProgress({
                  step: data.step || 0,
                  progress: data.progress || 0,
                  message: data.message || 'Bezig...',
                });
              } else if (data.type === 'complete') {
                setResult({
                  videoId: data.videoId,
                  videoUrl: data.videoUrl,
                  thumbnailUrl: data.thumbnailUrl,
                  duration: data.duration,
                  creditsUsed: data.creditsUsed,
                });
                setProgress({
                  step: 10,
                  progress: 100,
                  message: data.message || 'Voltooid!',
                });
                toast.success('Video succesvol gegenereerd!');
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Onbekende fout');
              }
            } catch (parseError) {
              console.error('Parse error:', parseError);
            }
          }
        }
      }

    } catch (fetchError: any) {
      console.error('Video generation error:', fetchError);
      
      // Retry logic for connection errors
      if (currentRetryCount < MAX_RETRIES && 
          (fetchError.message?.includes('fetch') || 
           fetchError.message?.includes('network') ||
           fetchError.message?.includes('HTTP 5'))) {
        
        toast.info(`Verbinding verloren, opnieuw proberen... (${currentRetryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(currentRetryCount + 1);
        
        await new Promise(r => setTimeout(r, 2000));
        return generateVideo(currentRetryCount + 1);
      }
      
      setError(fetchError.message || 'Video generatie mislukt');
      toast.error(fetchError.message || 'Video generatie mislukt');
    } finally {
      setGenerating(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    generateVideo();
  };

  const getCreditCost = () => {
    const costs = {
      simple: 10,
      custom: 80,
      pro: 150,
    };
    return costs[config.type];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-4 md:p-8">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/client-portal">
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Terug
            </Button>
          </Link>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-[#ff6b35] to-[#ff8c42] rounded-xl shadow-lg">
              <Video className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Video Generatie</h1>
              <p className="text-gray-300 text-lg mt-1">Één tool voor alle video types</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Type Selector */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Video Type</CardTitle>
                <CardDescription className="text-gray-300">
                  Kies het type video dat je wilt genereren
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <button
                    onClick={() => setConfig({ ...config, type: 'simple' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      config.type === 'simple'
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <Zap className={`w-8 h-8 mb-2 ${config.type === 'simple' ? 'text-[#ff6b35]' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-white mb-1">Simple</h3>
                    <p className="text-xs text-gray-400">Snel & eenvoudig</p>
                    <p className="text-xs text-[#ff6b35] mt-2">{getCreditCost()} credits</p>
                  </button>

                  <button
                    onClick={() => setConfig({ ...config, type: 'custom' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      config.type === 'custom'
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <Settings className={`w-8 h-8 mb-2 ${config.type === 'custom' ? 'text-[#ff6b35]' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-white mb-1">Custom</h3>
                    <p className="text-xs text-gray-400">Met voiceover</p>
                    <p className="text-xs text-[#ff6b35] mt-2">80 credits</p>
                  </button>

                  <button
                    onClick={() => setConfig({ ...config, type: 'pro' })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      config.type === 'pro'
                        ? 'border-[#ff6b35] bg-[#ff6b35]/10'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <Crown className={`w-8 h-8 mb-2 ${config.type === 'pro' ? 'text-[#ff6b35]' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-white mb-1">Pro</h3>
                    <p className="text-xs text-gray-400">Volledige controle</p>
                    <p className="text-xs text-[#ff6b35] mt-2">150 credits</p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Configuratie</CardTitle>
                <CardDescription className="text-gray-300">
                  Pas je video instellingen aan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Topic */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-white">Onderwerp *</Label>
                  <Input
                    id="topic"
                    placeholder="bijv: Waarom AI de wereld verandert"
                    value={config.topic}
                    onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                    className="border-zinc-700 bg-zinc-800 text-white"
                  />
                </div>

                {/* Script (for custom/pro) */}
                {(config.type === 'custom' || config.type === 'pro') && (
                  <div className="space-y-2">
                    <Label htmlFor="script" className="text-white">Script (optioneel)</Label>
                    <Textarea
                      id="script"
                      placeholder="Laat leeg voor automatisch gegenereerd script..."
                      value={config.script || ''}
                      onChange={(e) => setConfig({ ...config, script: e.target.value })}
                      rows={4}
                      className="border-zinc-700 bg-zinc-800 text-white"
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Voice */}
                  {(config.type === 'custom' || config.type === 'pro') && (
                    <div className="space-y-2">
                      <Label className="text-white">Stem</Label>
                      <Select 
                        value={config.voiceId || ''} 
                        onValueChange={(value) => setConfig({ ...config, voiceId: value })}
                      >
                        <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                          <SelectValue placeholder="Automatisch kiezen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Automatisch kiezen</SelectItem>
                          {VOICE_OPTIONS.map(voice => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Language */}
                  <div className="space-y-2">
                    <Label className="text-white">Taal</Label>
                    <Select 
                      value={config.language} 
                      onValueChange={(value) => setConfig({ ...config, language: value })}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dutch">Nederlands</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="German">Deutsch</SelectItem>
                        <SelectItem value="French">Français</SelectItem>
                        <SelectItem value="Spanish">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Style */}
                  <div className="space-y-2">
                    <Label className="text-white">Stijl</Label>
                    <Select 
                      value={config.style} 
                      onValueChange={(value) => setConfig({ ...config, style: value })}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professioneel</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="energetic">Energiek</SelectItem>
                        <SelectItem value="calm">Rustig</SelectItem>
                        <SelectItem value="realistic">Realistisch</SelectItem>
                        <SelectItem value="cinematic">Filmisch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="space-y-2">
                    <Label className="text-white">Beeldverhouding</Label>
                    <Select 
                      value={config.aspectRatio} 
                      onValueChange={(value: any) => setConfig({ ...config, aspectRatio: value })}
                    >
                      <SelectTrigger className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                        <SelectItem value="9:16">9:16 (TikTok/Reels)</SelectItem>
                        <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-white">Duur: {config.duration}s</Label>
                  <Slider
                    value={[config.duration]}
                    onValueChange={(value) => setConfig({ ...config, duration: value[0] })}
                    min={15}
                    max={120}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>15s</span>
                    <span>120s</span>
                  </div>
                </div>

                {/* Project */}
                <div className="space-y-2">
                  <Label className="text-white">Project (optioneel)</Label>
                  <ProjectSelector
                    value={config.projectId || null}
                    onChange={handleProjectChange}
                    autoSelectPrimary={false}
                  />
                </div>

                {/* Toggles */}
                {(config.type === 'custom' || config.type === 'pro') && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subtitles" className="text-white">Ondertitels toevoegen</Label>
                      <Switch
                        id="subtitles"
                        checked={config.includeSubtitles}
                        onCheckedChange={(checked) => setConfig({ ...config, includeSubtitles: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="music" className="text-white">Achtergrond muziek</Label>
                      <Switch
                        id="music"
                        checked={config.backgroundMusic}
                        onCheckedChange={(checked) => setConfig({ ...config, backgroundMusic: checked })}
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={() => generateVideo()}
                  disabled={generating || !config.topic.trim() || config.topic.length < 10}
                  className="w-full bg-[#ff6b35] hover:bg-[#ff8c42]"
                  size="lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Genereren...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Genereer Video ({getCreditCost()} credits)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Result Panel */}
          <div className="space-y-6">
            {/* Progress */}
            {(generating || progress) && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">Voortgang</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {progress && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300">{progress.message}</span>
                          <span className="text-[#ff6b35] font-medium">{progress.progress}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#ff6b35] to-[#ff8c42] transition-all duration-500"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                      </div>
                      {progress.progress === 100 && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <Check className="w-4 h-4" />
                          Video generatie voltooid!
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card className="bg-red-900/20 border-red-800">
                <CardHeader>
                  <CardTitle className="text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Fout
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-red-300 text-sm">{error}</p>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    className="w-full border-red-700 text-red-300 hover:bg-red-900/30"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Opnieuw proberen
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Result */}
            {result && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-400" />
                    Video Klaar!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                    <video
                      src={result.videoUrl}
                      controls
                      className="w-full h-full"
                      poster={result.thumbnailUrl}
                    />
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Duur:</span>
                      <span className="text-white">{result.duration}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Credits gebruikt:</span>
                      <span className="text-[#ff6b35]">{result.creditsUsed}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid gap-2">
                    <Button
                      onClick={() => window.open(result.videoUrl, '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Bekijk in nieuw tabblad
                    </Button>
                    <Button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = result.videoUrl;
                        a.download = `video-${result.videoId}.mp4`;
                        a.click();
                      }}
                      variant="outline"
                      className="w-full border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            {!generating && !result && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-white">ℹ️ Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-gray-300">
                  <div>
                    <p className="font-semibold text-white mb-1">Simple (10 credits)</p>
                    <p>Snelle AI video generatie met Luma AI. Duur: 1-2 minuten.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Custom (80 credits)</p>
                    <p>Video met aangepast script en ElevenLabs voiceover. Duur: 3-5 minuten.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Pro (150 credits)</p>
                    <p>Volledige video workflow met AI ideation, professioneel script en bewerking. Duur: 5-10 minuten.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
